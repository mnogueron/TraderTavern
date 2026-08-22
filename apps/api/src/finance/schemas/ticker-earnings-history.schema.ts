import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class EpsPeriod {
  @Prop({ required: true })
  quarter!: Date;

  @Prop()
  actual?: number;

  @Prop()
  estimate?: number;
}

export class RevenuePeriod {
  @Prop({ required: true })
  quarter!: Date;

  @Prop()
  actual?: number;
}

export type TickerEarningsHistoryDocument =
  HydratedDocument<TickerEarningsHistory>;

@Schema({ collection: 'ticker_earnings_history', timestamps: true })
export class TickerEarningsHistory {
  @Prop({ required: true, unique: true })
  ticker!: string;

  @Prop({ type: [Object], default: [] })
  eps!: EpsPeriod[];

  @Prop({ type: [Object], default: [] })
  revenue!: RevenuePeriod[];
}

export const TickerEarningsHistorySchema = SchemaFactory.createForClass(
  TickerEarningsHistory,
);
