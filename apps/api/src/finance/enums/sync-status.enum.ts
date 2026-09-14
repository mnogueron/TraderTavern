export enum SyncStatus {
  Running = 'running',
  Success = 'success',
  PartialSuccess = 'partial_success',
  Failed = 'failed',
  // A request timeout occurred immediately after resuming from a prior
  // rate-limit cooldown, indicating Yahoo (or its client-side request
  // queue) is still jammed. The whole chunk is aborted rather than
  // burning through every remaining ticker at the full request timeout.
  Timeout = 'timeout',
}
