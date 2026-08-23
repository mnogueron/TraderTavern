import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SyncType } from '../enums/sync-type.enum';
import { SyncStatus } from '../enums/sync-status.enum';

export type SyncHistoryDocument = HydratedDocument<SyncHistory>;

@Schema({ collection: 'sync_history', timestamps: true })
export class SyncHistory {
  @Prop({ type: String, required: true, enum: SyncType })
  type!: SyncType;

  @Prop({ type: String, required: true, enum: SyncStatus })
  status!: SyncStatus;

  @Prop({ required: true })
  syncDate!: Date;

  @Prop()
  triggeredByUserId?: string;

  @Prop()
  errors?: string;
}

export const SyncHistorySchema = SchemaFactory.createForClass(SyncHistory);

// Acts as a distributed lock: at most one "running" sync can exist at a
// time, so concurrent triggers (e.g. several requests to the screener
// landing before the first sync finishes) can only start one real sync
// instead of piling up overlapping full-collection syncs against Yahoo.
SyncHistorySchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: SyncStatus.Running } },
);
