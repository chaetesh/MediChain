import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AccessLog,
  AccessLogDocument,
  AccessType,
  AccessMethod,
} from './schemas/access-log.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AccessLogsService {
  private readonly logger = new Logger(AccessLogsService.name);

  constructor(
    @InjectModel(AccessLog.name)
    private accessLogModel: Model<AccessLogDocument>,
  ) {}

  async createAccessLog(
    patientId: string | User,
    accessorId: string | User,
    recordId: string,
    recordTitle: string,
    accessType: AccessType,
    accessMethod: AccessMethod = AccessMethod.DIRECT,
    ipAddress?: string,
    userAgent?: string,
    hospitalId?: string,
    blockchainVerified: boolean = false,
    notes?: string,
  ): Promise<AccessLog | null> {
    try {
      const accessLog = new this.accessLogModel({
        patientId,
        accessorId,
        recordId,
        recordTitle,
        accessType,
        accessMethod,
        ipAddress,
        userAgent,
        hospitalId,
        blockchainVerified,
        notes,
      });

      // Save to MongoDB
      const savedLog = await accessLog.save();

      return savedLog;
    } catch (error) {
      this.logger.error(
        `Error creating access log: ${error.message}`,
        error.stack,
      );
      // Don't throw - logging should be non-blocking
      return null;
    }
  }

  async getUserAccessLogs(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: AccessType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    logs: AccessLog[];
  }> {
    const { startDate, endDate, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build query filter
    const queryFilter: any = { patientId: userId };

    if (startDate) {
      queryFilter.createdAt = { $gte: startDate };
    }

    if (endDate) {
      queryFilter.createdAt = {
        ...queryFilter.createdAt,
        $lte: endDate,
      };
    }

    if (type) {
      queryFilter.accessType = type;
    }

    try {
      // Execute query with pagination
      const [logs, total] = await Promise.all([
        this.accessLogModel
          .find(queryFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('accessorId', 'firstName lastName role')
          .populate('hospitalId', 'name')
          .exec(),
        this.accessLogModel.countDocuments(queryFilter).exec(),
      ]);

      return {
        total,
        page,
        limit,
        logs,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching user access logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getRecordAccessHistory(recordId: string): Promise<AccessLog[]> {
    try {
      return await this.accessLogModel
        .find({ recordId })
        .sort({ createdAt: -1 })
        .populate('accessorId', 'firstName lastName role')
        .exec();
    } catch (error) {
      this.logger.error(
        `Error fetching record access history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getHospitalAccessLogs(
    hospitalId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: AccessType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    logs: AccessLog[];
  }> {
    const { startDate, endDate, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build query filter
    const queryFilter: any = { hospitalId };

    if (startDate) {
      queryFilter.createdAt = { $gte: startDate };
    }

    if (endDate) {
      queryFilter.createdAt = {
        ...queryFilter.createdAt,
        $lte: endDate,
      };
    }

    if (type) {
      queryFilter.accessType = type;
    }

    try {
      // Execute query with pagination
      const [logs, total] = await Promise.all([
        this.accessLogModel
          .find(queryFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('patientId', 'firstName lastName')
          .populate('accessorId', 'firstName lastName role')
          .exec(),
        this.accessLogModel.countDocuments(queryFilter).exec(),
      ]);

      return {
        total,
        page,
        limit,
        logs,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching hospital access logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
