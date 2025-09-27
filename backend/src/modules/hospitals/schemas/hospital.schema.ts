import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type HospitalDocument = HydratedDocument<Hospital>;

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum HospitalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class Hospital extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  country: string;

  @Prop()
  zipCode: string;

  @Prop()
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  website: string;

  @Prop({ required: true })
  licenseNumber: string;

  @Prop()
  registrationNumber: string;

  @Prop({
    type: String,
    enum: HospitalStatus,
    default: HospitalStatus.PENDING,
  })
  status: HospitalStatus;

  @Prop()
  notes: string;

  @Prop({ type: Object })
  adminDetails: {
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
  };

  @Prop({ type: [String], default: [] })
  departments: string[];

  @Prop({ type: [String], default: [] })
  facilities: string[];

  @Prop({ type: Object, default: {} })
  metrics: {
    totalDoctors?: number;
    totalPatients?: number;
    monthlyRecords?: number;
    activeAppointments?: number;
  };

  @Prop()
  walletAddress: string;

  @Prop({ type: Boolean, default: false })
  blockchainVerified: boolean;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @Prop({ type: Date })
  subscriptionExpiryDate: Date;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  aiSettings: {
    summarizationEnabled: boolean;
    predictionEnabled: boolean;
    anonymizationLevel: string;
  };
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);
