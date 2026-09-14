import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FundamentalTickerData,
  FundamentalTickerDataDocument,
} from '../schemas/fundamental-ticker-data.schema';
import { TickerRef } from '../helpers/sync-utils';

export type FundamentalDataUpsert = Omit<
  FundamentalTickerData,
  'isin' | 'ticker' | 'syncDate'
>;

export type FundamentalScores = Pick<
  FundamentalTickerData,
  'piotroskiScore' | 'altmanZScore'
>;

@Injectable()
export class FundamentalDataRepository {
  constructor(
    @InjectModel(FundamentalTickerData.name)
    private readonly fundamentalTickerDataModel: Model<FundamentalTickerDataDocument>,
  ) {}

  // These scores only change with annual filings, so callers that don't
  // recompute them on a given sync carry the last known values forward
  // instead of dropping them from that day's snapshot.
  async findLatestScores(isin: string): Promise<FundamentalScores | null> {
    return this.fundamentalTickerDataModel
      .findOne({ isin })
      .sort({ syncDate: -1 })
      .select('piotroskiScore altmanZScore')
      .lean();
  }

  async upsert(
    ref: TickerRef,
    syncDate: Date,
    data: FundamentalDataUpsert,
  ): Promise<void> {
    await this.fundamentalTickerDataModel.updateOne(
      { isin: ref.isin, syncDate },
      { $set: { isin: ref.isin, ticker: ref.ticker, syncDate, ...data } },
      { upsert: true },
    );
  }
}
