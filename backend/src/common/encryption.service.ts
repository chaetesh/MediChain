import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key || key.length < 32) {
      throw new Error(
        'Invalid encryption key. Must be at least 32 characters long.',
      );
    }
    this.encryptionKey = key;
  }

  encrypt(data: string): string {
    if (!data) return '';
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Generate a hash for blockchain storage
  generateHash(data: any): string {
    const jsonData = JSON.stringify(data);
    return CryptoJS.SHA256(jsonData).toString();
  }
}
