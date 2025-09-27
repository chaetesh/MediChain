import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessLogsService } from './access-logs.service';
import { AccessType } from './schemas/access-log.schema';
import { UserRole } from '../users/schemas/user.schema';

// DTOs
import { IsOptional, IsDate, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class GetAccessLogsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(AccessType)
  type?: AccessType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

@Controller('access-logs')
@UseGuards(JwtAuthGuard)
export class AccessLogsController {
  private readonly logger = new Logger(AccessLogsController.name);

  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUserAccessLogs(@Request() req, @Query() query: GetAccessLogsDto) {
    try {
      // Only allow users to access their own logs or system admins to access any logs
      if (req.user.role === UserRole.SYSTEM_ADMIN) {
        return this.accessLogsService.getUserAccessLogs(
          query.userId || req.user.id,
          {
            startDate: query.startDate,
            endDate: query.endDate,
            type: query.type,
            page: query.page,
            limit: query.limit,
          },
        );
      } else {
        return this.accessLogsService.getUserAccessLogs(req.user.id, {
          startDate: query.startDate,
          endDate: query.endDate,
          type: query.type,
          page: query.page,
          limit: query.limit,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error getting user access logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

@Controller('medical-records/:id/access-history')
@UseGuards(JwtAuthGuard)
export class RecordAccessHistoryController {
  private readonly logger = new Logger(RecordAccessHistoryController.name);

  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get()
  async getRecordAccessHistory(@Request() req, @Param('id') recordId: string) {
    try {
      // In a real implementation, we would need to verify that the user has access to this record
      // This could be done by checking if the user is the patient or a doctor with access
      const accessLogs =
        await this.accessLogsService.getRecordAccessHistory(recordId);

      return {
        record: {
          id: recordId,
          // In a real implementation, we would fetch the record title here
          title: 'Medical Record', // Placeholder
        },
        accessLogs,
      };
    } catch (error) {
      this.logger.error(
        `Error getting record access history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
