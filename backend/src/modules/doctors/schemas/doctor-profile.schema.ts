import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DoctorProfileDocument = HydratedDocument<DoctorProfile>;

@Schema({ timestamps: true })
export class DoctorProfile extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;
  
  @Prop({ required: true })
  specialization: string;
  
  @Prop()
  department: string;
  
  @Prop({ required: true })
  licenseNumber: string;
  
  @Prop({ type: Number, default: 0 })
  experience: number;
  
  @Prop({ type: String })
  qualifications: string;
  
  @Prop({ type: String })
  bio: string;
  
  @Prop({ type: String })
  profilePicture: string;
  
  @Prop({ type: [String], default: [] })
  languages: string[];
  
  @Prop({ type: Boolean, default: true })
  isAvailableForConsultation: boolean;
  
  @Prop({ type: String, ref: 'Hospital' })
  hospitalId: string;
  
  @Prop({ type: Number, default: 0 })
  patientsServed: number;
  
  @Prop({ type: Number, default: 0 })
  recordsUploaded: number;
  
  @Prop({ type: Boolean, default: false })
  verified: boolean;
  
  @Prop({ type: Object, default: {} })
  workingHours: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  
  @Prop({ type: Object, default: {} })
  consultationFees: {
    inPerson: number;
    virtual: number;
  };
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const DoctorProfileSchema = SchemaFactory.createForClass(DoctorProfile);
