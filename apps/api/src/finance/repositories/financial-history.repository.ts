import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnnualFinancialPeriod,
  TickerFinancialHistory,
  TickerFinancialHistoryDocument,
} from '../schemas/ticker-financial-history.schema';
import { TickerRef } from '../helpers/sync-utils';

@Injectable()
export class FinancialHistoryRepository {
  constructor(
    @InjectModel(TickerFinancialHistory.name)
    private readonly tickerFinancialHistoryModel: Model<TickerFinancialHistoryDocument>,
  ) {}

  async upsertAnnual(
    ref: TickerRef,
    annual: AnnualFinancialPeriod[],
  ): Promise<void> {
    await this.tickerFinancialHistoryModel.updateOne(
      { isin: ref.isin },
      { $set: { isin: ref.isin, ticker: ref.ticker, annual } },
      { upsert: true },
    );
  }
}
