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
        status: {
          $in: [SyncStatus.Running, SyncStatus.Success, SyncStatus.PartialSuccess],
        },
      }),
    );
  }

  // Attempts to atomically claim this chunk's "running" slot, both via the
  // { syncDate, kind, chunkHash } unique index (this exact chunk hasn't been
  // processed today) and the { kind, status: 'running' } partial unique
  // index (no other chunk of this kind is in flight). Returns null if either
  // lock is already held.
  async claimLock(
    trigger: SyncTrigger,
    kind: SyncKind,
    syncDate: Date,
    chunkHash: string,
    tickerCount: number,
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
          errors: JSON.stringify({
            _lock: 'Reclaimed: stale running lock, likely an abandoned process',
          }),
        },
      },
    );
    return result.modifiedCount;
  }

  async finalize(
    lockId: SyncHistoryDocument['_id'],
    successCount: number,
    errors: Record<string, string>,
  ): Promise<void> {
    const hasErrors = Object.keys(errors).length > 0;
    const status =
      successCount === 0
        ? SyncStatus.Failed
        : hasErrors
          ? SyncStatus.PartialSuccess
          : SyncStatus.Success;

    await this.syncHistoryModel.updateOne(
      { _id: lockId },
      { $set: { status, errors: hasErrors ? JSON.stringify(errors) : undefined } },
    );
  }
}
