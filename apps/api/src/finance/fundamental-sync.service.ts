import { Injectable } from '@nestjs/common';
import { FundamentalDataRepository } from './repositories/fundamental-data.repository';
import { QuoteSummaryResult } from './helpers/sync-fetchers';
import { TickerRef } from './helpers/sync-utils';

// Computes and persists fundamental_ticker_data: valuation, profitability,
// growth, cash flow, balance sheet, dividend and ownership metrics derived
// from a ticker's quote summary, plus the Piotroski/Altman quality scores
// computed elsewhere from financial history.
@Injectable()
export class FundamentalSyncService {
  constructor(
    private readonly fundamentalDataRepository: FundamentalDataRepository,
  ) {}

  async update(
    ref: TickerRef,
    syncDate: Date,
    quoteSummary: QuoteSummaryResult,
    piotroskiScore?: number,
    altmanZScore?: number,
  ): Promise<void> {
    const { price, summaryDetail, financialData, defaultKeyStatistics } =
      quoteSummary;

    // These scores only change with annual filings and are freshly computed
    // by updateFinancialHistory as part of the full ticker sync; on syncs
    // that don't recompute them (e.g. the fundamental-only cadence), carry
    // the last known values forward instead of dropping them from that
    // day's snapshot.
    const previousFundamental =
      piotroskiScore == null || altmanZScore == null
        ? await this.fundamentalDataRepository.findLatestScores(ref.isin)
        : null;
    const resolvedPiotroskiScore =
      piotroskiScore ?? previousFundamental?.piotroskiScore;
    const resolvedAltmanZScore =
      altmanZScore ?? previousFundamental?.altmanZScore;

    const totalRevenue = financialData?.totalRevenue;
    const freeCashflow = financialData?.freeCashflow;
    const operatingCashflow = financialData?.operatingCashflow;
    const marketCap = summaryDetail?.marketCap ?? price?.marketCap;
    const ebitda = financialData?.ebitda;
    const totalDebt = financialData?.totalDebt;
    const totalCash = financialData?.totalCash;

    const capex =
      operatingCashflow != null && freeCashflow != null
        ? operatingCashflow - freeCashflow
        : undefined;
    const fcfMargin =
      freeCashflow != null && totalRevenue
        ? (freeCashflow / totalRevenue) * 100
        : undefined;
    const fcfYield =
      freeCashflow != null && marketCap
        ? (freeCashflow / marketCap) * 100
        : undefined;
    const netDebt =
      totalDebt != null && totalCash != null
        ? totalDebt - totalCash
        : undefined;
    const netDebtToEbitda =
      netDebt != null && ebitda ? netDebt / ebitda : undefined;

    // Yahoo returns these as fractions (e.g. 0.4865 for 48.65%); convert to
    // percentage points, matching the existing changePercent* convention.
    const toPercent = (value: number | undefined): number | undefined =>
      value != null ? value * 100 : undefined;

    await this.fundamentalDataRepository.upsert(ref, syncDate, {
      marketCap,
      peRatio: summaryDetail?.trailingPE,
      psRatio: summaryDetail?.priceToSalesTrailing12Months,
      ebitda,
      totalDebt,
      totalCash,
      debtToEquity: financialData?.debtToEquity,

      // Company
      enterpriseValue: defaultKeyStatistics?.enterpriseValue,
      revenue: totalRevenue,
      grossProfit: financialData?.grossProfits,
      netIncome: defaultKeyStatistics?.netIncomeToCommon,
      revenuePerShare: financialData?.revenuePerShare,

      // Valuation
      forwardPE: summaryDetail?.forwardPE ?? defaultKeyStatistics?.forwardPE,
      pegRatio: defaultKeyStatistics?.pegRatio,
      evToEbitda: defaultKeyStatistics?.enterpriseToEbitda,
      evToRevenue: defaultKeyStatistics?.enterpriseToRevenue,
      priceToBook: defaultKeyStatistics?.priceToBook,
      epsTrailing: defaultKeyStatistics?.trailingEps,
      epsForward: defaultKeyStatistics?.forwardEps,

      // 52W range
      fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow,

      // Profitability
      grossMargin: toPercent(financialData?.grossMargins),
      operatingMargin: toPercent(financialData?.operatingMargins),
      ebitdaMargin: toPercent(financialData?.ebitdaMargins),
      profitMargin: toPercent(
        financialData?.profitMargins ?? defaultKeyStatistics?.profitMargins,
      ),
      returnOnEquity: toPercent(financialData?.returnOnEquity),
      returnOnAssets: toPercent(financialData?.returnOnAssets),

      // Growth
      revenueGrowth: toPercent(financialData?.revenueGrowth),
      earningsGrowth: toPercent(financialData?.earningsGrowth),

      // Cash flow & leverage
      operatingCashflow,
      freeCashflow,
      capex,
      fcfMargin,
      fcfYield,
      netDebt,
      netDebtToEbitda,

      // Balance sheet
      currentRatio: financialData?.currentRatio,
      quickRatio: financialData?.quickRatio,
      bookValuePerShare: defaultKeyStatistics?.bookValue,
      cashPerShare: financialData?.totalCashPerShare,

      // Dividends
      forwardDividendRate: summaryDetail?.dividendRate,
      trailingDividendRate: summaryDetail?.trailingAnnualDividendRate,
      dividendYield: toPercent(summaryDetail?.dividendYield),
      fiveYearAvgDividendYield: summaryDetail?.fiveYearAvgDividendYield,
      payoutRatio: toPercent(summaryDetail?.payoutRatio),
      exDividendDate: summaryDetail?.exDividendDate,

      // Analyst consensus
      analystRating: financialData?.recommendationKey,
      analystTargetMean: financialData?.targetMeanPrice,
      analystTargetLow: financialData?.targetLowPrice,
      analystTargetHigh: financialData?.targetHighPrice,
      analystCount: financialData?.numberOfAnalystOpinions,

      // Ownership
      sharesOutstanding: defaultKeyStatistics?.sharesOutstanding,
      floatShares: defaultKeyStatistics?.floatShares,
      insidersPercent: toPercent(defaultKeyStatistics?.heldPercentInsiders),
      institutionsPercent: toPercent(
        defaultKeyStatistics?.heldPercentInstitutions,
      ),

      // Quality
      piotroskiScore: resolvedPiotroskiScore,
      altmanZScore: resolvedAltmanZScore,

      // Technical (directly from Yahoo, no computation)
      sma50: summaryDetail?.fiftyDayAverage,
      sma200: summaryDetail?.twoHundredDayAverage,
      beta: summaryDetail?.beta ?? defaultKeyStatistics?.beta,
      sp500Change52w: toPercent(defaultKeyStatistics?.SandP52WeekChange),
      avgVolume30d: summaryDetail?.averageVolume,
      avgVolume10d:
        summaryDetail?.averageVolume10days ??
        summaryDetail?.averageDailyVolume10Day,
    });
  }
}
