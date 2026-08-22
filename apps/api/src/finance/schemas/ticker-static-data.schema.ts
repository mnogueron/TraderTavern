import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TickerStaticDataDocument = HydratedDocument<TickerStaticData>;

@Schema({ collection: 'ticker_static_data', timestamps: true })
export class TickerStaticData {
  @Prop({ required: true, unique: true })
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
  employees?: number;

  @Prop()
  fiscalYearEnd?: Date;

  @Prop()
  mostRecentQuarter?: Date;
}

export const TickerStaticDataSchema =
  SchemaFactory.createForClass(TickerStaticData);
