import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TickerDto } from './dto/Ticker.dto';
import { FundamentalTickerDto } from './dto/FundamentalTicker.dto';
import { CandleDto } from './dto/Candle.dto';
import { TickerChartDto } from './dto/TickerChart.dto';
import { SyncType } from './enums/sync-type.enum';
import { CandleWindow } from './enums/candle-window.enum';
import { TickerSyncService } from './ticker-sync.service';
import { TickerStaticData, TickerStaticDataDocument } from './schemas/ticker-static-data.schema';
import {
  CompoundTechnicalTickerData,
  CompoundTechnicalTickerDataDocument,
} from './schemas/compound-technical-ticker-data.schema';
import {
  FundamentalTickerData,
  FundamentalTickerDataDocument,
} from './schemas/fundamental-ticker-data.schema';
import {
  TechnicalTickerData,
  TechnicalTickerDataDocument,
} from './schemas/technical-ticker-data.schema';
import { MarketHours, MarketHoursDocument } from './schemas/market-hours.schema';
import { MarketHoursDto } from './dto/MarketHours.dto';
import { TickerOptionDto } from './dto/TickerOption.dto';
import {
  AnnualFinancialPeriodDto,
  FinancialHistoryDto,
} from './dto/FinancialHistory.dto';
import {
  EarningsHistoryDto,
  EpsPeriodDto,
  RevenuePeriodDto,
} from './dto/EarningsHistory.dto';
import {
  TickerFinancialHistory,
  TickerFinancialHistoryDocument,
} from './schemas/ticker-financial-history.schema';
import {
  TickerEarningsHistory,
  TickerEarningsHistoryDocument,
} from './schemas/ticker-earnings-history.schema';
import { GetScreenerDto } from './dto/GetScreener.dto';
import { PaginatedTickerDto } from './dto/PaginatedTicker.dto';
import { ScreenerFilterOptionsDto } from './dto/ScreenerFilterOptions.dto';
import {
  applyScreenerFilters,
  parseScreenerFilters,
  sortScreenerTickers,
} from './screener-filters';

type WithUpdatedAt = { updatedAt: Date };

@Injectable()
export class FinanceService {
  constructor(
    private readonly tickerSyncService: TickerSyncService,
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
    @InjectModel(CompoundTechnicalTickerData.name)
    private readonly compoundTechnicalTickerDataModel: Model<CompoundTechnicalTickerDataDocument>,
    @InjectModel(FundamentalTickerData.name)
    private readonly fundamentalTickerDataModel: Model<FundamentalTickerDataDocument>,
    @InjectModel(TechnicalTickerData.name)
    private readonly technicalTickerDataModel: Model<TechnicalTickerDataDocument>,
    @InjectModel(MarketHours.name)
    private readonly marketHoursModel: Model<MarketHoursDocument>,
    @InjectModel(TickerFinancialHistory.name)
    private readonly tickerFinancialHistoryModel: Model<TickerFinancialHistoryDocument>,
    @InjectModel(TickerEarningsHistory.name)
    private readonly tickerEarningsHistoryModel: Model<TickerEarningsHistoryDocument>,
  ) {}

  private async getScreenerTickerOptions(): Promise<TickerOptionDto[]> {
    const staticData = await this.tickerStaticDataModel
      .find()
      .select('ticker companyName')
      .sort({ ticker: 1 })
      .lean();

    return staticData.map(
      (ticker) => new TickerOptionDto(ticker.ticker, ticker.companyName),
    );
  }

  async getScreener(query: GetScreenerDto): Promise<PaginatedTickerDto> {
    const tickers = await this.buildScreenerTickers();

    const filters = parseScreenerFilters(query.filters);
    const filtered = applyScreenerFilters(tickers, filters);
    const sorted = sortScreenerTickers(filtered, query.sortBy, query.sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = sorted.length;
    const start = (page - 1) * limit;
    const data = sorted.slice(start, start + limit);

    return new PaginatedTickerDto(
      data,
      page,
      limit,
      total,
      Math.max(Math.ceil(total / limit), 1),
    );
  }

  async getScreenerFilterOptions(): Promise<ScreenerFilterOptionsDto> {
    const [tickerOptions, tickers] = await Promise.all([
      this.getScreenerTickerOptions(),
      this.buildScreenerTickers(),
    ]);

    return new ScreenerFilterOptionsDto({
      tickers: tickerOptions,
      sectors: this.uniqueSorted(tickers.map((t) => t.sector)),
      industries: this.uniqueSorted(tickers.map((t) => t.industry)),
      countries: this.uniqueSorted(tickers.map((t) => t.country)),
      markets: this.uniqueSorted(tickers.map((t) => t.market)),
      currencies: this.uniqueSorted(tickers.map((t) => t.currency)),
      analystRatings: this.uniqueSorted(tickers.map((t) => t.analystRating)),
    });
  }

  private async buildScreenerTickers(): Promise<TickerDto[]> {
    await this.tickerSyncService.ensureSyncedToday({ type: SyncType.Auto });

    const [staticData, technicalData, fundamentalData, marketHours] =
      await Promise.all([
        this.tickerStaticDataModel.find().lean(),
        this.latestPerTicker<CompoundTechnicalTickerData & WithUpdatedAt>(
          this.compoundTechnicalTickerDataModel,
        ),
        this.latestPerTicker<FundamentalTickerData>(
          this.fundamentalTickerDataModel,
        ),
        this.marketHoursModel.find().lean(),
      ]);

    const technicalByTicker = new Map(
      technicalData.map((doc) => [doc.ticker, doc]),
    );
    const fundamentalByTicker = new Map(
      fundamentalData.map((doc) => [doc.ticker, doc]),
    );
    const marketLabelByCode = new Map(
      marketHours.map((doc) => [doc.market, doc.label]),
    );

    return staticData.map((ticker) =>
      this.toTickerDto(
        ticker,
        technicalByTicker.get(ticker.ticker),
        fundamentalByTicker.get(ticker.ticker),
        (ticker.market && marketLabelByCode.get(ticker.market)) ?? null,
      ),
    );
  }

  private uniqueSorted(values: (string | null | undefined)[]): string[] {
    const unique = Array.from(new Set(values.filter((v): v is string => !!v)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }

  async getTicker(ticker: string): Promise<TickerDto> {
    const [staticData, technical, fundamental] = await Promise.all([
      this.tickerStaticDataModel.findOne({ ticker }).lean(),
      this.compoundTechnicalTickerDataModel
        .findOne({ ticker })
        .sort({ syncDate: -1 })
        .lean<CompoundTechnicalTickerData & WithUpdatedAt>(),
      this.fundamentalTickerDataModel
        .findOne({ ticker })
        .sort({ syncDate: -1 })
        .lean<FundamentalTickerData>(),
    ]);

    if (!staticData) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }

    const marketHours = staticData.market
      ? await this.marketHoursModel.findOne({ market: staticData.market }).lean()
      : null;

    return this.toTickerDto(
      staticData,
      technical,
      fundamental,
      marketHours?.label ?? null,
    );
  }

  async getMarketHours(ticker: string): Promise<MarketHoursDto> {
    const staticData = await this.tickerStaticDataModel
      .findOne({ ticker })
      .lean();

    if (!staticData) {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }

    const marketHours = staticData.market
      ? await this.marketHoursModel.findOne({ market: staticData.market }).lean()
      : null;

    if (!marketHours) {
      throw new NotFoundException(`Market hours for ${ticker} not found`);
    }

    return new MarketHoursDto(
      marketHours.market,
      marketHours.label,
      marketHours.timezone,
      marketHours.preMarketOpen ?? null,
      marketHours.regularOpen,
      marketHours.regularClose,
      marketHours.postMarketClose ?? null,
    );
  }

  async getFundamental(ticker: string): Promise<FundamentalTickerDto> {
    const fundamental = await this.fundamentalTickerDataModel
      .findOne({ ticker })
      .sort({ syncDate: -1 })
      .lean<(FundamentalTickerData & WithUpdatedAt) | null>();

    if (!fundamental) {
      throw new NotFoundException(`Fundamental data for ${ticker} not found`);
    }

    return new FundamentalTickerDto(
      ticker,
      fundamental.marketCap ?? null,
      fundamental.peRatio ?? null,
      fundamental.psRatio ?? null,
      fundamental.ebitda ?? null,
      fundamental.totalDebt ?? null,
      fundamental.totalCash ?? null,
      fundamental.debtToEquity ?? null,
      fundamental.enterpriseValue ?? null,
      fundamental.revenue ?? null,
      fundamental.grossProfit ?? null,
      fundamental.netIncome ?? null,
      fundamental.revenuePerShare ?? null,
      fundamental.forwardPE ?? null,
      fundamental.pegRatio ?? null,
      fundamental.evToEbitda ?? null,
      fundamental.evToRevenue ?? null,
      fundamental.priceToBook ?? null,
      fundamental.epsTrailing ?? null,
      fundamental.epsForward ?? null,
      fundamental.fiftyTwoWeekHigh ?? null,
      fundamental.fiftyTwoWeekLow ?? null,
      fundamental.grossMargin ?? null,
      fundamental.operatingMargin ?? null,
      fundamental.ebitdaMargin ?? null,
      fundamental.profitMargin ?? null,
      fundamental.returnOnEquity ?? null,
      fundamental.returnOnAssets ?? null,
      fundamental.revenueGrowth ?? null,
      fundamental.earningsGrowth ?? null,
      fundamental.operatingCashflow ?? null,
      fundamental.freeCashflow ?? null,
      fundamental.capex ?? null,
      fundamental.fcfMargin ?? null,
      fundamental.fcfYield ?? null,
      fundamental.netDebt ?? null,
      fundamental.netDebtToEbitda ?? null,
      fundamental.currentRatio ?? null,
      fundamental.quickRatio ?? null,
      fundamental.bookValuePerShare ?? null,
      fundamental.cashPerShare ?? null,
      fundamental.forwardDividendRate ?? null,
      fundamental.trailingDividendRate ?? null,
      fundamental.dividendYield ?? null,
      fundamental.fiveYearAvgDividendYield ?? null,
      fundamental.payoutRatio ?? null,
      fundamental.exDividendDate ?? null,
      fundamental.analystRating ?? null,
      fundamental.analystTargetMean ?? null,
      fundamental.analystTargetLow ?? null,
      fundamental.analystTargetHigh ?? null,
      fundamental.analystCount ?? null,
      fundamental.sharesOutstanding ?? null,
      fundamental.floatShares ?? null,
      fundamental.insidersPercent ?? null,
      fundamental.institutionsPercent ?? null,
      fundamental.sma50 ?? null,
      fundamental.sma200 ?? null,
      fundamental.beta ?? null,
      fundamental.sp500Change52w ?? null,
      fundamental.avgVolume30d ?? null,
      fundamental.avgVolume10d ?? null,
      fundamental.updatedAt ?? null,
    );
  }

  async getFinancialHistory(ticker: string): Promise<FinancialHistoryDto> {
    const financialHistory = await this.tickerFinancialHistoryModel
      .findOne({ ticker })
      .lean<TickerFinancialHistory | null>();

    if (!financialHistory) {
      throw new NotFoundException(
        `Financial history for ${ticker} not found`,
      );
    }

    return new FinancialHistoryDto(
      ticker,
      financialHistory.annual.map(
        (period) =>
          new AnnualFinancialPeriodDto(
            period.periodEnd,
            period.revenue ?? null,
            period.ebitda ?? null,
            period.netIncome ?? null,
            period.operatingCashflow ?? null,
            period.capex ?? null,
            period.freeCashflow ?? null,
            period.cash ?? null,
            period.totalDebt ?? null,
            period.netDebt ?? null,
          ),
      ),
    );
  }

  async getEarningsHistory(ticker: string): Promise<EarningsHistoryDto> {
    const earningsHistory = await this.tickerEarningsHistoryModel
      .findOne({ ticker })
      .lean<TickerEarningsHistory | null>();

    if (!earningsHistory) {
      throw new NotFoundException(`Earnings history for ${ticker} not found`);
    }

    return new EarningsHistoryDto(
      ticker,
      earningsHistory.eps.map(
        (period) =>
          new EpsPeriodDto(
            period.quarter,
            period.actual ?? null,
            period.estimate ?? null,
          ),
      ),
      earningsHistory.revenue.map(
        (period) => new RevenuePeriodDto(period.quarter, period.actual ?? null),
      ),
    );
  }

  async getChart(
    ticker: string,
    window: CandleWindow,
  ): Promise<TickerChartDto> {
    const technicalTickerData = await this.technicalTickerDataModel
      .findOne({ ticker, window })
      .lean();

    if (!technicalTickerData) {
      throw new NotFoundException(
        `Chart data for ${ticker} (${window}) not found`,
      );
    }

    const candles = technicalTickerData.candles.map(
      (candle) =>
        new CandleDto(
          candle.startTime,
          candle.endTime,
          candle.entry,
          candle.exit,
          candle.low,
          candle.high,
          candle.volume,
        ),
    );

    return new TickerChartDto(ticker, window, candles);
  }

  private toTickerDto(
    staticData: TickerStaticData,
    technical: (CompoundTechnicalTickerData & WithUpdatedAt) | null | undefined,
    fundamental: FundamentalTickerData | null | undefined,
    marketLabel: string | null,
  ): TickerDto {
    return new TickerDto({
      ticker: staticData.ticker,
      companyName: staticData.companyName,
      sector: staticData.sector ?? null,
      industry: staticData.industry ?? null,
      marketCap: fundamental?.marketCap ?? null,
      peRatio: fundamental?.peRatio ?? null,
      price: technical?.price ?? null,
      country: staticData.country ?? null,
      description: staticData.description ?? null,
      market: marketLabel,
      currency: staticData.currency ?? null,
      changePercent: technical?.changePercent1d ?? null,
      changePercent5d: technical?.changePercent5d ?? null,
      changePercent1w: technical?.changePercent1w ?? null,
      changePercent1m: technical?.changePercent1m ?? null,
      changePercent3m: technical?.changePercent3m ?? null,
      changePercent6m: technical?.changePercent6m ?? null,
      changePercentYtd: technical?.changePercentYtd ?? null,
      changePercent1y: technical?.changePercent1y ?? null,
      employees: staticData.employees ?? null,
      fiscalYearEnd: staticData.fiscalYearEnd ?? null,
      mostRecentQuarter: staticData.mostRecentQuarter ?? null,
      rsi14: technical?.rsi14 ?? null,
      macd: technical?.macd ?? null,
      macdSignal: technical?.macdSignal ?? null,
      macdHistogram: technical?.macdHistogram ?? null,
      bbUpper: technical?.bbUpper ?? null,
      bbMiddle: technical?.bbMiddle ?? null,
      bbLower: technical?.bbLower ?? null,
      bbWidth: technical?.bbWidth ?? null,
      atr14: technical?.atr14 ?? null,
      volumeRatio20d: technical?.volumeRatio20d ?? null,
      refreshedAt: technical?.updatedAt ?? null,
      website: staticData.website ?? null,
      logoUrl: staticData.logoUrl ?? null,
      psRatio: fundamental?.psRatio ?? null,
      forwardPE: fundamental?.forwardPE ?? null,
      pegRatio: fundamental?.pegRatio ?? null,
      evToEbitda: fundamental?.evToEbitda ?? null,
      evToRevenue: fundamental?.evToRevenue ?? null,
      priceToBook: fundamental?.priceToBook ?? null,
      epsTrailing: fundamental?.epsTrailing ?? null,
      epsForward: fundamental?.epsForward ?? null,
      enterpriseValue: fundamental?.enterpriseValue ?? null,
      fiftyTwoWeekHigh: fundamental?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: fundamental?.fiftyTwoWeekLow ?? null,
      revenue: fundamental?.revenue ?? null,
      grossProfit: fundamental?.grossProfit ?? null,
      netIncome: fundamental?.netIncome ?? null,
      revenuePerShare: fundamental?.revenuePerShare ?? null,
      ebitda: fundamental?.ebitda ?? null,
      grossMargin: fundamental?.grossMargin ?? null,
      operatingMargin: fundamental?.operatingMargin ?? null,
      ebitdaMargin: fundamental?.ebitdaMargin ?? null,
      profitMargin: fundamental?.profitMargin ?? null,
      returnOnEquity: fundamental?.returnOnEquity ?? null,
      returnOnAssets: fundamental?.returnOnAssets ?? null,
      revenueGrowth: fundamental?.revenueGrowth ?? null,
      operatingCashflow: fundamental?.operatingCashflow ?? null,
      freeCashflow: fundamental?.freeCashflow ?? null,
      capex: fundamental?.capex ?? null,
      totalDebt: fundamental?.totalDebt ?? null,
      totalCash: fundamental?.totalCash ?? null,
      debtToEquity: fundamental?.debtToEquity ?? null,
      currentRatio: fundamental?.currentRatio ?? null,
      quickRatio: fundamental?.quickRatio ?? null,
      bookValuePerShare: fundamental?.bookValuePerShare ?? null,
      dividendYield: fundamental?.dividendYield ?? null,
      payoutRatio: fundamental?.payoutRatio ?? null,
      fiveYearAvgDividendYield: fundamental?.fiveYearAvgDividendYield ?? null,
      exDividendDate: fundamental?.exDividendDate ?? null,
      analystRating: fundamental?.analystRating ?? null,
      analystTargetMean: fundamental?.analystTargetMean ?? null,
      analystTargetLow: fundamental?.analystTargetLow ?? null,
      analystTargetHigh: fundamental?.analystTargetHigh ?? null,
      analystCount: fundamental?.analystCount ?? null,
      sharesOutstanding: fundamental?.sharesOutstanding ?? null,
      floatShares: fundamental?.floatShares ?? null,
      insidersPercent: fundamental?.insidersPercent ?? null,
      institutionsPercent: fundamental?.institutionsPercent ?? null,
      sma50: fundamental?.sma50 ?? null,
      sma200: fundamental?.sma200 ?? null,
      beta: fundamental?.beta ?? null,
      avgVolume10d: fundamental?.avgVolume10d ?? null,
    });
  }

  private latestPerTicker<T extends { ticker: string; syncDate: Date }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: Model<any>,
  ): Promise<T[]> {
    return model.aggregate<T>([
      { $sort: { syncDate: -1 } },
      { $group: { _id: '$ticker', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
  }
}
