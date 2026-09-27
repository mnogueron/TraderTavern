// Day-of-week indices (0 = Sunday, matching `Date#getDay`/`Intl` "weekday").
export const DEFAULT_TRADING_DAYS: readonly number[] = [1, 2, 3, 4, 5];

// Markets whose trading week isn't Mon-Fri. Yahoo's chart meta (the only
// automatic market-hours discovery source, see MarketHoursSyncService) never
// exposes which days of the week a market trades, so this list is
// hand-maintained.
export const TRADING_DAYS_OVERRIDES: Readonly<Record<string, readonly number[]>> = {
  TLV: [0, 1, 2, 3, 4], // Tel Aviv Stock Exchange: Sunday-Thursday
};

export function resolveTradingDaysForMarket(market: string): readonly number[] {
  return TRADING_DAYS_OVERRIDES[market] ?? DEFAULT_TRADING_DAYS;
}
