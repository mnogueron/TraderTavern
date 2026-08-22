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
  totalCash?: number;

  @Prop()
  debtToEquity?: number;

  // Company
  @Prop()
  enterpriseValue?: number;

  @Prop()
  revenue?: number;

  @Prop()
  grossProfit?: number;

  @Prop()
  netIncome?: number;

  @Prop()
  revenuePerShare?: number;

  // Valuation
  @Prop()
  forwardPE?: number;

  @Prop()
  pegRatio?: number;

  @Prop()
  evToEbitda?: number;

  @Prop()
  evToRevenue?: number;

  @Prop()
  priceToBook?: number;

  @Prop()
  epsTrailing?: number;

  @Prop()
  epsForward?: number;

  // 52-week range
  @Prop()
  fiftyTwoWeekHigh?: number;

  @Prop()
  fiftyTwoWeekLow?: number;

  // Profitability
  @Prop()
  grossMargin?: number;

  @Prop()
  operatingMargin?: number;

  @Prop()
  ebitdaMargin?: number;

  @Prop()
  profitMargin?: number;

  @Prop()
  returnOnEquity?: number;

  @Prop()
  returnOnAssets?: number;

  // Growth
  @Prop()
  revenueGrowth?: number;

  @Prop()
  earningsGrowth?: number;

  // Cash flow & leverage
  @Prop()
  operatingCashflow?: number;

  @Prop()
  freeCashflow?: number;

  @Prop()
  capex?: number;

  @Prop()
  fcfMargin?: number;

  @Prop()
  fcfYield?: number;

  @Prop()
  netDebt?: number;

  @Prop()
  netDebtToEbitda?: number;

  // Balance sheet
  @Prop()
  currentRatio?: number;

  @Prop()
  quickRatio?: number;

  @Prop()
  bookValuePerShare?: number;

  @Prop()
  cashPerShare?: number;

  // Dividends
  @Prop()
  forwardDividendRate?: number;

  @Prop()
  trailingDividendRate?: number;

  @Prop()
  dividendYield?: number;

  @Prop()
  fiveYearAvgDividendYield?: number;

  @Prop()
  payoutRatio?: number;

  @Prop()
  exDividendDate?: Date;

  // Analyst consensus
  @Prop()
  analystRating?: string;

  @Prop()
  analystTargetMean?: number;

  @Prop()
  analystTargetLow?: number;

  @Prop()
  analystTargetHigh?: number;

  @Prop()
  analystCount?: number;

  // Ownership
  @Prop()
  sharesOutstanding?: number;

  @Prop()
  floatShares?: number;

  @Prop()
  insidersPercent?: number;

  @Prop()
  institutionsPercent?: number;

  // Technical (Yahoo-provided, no computation)
  @Prop()
  sma50?: number;

  @Prop()
  sma200?: number;

  @Prop()
  beta?: number;

  @Prop()
  sp500Change52w?: number;

  @Prop()
  avgVolume30d?: number;

  @Prop()
  avgVolume10d?: number;
}

export const FundamentalTickerDataSchema = SchemaFactory.createForClass(
  FundamentalTickerData,
);
FundamentalTickerDataSchema.index(
  { ticker: 1, syncDate: -1 },
  { unique: true },
);
