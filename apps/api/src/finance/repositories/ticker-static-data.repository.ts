import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TickerStaticData,
  TickerStaticDataDocument,
} from '../schemas/ticker-static-data.schema';
import { TickerRef } from '../helpers/sync-utils';

export type TickerStaticDataUpsert = Omit<TickerStaticData, 'isin' | 'ticker'>;

export type TickerRefWithMarket = TickerRef & { market?: string };

@Injectable()
export class TickerStaticDataRepository {
  constructor(
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
  ) {}

  async upsert(ref: TickerRef, data: TickerStaticDataUpsert): Promise<void> {
    await this.tickerStaticDataModel.updateOne(
      { isin: ref.isin },
      { $set: { isin: ref.isin, ticker: ref.ticker, ...data } },
      { upsert: true },
    );
  }

  // Used to find every ticker whose market has just closed for the day (see
  // TickerSyncService#handleEndOfDayRefresh).
  async findAllRefsWithMarket(): Promise<TickerRefWithMarket[]> {
    return this.tickerStaticDataModel.find().select('isin ticker market').lean();
  }
}
