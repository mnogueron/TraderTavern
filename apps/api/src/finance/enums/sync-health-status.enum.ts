// Whether a ticker's EOD data has been refreshed since its market last
// closed (see FinanceService.computeTickerHealthEntries).
export enum SyncHealthStatus {
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
}
