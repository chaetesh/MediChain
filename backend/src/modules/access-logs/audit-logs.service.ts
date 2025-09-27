import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccessLog, AccessLogDocument, AccessType } from './schemas/access-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface AuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  resourceId?: string;
  resourceType: 'patient_record' | 'user_account' | 'hospital_data' | 'system_config';
  resourceName?: string;
  action: string;
  accessType: 'view' | 'upload' | 'share' | 'download' | 'delete' | 'modify';
  ipAddress: string;
  location: string;
  timestamp: string;
  success: boolean;
  details?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  userRole?: string;
  userId?: string;
  success?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AccessLog.name)
    private accessLogModel: Model<AccessLogDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async getSystemAuditLogs(filters: AuditLogFilters = {}) {
    const {
      startDate,
      endDate,
      action,
      userRole,
      userId,
      success,
      page = 1,
      limit = 100
    } = filters;

    const skip = (page - 1) * limit;

    // Build MongoDB aggregation pipeline for comprehensive audit logs
    const pipeline: any[] = [
      // Match stage for filtering
      {
        $match: {
          ...(startDate && { createdAt: { $gte: startDate } }),
          ...(endDate && { createdAt: { ...{ createdAt: { $gte: startDate } }, $lte: endDate } }),
          ...(userId && { $or: [{ patientId: userId }, { accessorId: userId }] }),
          ...(action && { accessType: action }),
        }
      },
      
      // Lookup user details for accessor
      {
        $lookup: {
          from: 'users',
          localField: 'accessorId',
          foreignField: '_id',
          as: 'accessor'
        }
      },
      
      // Lookup patient details
      {
        $lookup: {
          from: 'users',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },

      // Lookup hospital details if available
      {
        $lookup: {
          from: 'hospitals',
          localField: 'hospitalId',
          foreignField: '_id',
          as: 'hospital'
        }
      },

      // Unwind arrays (make them single objects instead of arrays)
      { $unwind: { path: '$accessor', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },

      // Project fields to match expected audit log format
      {
        $project: {
          _id: 1,
          userId: '$accessorId',
          userEmail: '$accessor.email',
          userName: {
            $concat: [
              { $ifNull: ['$accessor.firstName', ''] },
              ' ',
              { $ifNull: ['$accessor.lastName', ''] }
            ]
          },
          userRole: '$accessor.role',
          resourceId: '$recordId',
          resourceType: { $literal: 'patient_record' },
          resourceName: '$recordTitle',
          action: '$accessType',
          accessType: '$accessType',
          ipAddress: { $ifNull: ['$ipAddress', 'Unknown'] },
          location: { $literal: 'Location not available' },
          timestamp: '$createdAt',
          success: { $literal: true }, // Access logs only exist for successful access
          details: '$notes',
          metadata: {
            blockchainVerified: '$blockchainVerified',
            accessMethod: '$accessMethod',
            hospitalId: '$hospitalId',
            hospitalName: '$hospital.name',
            patientName: {
              $concat: [
                { $ifNull: ['$patient.firstName', ''] },
                ' ',
                { $ifNull: ['$patient.lastName', ''] }
              ]
            }
          }
        }
      },

      // Filter by user role if specified
      ...(userRole ? [{ $match: { userRole } }] : []),

      // Sort by timestamp descending (newest first)
      { $sort: { timestamp: -1 } },

      // Facet for pagination
      {
        $facet: {
          logs: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    try {
      const result = await this.accessLogModel.aggregate(pipeline).exec();
      const logs = result[0]?.logs || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      // Transform logs to ensure consistent format
      const transformedLogs: AuditLog[] = logs.map(log => ({
        _id: log._id,
        userId: log.userId?.toString() || 'unknown',
        userEmail: log.userEmail || 'unknown@email.com',
        userName: (log.userName || '').trim() || 'Unknown User',
        userRole: log.userRole || 'unknown',
        resourceId: log.resourceId?.toString(),
        resourceType: log.resourceType as 'patient_record',
        resourceName: log.resourceName || 'Unknown Resource',
        action: log.action,
        accessType: log.accessType as 'view' | 'upload' | 'share' | 'download' | 'delete' | 'modify',
        ipAddress: log.ipAddress || 'Unknown',
        location: log.location || 'Unknown Location',
        timestamp: log.timestamp?.toISOString() || new Date().toISOString(),
        success: log.success !== false,
        details: log.details,
        metadata: log.metadata || {}
      }));

      return {
        total,
        page,
        limit,
        logs: transformedLogs
      };
    } catch (error) {
      this.logger.error('Error fetching system audit logs:', error);
      throw error;
    }
  }

  async getUserAuditLogs(userId: string, filters: Omit<AuditLogFilters, 'userId'> = {}) {
    return this.getSystemAuditLogs({ ...filters, userId });
  }

  async getResourceAuditHistory(resourceId: string): Promise<AuditLog[]> {
    try {
      const logs = await this.accessLogModel.find({ recordId: resourceId })
        .populate('accessorId', 'firstName lastName email role')
        .populate('patientId', 'firstName lastName email')
        .populate('hospitalId', 'name')
        .sort({ createdAt: -1 })
        .exec();

      return logs.map((log: any) => ({
        _id: log._id?.toString() || 'unknown',
        userId: log.accessorId?.toString() || 'unknown',
        userEmail: log.accessorId?.email || 'unknown@email.com',
        userName: `${log.accessorId?.firstName || ''} ${log.accessorId?.lastName || ''}`.trim() || 'Unknown User',
        userRole: log.accessorId?.role || 'unknown',
        resourceId: log.recordId?.toString(),
        resourceType: 'patient_record' as const,
        resourceName: log.recordTitle || 'Unknown Resource',
        action: log.accessType,
        accessType: log.accessType as 'view' | 'upload' | 'share' | 'download' | 'delete' | 'modify',
        ipAddress: log.ipAddress || 'Unknown',
        location: 'Location not available',
        timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
        success: true,
        details: log.notes,
        metadata: {
          blockchainVerified: log.blockchainVerified,
          accessMethod: log.accessMethod,
          hospitalId: log.hospitalId?.toString(),
          hospitalName: log.hospitalId?.name
        }
      }));
    } catch (error) {
      this.logger.error('Error fetching resource audit history:', error);
      throw error;
    }
  }

  async getAuditStats() {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: { $sum: 1 }, // All access logs are successful
            uniqueUsers: { $addToSet: '$accessorId' },
            actionsByType: {
              $push: {
                type: '$accessType',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            totalActions: 1,
            successfulActions: 1,
            uniqueUserCount: { $size: '$uniqueUsers' },
            actionsByType: 1
          }
        }
      ];

      const stats = await this.accessLogModel.aggregate(pipeline).exec();
      
      if (stats.length === 0) {
        return {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          uniqueUsers: 0,
          actionsByType: {}
        };
      }

      const result = stats[0];
      
      // Count actions by type
      const actionTypeMap: Record<string, number> = {};
      result.actionsByType?.forEach((action: any) => {
        actionTypeMap[action.type] = (actionTypeMap[action.type] || 0) + 1;
      });

      return {
        totalActions: result.totalActions || 0,
        successfulActions: result.successfulActions || 0,
        failedActions: 0, // Access logs don't track failures
        uniqueUsers: result.uniqueUserCount || 0,
        actionsByType: actionTypeMap
      };
    } catch (error) {
      this.logger.error('Error getting audit stats:', error);
      return {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        uniqueUsers: 0,
        actionsByType: {}
      };
    }
  }

  async exportAuditLogs(filters: AuditLogFilters = {}) {
    // Get all logs without pagination for export
    const { logs } = await this.getSystemAuditLogs({ ...filters, limit: 10000 });
    
    // Convert to CSV format
    const csvHeader = [
      'Timestamp',
      'User Name',
      'User Email', 
      'User Role',
      'Action',
      'Resource',
      'IP Address',
      'Success',
      'Details'
    ].join(',');

    const csvRows = logs.map(log => [
      log.timestamp,
      `"${log.userName}"`,
      log.userEmail,
      log.userRole,
      log.action,
      `"${log.resourceName}"`,
      log.ipAddress,
      log.success ? 'Success' : 'Failed',
      `"${log.details || ''}"`
    ].join(','));

    return [csvHeader, ...csvRows].join('\n');
  }
}