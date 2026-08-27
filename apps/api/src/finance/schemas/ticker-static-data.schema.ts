import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TickerStaticDataDocument = HydratedDocument<TickerStaticData>;

@Schema({ collection: 'ticker_static_data', timestamps: true })
export class TickerStaticData {
  // The stable cross-source identity for this instrument; the true unique
  // key. `ticker` is only the source-specific (Yahoo) symbol used to query
  // Yahoo Finance, kept for reference but not itself a uniqueness guarantee.
  @Prop({ required: true, unique: true })
  isin!: string;

  @Prop({ required: true })
  ticker!: string;

  @Prop({ required: true })
  companyName!: string;

  @Prop()
  sector?: string;

  @Prop()
  industry?: string;

  @Prop()
  country?: string;

  @Prop()
  description?: string;

  @Prop()
  market?: string;

  @Prop()
  currency?: string;

  @Prop()
  website?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  employees?: number;

  @Prop()
  fiscalYearEnd?: Date;

  @Prop()
  mostRecentQuarter?: Date;
}

export const TickerStaticDataSchema =
  SchemaFactory.createForClass(TickerStaticData);
