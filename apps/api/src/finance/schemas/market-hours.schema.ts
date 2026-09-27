import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DEFAULT_TRADING_DAYS } from '../constants/trading-days';

export type MarketHoursDocument = HydratedDocument<MarketHours>;

@Schema({ collection: 'market_hours', timestamps: true })
export class MarketHours {
  @Prop({ required: true, unique: true })
  market!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  timezone!: string;

  @Prop()
  preMarketOpen?: string;

  @Prop({ required: true })
  regularOpen!: string;

  @Prop({ required: true })
  regularClose!: string;

  @Prop()
  postMarketClose?: string;

  // Day-of-week indices (0 = Sunday) this market trades on. Defaults to
  // Mon-Fri; see constants/trading-days.ts for known exceptions (e.g. TLV).
  @Prop({ type: [Number], default: () => [...DEFAULT_TRADING_DAYS] })
  tradingDays!: number[];
}

export const MarketHoursSchema = SchemaFactory.createForClass(MarketHours);
