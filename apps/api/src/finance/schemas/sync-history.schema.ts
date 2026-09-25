import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SyncType } from '../enums/sync-type.enum';
import { SyncStatus } from '../enums/sync-status.enum';
import { SyncKind } from '../enums/sync-kind.enum';

export type SyncHistoryDocument = HydratedDocument<SyncHistory>;

@Schema({ collection: 'sync_history', timestamps: true })
export class SyncHistory {
  @Prop({ type: String, required: true, enum: SyncType })
  type!: SyncType;

  @Prop({ type: String, required: true, enum: SyncKind })
  kind!: SyncKind;

  @Prop({ type: String, required: true, enum: SyncStatus })
  status!: SyncStatus;

  @Prop({ required: true })
  syncDate!: Date;

  // sha256 of the sorted ISIN list this chunk covers, so a given day's chunk
  // can be resumed/skipped idempotently instead of retriggered.
  @Prop({ required: true })
  chunkHash!: string;

  @Prop({ required: true })
  tickerCount!: number;

  @Prop()
  triggeredByUserId?: string;

  // ISIN -> error message, for every ISIN that failed to resolve or sync.
  @Prop()
  tickerErrors?: string;

  // The reason the whole chunk stopped early (e.g. a Yahoo rate-limit
  // cooldown, a request timeout, or a reclaimed stale lock), as opposed to
  // an individual ticker's own error (see `tickerErrors`).
  @Prop()
  generalError?: string;

  // Every Yahoo exchange code this chunk's ISINs belong to (chunks are
  // grouped by market, see TickerSyncService.buildChunks) — usually one, but
  // more than one when small markets closing the same day were bulk
  // aggregated into a single chunk. Empty for the ungated group of ISINs
  // whose market hasn't been resolved yet.
  @Prop({ type: [String], default: [] })
  markets!: string[];

  // The full set of ISINs this chunk covers, regardless of whether each one
  // was successfully resolved/synced, so the admin sync log can show what
  // was attempted.
  @Prop({ type: [String], default: [] })
  isins!: string[];

  // ISIN -> Yahoo ticker for every ISIN in `isins` that was successfully
  // resolved, populated as the sync progresses/finishes.
  @Prop({ type: Object, default: {} })
  resolvedTickers!: Record<string, string>;
}

export const SyncHistorySchema = SchemaFactory.createForClass(SyncHistory);

// Prevents the same chunk of tickers from being processed twice on the same
// day, regardless of how many times it's (re)triggered.
SyncHistorySchema.index(
  { syncDate: 1, kind: 1, chunkHash: 1 },
  { unique: true },
);

// Acts as a distributed lock: at most one "running" chunk per kind at a
// time, so concurrent triggers (e.g. an overlapping cron tick, or a manual
// trigger racing the cron) can't process overlapping chunks against Yahoo.
SyncHistorySchema.index(
  { kind: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: SyncStatus.Running } },
);
