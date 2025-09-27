import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { IPFSService } from './ipfs.service';
import { IPFSController } from './ipfs.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [IPFSController],
  providers: [EncryptionService, IPFSService],
  exports: [EncryptionService, IPFSService],
})
export class CommonModule {}
