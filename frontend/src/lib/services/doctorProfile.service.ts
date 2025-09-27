import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Doctor Profile types
export interface DoctorProfile {
  _id: string;
  userId: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  experience: number;
  qualifications: string;
  bio?: string;
  consultationFees?: {
    inPerson: number;
    virtual: number;
  };
  workingHours?: {
    [key: string]: string[];
  };
  languages?: string[];
  isAvailableForConsultation: boolean;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateDoctorProfileDto {
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  experience?: number;
  qualifications?: string;
  bio?: string;
  consultationFees?: {
    inPerson: number;
    virtual: number;
  };
  workingHours?: {
    [key: string]: string[];
  };
  languages?: string[];
  isAvailableForConsultation?: boolean;
}

export interface DoctorStats {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  recordsUploaded: number;
  rating: number;
  reviewCount: number;
}

// Generic API request handler with proper error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Add /api prefix to all endpoints since backend uses global prefix 'api'
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage if available
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
    
    // Network or other errors
    throw new ApiErrorClass(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

// Doctor Profile API service
export class DoctorProfileApiService {
  /**
   * Get current doctor's profile
   */
  static async getMyProfile(): Promise<DoctorProfile> {
    return apiRequest<DoctorProfile>('/doctors/profile', {
      method: 'GET',
    });
  }

  /**
   * Update current doctor's profile
   */
  static async updateMyProfile(updateData: UpdateDoctorProfileDto): Promise<DoctorProfile> {
    return apiRequest<DoctorProfile>('/doctors/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Get doctor statistics
   */
  static async getMyStats(): Promise<DoctorStats> {
    return apiRequest<DoctorStats>('/doctors/stats', {
      method: 'GET',
    });
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: File): Promise<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return apiRequest<{ profilePicture: string }>('/doctors/profile/picture', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
      },
    });
  }

  /**
   * Update availability status
   */
  static async updateAvailability(isAvailable: boolean): Promise<void> {
    return apiRequest<void>('/doctors/availability', {
      method: 'PUT',
      body: JSON.stringify({ isAvailableForConsultation: isAvailable }),
    });
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };