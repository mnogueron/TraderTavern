export type TechnicalIndicators = {
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  bbWidth?: number;
  atr14?: number;
  volumeRatio20d?: number;
};

const computeEma = (values: number[], period: number): number[] | null => {
  if (values.length < period) {
    return null;
  }
  const k = 2 / (period + 1);
  const seed =
    values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  const ema = [seed];
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
};

const computeRsi = (closes: number[], period: number): number | undefined => {
  if (closes.length < period + 1) {
    return undefined;
  }

  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    gains.push(Math.max(delta, 0));
    losses.push(Math.max(-delta, 0));
  }

  let avgGain = gains.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const computeMacd = (
  closes: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): { macd: number; signal: number; histogram: number } | null => {
  const fastEma = computeEma(closes, fastPeriod);
  const slowEma = computeEma(closes, slowPeriod);
  if (!fastEma || !slowEma) {
    return null;
  }

  // Align both EMA series to the same trailing window (slowEma is
  // shorter since it warms up later) before computing the MACD line.
  const offset = fastEma.length - slowEma.length;
  const macdLine = slowEma.map((slow, i) => fastEma[i + offset] - slow);

  const signalEma = computeEma(macdLine, signalPeriod);
  if (!signalEma) {
    return null;
  }

  const macd = macdLine[macdLine.length - 1];
  const signal = signalEma[signalEma.length - 1];
  return { macd, signal, histogram: macd - signal };
};

const computeBollingerBands = (
  closes: number[],
  period: number,
  stdDevMultiplier: number,
): { upper: number; middle: number; lower: number } | null => {
  if (closes.length < period) {
    return null;
  }
  const window = closes.slice(-period);
  const middle = window.reduce((sum, v) => sum + v, 0) / period;
  const variance =
    window.reduce((sum, v) => sum + (v - middle) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: middle + stdDevMultiplier * stdDev,
    middle,
    lower: middle - stdDevMultiplier * stdDev,
  };
};

const computeAtr = (
  quotes: { close: number; high: number; low: number }[],
  period: number,
): number | undefined => {
  if (quotes.length < period + 1) {
    return undefined;
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < quotes.length; i++) {
    const { high, low } = quotes[i];
    const prevClose = quotes[i - 1].close;
    trueRanges.push(
      Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose),
      ),
    );
  }

  let atr =
    trueRanges.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  return atr;
};

// Computed from the daily quote series already fetched for the change%
// calculations, so no extra Yahoo requests are needed. Won't necessarily
// match other providers exactly (lookback window, EMA seeding, and
// adjusted-vs-unadjusted close conventions all vary), same caveat as the
// change% figures.
export const computeTechnicalIndicators = (
  quotes: { close: number; high: number; low: number; volume: number }[],
): TechnicalIndicators => {
  const closes = quotes.map((q) => q.close);

  const result: TechnicalIndicators = {};

  const rsi14 = computeRsi(closes, 14);
  if (rsi14 != null) {
    result.rsi14 = rsi14;
  }

  const macdResult = computeMacd(closes, 12, 26, 9);
  if (macdResult) {
    result.macd = macdResult.macd;
    result.macdSignal = macdResult.signal;
    result.macdHistogram = macdResult.histogram;
  }

  const bands = computeBollingerBands(closes, 20, 2);
  if (bands) {
    result.bbUpper = bands.upper;
    result.bbMiddle = bands.middle;
    result.bbLower = bands.lower;
    result.bbWidth =
      bands.middle !== 0
        ? ((bands.upper - bands.lower) / bands.middle) * 100
        : undefined;
  }

  const atr14 = computeAtr(quotes, 14);
  if (atr14 != null) {
    result.atr14 = atr14;
  }

  if (quotes.length >= 20) {
    const volumes = quotes.map((q) => q.volume);
    const avgVolume20d =
      volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
    const latestVolume = volumes.at(-1);
    if (avgVolume20d !== 0 && latestVolume != null) {
      result.volumeRatio20d = latestVolume / avgVolume20d;
    }
  }

  return result;
};
