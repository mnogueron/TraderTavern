import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export const MarketHoursSchema = SchemaFactory.createForClass(MarketHours);
