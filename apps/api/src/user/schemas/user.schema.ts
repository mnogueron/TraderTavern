import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../shared/role.enum';
import { TickerSourceType } from '../../ticker-source/enums/ticker-source-type.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, required: true, enum: Role, default: Role.User })
  role!: Role;

  @Prop({
    type: String,
    required: true,
    enum: TickerSourceType,
    default: TickerSourceType.Yahoo,
  })
  tickerSource!: TickerSourceType;

  @Prop()
  resetPasswordTokenHash?: string;

  @Prop()
  resetPasswordExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
