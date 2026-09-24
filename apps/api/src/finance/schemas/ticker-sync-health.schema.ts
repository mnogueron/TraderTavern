import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TickerSyncHealthDocument = HydratedDocument<TickerSyncHealth>;

// Tracks consecutive Yahoo sync failures per ISIN so a persistently broken
// ticker (delisted, wrong symbol, Yahoo-specific quirk) can be automatically
// excluded from future sync attempts instead of being retried forever. See
// TICKER_SYNC_ERROR_THRESHOLD for the cutoff and TickerHealthService for the
// read/write logic.
@Schema({ collection: 'ticker_sync_health', timestamps: true })
export class TickerSyncHealth {
  @Prop({ required: true, unique: true })
  isin!: string;

  @Prop({ required: true })
  ticker!: string;

  @Prop({ required: true, default: 0 })
  errorCount!: number;

  @Prop()
  lastError?: string;

  @Prop()
  lastErrorAt?: Date;

  // Once true, the ISIN is skipped entirely by the automated sync job (no
  // ticker resolution, no Yahoo requests) until an admin unhides it from
  // settings.
  @Prop({ required: true, default: false })
  hidden!: boolean;

  @Prop()
  hiddenAt?: Date;

  // Set only when a *full* ticker sync (static + compound + financial
  // history + fundamental + earnings + technical, see
  // TickerSyncService.syncTicker) succeeds, as opposed to a partial sync of
  // a single data kind (e.g. compound-only). Used by the sync health
  // monitor to tell whether a ticker's EOD data has actually been refreshed
  // since its market closed.
  @Prop()
  lastFullSyncedAt?: Date;
}

export const TickerSyncHealthSchema =
  SchemaFactory.createForClass(TickerSyncHealth);
