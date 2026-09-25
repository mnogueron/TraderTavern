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

  // Atomically claims this chunk's "running" slot, both re-claiming a prior
  // attempt of the exact same { syncDate, kind, chunkHash } if one exists
  // (e.g. a previous Failed/Timeout run, so it can be resumed rather than
  // permanently stuck) and via the { kind, status: 'running' } partial
  // unique index (no other chunk of this kind is in flight). The caller is
  // expected to have already checked isChunkDone, so any existing doc for
  // this chunk is guaranteed not to be Running/Success/PartialSuccess/
  // Cancelled — but the status is re-checked here too (excluding Running)
  // to close the race where a chunk is still genuinely in flight when this
  // is called: without it, the upsert would match the in-flight doc and
  // hand out a second lock on it, causing two concurrent runs against the
  // same chunk. Reusing (rather than replacing) the doc preserves its
  // `resolvedTickers`/`tickerErrors` so the caller can skip tickers already
  // synced successfully in an earlier attempt. Returns null if the chunk is
  // already running or the kind-wide lock is held by another chunk.
  async claimLock(
    trigger: SyncTrigger,
    kind: SyncKind,
    syncDate: Date,
    chunkHash: string,
    tickerCount: number,
    market: string | null,
    isins: string[],
  ): Promise<SyncHistoryDocument | null> {
    try {
      return await this.syncHistoryModel.findOneAndUpdate(
        { syncDate, kind, chunkHash, status: { $ne: SyncStatus.Running } },
        {
          $set: {
            type: trigger.type,
            status: SyncStatus.Running,
            tickerCount,
            triggeredByUserId: trigger.userId,
            market,
            isins,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
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
