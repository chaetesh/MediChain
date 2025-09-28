import { Injectable, Logger } from '@nestjs/common';
import { IPFSService } from '../../common/ipfs.service';
import { EncryptionService } from '../../common/encryption.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly ipfsService: IPFSService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Store a file with encryption on IPFS
   * @param fileBuffer - File content as buffer
   * @returns IPFS hash (CID) and content hash for verification
   */
  async storeFile(
    fileBuffer: Buffer,
  ): Promise<{ ipfsHash: string; contentHash: string }> {
    try {
      // Generate content hash for blockchain verification
      const contentHash = this.encryptionService.generateHash(
        fileBuffer.toString('base64'),
      );

      // Store encrypted file on IPFS
      const ipfsHash = await this.ipfsService.storeEncrypted(fileBuffer);

      this.logger.log(`File stored on IPFS with hash: ${ipfsHash}`);
      return { ipfsHash, contentHash };
    } catch (error) {
      this.logger.error('Failed to store file', error.stack);
      throw new Error('Failed to store file');
    }
  }

  /**
   * Retrieve a file from IPFS and decrypt it
   * @param ipfsHash - IPFS hash (CID) of the file
   * @returns Decrypted file content
   */
  async retrieveFile(ipfsHash: string): Promise<Buffer> {
    try {
      // Retrieve and decrypt the file
      const fileBuffer = await this.ipfsService.retrieveEncrypted(ipfsHash);

      this.logger.log(`File retrieved from IPFS: ${ipfsHash}`);
      return fileBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve file from IPFS: ${ipfsHash}`,
        error.stack,
      );
      throw new Error('Failed to retrieve file');
    }
  }

  /**
   * Verify file integrity against a stored hash
   * @param fileBuffer - File content to verify
   * @param storedHash - Hash stored on blockchain
   * @returns True if the file matches the hash
   */
  verifyFileIntegrity(fileBuffer: Buffer, storedHash: string): boolean {
    const calculatedHash = this.encryptionService.generateHash(
      fileBuffer.toString('base64'),
    );

    return calculatedHash === storedHash;
  }
}
