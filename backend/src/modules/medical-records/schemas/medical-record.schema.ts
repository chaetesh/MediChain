import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

export enum RecordType {
  LAB_RESULT = 'lab_result',
  PRESCRIPTION = 'prescription',
  DIAGNOSIS = 'diagnosis',
  IMAGING = 'imaging',
  DISCHARGE_SUMMARY = 'discharge_summary',
  VACCINATION = 'vaccination',
  OPERATION_REPORT = 'operation_report',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class MedicalRecord extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  patientId: User;

  @Prop({ type: String, enum: RecordType, required: true })
  recordType: RecordType;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  ipfsHash: string;

  @Prop({ required: true })
  contentHash: string;

  @Prop()
  blockchainTxHash: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ type: Date, required: true })
  recordDate: Date;

  @Prop({ type: String, ref: 'Hospital' })
  hospitalId: string;

  @Prop()
  originalFilename: string;

  @Prop()
  mimeType: string;

  @Prop({ type: Boolean, default: true })
  isEncrypted: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  sharedWith: User[];

  @Prop({ type: Array, default: [] })
  accessHistory: Array<{
    userId: string;
    action: string; // e.g., 'share_granted', 'share_revoked', 'accessed'
    timestamp: Date;
    expirationTime?: Date;
  }>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Object, default: null })
  aiSummary: {
    text: string;
    generatedAt: Date;
    model: string;
  };

  @Prop({ type: Object, default: null })
  aiPrediction: {
    result: any;
    confidence: number;
    generatedAt: Date;
    model: string;
  };

  @Prop({ type: Object, default: null })
  fhirResource: Record<string, any>;

  @Prop({ type: String, default: null })
  extractedText: string;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

// Transform _id to id in JSON responses
MedicalRecordSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    const { __v, ...cleanRet } = ret;
    return cleanRet;
  }
});
