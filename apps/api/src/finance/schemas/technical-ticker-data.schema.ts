import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CandleWindow } from '../enums/candle-window.enum';

@Schema({ _id: false })
export class Candle {
  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({ required: true })
  entry!: number;

  @Prop({ required: true })
  exit!: number;

  @Prop({ required: true })
  low!: number;

  @Prop({ required: true })
  high!: number;

  @Prop({ required: true })
  volume!: number;
}

export const CandleSchema = SchemaFactory.createForClass(Candle);

export type TechnicalTickerDataDocument = HydratedDocument<TechnicalTickerData>;

@Schema({ collection: 'technical_ticker_data', timestamps: true })
export class TechnicalTickerData {
  @Prop({ required: true })
  isin!: string;

  @Prop({ required: true })
  ticker!: string;

  @Prop({ type: String, required: true, enum: CandleWindow })
  window!: CandleWindow;

  @Prop({ type: [CandleSchema], default: [] })
  candles!: Candle[];
}

export const TechnicalTickerDataSchema = SchemaFactory.createForClass(
  TechnicalTickerData,
);
TechnicalTickerDataSchema.index({ isin: 1, window: 1 }, { unique: true });
