import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompoundTechnicalTickerDataDocument =
  HydratedDocument<CompoundTechnicalTickerData>;

@Schema({ collection: 'compound_technical_ticker_data', timestamps: true })
export class CompoundTechnicalTickerData {
  @Prop({ required: true })
  ticker!: string;

  @Prop({ required: true })
  syncDate!: Date;

  @Prop()
  price?: number;

  @Prop()
  changePercent1d?: number;

  @Prop()
  changePercent2d?: number;

  @Prop()
  changePercent5d?: number;

  @Prop()
  changePercent1w?: number;

  @Prop()
  changePercent1m?: number;

  @Prop()
  changePercent3m?: number;

  @Prop()
  changePercent6m?: number;

  @Prop()
  changePercentYtd?: number;

  @Prop()
  changePercent1y?: number;

  // Placeholder for future indicators, e.g. MACD bullish/bearish on a given timeframe.
  @Prop()
  macdSignal?: string;
}

export const CompoundTechnicalTickerDataSchema = SchemaFactory.createForClass(
  CompoundTechnicalTickerData,
);
CompoundTechnicalTickerDataSchema.index(
  { ticker: 1, syncDate: -1 },
  { unique: true },
);
