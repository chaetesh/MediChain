import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessLogsService } from './access-logs.service';
import { AuditLogsService } from './audit-logs.service';
import {
  AccessLogsController,
  RecordAccessHistoryController,
} from './access-logs.controller';
import { AccessLog, AccessLogSchema } from './schemas/access-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccessLog.name, schema: AccessLogSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  providers: [AccessLogsService, AuditLogsService],
  controllers: [AccessLogsController, RecordAccessHistoryController],
  exports: [AccessLogsService, AuditLogsService],
})
export class AccessLogsModule {}
