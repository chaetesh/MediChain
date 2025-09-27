import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { AIProcessingService } from './ai-processing.service';
import {
  MedicalRecord,
  MedicalRecordSchema,
} from './schemas/medical-record.schema';
import { StorageModule } from '../storage/storage.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AccessLogsModule } from '../access-logs/access-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
    ]),
    StorageModule,
    BlockchainModule,
    AccessLogsModule,
  ],
  providers: [MedicalRecordsService, AIProcessingService],
  controllers: [MedicalRecordsController],
  exports: [MedicalRecordsService, AIProcessingService],
})
export class MedicalRecordsModule {}
