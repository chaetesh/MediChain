import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Access logs types based on backend schema
export interface AccessLog {
  _id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  resourceId?: string;
  resourceType: 'medical_record' | 'user_profile' | 'system' | 'admin_panel';
  action: string;
  accessType: 'view' | 'download' | 'share' | 'edit' | 'create' | 'delete';
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface AccessLogParams {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  page?: number;
  limit?: number;
}

export interface AccessLogResponse {
  logs: AccessLog[];
  total: number;
  page: number;
  limit: number;
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

export class AccessLogsApiService {
  /**
   * Get access logs for current user or specified user (admin only)
   */
  static async getAccessLogs(params: AccessLogParams = {}): Promise<AccessLogResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/access-logs${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AccessLogResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get access history for a specific medical record
   */
  static async getRecordAccessHistory(recordId: string): Promise<{
    record: {
      id: string;
      title: string;
    };
    accessLogs: any[];
  }> {
    return apiRequest<{
      record: {
        id: string;
        title: string;
      };
      accessLogs: any[];
    }>(`/medical-records/${recordId}/access-history`, {
      method: 'GET',
    });
  }

  /**
   * Get access history for multiple medical records (for patient view)
   */
  static async getPatientAccessHistory(recordIds: string[]): Promise<{
    records: Array<{
      record: {
        id: string;
        title: string;
      };
      accessLogs: any[];
    }>;
    totalLogs: number;
  }> {
    try {
      // Get access history for each record
      const promises = recordIds.map(recordId => 
        this.getRecordAccessHistory(recordId).catch(error => {
          console.error(`Failed to get access history for record ${recordId}:`, error);
          return {
            record: { id: recordId, title: 'Unknown Record' },
            accessLogs: []
          };
        })
      );

      const results = await Promise.all(promises);
      
      // Combine all access logs and sort by timestamp
      const allLogs: any[] = [];
      results.forEach(result => {
        result.accessLogs.forEach(log => {
          allLogs.push({
            ...log,
            recordId: result.record.id,
            recordTitle: result.record.title
          });
        });
      });

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());

      return {
        records: results,
        totalLogs: allLogs.length
      };
    } catch (error) {
      console.error('Error getting patient access history:', error);
      throw error;
    }
  }

  /**
   * Transform backend access log to frontend display format
   */
  static transformAccessLog(backendLog: any): {
    id: string;
    accessor: string;
    accessorType: 'doctor' | 'hospital' | 'patient' | 'system';
    accessedResource: string;
    accessType: 'view' | 'download' | 'share' | 'upload' | 'revoke';
    timestamp: string;
    location: string;
    ipAddress: string;
    deviceInfo: string;
    purpose: string;
    status: 'authorized' | 'suspicious' | 'blocked';
    qrCodeUsed?: boolean;
  } {
    // Map backend roles to frontend accessor types
    const getAccessorType = (role: string): 'doctor' | 'hospital' | 'patient' | 'system' => {
      if (!role) return 'system';
      switch (role.toLowerCase()) {
        case 'doctor':
          return 'doctor';
        case 'hospital_admin':
          return 'hospital';
        case 'patient':
          return 'patient';
        case 'system_admin':
        default:
          return 'system';
      }
    };

    // Determine status based on success and other factors
    const getStatus = (success: boolean, metadata?: any): 'authorized' | 'suspicious' | 'blocked' => {
      if (success === false) return 'blocked';
      if (metadata?.suspicious) return 'suspicious';
      return 'authorized';
    };

    // Extract device info from user agent
    const getDeviceInfo = (userAgent: string): string => {
      if (!userAgent) return 'Unknown Device';
      
      // Simple user agent parsing
      if (userAgent.includes('Mobile')) return 'Mobile Device';
      if (userAgent.includes('iPad')) return 'iPad';
      if (userAgent.includes('iPhone')) return 'iPhone';
      if (userAgent.includes('Android')) return 'Android Device';
      if (userAgent.includes('Windows')) return 'Windows PC';
      if (userAgent.includes('Mac')) return 'Mac';
      if (userAgent.includes('Linux')) return 'Linux PC';
      
      return 'Desktop Browser';
    };

    // Generate purpose based on action and resource type
    const getPurpose = (action: string, notes?: string): string => {
      const actionMap: Record<string, string> = {
        'view': 'Viewed medical record',
        'download': 'Downloaded medical document', 
        'share': 'Shared medical record',
        'upload': 'Uploaded medical record',
        'revoke': 'Revoked access to medical record'
      };
      
      return notes || actionMap[action] || `Performed ${action} on medical record`;
    };

    // Extract accessor information from the populated accessorId
    const accessor = backendLog.accessorId;
    const accessorName = accessor 
      ? `${accessor.firstName || ''} ${accessor.lastName || ''}`.trim()
      : 'Unknown User';
    const accessorRole = accessor?.role || 'unknown';

    return {
      id: backendLog._id || backendLog.id,
      accessor: accessorName || 'Unknown User',
      accessorType: getAccessorType(accessorRole),
      accessedResource: backendLog.recordTitle || 'Medical Record',
      accessType: backendLog.accessType as 'view' | 'download' | 'share' | 'upload' | 'revoke',
      timestamp: backendLog.createdAt || backendLog.timestamp || new Date().toISOString(),
      location: backendLog.location || 'Unknown Location',
      ipAddress: backendLog.ipAddress || 'Unknown IP',
      deviceInfo: getDeviceInfo(backendLog.userAgent),
      purpose: getPurpose(backendLog.accessType, backendLog.notes),
      status: getStatus(true, {}), // Assume successful if logged
      qrCodeUsed: backendLog.accessMethod === 'qr'
    };
  }

  /**
   * Get access statistics for current user
   */
  static async getAccessStats(): Promise<{
    totalAccesses: number;
    authorizedAccesses: number;
    blockedAccesses: number;
    qrCodeAccesses: number;
    recentActivity: AccessLog[];
  }> {
    try {
      // Get recent access logs
      const response = await this.getAccessLogs({ limit: 100 });
      
      const totalAccesses = response.total;
      const authorizedAccesses = response.logs.filter(log => log.success).length;
      const blockedAccesses = response.logs.filter(log => !log.success).length;
      const qrCodeAccesses = response.logs.filter(log => log.metadata?.qrCodeUsed).length;
      
      return {
        totalAccesses,
        authorizedAccesses,
        blockedAccesses,
        qrCodeAccesses,
        recentActivity: response.logs.slice(0, 5) // Latest 5 activities
      };
    } catch (error) {
      // Return default stats if API call fails
      return {
        totalAccesses: 0,
        authorizedAccesses: 0,
        blockedAccesses: 0,
        qrCodeAccesses: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Export access logs as CSV
   */
  static async exportAccessLogs(params: AccessLogParams = {}): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
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
    
    const response = await fetch(`${API_BASE_URL}/api/access-logs/export?${queryString}`, {
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
   * Get unique IP addresses from logs (for security analysis)
   */
  static getUniqueIPs(logs: AccessLog[]): string[] {
    const ips = logs.map(log => log.ipAddress).filter(ip => ip && ip !== 'Unknown IP');
    return [...new Set(ips)];
  }

  /**
   * Detect suspicious activity patterns
   */
  static detectSuspiciousActivity(logs: AccessLog[]): {
    multipleIPs: boolean;
    unusualTimes: boolean;
    highFrequency: boolean;
    failedAttempts: boolean;
  } {
    const uniqueIPs = this.getUniqueIPs(logs);
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
    
    return {
      multipleIPs,
      unusualTimes,
      highFrequency,
      failedAttempts
    };
  }
}

export { ApiErrorClass };