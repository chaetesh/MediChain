import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  patientId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: User;

  @Prop({ type: String, ref: 'Hospital' })
  hospitalId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Prop({ type: String, enum: AppointmentType, required: true })
  type: AppointmentType;

  @Prop()
  location: string;

  @Prop()
  meetingLink: string;

  @Prop({ type: Boolean, default: false })
  reminder: boolean;

  @Prop({ type: Date })
  reminderTime: Date;

  @Prop()
  notes: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
