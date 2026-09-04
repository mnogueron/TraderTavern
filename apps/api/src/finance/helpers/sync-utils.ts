import { createHash } from 'crypto';
import { SyncType } from '../enums/sync-type.enum';

// A ticker paired with the stable cross-source identity (ISIN) it was
// resolved from, threaded through the whole sync pipeline so every write
// keys its document by ISIN rather than the source-specific ticker string.
export type TickerRef = {
  isin: string;
  ticker: string;
};

export type SyncTrigger = {
  type: SyncType;
  userId?: string;
};

// A "running" lock older than this is assumed abandoned (e.g. the process
// crashed or was restarted mid-chunk) rather than genuinely still in
// progress, and is reclaimed so the chunk can be retried. Comfortably above
// the worst-case chunk duration (a few hundred Yahoo requests, throttled to
// one per YAHOO_REQUEST_DELAY_MS).
export const STALE_LOCK_MS = 30 * 60 * 1000;

// Mongo's duplicate-key error code, thrown when the sync_history "running"
// partial unique index rejects a second concurrent lock claim.
export const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE;

// Runs `worker` over `items` with at most `concurrency` in flight at once,
// collecting per-item failures instead of aborting the whole batch.
export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  onError: (item: T, error: unknown) => void,
): Promise<number> {
  let successCount = 0;
  let cursor = 0;

  const runNext = async (): Promise<void> => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }

      try {
        await worker(items[index]);
        successCount += 1;
      } catch (error) {
        onError(items[index], error);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runNext),
  );

  return successCount;
}

export const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

// Content hash of a chunk's ISINs, used as the idempotency key for that
// chunk in sync_history (order-independent, so the same set of ISINs always
// hashes the same way regardless of how the universe was assembled).
export const hashIsinChunk = (isins: string[]): string =>
  createHash('sha256').update([...isins].sort().join(',')).digest('hex');

export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const startOfTomorrow = (): Date => {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
};
