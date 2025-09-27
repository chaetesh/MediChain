// frontend/src/lib/types/family.types.ts

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
  REJECTED = 'rejected'
}

export interface FamilyRelationship {
  _id: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  confirmedAt?: string;
  allowMedicalDataSharing: boolean;
  relatedUserId: string;
  relatedUserName?: string; // Display name of related user
  userId: string;
}

export interface GeneticRiskAssessment {
  _id: string;
  userId: string;
  diseaseName: string;
  riskPercentage: number;
  factors: string[];
  familyHistoryContribution: {
    userId: string;
    condition: string;
    relationship: string;
    impact: number;
  }[];
  recommendations: string[];
  assessedAt: string;
}
