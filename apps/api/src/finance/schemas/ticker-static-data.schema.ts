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

  // Diacritic-stripped copy of `ticker`, kept in sync by
  // TickerStaticDataRepository.upsert. Search matches against this (with an
  // equally-stripped query) rather than `ticker` directly, so e.g. "generale"
  // matches "GÉNÉRALE" - see helpers/text-normalization.ts.
  @Prop({ required: true })
  normalizedTicker!: string;

  @Prop({ required: true })
  companyName!: string;

  // Diacritic-stripped copy of `companyName`, same reasoning as
  // `normalizedTicker`.
  @Prop({ required: true })
  normalizedCompanyName!: string;

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

// Powers ticker search: relevance-scored $text matching on the normalized
// (diacritic-stripped) ticker and company name - see
// helpers/text-normalization.ts. Ticker weighted higher so a symbol match
// outranks an incidental word match in a company name.
TickerStaticDataSchema.index(
  { normalizedTicker: 'text', normalizedCompanyName: 'text' },
  {
    weights: { normalizedTicker: 5, normalizedCompanyName: 1 },
    name: 'ticker_companyName_text',
  },
);

// Backs the anchored ticker-prefix fallback for short/partial queries that
// $text (whole-word) search can't match, e.g. "AAP" -> "AAPL".
TickerStaticDataSchema.index({ normalizedTicker: 1 });
