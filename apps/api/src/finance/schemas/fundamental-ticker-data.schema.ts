import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FundamentalTickerDataDocument =
  HydratedDocument<FundamentalTickerData>;

@Schema({ collection: 'fundamental_ticker_data', timestamps: true })
export class FundamentalTickerData {
  @Prop({ required: true })
  ticker!: string;

  @Prop({ required: true })
  syncDate!: Date;

  @Prop()
  marketCap?: number;

  @Prop()
  peRatio?: number;

  @Prop()
  psRatio?: number;

  @Prop()
  ebitda?: number;

  @Prop()
  totalDebt?: number;

  @Prop()
  debtToEquity?: number;
}

export const FundamentalTickerDataSchema = SchemaFactory.createForClass(
  FundamentalTickerData,
);
FundamentalTickerDataSchema.index(
  { ticker: 1, syncDate: -1 },
  { unique: true },
);
