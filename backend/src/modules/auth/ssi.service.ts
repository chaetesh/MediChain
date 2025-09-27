import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  VerifiableCredential,
  VerifiableCredentialDocument,
  ProofType,
  CredentialStatus,
  ProofMetadata,
  DigitalSignature,
  VerificationResult,
  CredentialFormat,
} from './schemas/verifiable-credential.schema';
import { SsiKeysService } from './ssi-keys.service';
import { SsiGlobalConfig, SsiStandard } from './config/ssi-global-config';

export interface SSIRegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  walletAddress?: string;
  proofs: ProofSubmission[];
  hospitalId?: string;
  password?: string;  // Add password field
}

export interface ProofSubmission {
  type: ProofType;
  document: Buffer | string; // Base64 encoded document
  metadata: ProofMetadata;
  signature?: DigitalSignature;
}

export interface VerificationRequest {
  credentialId: string;
  verifiedBy: string;
  isValid: boolean;
  notes?: string;
  verificationData?: Record<string, any>;
}

@Injectable()
export class SelfSovereignIdentityService {
  private readonly logger = new Logger(SelfSovereignIdentityService.name);

  constructor(
    @InjectModel(VerifiableCredential.name)
    private verifiableCredentialModel: Model<VerifiableCredentialDocument>,
    private readonly configService: ConfigService,
    private readonly ssiKeysService: SsiKeysService,
    private readonly ssiGlobalConfig: SsiGlobalConfig,
  ) {}

  /**
   * Store verifiable credentials for a user
   */
  async storeCredentials(
    userId: string,
    proofs: ProofSubmission[],
  ): Promise<VerifiableCredential[]> {
    try {
      const credentials: VerifiableCredential[] = [];

      // Get region configuration for default region
      const regionConfig = this.ssiGlobalConfig.getRegionConfig();

      for (const proof of proofs) {
        // Validate proof type
        if (!Object.values(ProofType).includes(proof.type)) {
          throw new BadRequestException(`Invalid proof type: ${proof.type}`);
        }

        // Validate document size (base64 encoded)
        const documentString = typeof proof.document === 'string' ? proof.document : proof.document.toString('base64');
        const documentSizeBytes = Buffer.byteLength(documentString, 'base64');
        const maxSizeBytes = 30 * 1024 * 1024; // 30MB max for individual documents

        if (documentSizeBytes > maxSizeBytes) {
          throw new BadRequestException(
            `Document size ${(documentSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of 30MB for ${proof.type}`
          );
        }

        this.logger.log(`Processing ${proof.type} document: ${(documentSizeBytes / 1024).toFixed(1)}KB`);

        // Generate document hash
        const documentHash = this.generateDocumentHash(proof.document);

        // Prepare credential data for signing
        const credentialData = {
          id: crypto.randomUUID(),
          issuer: proof.metadata.issuer,
          issuedDate: proof.metadata.issuedDate,
          holder: userId,
          proofType: proof.type,
          documentHash,
          metadata: proof.metadata,
        };

        // Convert to string for signing
        const dataToSign = JSON.stringify(credentialData);

        // Create digital signature using our SSI keys
        let digitalSignature: DigitalSignature;

        try {
          // Use provided signature or create our own
          if (proof.signature) {
            digitalSignature = proof.signature;
            this.logger.log(`Using provided signature for ${proof.type}`);
          } else {
            const sigData = this.ssiKeysService.createDigitalSignature(dataToSign);
            digitalSignature = {
              signature: sigData.signature,
              algorithm: sigData.algorithm,
              publicKey: sigData.publicKey,
              timestamp: sigData.timestamp,
              keyId: sigData.keyId,
              keyType: sigData.keyType,
            };
            this.logger.log(`Generated new signature for ${proof.type} with key ID: ${sigData.keyId}`);
          }
        } catch (sigError: any) {
          this.logger.warn(`Could not sign credential: ${sigError?.message ?? sigError}`, sigError?.stack);
          // Create a default signature if there's an error
          if (proof.signature) {
            digitalSignature = proof.signature;
          } else {
            // Create placeholder signature
            digitalSignature = {
              signature: 'unable-to-generate-signature',
              algorithm: 'none',
              publicKey: 'none',
              timestamp: new Date(),
            } as DigitalSignature;
          }
        }

        // Create DID context if we have SSI keys
        let didContext = {} as any;
        let didUrl: string | undefined;

        try {
          const didDocument = this.ssiKeysService.exportDidDocument();
          didContext = didDocument;
          didUrl = didDocument.id;
        } catch (didError: any) {
          this.logger.warn(`Could not create DID document: ${didError?.message ?? didError}`);
        }

        // Create verifiable credential
        const credential = new this.verifiableCredentialModel({
          userId,
          proofType: proof.type,
          status: CredentialStatus.PENDING,
          metadata: proof.metadata,
          documentHash,
          digitalSignature,
          selfSovereignData: {
            submittedAt: new Date(),
            version: '1.0',
            protocol: 'MediChain-SSI',
            credentialId: credentialData.id,
          },
          didContext,
          didUrl,
          credentialFormat: regionConfig.preferredStandard === SsiStandard.W3C_VC 
            ? CredentialFormat.JSON_LD 
            : CredentialFormat.JWT,
          regionCode: 'global',
          governanceFramework: `MediChain-${regionConfig.name}`,
        });

        // Save to database
        const savedCredential = await credential.save();
        credentials.push(savedCredential);

        this.logger.log(`Stored credential ${proof.type} for user ${userId} with SSI signature`);
      }

      return credentials;
    } catch (error: any) {
      this.logger.error(`Error storing credentials: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  /**
   * Verify a credential
   */
  async verifyCredential(
    credentialId: string,
    verificationRequest: VerificationRequest,
  ): Promise<VerifiableCredential> {
    try {
      const credential = await this.verifiableCredentialModel.findById(credentialId);

      if (!credential) {
        throw new BadRequestException('Credential not found');
      }

      // If credential has a digital signature, verify it automatically
      let signatureValid = true;
      let signatureInfo = {} as any;

      if (credential.digitalSignature?.signature) {
        // Verify the digital signature
        signatureValid = this.verifyCredentialSignature(credential as VerifiableCredential);

        signatureInfo = {
          signatureVerified: signatureValid,
          signatureKeyId: credential.digitalSignature.keyId || 'unknown',
          signatureTimestamp: credential.digitalSignature.timestamp,
        };

        this.logger.log(
          `Credential ${credentialId} signature verification: ${signatureValid ? 'VALID' : 'INVALID'}`
        );
      }

      // Create verification result with signature information
      const verificationResult: VerificationResult = {
        isValid: verificationRequest.isValid && signatureValid, // Must pass both checks
        verifiedAt: new Date(),
        verifiedBy: verificationRequest.verifiedBy,
        verificationNotes: verificationRequest.notes,
        verificationData: {
          ...(verificationRequest.verificationData || {}),
          ...signatureInfo,
        },
      };

      // Add to verification history
      credential.verificationHistory = credential.verificationHistory || [];
      credential.verificationHistory.push(verificationResult as any);

      // Update status based on verification
      credential.status = verificationResult.isValid
        ? CredentialStatus.VERIFIED
        : CredentialStatus.REJECTED;

      // Save updated credential
      const updatedCredential = await credential.save();

      this.logger.log(`Verified credential ${credentialId}: ${verificationResult.isValid}`);

      return updatedCredential;
    } catch (error: any) {
      this.logger.error(`Error verifying credential: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  /**
   * Get user's credentials by type
   */
  async getUserCredentials(
    userId: string,
    proofType?: ProofType,
    status?: CredentialStatus,
  ): Promise<VerifiableCredential[]> {
    try {
      const query: any = { userId };

      if (proofType) {
        query.proofType = proofType;
      }

      if (status) {
        query.status = status;
      }

      return await this.verifiableCredentialModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error fetching user credentials: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  /**
   * Validate government-issued proof metadata
   */
  validateGovernmentProof(proofType: ProofType, metadata: ProofMetadata): boolean {
    try {
      switch (proofType) {
        case ProofType.AADHAAR:
          return this.validateAadhaarMetadata(metadata);
        case ProofType.PASSPORT:
          return this.validatePassportMetadata(metadata);
        case ProofType.DRIVING_LICENSE:
          return this.validateDrivingLicenseMetadata(metadata);
        case ProofType.PAN_CARD:
          return this.validatePanCardMetadata(metadata);
        case ProofType.VOTER_ID:
          return this.validateVoterIdMetadata(metadata);
        case ProofType.MEDICAL_LICENSE:
          return this.validateMedicalLicenseMetadata(metadata);
        default:
          return this.validateGenericProofMetadata(metadata);
      }
    } catch (error: any) {
      this.logger.error(`Error validating proof metadata: ${error?.message ?? error}`, error?.stack);
      return false;
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(
    credentialId: string,
    reason: string,
    revokedBy: string,
  ): Promise<VerifiableCredential> {
    try {
      const credential = await this.verifiableCredentialModel.findById(credentialId);

      if (!credential) {
        throw new BadRequestException('Credential not found');
      }

      credential.isRevoked = true;
      credential.revokedAt = new Date();
      credential.revokedReason = reason;
      credential.status = CredentialStatus.REJECTED;

      // Add revocation to verification history
      const revocationResult: VerificationResult = {
        isValid: false,
        verifiedAt: new Date(),
        verifiedBy: revokedBy,
        verificationNotes: `Credential revoked: ${reason}`,
        verificationData: { action: 'revocation' },
      };

      credential.verificationHistory = credential.verificationHistory || [];
      credential.verificationHistory.push(revocationResult as any);

      const updatedCredential = await credential.save();

      this.logger.log(`Revoked credential ${credentialId}: ${reason}`);

      return updatedCredential;
    } catch (error: any) {
      this.logger.error(`Error revoking credential: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  /**
   * Check if user has valid credentials for specific proof types
   */
  async hasValidCredentials(
    userId: string,
    requiredProofTypes: ProofType[],
  ): Promise<{ hasValid: boolean; missingTypes: ProofType[] }> {
    try {
      const userCredentials = await this.getUserCredentials(
        userId,
        undefined,
        CredentialStatus.VERIFIED,
      );

      const verifiedTypes = userCredentials.map(cred => cred.proofType);
      const missingTypes = requiredProofTypes.filter(
        type => !verifiedTypes.includes(type),
      );

      return {
        hasValid: missingTypes.length === 0,
        missingTypes,
      };
    } catch (error: any) {
      this.logger.error(`Error checking valid credentials: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  // Private helper methods
  private generateDocumentHash(document: Buffer | string): string {
    const data = typeof document === 'string' ? Buffer.from(document, 'base64') : document;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private validateAadhaarMetadata(metadata: ProofMetadata): boolean {
    // Allow more flexible Aadhaar validation since we're getting from UI
    // Not requiring specific issuer or pattern for easier registration
    return !!(
      metadata.documentNumber && 
      metadata.issuer
      // No longer strictly requiring UIDAI as issuer
      // No longer checking for 12-digit pattern
    );
  }

  private validatePassportMetadata(metadata: ProofMetadata): boolean {
    // Passport number pattern (varies by country)
    const passportPattern = /^[A-Z]{1,2}\d{6,8}$/;
    return !!(
      passportPattern.test(metadata.documentNumber) &&
      metadata.holderName &&
      metadata.holderDOB &&
      metadata.expirationDate
    );
  }

  private validateDrivingLicenseMetadata(metadata: ProofMetadata): boolean {
    return !!(
      metadata.documentNumber &&
      metadata.holderName &&
      metadata.holderDOB &&
      metadata.expirationDate
    );
  }

  private validatePanCardMetadata(metadata: ProofMetadata): boolean {
    // PAN card pattern: 5 letters, 4 digits, 1 letter
    const panPattern = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    return !!(
      panPattern.test(metadata.documentNumber) &&
      metadata.holderName &&
      metadata.holderDOB
    );
  }

  private validateVoterIdMetadata(metadata: ProofMetadata): boolean {
    return !!(
      metadata.documentNumber &&
      metadata.holderName &&
      metadata.holderDOB &&
      metadata.issuer
    );
  }

  private validateMedicalLicenseMetadata(metadata: ProofMetadata): boolean {
    return !!(
      metadata.documentNumber &&
      metadata.holderName &&
      metadata.issuer && // Medical council/board
      metadata.issuedDate &&
      (metadata.expirationDate || metadata.additionalFields?.validityPeriod)
    );
  }

  private validateGenericProofMetadata(metadata: ProofMetadata): boolean {
    return !!(
      metadata.documentNumber &&
      metadata.issuer &&
      metadata.issuedDate
    );
  }

  /**
   * Get maximum allowed file size for document uploads
   */
  getMaxDocumentSize(): { bytes: number; mb: number; description: string } {
    const maxBytes = 30 * 1024 * 1024; // 30MB
    return {
      bytes: maxBytes,
      mb: 30,
      description: 'Maximum allowed document size is 30MB for Aadhaar cards and other government documents'
    };
  }
  
  /**
   * Create a digitally signed verifiable credential
   * @param userId The user ID
   * @param proofType Type of proof document
   * @param metadata Metadata for the proof
   * @param documentHash Hash of the document
   * @param regionCode Optional region code for credential
   * @returns Signed verifiable credential
   */
  async createSignedCredential(
    userId: string,
    proofType: ProofType,
    metadata: ProofMetadata,
    documentHash: string,
    encryptedDocumentUrl?: string,
    regionCode?: string,
  ): Promise<VerifiableCredential> {
    try {
      // Get region-specific configuration
      const regionConfig = this.ssiGlobalConfig.getRegionConfig(regionCode);
      
      // Prepare credential data for signing
      const credentialData = {
        id: crypto.randomUUID(),
        issuer: metadata.issuer,
        issuedDate: metadata.issuedDate,
        holder: userId,
        proofType,
        documentHash,
        metadata,
      };
      
      // Convert to string for signing
      const dataToSign = JSON.stringify(credentialData);
      
      // Create digital signature
      const digitalSignature = this.ssiKeysService.createDigitalSignature(dataToSign);
      
      // Create a DID context
      const didDocument = this.ssiKeysService.exportDidDocument();
      
      // Create credential with SSI data
      const credential = new this.verifiableCredentialModel({
        userId,
        proofType,
        status: CredentialStatus.PENDING,
        metadata,
        documentHash,
        encryptedDocumentUrl,
        digitalSignature,
        selfSovereignData: {
          submittedAt: new Date(),
          version: '1.0',
          protocol: 'MediChain-SSI',
          credentialId: credentialData.id,
        },
        didContext: didDocument,
        didUrl: didDocument.id,
        credentialFormat: regionConfig.preferredStandard === SsiStandard.W3C_VC 
          ? CredentialFormat.JSON_LD 
          : CredentialFormat.JWT,
        regionCode: regionCode || 'global',
        governanceFramework: `MediChain-${regionConfig.name}`,
      });

      // Save to database
      const savedCredential = await credential.save();
      
      this.logger.log(`Created signed credential ${proofType} for user ${userId} with SSI keys`);
      
      return savedCredential;
    } catch (error: any) {
      this.logger.error(`Error creating signed credential: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }
  
  /**
   * Verify a credential's digital signature
   * @param credential The verifiable credential to verify
   * @returns Boolean indicating if the signature is valid
   */
  verifyCredentialSignature(credential: VerifiableCredential): boolean {
    try {
      if (!credential.digitalSignature?.signature) {
        this.logger.warn(`Credential ${(<any>credential)._id ?? 'unknown'} has no digital signature`);
        return false;
      }
      
      // Recreate the data that was originally signed
      const credentialData = {
        id: credential.selfSovereignData?.credentialId || crypto.randomUUID(),
        issuer: credential.metadata.issuer,
        issuedDate: credential.metadata.issuedDate,
        holder: credential.userId,
        proofType: credential.proofType,
        documentHash: credential.documentHash,
        metadata: credential.metadata,
      };
      
      // Convert to string for verification
      const dataToVerify = JSON.stringify(credentialData);
      
      // Verify signature
      return this.ssiKeysService.verifySignature(
        dataToVerify,
        credential.digitalSignature.signature
      );
    } catch (error: any) {
      this.logger.error(`Error verifying credential signature: ${error?.message ?? error}`, error?.stack);
      return false;
    }
  }
  
  /**
   * Get SSI key information
   */
  getKeyInfo(): Record<string, any> {
    try {
      const keyPair = this.ssiKeysService.getKeyPair();
      
      return {
        keyId: keyPair.keyId,
        keyType: keyPair.keyType,
        algorithm: keyPair.algorithm,
        generatedAt: keyPair.generatedAt,
        didDocument: this.ssiKeysService.exportDidDocument(),
      };
    } catch (error: any) {
      this.logger.error(`Error getting SSI key info: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }
}
