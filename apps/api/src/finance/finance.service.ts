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
  ) {}

  async getScreenerTickerOptions(): Promise<TickerOptionDto[]> {
    const staticData = await this.tickerStaticDataModel
      .find()
      .select('ticker companyName')
      .sort({ ticker: 1 })
      .lean();

    return staticData.map(
      (ticker) => new TickerOptionDto(ticker.ticker, ticker.companyName),
    );
  }

  async getScreener(): Promise<TickerDto[]> {
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
      fundamental.debtToEquity ?? null,
      fundamental.updatedAt ?? null,
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
    return new TickerDto(
      staticData.ticker,
      staticData.companyName,
      staticData.sector ?? null,
      staticData.industry ?? null,
      fundamental?.marketCap ?? null,
      fundamental?.peRatio ?? null,
      technical?.price ?? null,
      staticData.country ?? null,
      marketLabel,
      technical?.changePercent1d ?? null,
      technical?.updatedAt ?? null,
    );
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
