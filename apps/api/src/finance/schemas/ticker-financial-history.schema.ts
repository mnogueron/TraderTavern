import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class AnnualFinancialPeriod {
  @Prop({ required: true })
  periodEnd!: Date;

  @Prop()
  revenue?: number;

  @Prop()
  ebitda?: number;

  @Prop()
  netIncome?: number;

  @Prop()
  operatingCashflow?: number;

  @Prop()
  capex?: number;

  @Prop()
  freeCashflow?: number;

  @Prop()
  cash?: number;

  @Prop()
  totalDebt?: number;

  @Prop()
  netDebt?: number;
}

export type TickerFinancialHistoryDocument =
  HydratedDocument<TickerFinancialHistory>;

@Schema({ collection: 'ticker_financial_history', timestamps: true })
export class TickerFinancialHistory {
  @Prop({ required: true, unique: true })
  isin!: string;

  @Prop({ required: true })
  ticker!: string;

  @Prop({ type: [Object], default: [] })
  annual!: AnnualFinancialPeriod[];
}

export const TickerFinancialHistorySchema = SchemaFactory.createForClass(
  TickerFinancialHistory,
);
