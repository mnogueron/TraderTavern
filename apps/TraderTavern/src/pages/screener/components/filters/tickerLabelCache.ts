// Selected ticker filter values are ISINs, which aren't human-readable. The
// async ticker multiselect only ever has a page of `{ isin, ticker,
// companyName }` options loaded at a time, so this module-level cache lets
// any already-seen ISIN be resolved back to a display label (e.g. for the
// active-filter summary chips) without needing to hold the full ~8000-ticker
// list in memory.
type CachedTicker = { ticker: string; companyName: string };

const tickersByIsin = new Map<string, CachedTicker>();

export const cacheTickerLabel = (
  isin: string,
  ticker: string,
  companyName: string,
): void => {
  tickersByIsin.set(isin, { ticker, companyName });
};

export const getCachedTickerLabel = (isin: string): string | undefined => {
  const cached = tickersByIsin.get(isin);
  return cached ? `${cached.ticker} · ${cached.companyName}` : undefined;
};

export const getCachedTickerSymbol = (isin: string): string | undefined =>
  tickersByIsin.get(isin)?.ticker;
