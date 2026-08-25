import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TickerBindDocument = HydratedDocument<TickerBind>;

@Schema({ collection: 'ticker_binds', timestamps: true })
export class TickerBind {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  source!: string;

  @Prop({ type: [String], default: [] })
  tickers!: string[];
}

export const TickerBindSchema = SchemaFactory.createForClass(TickerBind);

TickerBindSchema.index({ userId: 1, source: 1 }, { unique: true });
