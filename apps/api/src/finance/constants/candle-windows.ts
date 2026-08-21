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

export const DEFAULT_CANDLE_COUNT: Record<CandleWindow, number> = {
  [CandleWindow.FiveMinutes]: 500,
  [CandleWindow.OneHour]: 500,
  [CandleWindow.OneDay]: 500,
  [CandleWindow.OneWeek]: 260,
};

// Extra lookback multiplier applied to (count * window duration) when
// requesting history from Yahoo, to account for closed markets (weekends,
// holidays, after-hours) that leave gaps in the raw candle series.
export const CANDLE_LOOKBACK_MULTIPLIER = 3;
