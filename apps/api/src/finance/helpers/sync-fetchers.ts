import YahooFinance from 'yahoo-finance2';
import { YahooRateLimiterService } from '../../shared/yahoo-rate-limiter.service';
import {
  AltmanPeriodDraft,
  AnnualFinancialPeriodDraft,
  FundamentalsTimeSeriesRow,
  PiotroskiPeriodDraft,
  computeAltmanZScore,
  computePiotroskiScore,
} from './financial-helpers';

const yahooFinance = new YahooFinance();

// Covers just over a year of calendar days lookback, so the 1y/YTD change
// calculations always have a reference close to compare against.
const HISTORY_LOOKBACK_DAYS = 400;

// How far back to pull the Financial History (annual) and Earnings History
// (quarterly revenue) charts.
const FINANCIAL_HISTORY_YEARS = 6;
const QUARTERLY_REVENUE_HISTORY_YEARS = 2;

export type QuoteSummaryResult = Awaited<ReturnType<typeof fetchQuoteSummary>>;
export type DailyChartResult = Awaited<ReturnType<typeof fetchDailyChart>>;

export async function fetchQuoteSummary(
  yahooRateLimiter: YahooRateLimiterService,
  ticker: string,
) {
  return yahooRateLimiter.schedule(() =>
    yahooFinance.quoteSummary(ticker, {
      modules: [
        'price',
        'summaryDetail',
        'assetProfile',
        'financialData',
        'defaultKeyStatistics',
        'earningsHistory',
      ],
    }),
  );
}

export async function fetchDailyChart(
  yahooRateLimiter: YahooRateLimiterService,
  ticker: string,
) {
  return yahooRateLimiter.schedule(() =>
    yahooFinance.chart(ticker, {
      period1: new Date(
        Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
      ),
      interval: '1d',
    }),
  );
}

export async function fetchCandleChart(
  yahooRateLimiter: YahooRateLimiterService,
  ticker: string,
  period1: Date,
  interval: '5m' | '1h' | '1d' | '1wk',
) {
  return yahooRateLimiter.schedule(() =>
    yahooFinance.chart(ticker, { period1, interval }),
  );
}

export async function fetchFinancialHistory(
  yahooRateLimiter: YahooRateLimiterService,
  ticker: string,
  marketCap?: number,
): Promise<{
  periods: AnnualFinancialPeriodDraft[];
  piotroskiScore?: number;
  altmanZScore?: number;
}> {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - FINANCIAL_HISTORY_YEARS);

  const [financials, cashFlow, balanceSheet] = await Promise.all([
    yahooRateLimiter.schedule(
      () =>
        yahooFinance.fundamentalsTimeSeries(ticker, {
          period1,
          type: 'annual',
          module: 'financials',
        }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
    ),
    yahooRateLimiter.schedule(
      () =>
        yahooFinance.fundamentalsTimeSeries(ticker, {
          period1,
          type: 'annual',
          module: 'cash-flow',
        }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
    ),
    yahooRateLimiter.schedule(
      () =>
        yahooFinance.fundamentalsTimeSeries(ticker, {
          period1,
          type: 'annual',
          module: 'balance-sheet',
        }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
    ),
  ]);

  const byPeriodEnd = new Map<string, AnnualFinancialPeriodDraft>();
  const getOrCreate = (date: Date): AnnualFinancialPeriodDraft => {
    const key = date.toISOString();
    let entry = byPeriodEnd.get(key);
    if (!entry) {
      entry = { periodEnd: date };
      byPeriodEnd.set(key, entry);
    }
    return entry;
  };

  const piotroskiByPeriodEnd = new Map<string, PiotroskiPeriodDraft>();
  const getOrCreatePiotroski = (date: Date): PiotroskiPeriodDraft => {
    const key = date.toISOString();
    let entry = piotroskiByPeriodEnd.get(key);
    if (!entry) {
      entry = { periodEnd: date };
      piotroskiByPeriodEnd.set(key, entry);
    }
    return entry;
  };

  const altmanByPeriodEnd = new Map<string, AltmanPeriodDraft>();
  const getOrCreateAltman = (date: Date): AltmanPeriodDraft => {
    const key = date.toISOString();
    let entry = altmanByPeriodEnd.get(key);
    if (!entry) {
      entry = { periodEnd: date };
      altmanByPeriodEnd.set(key, entry);
    }
    return entry;
  };

  for (const row of financials) {
    const entry = getOrCreate(row.date);
    entry.revenue = row.totalRevenue;
    entry.ebitda = row.EBITDA;
    entry.netIncome = row.netIncome;

    const piotroski = getOrCreatePiotroski(row.date);
    piotroski.revenue = row.totalRevenue;
    piotroski.netIncome = row.netIncome;
    piotroski.grossProfit = row.grossProfit;

    const altman = getOrCreateAltman(row.date);
    altman.revenue = row.totalRevenue;
    altman.ebit = row.EBIT;
  }
  for (const row of cashFlow) {
    const entry = getOrCreate(row.date);
    entry.operatingCashflow = row.operatingCashFlow;
    entry.freeCashflow = row.freeCashFlow;
    entry.capex = row.capitalExpenditure;

    const piotroski = getOrCreatePiotroski(row.date);
    piotroski.operatingCashflow = row.operatingCashFlow;
  }
  for (const row of balanceSheet) {
    const entry = getOrCreate(row.date);
    entry.cash = row.cashAndCashEquivalents;
    entry.totalDebt = row.totalDebt;
    entry.netDebt = row.netDebt;

    const piotroski = getOrCreatePiotroski(row.date);
    piotroski.totalAssets = row.totalAssets;
    piotroski.currentAssets = row.currentAssets;
    piotroski.currentLiabilities = row.currentLiabilities;
    piotroski.longTermDebt = row.longTermDebt;
    piotroski.sharesOutstanding = row.ordinarySharesNumber ?? row.shareIssued;

    const altman = getOrCreateAltman(row.date);
    altman.totalAssets = row.totalAssets;
    altman.currentAssets = row.currentAssets;
    altman.currentLiabilities = row.currentLiabilities;
    altman.retainedEarnings = row.retainedEarnings;
    altman.totalLiabilities = row.totalLiabilitiesNetMinorityInterest;
  }

  const piotroskiPeriods = Array.from(piotroskiByPeriodEnd.values()).sort(
    (a, b) => a.periodEnd.getTime() - b.periodEnd.getTime(),
  );
  const [priorPiotroskiPeriod, latestPiotroskiPeriod] =
    piotroskiPeriods.slice(-2);
  const piotroskiScore =
    latestPiotroskiPeriod && priorPiotroskiPeriod
      ? computePiotroskiScore(latestPiotroskiPeriod, priorPiotroskiPeriod)
      : undefined;

  const latestAltmanPeriod = Array.from(altmanByPeriodEnd.values())
    .sort((a, b) => a.periodEnd.getTime() - b.periodEnd.getTime())
    .at(-1);
  const altmanZScore = latestAltmanPeriod
    ? computeAltmanZScore(latestAltmanPeriod, marketCap)
    : undefined;

  return {
    periods: Array.from(byPeriodEnd.values()).sort(
      (a, b) => a.periodEnd.getTime() - b.periodEnd.getTime(),
    ),
    piotroskiScore,
    altmanZScore,
  };
}

export async function fetchQuarterlyRevenueHistory(
  yahooRateLimiter: YahooRateLimiterService,
  ticker: string,
): Promise<{ quarter: Date; actual?: number }[]> {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - QUARTERLY_REVENUE_HISTORY_YEARS);

  const rows = (await yahooRateLimiter.schedule(
    () =>
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1,
        type: 'quarterly',
        module: 'financials',
      }) as unknown as Promise<FundamentalsTimeSeriesRow[]>,
  )) as FundamentalsTimeSeriesRow[];

  return rows.map((row) => ({
    quarter: row.date,
    actual: row.totalRevenue,
  }));
}
