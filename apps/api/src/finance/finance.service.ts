import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TickerDto } from './dto/Ticker.dto';
import { SyncType } from './enums/sync-type.enum';
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
  ) {}

  async getScreener(): Promise<TickerDto[]> {
    await this.tickerSyncService.ensureSyncedToday({ type: SyncType.Auto });

    const [staticData, technicalData, fundamentalData] = await Promise.all([
      this.tickerStaticDataModel.find().lean(),
      this.latestPerTicker<CompoundTechnicalTickerData>(
        this.compoundTechnicalTickerDataModel,
      ),
      this.latestPerTicker<FundamentalTickerData>(
        this.fundamentalTickerDataModel,
      ),
    ]);

    const technicalByTicker = new Map(
      technicalData.map((doc) => [doc.ticker, doc]),
    );
    const fundamentalByTicker = new Map(
      fundamentalData.map((doc) => [doc.ticker, doc]),
    );

    return staticData.map((ticker) => {
      const technical = technicalByTicker.get(ticker.ticker);
      const fundamental = fundamentalByTicker.get(ticker.ticker);

      return new TickerDto(
        ticker.ticker,
        ticker.companyName,
        ticker.sector ?? null,
        ticker.industry ?? null,
        fundamental?.marketCap ?? null,
        fundamental?.peRatio ?? null,
        technical?.price ?? null,
        ticker.country ?? null,
        technical?.changePercent1d ?? null,
      );
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
