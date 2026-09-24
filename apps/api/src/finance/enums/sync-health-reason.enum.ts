// Why a ticker is flagged SyncHealthStatus.Unhealthy.
export enum SyncHealthReason {
  // Past the stale threshold since its market's regular close, and no full
  // sync has ever succeeded for it.
  NeverSynced = 'never_synced',
  // Past the stale threshold since its market's regular close, and its last
  // full sync predates that close.
  StaleSinceClose = 'stale_since_close',
}
