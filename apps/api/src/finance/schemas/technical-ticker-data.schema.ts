import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CandleWindow } from '../enums/candle-window.enum';

export type TechnicalTickerDataDocument = HydratedDocument<TechnicalTickerData>;

@Schema({ collection: 'technical_ticker_data', timestamps: true })
export class TechnicalTickerData {
  @Prop({ required: true })
  ticker!: string;

  @Prop({ type: String, required: true, enum: CandleWindow })
  window!: CandleWindow;

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

export const TechnicalTickerDataSchema = SchemaFactory.createForClass(
  TechnicalTickerData,
);
TechnicalTickerDataSchema.index(
  { ticker: 1, window: 1, startTime: -1 },
  { unique: true },
);
