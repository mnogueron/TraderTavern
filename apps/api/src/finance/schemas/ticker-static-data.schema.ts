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
  market?: string;
}

export const TickerStaticDataSchema =
  SchemaFactory.createForClass(TickerStaticData);
