import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Audit logs types based on the API documentation
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'patient' | 'doctor' | 'hospital_admin' | 'system_admin';
  action: 'view' | 'upload' | 'share' | 'download' | 'delete' | 'modify';
  resourceType: 'patient_record' | 'user_account' | 'hospital_data' | 'system_config';
  resourceId: string;
  resourceName: string;
  ipAddress: string;
  location: string;
  success: boolean;
  details?: string;
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

export interface AuditLogResponse {
  total: number;
  page: number;
  limit: number;
  logs: AuditLog[];
}

export interface AuditStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  actionsByType: Record<string, number>;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = AuthApiService.getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(
        data.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiErrorClass) {
      throw error;
    }
    
    throw new ApiErrorClass(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

export class AuditLogsApiService {
  /**
   * Get system audit logs with filtering and pagination
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/admin/audit-logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<AuditLogResponse>(endpoint, {
      method: 'GET',
    });

    // Transform the backend response to match our interface
    const transformedLogs: AuditLog[] = response.logs.map((log: any) => ({
      id: log._id || log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole as 'patient' | 'doctor' | 'hospital_admin' | 'system_admin',
      action: log.accessType || log.action,
      resourceType: log.resourceType as 'patient_record' | 'user_account' | 'hospital_data' | 'system_config',
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      ipAddress: log.ipAddress,
      location: log.location,
      success: log.success,
      details: log.details
    }));

    return {
      ...response,
      logs: transformedLogs
    };
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, filters: Omit<AuditLogFilters, 'userId'> = {}): Promise<AuditLogResponse> {
    return this.getAuditLogs({ ...filters, userId });
  }

  /**
   * Get audit history for a specific resource
   */
  static async getResourceAuditHistory(resourceId: string): Promise<AuditLog[]> {
    const endpoint = `/admin/audit-logs/resource/${resourceId}`;
    
    const response = await apiRequest<{ logs: any[] }>(endpoint, {
      method: 'GET',
    });

    return response.logs.map((log: any) => ({
      id: log._id || log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.accessType || log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      ipAddress: log.ipAddress,
      location: log.location,
      success: log.success,
      details: log.details
    }));
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(): Promise<AuditStats> {
    const endpoint = '/admin/audit-logs/stats';
    
    try {
      return await apiRequest<AuditStats>(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      // Return default stats if API call fails
      return {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        uniqueUsers: 0,
        actionsByType: {}
      };
    }
  }

  /**
   * Export audit logs as CSV
   */
  static async exportAuditLogs(filters: AuditLogFilters = {}): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    searchParams.append('format', 'csv');
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs/export?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AuthApiService.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiErrorClass(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return response.blob();
  }

  /**
   * Get action icon based on action type
   */
  static getActionIcon(action: string): string {
    const iconMap: Record<string, string> = {
      'view': '👁️',
      'upload': '📤',
      'share': '🔗',
      'download': '📥',
      'delete': '🗑️',
      'modify': '✏️'
    };
    return iconMap[action] || '📄';
  }

  /**
   * Get action color based on action type
   */
  static getActionColor(action: string): string {
    const colorMap: Record<string, string> = {
      'view': 'bg-blue-100 text-blue-800',
      'upload': 'bg-green-100 text-green-800',
      'share': 'bg-purple-100 text-purple-800',
      'download': 'bg-indigo-100 text-indigo-800',
      'delete': 'bg-red-100 text-red-800',
      'modify': 'bg-orange-100 text-orange-800'
    };
    return colorMap[action] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get role color based on user role
   */
  static getRoleColor(role: string): string {
    const colorMap: Record<string, string> = {
      'patient': 'bg-blue-100 text-blue-800',
      'doctor': 'bg-green-100 text-green-800',
      'hospital_admin': 'bg-purple-100 text-purple-800',
      'system_admin': 'bg-red-100 text-red-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get relative time from timestamp
   */
  static getRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Detect suspicious activity patterns
   */
  static detectSuspiciousActivity(logs: AuditLog[]): {
    multipleIPs: boolean;
    unusualTimes: boolean;
    highFrequency: boolean;
    failedAttempts: boolean;
    suspiciousScore: number;
  } {
    const uniqueIPs = [...new Set(logs.map(log => log.ipAddress).filter(ip => ip && ip !== 'Unknown'))];
    const failedLogs = logs.filter(log => !log.success);
    
    // Check for multiple IPs in short time
    const multipleIPs = uniqueIPs.length > 3;
    
    // Check for access during unusual hours (11 PM - 5 AM)
    const unusualTimes = logs.some(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 23 || hour <= 5;
    });
    
    // Check for high frequency access (more than 20 accesses in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);
    const highFrequency = recentLogs.length > 20;
    
    // Check for multiple failed attempts
    const failedAttempts = failedLogs.length > 5;
    
    // Calculate suspicious score (0-100)
    let suspiciousScore = 0;
    if (multipleIPs) suspiciousScore += 25;
    if (unusualTimes) suspiciousScore += 15;
    if (highFrequency) suspiciousScore += 30;
    if (failedAttempts) suspiciousScore += 30;
    
    return {
      multipleIPs,
      unusualTimes,
      highFrequency,
      failedAttempts,
      suspiciousScore
    };
  }

  /**
   * Group logs by time period
   */
  static groupLogsByPeriod(logs: AuditLog[], period: 'hour' | 'day' | 'week' = 'day'): Record<string, AuditLog[]> {
    const grouped: Record<string, AuditLog[]> = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      let key: string;
      
      switch (period) {
        case 'hour':
          key = `${date.toDateString()} ${date.getHours()}:00`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toDateString();
          break;
        case 'day':
        default:
          key = date.toDateString();
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(log);
    });
    
    return grouped;
  }

  /**
   * Get top users by activity
   */
  static getTopUsers(logs: AuditLog[], limit: number = 10): Array<{
    userId: string;
    userName: string;
    userRole: string;
    actionCount: number;
    lastActivity: string;
  }> {
    const userStats: Record<string, {
      userId: string;
      userName: string;
      userRole: string;
      actionCount: number;
      lastActivity: string;
    }> = {};
    
    logs.forEach(log => {
      if (!userStats[log.userId]) {
        userStats[log.userId] = {
          userId: log.userId,
          userName: log.userName,
          userRole: log.userRole,
          actionCount: 0,
          lastActivity: log.timestamp
        };
      }
      
      userStats[log.userId].actionCount++;
      
      // Update last activity if this log is more recent
      if (new Date(log.timestamp) > new Date(userStats[log.userId].lastActivity)) {
        userStats[log.userId].lastActivity = log.timestamp;
      }
    });
    
    return Object.values(userStats)
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, limit);
  }
}

export { ApiErrorClass };