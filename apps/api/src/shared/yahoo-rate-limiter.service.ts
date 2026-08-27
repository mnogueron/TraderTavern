import { Injectable } from '@nestjs/common';
import { YAHOO_REQUEST_DELAY_MS } from '../finance/constants/candle-windows';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Serializes every Yahoo Finance request (across both TickerSyncService and
// TickerSourceService) to at most one per `minIntervalMs`. A single shared
// instance is important: throttling only the chunk-sync requests while
// leaving ISIN->ticker resolution unthrottled still hammers Yahoo and risks
// the same rate limiting/hangs this was built to avoid.
@Injectable()
export class YahooRateLimiterService {
  private nextAvailableAt = 0;
  private readonly minIntervalMs = YAHOO_REQUEST_DELAY_MS;

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const runAt = Math.max(now, this.nextAvailableAt);
    this.nextAvailableAt = runAt + this.minIntervalMs;

    const wait = runAt - now;
    if (wait > 0) {
      await delay(wait);
    }

    return fn();
  }
}
