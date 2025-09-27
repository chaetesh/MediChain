import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export enum ProofType {
  GOVERNMENT_ID = 'government_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  AADHAAR = 'aadhaar',
  VOTER_ID = 'voter_id',
  PAN_CARD = 'pan_card',
  MEDICAL_LICENSE = 'medical_license',
  EDUCATION_CERTIFICATE = 'education_certificate',
  PROFESSIONAL_LICENSE = 'professional_license',
  HOSPITAL_AFFILIATION = 'hospital_affiliation',
  OTHER = 'other',
}

export enum CredentialStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export type VerifiableCredentialDocument = HydratedDocument<VerifiableCredential>;

@Schema({ _id: false })
export class ProofMetadata {
  @Prop({ required: true })
  issuer: string;

  @Prop({ required: true })
  issuedDate: Date;

  @Prop()
  expirationDate?: Date;

  @Prop({ required: true })
  documentNumber: string;

  @Prop()
  holderName?: string;

  @Prop()
  holderDOB?: Date;

  @Prop({ type: Object, default: {} })
  additionalFields: Record<string, any>;
}

@Schema({ _id: false })
export class DigitalSignature {
  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  algorithm: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  timestamp: Date;
  
  @Prop()
  keyId?: string; // Unique identifier for the key used
  
  @Prop()
  keyType?: string; // Type of key (e.g., 'ed25519', 'secp256k1', etc.)
  
  @Prop({ type: Object, default: {} })
  didDocument?: Record<string, any>; // DID Document reference for global interoperability
}

@Schema({ _id: false })
export class VerificationResult {
  @Prop({ required: true })
  isValid: boolean;

  @Prop({ required: true })
  verifiedAt: Date;

  @Prop({ required: true })
  verifiedBy: string; // System or verifier ID

  @Prop()
  verificationNotes?: string;

  @Prop({ type: Object, default: {} })
  verificationData: Record<string, any>;
}

export enum CredentialFormat {
  JWT = 'jwt',
  JSON_LD = 'json-ld',
  SD_JWT = 'sd-jwt', // Selective disclosure JWT
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      const transformed = { ...ret };
      delete transformed.__v;
      return transformed;
    },
  },
})
export class VerifiableCredential extends Document {
  @Prop({ required: true, ref: 'User' })
  userId: string;

  @Prop({ type: String, enum: ProofType, required: true })
  proofType: ProofType;

  @Prop({ type: String, enum: CredentialStatus, default: CredentialStatus.PENDING })
  status: CredentialStatus;

  @Prop({ type: ProofMetadata, required: true })
  metadata: ProofMetadata;

  @Prop({ required: true })
  documentHash: string; // Hash of the original document

  @Prop()
  encryptedDocumentUrl?: string; // IPFS URL or secure storage URL

  @Prop()
  thumbnailUrl?: string; // Redacted/watermarked preview

  @Prop({ type: DigitalSignature })
  digitalSignature?: DigitalSignature;

  @Prop({ type: [VerificationResult], default: [] })
  verificationHistory: VerificationResult[];

  @Prop({ type: Boolean, default: false })
  isRevoked: boolean;

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedReason?: string;

  @Prop({ type: Object, default: {} })
  selfSovereignData: Record<string, any>; // SSI-specific metadata
  
  @Prop({ type: Object, default: {} })
  didContext: Record<string, any>; // W3C DID context information
  
  @Prop()
  didUrl?: string; // Decentralized Identifier URL for global resolution
  
  @Prop({ 
    type: String, 
    enum: CredentialFormat, 
    default: CredentialFormat.JWT 
  })
  credentialFormat: CredentialFormat; // Format of the verifiable credential

  @Prop()
  regionCode?: string; // ISO country/region code for international deployments

  @Prop()
  governanceFramework?: string; // Credential governance framework identifier
}

export const VerifiableCredentialSchema = SchemaFactory.createForClass(VerifiableCredential);



// Indexes for efficient queries
VerifiableCredentialSchema.index({ userId: 1, proofType: 1 });
VerifiableCredentialSchema.index({ status: 1 });
VerifiableCredentialSchema.index({ 'metadata.documentNumber': 1 });
VerifiableCredentialSchema.index({ documentHash: 1 });
VerifiableCredentialSchema.index({ didUrl: 1 }); // Index for DID lookups