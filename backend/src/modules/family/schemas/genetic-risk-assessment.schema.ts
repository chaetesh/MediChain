import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type GeneticRiskAssessmentDocument = HydratedDocument<GeneticRiskAssessment>;

@Schema({ timestamps: true })
export class GeneticRiskAssessment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  diseaseName: string;

  @Prop({ required: true, min: 0, max: 100 })
  riskPercentage: number;

  @Prop()
  factors: string[];

  @Prop()
  familyHistoryContribution: {
    userId: MongooseSchema.Types.ObjectId,
    condition: string,
    relationship: string,
    impact: number
  }[];

  @Prop()
  recommendations: string[];
  
  @Prop({ default: Date.now })
  assessedAt: Date;
}

export const GeneticRiskAssessmentSchema = SchemaFactory.createForClass(GeneticRiskAssessment);
