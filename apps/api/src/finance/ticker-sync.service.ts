import { Injectable, Logger } from '@nestjs/common';
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

const yahooFinance = new YahooFinance();

const HISTORY_LOOKBACK_DAYS = 45;

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
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyCron(): Promise<void> {
    await this.ensureSyncedToday({ type: SyncType.Auto });
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

  private async syncTicker(ticker: string, syncDate: Date): Promise<void> {
    const [quoteSummary, chart] = await Promise.all([
      yahooFinance.quoteSummary(ticker, {
        modules: ['price', 'summaryDetail', 'assetProfile', 'financialData'],
      }),
      yahooFinance.chart(ticker, {
        period1: new Date(
          Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        ),
        interval: '1d',
      }),
    ]);

    const { price, summaryDetail, assetProfile, financialData } = quoteSummary;
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

    const quotes = (chart.quotes ?? []).filter(
      (quote): quote is typeof quote & { close: number } =>
        quote.close != null,
    );
    const latestClose =
      price?.regularMarketPrice ?? quotes.at(-1)?.close ?? null;

    await this.compoundTechnicalTickerDataModel.updateOne(
      { ticker, syncDate },
      {
        $set: {
          ticker,
          syncDate,
          price: latestClose,
          changePercent1d: this.changePercent(latestClose, quotes, 1),
          changePercent2d: this.changePercent(latestClose, quotes, 2),
          changePercent5d: this.changePercent(latestClose, quotes, 5),
          changePercent1m: this.changePercentFromDaysAgo(
            latestClose,
            quotes,
            30,
          ),
        },
      },
      { upsert: true },
    );

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

    for (const window of Object.values(CandleWindow)) {
      await delay(YAHOO_REQUEST_DELAY_MS);
      await this.syncCandles(ticker, window);
    }
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

  private changePercent(
    latestClose: number | null,
    quotes: { close: number }[],
    tradingDaysAgo: number,
  ): number | undefined {
    if (latestClose == null || quotes.length <= tradingDaysAgo) {
      return undefined;
    }
    const referenceClose = quotes.at(-1 - tradingDaysAgo)?.close;
    if (referenceClose == null || referenceClose === 0) {
      return undefined;
    }
    return ((latestClose - referenceClose) / referenceClose) * 100;
  }

  private changePercentFromDaysAgo(
    latestClose: number | null,
    quotes: { date: Date; close: number }[],
    calendarDaysAgo: number,
  ): number | undefined {
    if (latestClose == null || quotes.length === 0) {
      return undefined;
    }
    const targetDate = new Date(
      Date.now() - calendarDaysAgo * 24 * 60 * 60 * 1000,
    );
    const closest = quotes.reduce((best, quote) =>
      Math.abs(quote.date.getTime() - targetDate.getTime()) <
      Math.abs(best.date.getTime() - targetDate.getTime())
        ? quote
        : best,
    );
    if (closest.close === 0) {
      return undefined;
    }
    return ((latestClose - closest.close) / closest.close) * 100;
  }
}
