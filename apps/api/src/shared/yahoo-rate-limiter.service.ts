import { Injectable, Logger } from '@nestjs/common';
import {
  RATE_LIMIT_BACKOFF_INITIAL_MS,
  RATE_LIMIT_BACKOFF_MAX_MS,
  RATE_LIMIT_BACKOFF_MULTIPLIER,
  YAHOO_REQUEST_DELAY_MS,
  YAHOO_REQUEST_TIMEOUT_MS,
} from '../finance/constants/candle-windows';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Thrown when a request keeps hitting Yahoo's "Too Many Requests" (429)
// response even after backing off up to RATE_LIMIT_BACKOFF_MAX_MS. Callers
// should treat this as a signal to abandon the whole in-progress sync (not
// just the current ticker) and let it cool down until the next attempt.
export class RateLimitCooldownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitCooldownError';
  }
}

// Thrown when a request doesn't settle within YAHOO_REQUEST_TIMEOUT_MS.
// Distinguished from a plain Error so callers can tell a genuine request
// timeout (often a sign that Yahoo, or the client-side request queue, is
// still jammed) apart from an ordinary per-ticker failure.
export class YahooTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YahooTimeoutError';
  }
}

// yahoo-finance2 throws HTTPError (name: 'HTTPError') with `.code` set to
// the HTTP status, but `.code` isn't declared in its .d.ts, so it's read
// off an untyped cast here. The message-string fallback covers the
// observed production error text ("Edge: Too Many Requests") in case the
// status code isn't populated for some error shapes.
function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (
    error.name === 'HTTPError' &&
    (error as unknown as { code?: number }).code === 429
  ) {
    return true;
  }
  return /too many requests/i.test(error.message);
}

// Serializes every Yahoo Finance request (across both TickerSyncService and
// TickerSourceService) to at most one per `minIntervalMs`. A single shared
// instance is important: throttling only the chunk-sync requests while
// leaving ISIN->ticker resolution unthrottled still hammers Yahoo and risks
// the same rate limiting/hangs this was built to avoid.
@Injectable()
export class YahooRateLimiterService {
  private readonly logger = new Logger(YahooRateLimiterService.name);
  private nextAvailableAt = 0;
  private readonly minIntervalMs = YAHOO_REQUEST_DELAY_MS;

  // On a 429, retries the same request in place with incrementally growing
  // backoff instead of surfacing the error immediately, since moving on to
  // the next ticker just spreads the same rate limiting across the rest of
  // the chunk. Once the backoff would exceed RATE_LIMIT_BACKOFF_MAX_MS,
  // gives up and throws RateLimitCooldownError.
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    let backoffMs = RATE_LIMIT_BACKOFF_INITIAL_MS;
    let attempt = 0;

    for (;;) {
      try {
        return await this.runOnce(fn);
      } catch (error) {
        if (!isRateLimitError(error)) {
          throw error;
        }
        if (backoffMs > RATE_LIMIT_BACKOFF_MAX_MS) {
          throw new RateLimitCooldownError(
            `Yahoo rate limiting did not clear after ${attempt} retr${attempt === 1 ? 'y' : 'ies'}`,
          );
        }

        attempt += 1;
        this.logger.warn(
          `Yahoo rate limited (attempt ${attempt}), backing off ${backoffMs}ms`,
        );
        await delay(backoffMs);
        backoffMs *= RATE_LIMIT_BACKOFF_MULTIPLIER;
      }
    }
  }

  private async runOnce<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const runAt = Math.max(now, this.nextAvailableAt);
    this.nextAvailableAt = runAt + this.minIntervalMs;

    const wait = runAt - now;
    if (wait > 0) {
      await delay(wait);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new YahooTimeoutError(
              `Yahoo request timed out after ${YAHOO_REQUEST_TIMEOUT_MS}ms`,
            ),
          ),
        YAHOO_REQUEST_TIMEOUT_MS,
      );
    });

    try {
      return await Promise.race([fn(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
