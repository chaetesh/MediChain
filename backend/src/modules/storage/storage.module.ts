import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IPFSService } from '../../common/ipfs.service';
import { EncryptionService } from '../../common/encryption.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [StorageService, IPFSService, EncryptionService],
  exports: [StorageService],
})
export class StorageModule {}
