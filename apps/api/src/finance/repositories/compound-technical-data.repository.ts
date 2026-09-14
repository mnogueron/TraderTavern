import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompoundTechnicalTickerData,
  CompoundTechnicalTickerDataDocument,
} from '../schemas/compound-technical-ticker-data.schema';
import { TickerRef } from '../helpers/sync-utils';

export type CompoundTechnicalDataUpsert = Omit<
  CompoundTechnicalTickerData,
  'isin' | 'ticker' | 'syncDate'
>;

@Injectable()
export class CompoundTechnicalDataRepository {
  constructor(
    @InjectModel(CompoundTechnicalTickerData.name)
    private readonly compoundTechnicalTickerDataModel: Model<CompoundTechnicalTickerDataDocument>,
  ) {}

  async existsForDate(isin: string, syncDate: Date): Promise<boolean> {
    return Boolean(
      await this.compoundTechnicalTickerDataModel.exists({ isin, syncDate }),
    );
  }

  async upsert(
    ref: TickerRef,
    syncDate: Date,
    data: CompoundTechnicalDataUpsert,
  ): Promise<void> {
    await this.compoundTechnicalTickerDataModel.updateOne(
      { isin: ref.isin, syncDate },
      { $set: { isin: ref.isin, ticker: ref.ticker, syncDate, ...data } },
      { upsert: true },
    );
  }
}
