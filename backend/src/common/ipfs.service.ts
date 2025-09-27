import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lighthouse from '@lighthouse-web3/sdk';
import { EncryptionService } from './encryption.service';

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    // Get Lighthouse API key
    const apiKey = this.configService.get<string>('LIGHTHOUSE_API_KEY');
    
    if (!apiKey) {
      this.logger.error('LIGHTHOUSE_API_KEY is not defined in environment variables');
      throw new Error('Lighthouse API key is not configured');
    }
    
    this.apiKey = apiKey;
    this.logger.log('Lighthouse IPFS service initialized');
  }

  /**
   * Store file content on IPFS with encryption
   * @param fileContent The file content as a Buffer
   * @returns CID of the stored file on IPFS
   */
  async storeEncrypted(fileContent: Buffer): Promise<string> {
    try {
      // Encrypt the file content
      const encryptedContent = this.encryptionService.encrypt(
        fileContent.toString('base64'),
      );
      
      // Create a temporary file name for the upload
      const fileName = `encrypted_file_${Date.now()}`;
      
      // Convert encrypted string to blob-like object that lighthouse can handle
      const blob = Buffer.from(encryptedContent);
      
      // Store the encrypted content in Lighthouse IPFS
      const response = await lighthouse.uploadBuffer(
        blob,
        this.apiKey
      );
      
      // Validate the response
      if (!response || !response.data || !response.data.Hash) {
        throw new Error('Invalid response from Lighthouse');
      }

      const cid = response.data.Hash;
      this.logger.log(`File stored on Lighthouse IPFS with CID: ${cid}`);
      return cid;
    } catch (error) {
      this.logger.error('Failed to store encrypted file on Lighthouse IPFS', error.stack);
      throw new Error('Failed to store file on IPFS');
    }
  }

  /**
   * Retrieve and decrypt file content from IPFS
   * @param cid IPFS Content Identifier
   * @returns Decrypted file content as a Buffer
   */
  async retrieveEncrypted(cid: string): Promise<Buffer> {
    try {
      this.logger.log(`Retrieving file from Lighthouse IPFS with CID: ${cid}`);

      // Retrieve the encrypted content from Lighthouse IPFS
      // First get the download link from Lighthouse
      const downloadLink = `https://gateway.lighthouse.storage/ipfs/${cid}`;
      
      // Download the content from the gateway
      const response = await fetch(downloadLink);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      // Get the encrypted content as text
      const encryptedContent = await response.text();
      
      // Decrypt the content
      const decryptedBase64 = this.encryptionService.decrypt(encryptedContent);

      // Convert back from base64 to Buffer
      return Buffer.from(decryptedBase64, 'base64');
    } catch (error) {
      this.logger.error(
        `Failed to retrieve file with CID ${cid} from Lighthouse IPFS`,
        error.stack,
      );
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  /**
   * Check the health of the Lighthouse connection
   * @returns Object containing service status
   */
  async checkHealth(): Promise<{ id: string; version: string }> {
    try {
      // For Lighthouse, we'll check if we can connect to their API
      // by making a small test upload
      const testData = Buffer.from('health check');
      const testFileName = `health_check_${Date.now()}`;
      
      // Try to upload a tiny test file
      const response = await lighthouse.uploadBuffer(
        testData,
        this.apiKey
      );
      
      if (response && response.data && response.data.Hash) {
        this.logger.log(`Connected to Lighthouse IPFS service`);
        
        return {
          id: 'lighthouse',
          version: 'v1',  // Since lighthouse doesn't provide version info in the same way
        };
      } else {
        throw new Error('Failed to connect to Lighthouse');
      }
    } catch (error) {
      this.logger.error('Failed to check Lighthouse IPFS health', error.stack);
      throw new Error('Lighthouse IPFS health check failed');
    }
  }

  /**
   * Store large file content on IPFS with encryption
   * @param fileContent The file content as a Buffer
   * @param chunkSize Not used with Lighthouse but kept for backwards compatibility
   * @returns CID of the stored file on IPFS
   */
  async storeEncryptedLarge(
    fileContent: Buffer,
    chunkSize = 1024 * 1024, // Parameter kept for compatibility
  ): Promise<string> {
    try {
      // Log the upload attempt
      this.logger.log(
        `Storing large file on Lighthouse IPFS (size: ${fileContent.length} bytes)`,
      );

      // Encrypt the file content
      const encryptedContent = this.encryptionService.encrypt(
        fileContent.toString('base64'),
      );

      // Create a temporary file name for the upload
      const fileName = `large_encrypted_file_${Date.now()}`;
      
      // Convert encrypted string to buffer
      const encryptedBuffer = Buffer.from(encryptedContent);

      // Store the encrypted content in Lighthouse IPFS
      // Lighthouse automatically handles large file uploads
      const response = await lighthouse.uploadBuffer(
        encryptedBuffer,
        this.apiKey
      );
      
      // Validate the response
      if (!response || !response.data || !response.data.Hash) {
        throw new Error('Invalid response from Lighthouse');
      }

      const cid = response.data.Hash;
      this.logger.log(`Large file stored on Lighthouse IPFS with CID: ${cid}`);
      return cid;
    } catch (error) {
      this.logger.error(
        'Failed to store large encrypted file on Lighthouse IPFS',
        error.stack,
      );
      throw new Error('Failed to store large file on IPFS');
    }
  }
}
