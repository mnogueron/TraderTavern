import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BrokerType } from '../enums/broker-type.enum';
import { BrokerConnectionStatus } from '../enums/broker-connection-status.enum';

export type BrokerConnectionDocument = HydratedDocument<BrokerConnection>;

@Schema({ collection: 'broker_connections', timestamps: true })
export class BrokerConnection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: String, enum: BrokerType })
  broker!: BrokerType;

  @Prop({ type: Object, required: true })
  credentials!: Record<string, string>;

  @Prop({
    type: String,
    enum: BrokerConnectionStatus,
    default: BrokerConnectionStatus.Connected,
  })
  status!: BrokerConnectionStatus;
}

export const BrokerConnectionSchema =
  SchemaFactory.createForClass(BrokerConnection);

BrokerConnectionSchema.index({ userId: 1, broker: 1 }, { unique: true });
