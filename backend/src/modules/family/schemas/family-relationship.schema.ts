import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export enum RelationshipType {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  SPOUSE = 'spouse',
  GRANDPARENT = 'grandparent',
  GRANDCHILD = 'grandchild',
  OTHER = 'other',
}

export enum RelationshipStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export type FamilyRelationshipDocument = HydratedDocument<FamilyRelationship>;

@Schema({ timestamps: true })
export class FamilyRelationship extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  relatedUserId: User;

  @Prop({ type: String, enum: RelationshipType, required: true })
  relationshipType: RelationshipType;

  @Prop({ type: String, enum: RelationshipStatus, default: RelationshipStatus.PENDING })
  status: RelationshipStatus;

  @Prop({ default: false })
  isConfirmed: boolean; // For backward compatibility

  @Prop()
  confirmedAt: Date;

  @Prop({ default: false })
  allowMedicalDataSharing: boolean; // Renamed from shareGeneticData for consistency with frontend
}

export const FamilyRelationshipSchema = SchemaFactory.createForClass(FamilyRelationship);
// Add compound index to ensure uniqueness for each relationship pair
FamilyRelationshipSchema.index({ userId: 1, relatedUserId: 1 }, { unique: true });
