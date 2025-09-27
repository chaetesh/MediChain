import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MedicalRecord,
  MedicalRecordDocument,
} from './schemas/medical-record.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { StorageService } from '../storage/storage.service';
import { IPFSService } from '../../common/ipfs.service';
import { AccessLogsService } from '../access-logs/access-logs.service';
import { AIProcessingService } from './ai-processing.service';
import {
  AccessType,
  AccessMethod,
} from '../access-logs/schemas/access-log.schema';
import * as crypto from 'crypto';

@Injectable()
export class MedicalRecordsService {
  private readonly logger = new Logger(MedicalRecordsService.name);

  constructor(
    @InjectModel(MedicalRecord.name)
    private medicalRecordModel: Model<MedicalRecordDocument>,
    private readonly blockchainService: BlockchainService,
    private readonly storageService: StorageService,
    private readonly ipfsService: IPFSService,
    private readonly accessLogsService: AccessLogsService,
    private readonly aiProcessingService: AIProcessingService,
  ) {}

  /**
   * Create a new medical record
   * @param patientId - Patient's user ID
   * @param patientAddress - Patient's blockchain address
   * @param doctorId - Doctor's user ID (if applicable)
   * @param hospitalId - Hospital ID (if applicable)
   * @param recordData - Medical record data
   * @param fileBuffer - File content
   */
  async create(
    patientId: string,
    patientAddress: string,
    recordData: any,
    fileBuffer: Buffer,
    doctorId?: string,
    hospitalId?: string,
    originalFilename?: string,
    mimeType?: string,
  ): Promise<MedicalRecord> {
    try {
      // Validate required fields explicitly
      if (!recordData.title) {
        throw new BadRequestException('Title is required');
      }

      if (!recordData.recordType) {
        throw new BadRequestException('Record type is required');
      }

      // Calculate content hash for verification
      const contentHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // Store file in IPFS
      const ipfsHash = await this.ipfsService.storeEncrypted(fileBuffer);

      // Process image with AI if it's an image file
      let aiSummary: any = null;
      let fhirResource: any = null;
      let extractedText: string | null = null;

      if (mimeType && this.aiProcessingService.isImageFile(mimeType)) {
        try {
          this.logger.log('Processing image with AI/OCR...');
          const aiResult = await this.aiProcessingService.processImage(
            fileBuffer,
            originalFilename || 'upload.jpg',
          );
          
          aiSummary = {
            text: aiResult.summary,
            generatedAt: new Date(),
            model: 'TrOCR + Gemini-2.0',
          };
          fhirResource = aiResult.fhirResource;
          extractedText = aiResult.extractedText;
          
          this.logger.log('AI processing completed successfully');
        } catch (error) {
          this.logger.warn(`AI processing failed: ${error.message}`, error.stack);
          // Provide a fallback response for image files
          aiSummary = {
            text: 'AI processing is temporarily unavailable. The image has been stored successfully.',
            generatedAt: new Date(),
            model: 'Fallback',
          };
          fhirResource = {
            resourceType: 'DocumentReference',
            status: 'current',
            content: [{
              attachment: {
                contentType: mimeType,
                title: originalFilename || 'Medical Image',
              }
            }],
          };
          extractedText = 'Text extraction failed';
        }
      }

      // Create record in MongoDB
      const newRecord = new this.medicalRecordModel({
        patientId,
        recordType: recordData.recordType,
        title: recordData.title,
        description: recordData.description || '',
        ipfsHash,
        contentHash,
        createdBy: doctorId || patientId,
        recordDate: new Date(), // Always use current date
        hospitalId: hospitalId,
        originalFilename: originalFilename || `record-${Date.now()}`,
        mimeType: mimeType || 'application/octet-stream',
        aiSummary,
        fhirResource,
        extractedText,
      });

      this.logger.debug(
        `Creating medical record with: ${JSON.stringify({
          patientId,
          recordType: recordData.recordType,
          title: recordData.title,
          description: recordData.description,
        })}`,
      );

      // Save record to get ID
      const savedRecord = await newRecord.save();

      const recordId = savedRecord._id ? savedRecord._id.toString() : '';

      // Store record hash on blockchain - throw error if blockchain storage fails
      const txHash = await this.blockchainService.storeRecordHash(
        patientAddress,
        recordId,
        ipfsHash,
        contentHash,
      );

      // Update record with blockchain transaction hash
      savedRecord.blockchainTxHash = txHash;
      await savedRecord.save();
      
      // Log the upload event
      await this.accessLogsService.createAccessLog(
        patientId,
        doctorId || patientId, // Creator is either the doctor or the patient themselves
        recordId,
        savedRecord.title,
        AccessType.UPLOAD,
        AccessMethod.DIRECT,
        undefined,
        undefined,
        hospitalId,
        true, // blockchain verified
        `Record uploaded and stored on blockchain with hash: ${txHash}`
      );

      return savedRecord;
    } catch (error) {
      this.logger.error(
        `Error creating medical record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all medical records accessible to a user
   * @param userId - User ID
   * @param userRole - User role
   * @param options - Query options
   */
  async findAll(
    userId: string,
    userRole: string,
    options?: any,
  ): Promise<MedicalRecord[]> {
    try {
      // Build query based on user role and options
      const query: any = {};

      if (userRole === 'patient') {
        query.patientId = userId;
      } else if (userRole === 'doctor') {
        query.$or = [{ createdBy: userId }, { sharedWith: userId }];
      }

      // Apply additional filters from options
      if (options?.recordType) {
        query.recordType = options.recordType;
      }

      if (options?.dateFrom || options?.dateTo) {
        query.recordDate = {};
        if (options.dateFrom) {
          query.recordDate.$gte = new Date(options.dateFrom);
        }
        if (options.dateTo) {
          query.recordDate.$lte = new Date(options.dateTo);
        }
      }

      const records = await this.medicalRecordModel
        .find(query)
        .populate('patientId', 'firstName lastName walletAddress')
        .populate('createdBy', 'firstName lastName role')
        .populate('sharedWith', 'firstName lastName role')
        .sort({ recordDate: -1 })
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error fetching medical records: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a medical record by ID with access control
   * @param recordId - Record ID
   * @param userId - User requesting the record
   * @param userWalletAddress - User's wallet address
   * @param patientWalletAddress - Patient's wallet address
   */
  async findById(
    recordId: string,
    userId: string,
    userWalletAddress?: string,
    patientWalletAddress?: string,
  ): Promise<MedicalRecord> {
    try {
      const record = await this.medicalRecordModel
        .findById(recordId)
        .populate('patientId', 'firstName lastName walletAddress')
        .populate('createdBy', 'firstName lastName role')
        .populate('sharedWith', 'firstName lastName role')
        .exec();

      if (!record) {
        throw new NotFoundException(
          `Medical record with ID ${recordId} not found`,
        );
      }

      // Check if user has access to this record
      const patientIdStr =
        record.patientId && record.patientId._id
          ? record.patientId._id.toString()
          : '';
      const createdByStr =
        record.createdBy && record.createdBy._id
          ? record.createdBy._id.toString()
          : '';

      const hasDBAccess =
        patientIdStr === userId ||
        createdByStr === userId ||
        record.sharedWith?.some(
          (user) => user && user._id && user._id.toString() === userId,
        );

      // If user has DB access, log the access and return the record
      if (hasDBAccess) {
        // Log access event
        await this.accessLogsService.createAccessLog(
          patientIdStr,
          userId,
          recordId,
          record.title,
          AccessType.VIEW,
          AccessMethod.DIRECT,
        );
        return record;
      }

      // If no DB access but we have wallet addresses, check blockchain
      if (userWalletAddress && patientWalletAddress) {
        const hasBlockchainAccess = await this.blockchainService.checkAccess(
          userWalletAddress,
          patientWalletAddress,
          record._id ? record._id.toString() : recordId,
        );

        if (hasBlockchainAccess) {
          // Add user to sharedWith list if they have blockchain access but not DB access
          await this.medicalRecordModel.findByIdAndUpdate(
            recordId,
            { $addToSet: { sharedWith: userId } },
            { new: true },
          );

          // Log blockchain-based access
          await this.accessLogsService.createAccessLog(
            patientIdStr,
            userId,
            recordId,
            record.title,
            AccessType.VIEW,
            AccessMethod.WALLET,
            undefined,
            undefined,
            undefined,
            true, // blockchain verified
          );
          return record;
        }
      }

      throw new BadRequestException(
        'You do not have access to this medical record',
      );
    } catch (error) {
      this.logger.error(
        `Error retrieving medical record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Download a medical record file with access control
   * @param recordId - Record ID
   * @param userId - User requesting the file
   * @param userWalletAddress - User's wallet address
   * @param patientWalletAddress - Patient's wallet address
   */
  async downloadFile(
    recordId: string,
    userId: string,
    userWalletAddress?: string,
    patientWalletAddress?: string,
  ): Promise<Buffer> {
    try {
      // First check if user has access
      const record = await this.findById(
        recordId,
        userId,
        userWalletAddress,
        patientWalletAddress,
      );

      // Retrieve file from IPFS
      const fileBuffer = await this.storageService.retrieveFile(
        record.ipfsHash,
      );

      // Verify file integrity using blockchain
      const isVerified = await this.blockchainService.verifyRecord(
        record._id ? record._id.toString() : recordId,
        record.contentHash,
      );

      if (!isVerified) {
        throw new BadRequestException('Record integrity verification failed');
      }
      
      // Log download access
      const patientIdStr =
        record.patientId && record.patientId._id
          ? record.patientId._id.toString()
          : '';

      await this.accessLogsService.createAccessLog(
        patientIdStr,
        userId,
        recordId,
        record.title,
        AccessType.DOWNLOAD,
        userWalletAddress ? AccessMethod.WALLET : AccessMethod.DIRECT,
        undefined,
        undefined,
        undefined,
        isVerified // blockchain verified
      );

      return fileBuffer;
    } catch (error) {
      this.logger.error(
        `Error downloading file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Share a medical record with another user
   * @param recordId - Record ID
   * @param userToShareWithId - User to share with ID
   * @param userToShareWithAddress - User to share with wallet address
   * @param expirationTime - Access expiration timestamp
   */
  async shareRecord(
    recordId: string,
    userToShareWithId: string,
    userToShareWithAddress: string,
    expirationTime: number,
  ): Promise<MedicalRecord> {
    try {
      // Validate expiration time
      const currentTime = Math.floor(Date.now() / 1000);
      if (expirationTime <= currentTime) {
        throw new Error('Expiration time must be in the future');
      }

      // Check if record exists and belongs to the user
      const record = await this.medicalRecordModel.findById(recordId).exec();
      if (!record) {
        throw new Error('Medical record not found');
      }

      // Grant access on blockchain
      await this.blockchainService.grantAccess(
        userToShareWithAddress,
        recordId,
        expirationTime,
      );

      // Update record in database
      const updatedRecord = await this.medicalRecordModel
        .findByIdAndUpdate(
          recordId,
          {
            $addToSet: { sharedWith: userToShareWithId },
          },
          { new: true },
        )
        .exec();

      if (!updatedRecord) {
        throw new Error('Failed to update record sharing');
      }

      // Log the sharing event
      const patientIdStr =
        record.patientId && typeof record.patientId === 'object'
          ? record.patientId._id
            ? record.patientId._id.toString()
            : ''
          : record.patientId
            ? String(record.patientId)
            : '';

      await this.accessLogsService.createAccessLog(
        patientIdStr,
        userToShareWithId,
        recordId,
        record.title,
        AccessType.SHARE,
        AccessMethod.DIRECT,
        undefined,
        undefined,
        undefined,
        true, // blockchain verified
        `Shared until ${new Date(expirationTime * 1000).toISOString()}`,
      );

      return updatedRecord;
    } catch (error) {
      // Check for specific blockchain errors
      if (error.message.includes('Expiration time must be in the future')) {
        this.logger.error(
          `Blockchain validation error: ${error.message}`,
          error.stack,
        );
        throw new Error(
          'Blockchain error: Expiration time must be in the future',
        );
      }
      this.logger.error(`Error sharing record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke a user's access to a medical record
   * @param recordId - Record ID
   * @param patientId - Patient ID
   * @param patientAddress - Patient's wallet address
   * @param userToRevokeId - User to revoke access from ID
   * @param userToRevokeAddress - User to revoke access from wallet address
   */
  async revokeAccess(
    recordId: string,
    patientId: string,
    patientAddress: string,
    userToRevokeId: string,
    userToRevokeAddress: string,
  ): Promise<MedicalRecord> {
    try {
      const record = await this.medicalRecordModel.findById(recordId).exec();

      if (!record) {
        throw new NotFoundException(
          `Medical record with ID ${recordId} not found`,
        );
      }

      const recordPatientId =
        record.patientId && typeof record.patientId === 'object'
          ? record.patientId._id
            ? record.patientId._id.toString()
            : ''
          : record.patientId
            ? String(record.patientId)
            : '';

      if (recordPatientId !== patientId) {
        throw new BadRequestException(
          'Only the patient can revoke access to this record',
        );
      }

      // Revoke access on blockchain
      await this.blockchainService.revokeAccess(userToRevokeAddress, recordId);

      // Update record in database
      const updatedRecord = await this.medicalRecordModel
        .findByIdAndUpdate(
          recordId,
          {
            $pull: { sharedWith: userToRevokeId },
          },
          { new: true },
        )
        .exec();

      if (!updatedRecord) {
        throw new Error('Failed to update record access');
      }

      // Log the revoke access event
      await this.accessLogsService.createAccessLog(
        patientId,
        userToRevokeId,
        recordId,
        record.title,
        AccessType.REVOKE,
        AccessMethod.DIRECT,
        undefined,
        undefined,
        undefined,
        true, // blockchain verified
      );

      return updatedRecord;
    } catch (error) {
      this.logger.error(`Error revoking access: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify a medical record's integrity
   * @param recordId - Record ID
   */
  async verifyRecord(recordId: string): Promise<{ isVerified: boolean }> {
    try {
      const record = await this.medicalRecordModel.findById(recordId).exec();

      if (!record) {
        throw new NotFoundException(
          `Medical record with ID ${recordId} not found`,
        );
      }

      const isVerified = await this.blockchainService.verifyRecord(
        recordId,
        record.contentHash,
      );

      return { isVerified };
    } catch (error) {
      this.logger.error(
        `Error verifying record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all medical records for a specific patient
   * @param patientId - Patient ID
   */
  async findAllByPatient(patientId: string): Promise<MedicalRecord[]> {
    try {
      const records = await this.medicalRecordModel
        .find({ patientId })
        .populate('patientId', 'firstName lastName walletAddress')
        .populate('createdBy', 'firstName lastName role')
        .populate('sharedWith', 'firstName lastName role')
        .sort({ recordDate: -1 })
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error fetching patient records: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all medical records shared with a doctor
   * @param doctorId - Doctor ID
   */
  async findAllSharedWithDoctor(doctorId: string): Promise<MedicalRecord[]> {
    try {
      const records = await this.medicalRecordModel
        .find({
          $or: [{ createdBy: doctorId }, { sharedWith: doctorId }],
        })
        .populate('patientId', 'firstName lastName walletAddress')
        .populate('createdBy', 'firstName lastName role')
        .populate('sharedWith', 'firstName lastName role')
        .sort({ recordDate: -1 })
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error fetching doctor's records: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get the file content of a medical record
   * @param recordId - Record ID
   * @param userId - User requesting the file
   * @param userWalletAddress - User's wallet address
   * @param patientWalletAddress - Patient's wallet address
   */
  async getRecordFile(
    recordId: string,
    userId: string,
    userWalletAddress?: string,
    patientWalletAddress?: string,
  ): Promise<Buffer> {
    return this.downloadFile(
      recordId,
      userId,
      userWalletAddress,
      patientWalletAddress,
    );
  }

  /**
   * Get the file content of a medical record with metadata (filename and MIME type)
   * @param recordId - Record ID
   * @param userId - User requesting the file
   * @param userWalletAddress - User's wallet address
   * @param patientWalletAddress - Patient's wallet address
   */
  async getRecordFileWithMetadata(
    recordId: string,
    userId: string,
    userWalletAddress?: string,
    patientWalletAddress?: string,
  ): Promise<{ fileBuffer: Buffer; filename: string; mimeType: string }> {
    try {
      // First check if user has access
      const record = await this.findById(
        recordId,
        userId,
        userWalletAddress,
        patientWalletAddress,
      );

      // Retrieve file from IPFS
      const fileBuffer = await this.storageService.retrieveFile(
        record.ipfsHash,
      );

      // Verify file integrity using blockchain
      const isVerified = await this.blockchainService.verifyRecord(
        record._id ? record._id.toString() : recordId,
        record.contentHash,
      );

      if (!isVerified) {
        throw new BadRequestException('Record integrity verification failed');
      }

      // Use stored filename and MIME type or provide defaults
      const filename = record.originalFilename || `record-${recordId}.dat`;
      const mimeType = record.mimeType || 'application/octet-stream';

      // Log download access
      const patientIdStr =
        record.patientId && record.patientId._id
          ? record.patientId._id.toString()
          : '';

      await this.accessLogsService.createAccessLog(
        patientIdStr,
        userId,
        recordId,
        record.title,
        AccessType.DOWNLOAD,
        userWalletAddress ? AccessMethod.WALLET : AccessMethod.DIRECT,
        undefined,
        undefined,
        undefined,
        isVerified, // blockchain verified
      );

      return {
        fileBuffer,
        filename,
        mimeType,
      };
    } catch (error) {
      this.logger.error(
        `Error downloading file with metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retry storing a record on the blockchain
   * @param recordId - Record ID to retry blockchain storage for
   */
  async retryBlockchainStorage(recordId: string): Promise<MedicalRecord> {
    try {
      // Find the record
      const record = await this.medicalRecordModel.findById(recordId).exec();

      if (!record) {
        throw new NotFoundException(
          `Medical record with ID ${recordId} not found`,
        );
      }

      // Check if it already has a valid blockchain transaction hash
      if (
        record.blockchainTxHash &&
        record.blockchainTxHash !== 'pending-blockchain-storage'
      ) {
        this.logger.log(
          `Record ${recordId} already has blockchain transaction hash: ${record.blockchainTxHash}`,
        );
        return record;
      }

      // Get patient address
      let patientAddress: string;
      if (
        typeof record.patientId === 'object' &&
        record.patientId.walletAddress
      ) {
        patientAddress = record.patientId.walletAddress;
      } else {
        throw new BadRequestException(
          'Patient wallet address not found for this record',
        );
      }

      // Retry storing on blockchain
      const txHash = await this.blockchainService.storeRecordHash(
        patientAddress,
        recordId,
        record.ipfsHash,
        record.contentHash,
      );

      // Update record with blockchain transaction hash
      record.blockchainTxHash = txHash;
      await record.save();

      this.logger.log(
        `Successfully stored record ${recordId} on blockchain with tx hash: ${txHash}`,
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to retry blockchain storage for record ${recordId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Blockchain storage retry failed: ${error.message}`);
    }
  }
}
