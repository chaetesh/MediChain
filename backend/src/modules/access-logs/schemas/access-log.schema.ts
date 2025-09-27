import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AccessLogDocument = HydratedDocument<AccessLog>;

export enum AccessType {
  VIEW = 'view',
  DOWNLOAD = 'download',
  SHARE = 'share',
  REVOKE = 'revoke',
  UPLOAD = 'upload',
}

export enum AccessMethod {
  DIRECT = 'direct',
  QR = 'qr',
  OTP = 'otp',
  WALLET = 'wallet',
}

@Schema({ timestamps: true })
export class AccessLog extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  patientId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  accessorId: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MedicalRecord',
    required: true,
  })
  recordId: string;

  @Prop({ type: String, required: true })
  recordTitle: string;

  @Prop({ type: String, enum: AccessType, required: true })
  accessType: AccessType;

  @Prop({
    type: String,
    enum: AccessMethod,
    required: true,
    default: AccessMethod.DIRECT,
  })
  accessMethod: AccessMethod;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital' })
  hospitalId: string;

  @Prop({ type: Boolean, default: false })
  blockchainVerified: boolean;

  @Prop({ type: String })
  notes: string;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog);
