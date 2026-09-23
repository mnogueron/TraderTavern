// Per-ticker outcome within a sync run, distinct from the run-level
// SyncStatus: a single chunk can contain a mix of succeeded, failed, and
// (if the chunk was aborted early, e.g. by a timeout) never-attempted
// tickers.
export enum TickerSyncStatus {
  Success = 'success',
  Failed = 'failed',
  DidNotRun = 'did_not_run',
}
