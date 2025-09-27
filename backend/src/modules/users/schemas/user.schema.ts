import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  HOSPITAL_ADMIN = 'hospital_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      const transformed = { ...ret };
      delete transformed.password;
      delete transformed.__v;
      return transformed;
    },
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: String, default: undefined })
  walletAddress: string;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLogin: Date;

  @Prop({ type: String, ref: 'Hospital', default: null })
  hospitalId: string;

  @Prop({ type: Object, default: {} })
  profileData: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add a sparse unique index on walletAddress
// This ensures uniqueness for non-null values but allows multiple documents with null/undefined walletAddress
UserSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });
