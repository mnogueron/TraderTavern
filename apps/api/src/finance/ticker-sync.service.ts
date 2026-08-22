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
      modules: ['price', 'summaryDetail', 'assetProfile', 'financialData'],
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

    const { price, assetProfile } = quoteSummary;
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
          market: price?.exchange,
          currency: price?.currency,
        },
      },
      { upsert: true },
    );

    await this.updateCompound(ticker, syncDate, quoteSummary, chart);
    await this.updateFundamental(ticker, syncDate, quoteSummary);
    await this.syncTechnical(ticker);
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
        },
      },
      { upsert: true },
    );
  }

  private async updateFundamental(
    ticker: string,
    syncDate: Date,
    quoteSummary: Awaited<ReturnType<typeof this.fetchQuoteSummary>>,
  ): Promise<void> {
    const { price, summaryDetail, financialData } = quoteSummary;

    await this.fundamentalTickerDataModel.updateOne(
      { ticker, syncDate },
      {
        $set: {
          ticker,
          syncDate,
          marketCap: summaryDetail?.marketCap ?? price?.marketCap,
          peRatio: summaryDetail?.trailingPE,
          psRatio: summaryDetail?.priceToSalesTrailing12Months,
          ebitda: financialData?.ebitda,
          totalDebt: financialData?.totalDebt,
          debtToEquity: financialData?.debtToEquity,
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
