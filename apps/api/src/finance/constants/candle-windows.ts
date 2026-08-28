import { CandleWindow } from '../enums/candle-window.enum';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const CANDLE_WINDOW_DURATION_MS: Record<CandleWindow, number> = {
  [CandleWindow.FiveMinutes]: 5 * MINUTE_MS,
  [CandleWindow.OneHour]: HOUR_MS,
  [CandleWindow.OneDay]: DAY_MS,
  [CandleWindow.OneWeek]: 7 * DAY_MS,
};

// Env var holding the number of candles to retain per window, keyed by
// CandleWindow value (e.g. CANDLE_COUNT_5M for CandleWindow.FiveMinutes).
export const CANDLE_COUNT_ENV_VAR: Record<CandleWindow, string> = {
  [CandleWindow.FiveMinutes]: 'CANDLE_COUNT_5M',
  [CandleWindow.OneHour]: 'CANDLE_COUNT_1H',
  [CandleWindow.OneDay]: 'CANDLE_COUNT_1D',
  [CandleWindow.OneWeek]: 'CANDLE_COUNT_1W',
};

// Kept low enough that a full sync (200+ tickers x 4 windows, one Yahoo
// request each) doesn't trip Yahoo Finance's unofficial-API rate limiting.
// These only need to cover what MACD/momentum-style indicators require
// (tens of periods), not hundreds.
export const DEFAULT_CANDLE_COUNT: Record<CandleWindow, number> = {
  [CandleWindow.FiveMinutes]: 100,
  [CandleWindow.OneHour]: 200,
  [CandleWindow.OneDay]: 100,
  [CandleWindow.OneWeek]: 52,
};

// Extra lookback multiplier applied to (count * window duration) when
// requesting history from Yahoo, to account for closed markets (weekends,
// holidays, after-hours) that leave gaps in the raw candle series.
export const CANDLE_LOOKBACK_MULTIPLIER = 2;

// Minimum delay enforced between successive Yahoo Finance requests, to
// spread calls out and avoid bursts that trigger rate limiting. Applied
// globally across all in-flight tickers (see YahooRateLimiter), not
// per-ticker, so raising SYNC_TICKER_CONCURRENCY doesn't multiply the
// effective request rate.
export const YAHOO_REQUEST_DELAY_MS = 250;

// Yahoo occasionally stalls a request indefinitely (no response, no error),
// which without a timeout leaves the calling chunk sync's lock stuck in
// "running" until reclaimStaleLocks reaps it 30 minutes later, then repeats
// on retry. Failing fast here lets a single bad ticker error out instead of
// blocking the whole chunk.
export const YAHOO_REQUEST_TIMEOUT_MS = 15_000;

// Env var holding how many tickers a sync run processes concurrently.
export const SYNC_CONCURRENCY_ENV_VAR = 'SYNC_TICKER_CONCURRENCY';

// Conservative default: overlapping ticker work (DB writes, JSON parsing)
// runs in parallel while actual Yahoo requests still funnel through the
// shared rate limiter, so this mostly shortens wall-clock time rather than
// increasing Yahoo request pressure.
export const DEFAULT_SYNC_CONCURRENCY = 5;

// Env var holding how many tickers make up one sync_history chunk.
export const SYNC_CHUNK_SIZE_ENV_VAR = 'SYNC_CHUNK_SIZE';

// With ~8000 tickers across all configured sources, one chunk per
// EVERY_10_MINUTES cron tick spreads a full day's sync out over several
// hours instead of one long run that would trip Yahoo's rate limiting.
export const DEFAULT_SYNC_CHUNK_SIZE = 200;
