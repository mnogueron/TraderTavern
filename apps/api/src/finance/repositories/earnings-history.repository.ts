import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EpsPeriod,
  RevenuePeriod,
  TickerEarningsHistory,
  TickerEarningsHistoryDocument,
} from '../schemas/ticker-earnings-history.schema';
import { TickerRef } from '../helpers/sync-utils';

@Injectable()
export class EarningsHistoryRepository {
  constructor(
    @InjectModel(TickerEarningsHistory.name)
    private readonly tickerEarningsHistoryModel: Model<TickerEarningsHistoryDocument>,
  ) {}

  async upsert(
    ref: TickerRef,
    eps: EpsPeriod[],
    revenue: RevenuePeriod[],
  ): Promise<void> {
    await this.tickerEarningsHistoryModel.updateOne(
      { isin: ref.isin },
      { $set: { isin: ref.isin, ticker: ref.ticker, eps, revenue } },
      { upsert: true },
    );
  }
}
