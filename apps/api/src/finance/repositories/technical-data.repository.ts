import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Candle,
  TechnicalTickerData,
  TechnicalTickerDataDocument,
} from '../schemas/technical-ticker-data.schema';
import { CandleWindow } from '../enums/candle-window.enum';
import { TickerRef } from '../helpers/sync-utils';

@Injectable()
export class TechnicalDataRepository {
  constructor(
    @InjectModel(TechnicalTickerData.name)
    private readonly technicalTickerDataModel: Model<TechnicalTickerDataDocument>,
  ) {}

  async upsertCandles(
    ref: TickerRef,
    window: CandleWindow,
    candles: Candle[],
  ): Promise<void> {
    await this.technicalTickerDataModel.updateOne(
      { isin: ref.isin, window },
      { $set: { isin: ref.isin, ticker: ref.ticker, window, candles } },
      { upsert: true },
    );
  }
}
