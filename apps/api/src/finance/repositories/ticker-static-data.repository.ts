import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TickerStaticData,
  TickerStaticDataDocument,
} from '../schemas/ticker-static-data.schema';
import { TickerRef } from '../helpers/sync-utils';
import { stripDiacritics } from '../helpers/text-normalization';
import {
  TickerSource,
  TickerSourceDocument,
} from '../../ticker-source/schemas/ticker-source.schema';

export type TickerStaticDataUpsert = Omit<TickerStaticData, 'isin' | 'ticker'>;

export type TickerRefWithMarket = TickerRef & { market?: string };

@Injectable()
export class TickerStaticDataRepository {
  constructor(
    @InjectModel(TickerStaticData.name)
    private readonly tickerStaticDataModel: Model<TickerStaticDataDocument>,
    @InjectModel(TickerSource.name)
    private readonly tickerSourceModel: Model<TickerSourceDocument>,
  ) {}

  async upsert(ref: TickerRef, data: TickerStaticDataUpsert): Promise<void> {
    await this.tickerStaticDataModel.updateOne(
      { isin: ref.isin },
      { $set: { isin: ref.isin, ticker: ref.ticker, ...data } },
      { upsert: true },
    );

    // Keep ticker_sources.companyName in sync so ticker search can $text
    // search it without joining back to ticker_static_data.
    await this.tickerSourceModel.updateMany(
      { isin: ref.isin },
      {
        $set: {
          companyName: data.companyName,
          normalizedCompanyName: stripDiacritics(data.companyName),
        },
      },
    );
  }

  // Used by MarketService to group ISINs by market for chunked syncing.
  async findAllRefsWithMarket(): Promise<TickerRefWithMarket[]> {
    return this.tickerStaticDataModel
      .find()
      .select('isin ticker market')
      .lean();
  }
}
