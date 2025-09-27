import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import * as util from 'util';
import { KeyType } from './config/ssi-global-config';

const execAsync = util.promisify(exec);

export interface SsiKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  keyType: KeyType;
  algorithm: string;
  generatedAt: Date;
  expiresAt?: Date;
  rotationStatus?: 'active' | 'rotating' | 'expired';
}

@Injectable()
export class SsiKeysService implements OnModuleInit {
  private readonly logger = new Logger(SsiKeysService.name);
  private keyPair: SsiKeyPair | null = null;
  private readonly keysDir = path.resolve(process.cwd(), 'keys');

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the service and load keys when the module starts
   */
  async onModuleInit() {
    try {
      await this.loadKeys();
    } catch (error) {
      this.logger.error(`Failed to load SSI keys: ${error.message}`, error.stack);
    }
  }

  /**
   * Load keys from environment variables or files
   */
  async loadKeys(): Promise<SsiKeyPair> {
    try {
      // Try to load from environment variables first
      const privateKeyBase64 = this.configService.get<string>('SSI_PRIVATE_KEY');
      const publicKeyBase64 = this.configService.get<string>('SSI_PUBLIC_KEY');
      const keyId = this.configService.get<string>('SSI_KEY_ID');
      const keyType = this.configService.get<KeyType>('SSI_KEY_TYPE') as KeyType || KeyType.ED25519;
      const generatedAtStr = this.configService.get<string>('SSI_KEY_GENERATED_AT');

      if (privateKeyBase64 && publicKeyBase64) {
        // Keys found in environment variables
        this.logger.log('SSI keys loaded from environment variables');
        
        this.keyPair = {
          privateKey: Buffer.from(privateKeyBase64, 'base64').toString('utf8'),
          publicKey: Buffer.from(publicKeyBase64, 'base64').toString('utf8'),
          keyId: keyId || this.generateKeyId(publicKeyBase64),
          keyType: keyType,
          algorithm: 'Ed25519',
          generatedAt: generatedAtStr ? new Date(generatedAtStr) : new Date(),
        };
        
        return this.keyPair;
      }

      // If not found in environment, try to load from files
      if (fs.existsSync(path.join(this.keysDir, 'ssi_private.pem')) && 
          fs.existsSync(path.join(this.keysDir, 'ssi_public.pem'))) {
        
        const privateKey = fs.readFileSync(path.join(this.keysDir, 'ssi_private.pem'), 'utf8');
        const publicKey = fs.readFileSync(path.join(this.keysDir, 'ssi_public.pem'), 'utf8');
        
        this.logger.log('SSI keys loaded from files');
        
        this.keyPair = {
          privateKey,
          publicKey,
          keyId: this.generateKeyId(publicKey),
          keyType: KeyType.ED25519,
          algorithm: 'Ed25519',
          generatedAt: new Date(),
        };
        
        return this.keyPair;
      }

      // If no keys found, generate new ones
      this.logger.warn('No SSI keys found, generating new keys');
      return await this.generateKeys();
      
    } catch (error) {
      this.logger.error(`Error loading SSI keys: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate new Ed25519 key pair
   */
  async generateKeys(): Promise<SsiKeyPair> {
    try {
      // Ensure keys directory exists
      if (!fs.existsSync(this.keysDir)) {
        fs.mkdirSync(this.keysDir, { recursive: true });
      }

      const privateKeyPath = path.join(this.keysDir, 'ssi_private.pem');
      const publicKeyPath = path.join(this.keysDir, 'ssi_public.pem');

      // Generate private key
      await execAsync(`openssl genpkey -algorithm ed25519 -out "${privateKeyPath}"`);

      // Extract public key
      await execAsync(`openssl pkey -in "${privateKeyPath}" -pubout -out "${publicKeyPath}"`);

      // Read the generated keys
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

      // Generate key ID
      const keyId = this.generateKeyId(publicKey);

      this.logger.log(`New Ed25519 key pair generated with ID: ${keyId}`);

      // Store the key pair
      this.keyPair = {
        privateKey,
        publicKey,
        keyId,
        keyType: KeyType.ED25519,
        algorithm: 'Ed25519',
        generatedAt: new Date(),
      };

      return this.keyPair;
    } catch (error) {
      this.logger.error(`Error generating SSI keys: ${error.message}`, error.stack);
      throw new Error(`Failed to generate SSI key pair: ${error.message}`);
    }
  }

  /**
   * Generate a key ID from public key
   */
  private generateKeyId(publicKey: string): string {
    return crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get current key pair
   */
  getKeyPair(): SsiKeyPair {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }
    return this.keyPair;
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }
    return this.keyPair.publicKey;
  }

  /**
   * Sign data using the private key
   * @param data Data to sign
   * @returns Signature in base64 format
   */
  signData(data: string | Buffer): string {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }
    
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
      
      // Create a private key object from the PEM
      let privateKey;
      try {
        privateKey = crypto.createPrivateKey({
          key: this.keyPair.privateKey,
          format: 'pem',
          type: 'pkcs8'
        });
      } catch (keyError) {
        this.logger.warn('Failed to parse key as PKCS8, trying with default options', keyError.message);
        // Fallback if the key format is different
        privateKey = crypto.createPrivateKey(this.keyPair.privateKey);
      }
      
      // Sign the data with Ed25519
      const signature = crypto.sign(null, dataBuffer, privateKey);
      
      return signature.toString('base64');
    } catch (error) {
      this.logger.error(`Error signing data: ${error.message}`, error.stack);
      throw new Error(`Failed to sign data: ${error.message}`);
    }
  }

  /**
   * Verify signature using the public key
   * @param data Original data
   * @param signature Signature in base64 format
   * @returns True if signature is valid
   */
  verifySignature(data: string | Buffer, signature: string): boolean {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }
    
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
      const signatureBuffer = Buffer.from(signature, 'base64');
      
      // Create a public key object from the PEM with error handling
      let publicKey;
      try {
        publicKey = crypto.createPublicKey({
          key: this.keyPair.publicKey,
          format: 'pem',
          type: 'spki'
        });
      } catch (keyError) {
        this.logger.warn('Failed to parse key as SPKI, trying with default options', keyError.message);
        // Fallback if the key format is different
        publicKey = crypto.createPublicKey(this.keyPair.publicKey);
      }
      
      // Verify the signature
      return crypto.verify(null, dataBuffer, publicKey, signatureBuffer);
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Create a digital signature object for credentials
   * @param data Data to sign
   * @returns Digital signature object
   */
  createDigitalSignature(data: string | Buffer): {
    signature: string;
    algorithm: string;
    publicKey: string;
    timestamp: Date;
    keyId: string;
    keyType: string;
  } {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }
    
    const signature = this.signData(data);
    
    return {
      signature,
      algorithm: this.keyPair.algorithm,
      publicKey: this.keyPair.publicKey,
      timestamp: new Date(),
      keyId: this.keyPair.keyId,
      keyType: this.keyPair.keyType,
    };
  }

  /**
   * Export DID Document for the public key
   */
  exportDidDocument(didMethod: string = 'key'): Record<string, any> {
    if (!this.keyPair) {
      throw new Error('SSI keys not initialized');
    }

    // Extract the raw public key (remove PEM headers and format)
    let publicKeyRaw = this.keyPair.publicKey;
    publicKeyRaw = publicKeyRaw.replace('-----BEGIN PUBLIC KEY-----', '');
    publicKeyRaw = publicKeyRaw.replace('-----END PUBLIC KEY-----', '');
    publicKeyRaw = publicKeyRaw.replace(/\s/g, '');
    
    // Convert to multibase format for did:key
    // Note: This is simplified, a real implementation would use multicodec
    const publicKeyMultibase = `z${Buffer.from(publicKeyRaw, 'base64').toString('hex')}`;
    
    // Generate did based on method
    let did: string;
    let verificationMethod: any;
    
    if (didMethod === 'key') {
      did = `did:key:${publicKeyMultibase}`;
      verificationMethod = [{
        id: `${did}#${this.keyPair.keyId}`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase
      }];
    } else if (didMethod === 'web') {
      // For did:web, typically uses a domain
      const domain = this.configService.get<string>('SSI_WEB_DOMAIN') || 'medichain.example.com';
      did = `did:web:${domain}`;
      verificationMethod = [{
        id: `${did}#${this.keyPair.keyId}`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyPem: this.keyPair.publicKey
      }];
    } else {
      // Generic DID Document format
      did = `did:${didMethod}:${this.keyPair.keyId}`;
      verificationMethod = [{
        id: `${did}#${this.keyPair.keyId}`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyPem: this.keyPair.publicKey
      }];
    }
    
    // Create DID Document
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did,
      verificationMethod,
      authentication: [
        verificationMethod[0].id
      ],
      assertionMethod: [
        verificationMethod[0].id
      ],
      capabilityInvocation: [
        verificationMethod[0].id
      ],
      capabilityDelegation: [
        verificationMethod[0].id
      ]
    };
  }
}