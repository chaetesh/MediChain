import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// System Admin types
export interface SystemStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalHospitals: number;
  totalRecords: number;
  totalTransactions: number;
  activeUsers: number;
  storageUsed: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin' | 'system_admin';
  isActive: boolean;
  hospitalId?: string;
  hospitalName?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  adminId?: string;
  adminName?: string;
  doctorsCount: number;
  patientsCount: number;
  recordsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  adminName: string;
  registeredAt: string;
  totalDoctors: number;
  totalPatients: number;
  monthlyRecords: number;
}

export interface AdminHospitalDetail {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  website?: string;
  status: 'approved' | 'pending' | 'rejected' | 'suspended';
  registrationNumber: string;
  registeredAt: string;
  adminDetails: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
  };
  departments: string[];
  facilities: string[];
  metrics: {
    totalDoctors: number;
    totalPatients: number;
    monthlyRecords: number;
    activeAppointments: number;
  };
  walletAddress?: string;
  blockchainVerified: boolean;
  notes?: string;
  lastUpdated: string;
}

export interface SystemLog {
  _id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface BackupInfo {
  _id: string;
  type: 'database' | 'files' | 'blockchain';
  filename: string;
  size: number;
  status: 'completed' | 'in_progress' | 'failed';
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
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

export class SystemAdminApiService {
  /**
   * Get system-wide statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    return apiRequest<SystemStats>('/admin/system/stats', {
      method: 'GET',
    });
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    searchTerm?: string; // Changed from 'search' to 'searchTerm' to match backend
  } = {}): Promise<{
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      users: User[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Update user status (activate/deactivate) 
   */
  static async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<{ message: string }> {
    const action = status === 'active' ? 'activate' : 'deactivate';
    return apiRequest<{ message: string }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Get all hospitals with pagination and filtering (System Admin)
   */
  static async getHospitals(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{
    hospitals: AdminHospital[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/admin/hospitals${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      hospitals: AdminHospital[];
      total: number;
      page: number;
      limit: number;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Register a new hospital
   */
  static async registerHospital(hospitalData: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone: string;
    website?: string;
    registrationNumber: string;
    adminDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      title?: string;
    };
    departments: string[];
    facilities: string[];
  }): Promise<{
    message: string;
    hospitalId: string;
    adminAccount: {
      userId: string;
      email: string;
      temporaryPassword: string;
    };
    status: string;
  }> {
    return apiRequest<{
      message: string;
      hospitalId: string;
      adminAccount: {
        userId: string;
        email: string;
        temporaryPassword: string;
      };
      status: string;
    }>('/admin/hospitals', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  }

  /**
   * Update hospital status (approve/reject/suspend)
   */
  static async updateHospitalStatus(
    hospitalId: string, 
    status: 'approved' | 'rejected' | 'suspended', 
    notes: string
  ): Promise<{
    message: string;
    hospitalId: string;
    status: string;
  }> {
    return apiRequest<{
      message: string;
      hospitalId: string;
      status: string;
    }>(`/admin/hospitals/${hospitalId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  /**
   * Get detailed hospital information
   */
  static async getHospitalDetails(hospitalId: string): Promise<AdminHospitalDetail> {
    return apiRequest<AdminHospitalDetail>(`/admin/hospitals/${hospitalId}`, {
      method: 'GET',
    });
  }

  /**
   * Update hospital information
   */
  static async updateHospitalInfo(hospitalId: string, hospitalData: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    email?: string;
    phone?: string;
    website?: string;
    departments?: string[];
    facilities?: string[];
    notes?: string;
  }): Promise<{
    message: string;
    hospitalId: string;
  }> {
    return apiRequest<{
      message: string;
      hospitalId: string;
    }>(`/admin/hospitals/${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(hospitalData),
    });
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  /**
   * Create a new hospital
   */
  static async createHospital(hospitalData: Omit<Hospital, '_id' | 'createdAt' | 'updatedAt' | 'doctorsCount' | 'patientsCount' | 'recordsCount'>): Promise<Hospital> {
    return apiRequest<Hospital>('/admin/hospitals', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  }

  /**
   * Update hospital information
   */
  static async updateHospital(hospitalId: string, hospitalData: Partial<Hospital>): Promise<Hospital> {
    return apiRequest<Hospital>(`/admin/hospitals/${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(hospitalData),
    });
  }

  /**
   * Get system logs
   */
  static async getSystemLogs(params: {
    page?: number;
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  } = {}): Promise<{
    logs: SystemLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/admin/logs${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      logs: SystemLog[];
      total: number;
      page: number;
      limit: number;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get backup information
   */
  static async getBackups(): Promise<BackupInfo[]> {
    return apiRequest<BackupInfo[]>('/admin/backups', {
      method: 'GET',
    });
  }

  /**
   * Create a new backup
   */
  static async createBackup(type: 'database' | 'files' | 'blockchain'): Promise<{ message: string; backupId: string }> {
    return apiRequest<{ message: string; backupId: string }>('/admin/backups', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  /**
   * Download a backup file
   */
  static async downloadBackup(backupId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/admin/backups/${backupId}/download`, {
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
   * Delete a backup
   */
  static async deleteBackup(backupId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/admin/backups/${backupId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Send system-wide notification
   */
  static async sendSystemNotification(data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    targetRole?: string;
    targetUsers?: string[];
  }): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get system health check
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: {
      database: 'up' | 'down';
      blockchain: 'up' | 'down';
      storage: 'up' | 'down';
      ipfs: 'up' | 'down';
    };
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  }> {
    return apiRequest<{
      status: 'healthy' | 'warning' | 'critical';
      services: {
        database: 'up' | 'down';
        blockchain: 'up' | 'down';
        storage: 'up' | 'down';
        ipfs: 'up' | 'down';
      };
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
      diskUsage: number;
    }>('/admin/health', {
      method: 'GET',
    });
  }

  /**
   * Clear system cache
   */
  static async clearCache(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/admin/cache/clear', {
      method: 'POST',
    });
  }

  /**
   * Restart system services
   */
  static async restartService(service: 'blockchain' | 'ipfs' | 'storage'): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/admin/services/${service}/restart`, {
      method: 'POST',
    });
  }

  /**
   * Export system data
   */
  static async exportSystemData(type: 'users' | 'hospitals' | 'logs' | 'all'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/admin/export/${type}`, {
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
   * Get blockchain statistics
   */
  static async getBlockchainStats(): Promise<{
    totalTransactions: number;
    pendingTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageGasUsed: number;
    totalContracts: number;
  }> {
    return apiRequest<{
      totalTransactions: number;
      pendingTransactions: number;
      successfulTransactions: number;
      failedTransactions: number;
      averageGasUsed: number;
      totalContracts: number;
    }>('/admin/blockchain/stats', {
      method: 'GET',
    });
  }

  /**
   * Utility function to format bytes
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Utility function to format uptime
   */
  static formatUptime(seconds: number): string {
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

export { ApiErrorClass };