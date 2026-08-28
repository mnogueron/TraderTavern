import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WatchlistDocument = HydratedDocument<Watchlist>;

@Schema({ collection: 'watchlists', timestamps: true })
export class Watchlist {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  // Yahoo-style ticker symbols (e.g. AAPL, SAP.DE), matching the convention
  // used by the finance module's ticker lookups.
  @Prop({ type: [String], default: [] })
  tickers!: string[];
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);
WatchlistSchema.index({ userId: 1 });
