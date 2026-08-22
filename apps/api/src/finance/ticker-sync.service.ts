import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import YahooFinance from 'yahoo-finance2';
import { SCREENER_TICKERS } from './constants/tickers';
import {
  CANDLE_COUNT_ENV_VAR,
  CANDLE_LOOKBACK_MULTIPLIER,
  CANDLE_WINDOW_DURATION_MS,
  DEFAULT_CANDLE_COUNT,
  YAHOO_REQUEST_DELAY_MS,
} from './constants/candle-windows';
import { SyncType } from './enums/sync-type.enum';
import { SyncStatus } from './enums/sync-status.enum';
import { CandleWindow } from './enums/candle-window.enum';
import { TickerStaticData, TickerStaticDataDocument } from './schemas/ticker-static-data.schema';
import {
  CompoundTechnicalTickerData,
  CompoundTechnicalTickerDataDocument,
} from './schemas/compound-technical-ticker-data.schema';
import {
  FundamentalTickerData,
  FundamentalTickerDataDocument,
} from './schemas/fundamental-ticker-data.schema';
import { SyncHistory, SyncHistoryDocument } from './schemas/sync-history.schema';
import {
  TechnicalTickerData,
  TechnicalTickerDataDocument,
} from './schemas/technical-ticker-data.schema';
import { MarketHours, MarketHoursDocument } from './schemas/market-hours.schema';

const yahooFinance = new YahooFinance();

// Covers just over a year of calendar days lookback, so the 1y/YTD change
// calculations always have a reference close to compare against.
const HISTORY_LOOKBACK_DAYS = 400;

type SyncTrigger = {
  type: SyncType;
  userId?: string;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const startOfTomorrow = (): Date => {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
};

@Injectable()
export class TickerSyncService {
  private readonly logger = new Logger(TickerSyncService.name);

  constructor(
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
    @InjectModel(CompoundTechnicalTickerData.name)
    private readonly compoundTechnicalTickerDataModel: Model<CompoundTechnicalTickerDataDocument>,
    @InjectModel(FundamentalTickerData.name)
    private readonly fundamentalTickerDataModel: Model<FundamentalTickerDataDocument>,
    @InjectModel(SyncHistory.name)
    private readonly syncHistoryModel: Model<SyncHistoryDocument>,
    @InjectModel(TechnicalTickerData.name)
    private readonly technicalTickerDataModel: Model<TechnicalTickerDataDocument>,
    @InjectModel(MarketHours.name)
    private readonly marketHoursModel: Model<MarketHoursDocument>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyCron(): Promise<void> {
    await this.ensureSyncedToday({ type: SyncType.Auto });
  }

  // Refreshes tickers whose market has just closed for the day, so
  // changePercent1d reflects today's official close (vs the daily cron,
  // which only runs pre-market and always sees yesterday's close).
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEndOfDayRefresh(): Promise<void> {
    const syncDate = startOfToday();
    const [staticData, marketHours] = await Promise.all([
      this.tickerStaticDataModel.find().select('ticker market').lean(),
      this.marketHoursModel.find().lean(),
    ]);
    const marketHoursByCode = new Map(
      marketHours.map((hours) => [hours.market, hours]),
    );

    for (const { ticker, market } of staticData) {
      const hours = market ? marketHoursByCode.get(market) : undefined;
      if (!hours || !this.isPastRegularClose(hours)) {
        continue;
      }

      const alreadySynced = await this.compoundTechnicalTickerDataModel.exists(
        { ticker, syncDate },
      );
      if (alreadySynced) {
        continue;
      }

      try {
        await delay(YAHOO_REQUEST_DELAY_MS);
        await this.syncCompound(ticker, syncDate);
      } catch (error) {
        this.logger.warn(`Failed end-of-day sync for ${ticker}: ${error}`);
      }
    }
  }

  private isPastRegularClose(hours: MarketHours): boolean {
    const localTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: hours.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());

    // Once local time has wrapped past midnight into the next calendar
    // day, today's regular session (which always closes before midnight)
    // is necessarily long over. Comparing "HH:mm" strings naively would
    // read e.g. "00:39" as earlier than a "17:30" close and wrongly treat
    // the market as still open, so also treat any time before the next
    // open as past-close.
    return localTime >= hours.regularClose || localTime < hours.regularOpen;
  }


  async ensureSyncedToday(trigger: SyncTrigger): Promise<void> {
    const alreadySynced = await this.syncHistoryModel.exists({
      syncDate: { $gte: startOfToday(), $lt: startOfTomorrow() },
      status: { $in: [SyncStatus.Success, SyncStatus.PartialSuccess] },
    });

    if (alreadySynced) {
      return;
    }

    await this.syncAll(trigger);
  }

  async syncAll(trigger: SyncTrigger): Promise<void> {
    const syncDate = startOfToday();
    const errors: Record<string, string> = {};
    let successCount = 0;

    for (const ticker of SCREENER_TICKERS) {
      try {
        await delay(YAHOO_REQUEST_DELAY_MS);
        await this.syncTicker(ticker, syncDate);
        successCount += 1;
      } catch (error) {
        this.logger.warn(`Failed to sync ticker ${ticker}: ${error}`);
        errors[ticker] = error instanceof Error ? error.message : String(error);
      }
    }

    const hasErrors = Object.keys(errors).length > 0;
    const status =
      successCount === 0
        ? SyncStatus.Failed
        : hasErrors
          ? SyncStatus.PartialSuccess
          : SyncStatus.Success;

    await this.syncHistoryModel.create({
      type: trigger.type,
      status,
      syncDate,
      triggeredByUserId: trigger.userId,
      errors: hasErrors ? JSON.stringify(errors) : undefined,
    });
  }

  async syncAllFundamental(): Promise<void> {
    const syncDate = startOfToday();
    for (const ticker of SCREENER_TICKERS) {
      try {
        await delay(YAHOO_REQUEST_DELAY_MS);
        await this.syncFundamental(ticker, syncDate);
      } catch (error) {
        this.logger.warn(`Failed to sync fundamental data for ${ticker}: ${error}`);
      }
    }
  }

  async syncAllCompound(): Promise<void> {
    const syncDate = startOfToday();
    for (const ticker of SCREENER_TICKERS) {
      try {
        await delay(YAHOO_REQUEST_DELAY_MS);
        await this.syncCompound(ticker, syncDate);
      } catch (error) {
        this.logger.warn(`Failed to sync compound data for ${ticker}: ${error}`);
      }
    }
  }

  async syncAllStatic(): Promise<void> {
    for (const ticker of SCREENER_TICKERS) {
      try {
        await delay(YAHOO_REQUEST_DELAY_MS);
        await this.syncStatic(ticker);
      } catch (error) {
        this.logger.warn(`Failed to sync static data for ${ticker}: ${error}`);
      }
    }
  }

  async syncAllTechnical(): Promise<void> {
    for (const ticker of SCREENER_TICKERS) {
      try {
        await this.syncTechnical(ticker);
      } catch (error) {
        this.logger.warn(`Failed to sync technical data for ${ticker}: ${error}`);
      }
    }
  }

  private assertKnownTicker(ticker: string): void {
    if (!SCREENER_TICKERS.includes(ticker)) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }
  }

  async syncSingleTickerStatic(ticker: string): Promise<void> {
    this.assertKnownTicker(ticker);
    await this.syncStatic(ticker);
  }

  async syncSingleTickerFundamental(ticker: string): Promise<void> {
    this.assertKnownTicker(ticker);
    await this.syncFundamental(ticker, startOfToday());
  }

  async syncSingleTickerCompound(ticker: string): Promise<void> {
    this.assertKnownTicker(ticker);
    await this.syncCompound(ticker, startOfToday());
  }

  async syncSingleTickerTechnical(ticker: string): Promise<void> {
    this.assertKnownTicker(ticker);
    await this.syncTechnical(ticker);
  }

  async syncSingleTicker(ticker: string): Promise<void> {
    this.assertKnownTicker(ticker);
    await this.syncTicker(ticker, startOfToday());
  }

  private async fetchQuoteSummary(ticker: string) {
    return yahooFinance.quoteSummary(ticker, {
      modules: [
        'price',
        'summaryDetail',
        'assetProfile',
        'financialData',
        'defaultKeyStatistics',
      ],
    });
  }

  private async fetchDailyChart(ticker: string) {
    return yahooFinance.chart(ticker, {
      period1: new Date(
        Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
      ),
      interval: '1d',
    });
  }

  private async syncTicker(ticker: string, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      this.fetchQuoteSummary(ticker),
      this.fetchDailyChart(ticker),
    ]);

    await this.updateStaticData(ticker, quoteSummary);
    await this.updateCompound(ticker, syncDate, quoteSummary, chart);
    await this.updateFundamental(ticker, syncDate, quoteSummary);
    await this.syncTechnical(ticker);
  }

  private async syncStatic(ticker: string): Promise<void> {
    const quoteSummary = await this.fetchQuoteSummary(ticker);

    await this.updateStaticData(ticker, quoteSummary);
  }

  private async updateStaticData(
    ticker: string,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
  ): Promise<void> {
    const { price, assetProfile, defaultKeyStatistics } = quoteSummary;
    const companyName = price?.longName ?? price?.shortName ?? ticker;

    await this.tickerStaticDataModel.updateOne(
      { ticker },
      {
        $set: {
          ticker,
          companyName,
          sector: assetProfile?.sector,
          industry: assetProfile?.industry,
          country: assetProfile?.country,
          description: assetProfile?.longBusinessSummary,
          market: price?.exchange,
          currency: price?.currency,
          employees: assetProfile?.fullTimeEmployees,
          fiscalYearEnd: defaultKeyStatistics?.lastFiscalYearEnd,
          mostRecentQuarter: defaultKeyStatistics?.mostRecentQuarter,
        },
      },
      { upsert: true },
    );
  }

  private async syncTechnical(ticker: string): Promise<void> {
    for (const window of Object.values(CandleWindow)) {
      await delay(YAHOO_REQUEST_DELAY_MS);
      await this.syncCandles(ticker, window);
    }
  }

  private async syncCompound(ticker: string, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      this.fetchQuoteSummary(ticker),
      this.fetchDailyChart(ticker),
    ]);

    await this.updateCompound(ticker, syncDate, quoteSummary, chart);
  }

  private async syncFundamental(ticker: string, syncDate: Date): Promise<void> {
    const quoteSummary = await this.fetchQuoteSummary(ticker);

    await this.updateFundamental(ticker, syncDate, quoteSummary);
  }

  private async updateCompound(
    ticker: string,
    syncDate: Date,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
    chart: Awaited<ReturnType<typeof this.fetchDailyChart>>,
  ): Promise<void> {
    const { price } = quoteSummary;

    const quotes = (chart.quotes ?? []).filter(
      (quote): quote is typeof quote & { close: number } =>
        quote.close != null,
    );
    const technicalIndicators = this.computeTechnicalIndicators(
      (chart.quotes ?? []).filter(
        (
          quote,
        ): quote is typeof quote & {
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        } =>
          quote.open != null &&
          quote.high != null &&
          quote.low != null &&
          quote.close != null &&
          quote.volume != null,
      ),
    );
    const latestClose =
      price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null;

    // The chart endpoint's most recent daily bar can still have a null
    // close for a brief window around/after market close (Yahoo hasn't
    // published the final bar yet), which the filter above drops — so
    // `quotes.at(-1)` can silently lag by a day right when a market has
    // just closed. The quoteSummary endpoint's live `price` fields don't
    // have that lag: `regularMarketPrice` is the live price while a
    // session is open and freezes at the official close once it ends;
    // `regularMarketPreviousClose` is always the close of the session
    // before that. Use those directly for the anchor/prior pair so 1D
    // change is never off by a day, and only fall back to `quotes` (for
    // the "market still open" case, where we need the close from *two*
    // sessions ago) or when live quote fields are unavailable.
    const hours = price?.exchange
      ? await this.marketHoursModel.findOne({ market: price.exchange }).lean()
      : null;
    const isClosedToday = hours != null && this.isPastRegularClose(hours);

    // "anchor": the most recent completed session's close — today's once
    // the market has closed for the day, otherwise yesterday's.
    const anchorClose = isClosedToday
      ? (price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null)
      : (price?.regularMarketPreviousClose ?? quotes.at(-1)?.close ?? null);
    // "prior": the completed session immediately before the anchor.
    const priorClose = isClosedToday
      ? (price?.regularMarketPreviousClose ?? quotes.at(-1)?.close ?? null)
      : (quotes.at(-2)?.close ?? null);

    const changePercent1d =
      anchorClose != null && priorClose != null && priorClose !== 0
        ? ((anchorClose - priorClose) / priorClose) * 100
        : undefined;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    await this.compoundTechnicalTickerDataModel.updateOne(
      { ticker, syncDate },
      {
        $set: {
          ticker,
          syncDate,
          price: latestClose,
          changePercent1d,
          changePercent2d: this.changePercentFromDaysAgo(anchorClose, quotes, 2),
          changePercent5d: this.changePercentFromDaysAgo(anchorClose, quotes, 5),
          changePercent1w: this.changePercentFromDaysAgo(
            anchorClose,
            quotes,
            7,
          ),
          changePercent1m: this.changePercentFromDaysAgo(
            anchorClose,
            quotes,
            30,
          ),
          changePercent3m: this.changePercentFromDaysAgo(
            anchorClose,
            quotes,
            91,
          ),
          changePercent6m: this.changePercentFromDaysAgo(
            anchorClose,
            quotes,
            182,
          ),
          changePercentYtd: this.changePercentFromDate(
            anchorClose,
            quotes,
            startOfYear,
          ),
          changePercent1y: this.changePercentFromDaysAgo(
            anchorClose,
            quotes,
            365,
          ),
          ...technicalIndicators,
        },
      },
      { upsert: true },
    );
  }

  // Computed from the daily quote series already fetched for the change%
  // calculations above, so no extra Yahoo requests are needed. Won't
  // necessarily match other providers exactly (lookback window, EMA
  // seeding, and adjusted-vs-unadjusted close conventions all vary), same
  // caveat as the change% figures.
  private computeTechnicalIndicators(
    quotes: { close: number; high: number; low: number; volume: number }[],
  ): {
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
  } {
    const closes = quotes.map((q) => q.close);

    const result: ReturnType<typeof this.computeTechnicalIndicators> = {};

    const rsi14 = this.computeRsi(closes, 14);
    if (rsi14 != null) {
      result.rsi14 = rsi14;
    }

    const macdResult = this.computeMacd(closes, 12, 26, 9);
    if (macdResult) {
      result.macd = macdResult.macd;
      result.macdSignal = macdResult.signal;
      result.macdHistogram = macdResult.histogram;
    }

    const bands = this.computeBollingerBands(closes, 20, 2);
    if (bands) {
      result.bbUpper = bands.upper;
      result.bbMiddle = bands.middle;
      result.bbLower = bands.lower;
      result.bbWidth =
        bands.middle !== 0
          ? ((bands.upper - bands.lower) / bands.middle) * 100
          : undefined;
    }

    const atr14 = this.computeAtr(quotes, 14);
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
  }

  private computeEma(values: number[], period: number): number[] | null {
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
  }

  private computeRsi(closes: number[], period: number): number | undefined {
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
  }

  private computeMacd(
    closes: number[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number,
  ): { macd: number; signal: number; histogram: number } | null {
    const fastEma = this.computeEma(closes, fastPeriod);
    const slowEma = this.computeEma(closes, slowPeriod);
    if (!fastEma || !slowEma) {
      return null;
    }

    // Align both EMA series to the same trailing window (slowEma is
    // shorter since it warms up later) before computing the MACD line.
    const offset = fastEma.length - slowEma.length;
    const macdLine = slowEma.map((slow, i) => fastEma[i + offset] - slow);

    const signalEma = this.computeEma(macdLine, signalPeriod);
    if (!signalEma) {
      return null;
    }

    const macd = macdLine[macdLine.length - 1];
    const signal = signalEma[signalEma.length - 1];
    return { macd, signal, histogram: macd - signal };
  }

  private computeBollingerBands(
    closes: number[],
    period: number,
    stdDevMultiplier: number,
  ): { upper: number; middle: number; lower: number } | null {
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
  }

  private computeAtr(
    quotes: { close: number; high: number; low: number }[],
    period: number,
  ): number | undefined {
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
  }

  private async updateFundamental(
    ticker: string,
    syncDate: Date,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
  ): Promise<void> {
    const { price, summaryDetail, financialData, defaultKeyStatistics } =
      quoteSummary;

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

    await this.fundamentalTickerDataModel.updateOne(
      { ticker, syncDate },
      {
        $set: {
          ticker,
          syncDate,
          marketCap,
          peRatio: summaryDetail?.trailingPE,
          psRatio: summaryDetail?.priceToSalesTrailing12Months,
          ebitda,
          totalDebt,
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

          // Technical (directly from Yahoo, no computation)
          sma50: summaryDetail?.fiftyDayAverage,
          sma200: summaryDetail?.twoHundredDayAverage,
          beta: summaryDetail?.beta ?? defaultKeyStatistics?.beta,
          sp500Change52w: toPercent(defaultKeyStatistics?.SandP52WeekChange),
          avgVolume30d: summaryDetail?.averageVolume,
          avgVolume10d:
            summaryDetail?.averageVolume10days ??
            summaryDetail?.averageDailyVolume10Day,
        },
      },
      { upsert: true },
    );
  }

  private getCandleCount(window: CandleWindow): number {
    const raw = this.configService.get<string>(CANDLE_COUNT_ENV_VAR[window]);
    const parsed = raw != null ? Number(raw) : undefined;
    return parsed != null && Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_CANDLE_COUNT[window];
  }

  private async syncCandles(
    ticker: string,
    window: CandleWindow,
  ): Promise<void> {
    const count = this.getCandleCount(window);
    const lookbackMs =
      count * CANDLE_WINDOW_DURATION_MS[window] * CANDLE_LOOKBACK_MULTIPLIER;

    const chart = await yahooFinance.chart(ticker, {
      period1: new Date(Date.now() - lookbackMs),
      interval: window,
    });

    const candles = (chart.quotes ?? [])
      .filter(
        (quote): quote is typeof quote & {
          open: number;
          close: number;
          low: number;
          high: number;
          volume: number;
        } =>
          quote.open != null &&
          quote.close != null &&
          quote.low != null &&
          quote.high != null &&
          quote.volume != null,
      )
      .slice(-count);

    if (candles.length === 0) {
      return;
    }

    const durationMs = CANDLE_WINDOW_DURATION_MS[window];

    await this.technicalTickerDataModel.updateOne(
      { ticker, window },
      {
        $set: {
          ticker,
          window,
          candles: candles.map((candle) => ({
            startTime: candle.date,
            endTime: new Date(candle.date.getTime() + durationMs),
            entry: candle.open,
            exit: candle.close,
            low: candle.low,
            high: candle.high,
            volume: candle.volume,
          })),
        },
      },
      { upsert: true },
    );
  }

  private changePercentFromDaysAgo(
    latestClose: number | null,
    quotes: { date: Date; close: number }[],
    calendarDaysAgo: number,
  ): number | undefined {
    const targetDate = new Date(
      Date.now() - calendarDaysAgo * 24 * 60 * 60 * 1000,
    );
    return this.changePercentFromDate(latestClose, quotes, targetDate);
  }

  private changePercentFromDate(
    latestClose: number | null,
    quotes: { date: Date; close: number }[],
    targetDate: Date,
  ): number | undefined {
    if (latestClose == null || quotes.length === 0) {
      return undefined;
    }
    // Anchor to the last close on or before the target date, not merely the
    // chronologically nearest one — around gaps like the New Year holiday,
    // the nearest quote by absolute distance can land on the wrong side of
    // the boundary (e.g. the first trading day of the new year instead of
    // the last one of the previous year), silently skewing YTD/period
    // returns. Fall back to the earliest available quote if the ticker's
    // history doesn't reach back to the target date.
    const onOrBefore = quotes.filter(
      (quote) => quote.date.getTime() <= targetDate.getTime(),
    );
    const closest =
      onOrBefore.length > 0 ? onOrBefore[onOrBefore.length - 1] : quotes[0];
    if (closest.close === 0) {
      return undefined;
    }
    return ((latestClose - closest.close) / closest.close) * 100;
  }
}
