import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SyncHistory,
  SyncHistoryDocument,
} from '../schemas/sync-history.schema';
import { SyncKind } from '../enums/sync-kind.enum';
import { SyncStatus } from '../enums/sync-status.enum';
import { isDuplicateKeyError, STALE_LOCK_MS, SyncTrigger } from '../helpers/sync-utils';

@Injectable()
export class SyncHistoryRepository {
  constructor(
    @InjectModel(SyncHistory.name)
    private readonly syncHistoryModel: Model<SyncHistoryDocument>,
  ) {}

  async hasAnyChunkStarted(
    kind: SyncKind,
    from: Date,
    to: Date,
  ): Promise<boolean> {
    return Boolean(
      await this.syncHistoryModel.exists({
        syncDate: { $gte: from, $lt: to },
        kind,
      }),
    );
  }

  async isChunkDone(
    syncDate: Date,
    kind: SyncKind,
    chunkHash: string,
  ): Promise<boolean> {
    return Boolean(
      await this.syncHistoryModel.exists({
        syncDate,
        kind,
        chunkHash,
        // Cancelled is deliberately included here (unlike Failed/Timeout):
        // an admin cancel is an explicit stop, not a transient failure, so
        // it must not be silently resumed by the next cron tick.
        status: {
          $in: [
            SyncStatus.Running,
            SyncStatus.Success,
            SyncStatus.PartialSuccess,
            SyncStatus.Cancelled,
          ],
        },
      }),
    );
  }

  // Atomically claims this chunk's "running" slot by always inserting a
  // brand new document — a prior Failed/Timeout attempt of the exact same
  // { syncDate, kind, chunkHash } is never reused/resumed, so its own
  // counters/timestamps stay untouched as a permanent record of that failed
  // run, and this run starts the whole chunk fresh. The caller is expected
  // to have already checked isChunkDone; the { kind, status: 'running' }
  // partial unique index is what actually enforces "no other chunk of this
  // kind is in flight" (and closes the race where one raced ahead between
  // that check and this call) — an insert that violates it throws a
  // duplicate-key error, which is caught and turned into a null return.
  async claimLock(
    trigger: SyncTrigger,
    kind: SyncKind,
    syncDate: Date,
    chunkHash: string,
    tickerCount: number,
    markets: string[],
    isins: string[],
  ): Promise<SyncHistoryDocument | null> {
    try {
      return await this.syncHistoryModel.create({
        type: trigger.type,
        kind,
        status: SyncStatus.Running,
        syncDate,
        chunkHash,
        tickerCount,
        triggeredByUserId: trigger.userId,
        markets,
        isins,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return null;
      }
      throw error;
    }
  }

  // Marks any "running" lock of this kind older than STALE_LOCK_MS as failed,
  // freeing up both the chunk-hash and the kind-wide "running" slot. Returns
  // the number of locks reclaimed.
  async reclaimStale(kind: SyncKind): Promise<number> {
    const staleCutoff = new Date(Date.now() - STALE_LOCK_MS);
    const result = await this.syncHistoryModel.updateMany(
      { kind, status: SyncStatus.Running, updatedAt: { $lt: staleCutoff } },
      {
        $set: {
          status: SyncStatus.Failed,
          generalError:
            'Reclaimed: stale running lock, likely an abandoned process',
        },
      },
    );
    return result.modifiedCount;
  }

  // Immediately marks this lock as cancelled if (and only if) it's still
  // "running", freeing its { kind, status: 'running' } slot. Used by the
  // admin "cancel" action on a specific sync's detail page, as opposed to
  // reclaimStale's passive, age-gated, kind-wide cleanup. Returns whether a
  // running job was actually found and cancelled.
  async cancelIfRunning(id: string): Promise<boolean> {
    const result = await this.syncHistoryModel.updateOne(
      { _id: id, status: SyncStatus.Running },
      {
        $set: {
          status: SyncStatus.Cancelled,
          generalError: 'Cancelled by admin',
        },
      },
    );
    return result.modifiedCount > 0;
  }

  async finalize(
    lockId: SyncHistoryDocument['_id'],
    successCount: number,
    tickerErrors: Record<string, string>,
    resolvedTickers: Record<string, string>,
    forcedStatus?: SyncStatus,
    generalError?: string,
  ): Promise<void> {
    const hasErrors = Object.keys(tickerErrors).length > 0;
    const status =
      forcedStatus ??
      (successCount === 0
        ? SyncStatus.Failed
        : hasErrors
          ? SyncStatus.PartialSuccess
          : SyncStatus.Success);

    await this.syncHistoryModel.updateOne(
      { _id: lockId },
      {
        $set: {
          status,
          tickerErrors: hasErrors ? JSON.stringify(tickerErrors) : undefined,
          generalError,
          resolvedTickers,
        },
      },
    );
  }

  async list(
    page: number,
    limit: number,
    status?: SyncStatus,
  ): Promise<{ items: SyncHistoryDocument[]; total: number }> {
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.syncHistoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.syncHistoryModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<SyncHistoryDocument | null> {
    return this.syncHistoryModel.findById(id).exec();
  }
}
