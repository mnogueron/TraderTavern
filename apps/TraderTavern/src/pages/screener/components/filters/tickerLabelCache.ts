// Selected ticker filter values are ISINs, which aren't human-readable. The
// async ticker multiselect only ever has a page of `{ isin, ticker,
// companyName }` options loaded at a time, so this module-level cache lets
// any already-seen ISIN be resolved back to a display label (e.g. for the
// active-filter summary chips) without needing to hold the full ~8000-ticker
// list in memory.
const labelsByIsin = new Map<string, string>();

export const cacheTickerLabel = (isin: string, label: string): void => {
  labelsByIsin.set(isin, label);
};

export const getCachedTickerLabel = (isin: string): string | undefined =>
  labelsByIsin.get(isin);
