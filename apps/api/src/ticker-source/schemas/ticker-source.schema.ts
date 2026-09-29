import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TickerSourceType } from '../enums/ticker-source-type.enum';

export type TickerSourceDocument = HydratedDocument<TickerSource>;

// One row per (isin, source) pair: the same instrument can be pulled from
// several sources under different tickers, but the ISIN is the stable key
// that ties them together and that the rest of the app maps back to.
@Schema({ collection: 'ticker_sources', timestamps: true })
export class TickerSource {
  @Prop({ required: true })
  isin!: string;

  @Prop({ type: String, required: true, enum: TickerSourceType })
  source!: TickerSourceType;

  @Prop({ required: true })
  ticker!: string;

  @Prop()
  name?: string;

  @Prop()
  currency?: string;

  // When this row was last confirmed by a successful sync run against the
  // source. Distinct from Mongoose's own `updatedAt`, which would also
  // change for unrelated field edits.
  @Prop({ required: true })
  lastSyncedAt!: Date;

  // The source's own "as of" vintage for this data, when the source
  // publishes one (e.g. the quarter the XTB OMI specification table covers).
  // Not applicable to sources like Yahoo that are queried live per ticker.
  @Prop()
  sourceUpdatedAt?: Date;
}

export const TickerSourceSchema = SchemaFactory.createForClass(TickerSource);

TickerSourceSchema.index({ isin: 1, source: 1 }, { unique: true });
