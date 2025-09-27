import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';
import { UserRole } from '../types/auth.types';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Dashboard data interfaces
export interface DashboardStats {
  totalRecords?: number;
  recentAccess?: number;
  sharedRecords?: number;
  walletStatus?: string;
  totalPatients?: number;
  totalDoctors?: number;
  appointmentsToday?: number;
  pendingReviews?: number;
  dailyAccess?: number;
  systemHealth?: string;
  totalUsers?: number;
  blockchainTxns?: number;
  activeHospitals?: number;
  uptime?: number;
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'access' | 'share' | 'appointment' | 'system';
  description: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'error';
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  quickActions?: any[];
}

// Generic API request handler for dashboard
async function dashboardApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage
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
    
    if (!response.ok) {
      throw new ApiErrorClass(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return await response.json() as T;
  } catch (error) {
    console.error('Dashboard API request failed:', error);
    throw error;
  }
}

export class DashboardApiService {
  /**
   * Get dashboard data for patient
   */
  static async getPatientDashboard(): Promise<DashboardData> {
    try {
      // Get patient's medical records
      const records = await dashboardApiRequest<any[]>('/medical-records');
      
      // Calculate stats
      const stats: DashboardStats = {
        totalRecords: records.length,
        recentAccess: records.filter(r => {
          const recordDate = new Date(r.lastAccessed || r.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return recordDate > weekAgo;
        }).length,
        sharedRecords: records.filter(r => r.sharedWith && r.sharedWith.length > 0).length,
        walletStatus: 'Connected', // This would come from wallet service later
      };

      // Generate recent activity from records
      const recentActivity: RecentActivity[] = records
        .slice(0, 5)
        .map((record, index) => ({
          id: record._id || `activity-${index}`,
          type: 'upload' as const,
          description: `Medical record "${record.title || 'Untitled'}" accessed`,
          timestamp: new Date(record.lastAccessed || record.createdAt),
          status: 'success' as const,
        }));

      return { stats, recentActivity };
    } catch (error) {
      console.error('Failed to fetch patient dashboard:', error);
      // Return default data on error
      return {
        stats: {
          totalRecords: 0,
          recentAccess: 0,
          sharedRecords: 0,
          walletStatus: 'Disconnected',
        },
        recentActivity: [],
      };
    }
  }

  /**
   * Get dashboard data for doctor
   */
  static async getDoctorDashboard(): Promise<DashboardData> {
    try {
      // Get doctor's patients and shared records
      const [patients, records] = await Promise.all([
        dashboardApiRequest<any>('/doctors/patients'),
        dashboardApiRequest<any[]>('/medical-records')
      ]);

      const stats: DashboardStats = {
        totalPatients: patients?.pagination?.total || patients?.patients?.length || 0,
        totalRecords: records.length,
        appointmentsToday: 0, // Placeholder - would come from appointments API
        pendingReviews: 0, // Placeholder - would come from a reviews/tasks API
      };

      const recentActivity: RecentActivity[] = records
        .slice(0, 5)
        .map((record, index) => ({
          id: record._id || `activity-${index}`,
          type: 'access' as const,
          description: `Accessed patient record "${record.title || 'Medical Record'}"`,
          timestamp: new Date(record.lastAccessed || record.createdAt),
          status: 'success' as const,
        }));

      return { stats, recentActivity };
    } catch (error) {
      console.error('Failed to fetch doctor dashboard:', error);
      return {
        stats: {
          totalPatients: 0,
          totalRecords: 0,
          appointmentsToday: 0,
          pendingReviews: 0,
        },
        recentActivity: [],
      };
    }
  }

  /**
   * Get dashboard data for hospital admin
   */
  static async getHospitalAdminDashboard(): Promise<DashboardData> {
    try {
      // Get hospital analytics and doctors
      const [analytics, doctors, patients] = await Promise.all([
        dashboardApiRequest<any>('/hospitals/analytics').catch(() => null),
        dashboardApiRequest<any>('/hospitals/doctors').catch(() => ({ doctors: [] })),
        dashboardApiRequest<any>('/hospitals/patients').catch(() => ({ patients: [] }))
      ]);

      const stats: DashboardStats = {
        totalDoctors: doctors?.pagination?.total || doctors?.doctors?.length || 0,
        totalPatients: patients?.pagination?.total || patients?.patients?.length || 0,
        totalRecords: analytics?.totalRecords || 0,
        dailyAccess: analytics?.dailyAccess || 0,
        systemHealth: '99.9%', // Would come from analytics
      };

      const recentActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'system',
          description: 'Daily system health check completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'success',
        },
        {
          id: '2',
          type: 'system',
          description: 'Hospital analytics updated',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'success',
        },
        {
          id: '3',
          type: 'system',
          description: 'Patient records synchronized',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'success',
        },
      ];

      return { stats, recentActivity };
    } catch (error) {
      console.error('Failed to fetch hospital admin dashboard:', error);
      return {
        stats: {
          totalDoctors: 0,
          totalPatients: 0,
          totalRecords: 0,
          dailyAccess: 0,
          systemHealth: 'Unknown',
        },
        recentActivity: [],
      };
    }
  }

  /**
   * Get dashboard data for system admin
   */
  static async getSystemAdminDashboard(): Promise<DashboardData> {
    try {
      // Get system overview from admin API
      const [overview, hospitals] = await Promise.all([
        dashboardApiRequest<any>('/admin/overview'),
        dashboardApiRequest<any>('/admin/hospitals').catch(() => ({ hospitals: [] }))
      ]);

      const stats: DashboardStats = {
        totalUsers: overview.users?.total || 0,
        totalRecords: overview.records?.total || 0,
        blockchainTxns: 0, // Would come from blockchain service
        activeHospitals: hospitals?.pagination?.total || hospitals?.hospitals?.length || 0,
        systemHealth: overview.systemHealth?.status || 'healthy',
        uptime: overview.systemHealth?.uptime || 0,
      };

      const recentActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'system',
          description: 'System health monitoring completed',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          status: 'success',
        },
        {
          id: '2',
          type: 'system',
          description: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          status: 'success',
        },
        {
          id: '3',
          type: 'system',
          description: 'Blockchain synchronization updated',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'success',
        },
      ];

      return { stats, recentActivity };
    } catch (error) {
      console.error('Failed to fetch system admin dashboard:', error);
      return {
        stats: {
          totalUsers: 0,
          totalRecords: 0,
          blockchainTxns: 0,
          activeHospitals: 0,
          systemHealth: 'Unknown',
          uptime: 0,
        },
        recentActivity: [],
      };
    }
  }

  /**
   * Get dashboard data based on user role
   */
  static async getDashboardData(role: UserRole, hospitalId?: string): Promise<DashboardData> {
    switch (role) {
      case UserRole.PATIENT:
        return this.getPatientDashboard();
      case UserRole.DOCTOR:
        return this.getDoctorDashboard();
      case UserRole.HOSPITAL_ADMIN:
        return this.getHospitalAdminDashboard();
      case UserRole.SYSTEM_ADMIN:
        return this.getSystemAdminDashboard();
      default:
        throw new Error(`Unsupported user role: ${role}`);
    }
  }

  /**
   * Format uptime in human readable format
   */
  static formatUptime(seconds: number): string {
    if (!seconds) return '0m';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}