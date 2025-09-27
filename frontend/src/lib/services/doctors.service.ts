import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Doctor types
export interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  hospitalId?: string;
  walletAddress?: string; // Added walletAddress field
  hospital?: {
    _id: string;
    name: string;
    address: string;
  };
  rating?: number;
  qualifications?: string[];
  languages?: string[];
  about?: string;
  avatar?: string;
  phone?: string;
  workingHours?: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetDoctorsQuery {
  specialization?: string;
  hospitalId?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DoctorsResponse {
  total: number;
  page: number;
  limit: number;
  doctors: Doctor[];
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

// Doctors API service
export class DoctorsApiService {
  /**
   * Get all doctors with optional filters (using public endpoint)
   */
  static async getDoctors(query: GetDoctorsQuery = {}): Promise<DoctorsResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/doctors/public${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ doctors: Doctor[]; pagination: any }>(endpoint, {
      method: 'GET',
    });

    // Transform the response to match the expected format
    return {
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      doctors: response.doctors
    };
  }

  /**
   * Get doctor by ID
   */
  static async getDoctorById(doctorId: string): Promise<Doctor> {
    return apiRequest<Doctor>(`/doctors/${doctorId}`, {
      method: 'GET',
    });
  }

  /**
   * Get doctors by hospital ID
   */
  static async getDoctorsByHospital(
    hospitalId: string,
    query: Omit<GetDoctorsQuery, 'hospitalId'> = {}
  ): Promise<DoctorsResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/doctors/hospital/${hospitalId}${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<DoctorsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Search doctors by name or specialization
   */
  static async searchDoctors(
    searchTerm: string,
    query: Omit<GetDoctorsQuery, 'search'> = {}
  ): Promise<DoctorsResponse> {
    return this.getDoctors({
      ...query,
      search: searchTerm,
    });
  }

  /**
   * Get doctors by specialization
   */
  static async getDoctorsBySpecialization(
    specialization: string,
    query: Omit<GetDoctorsQuery, 'specialization'> = {}
  ): Promise<DoctorsResponse> {
    return this.getDoctors({
      ...query,
      specialization,
    });
  }

  /**
   * Get available doctors
   */
  static async getAvailableDoctors(
    query: Omit<GetDoctorsQuery, 'isAvailable'> = {}
  ): Promise<DoctorsResponse> {
    return this.getDoctors({
      ...query,
      isAvailable: true,
    });
  }

  /**
   * Get shared medical records for the logged-in doctor
   * @param query Query parameters for filtering and pagination
   * @returns Shared records with pagination
   */
  static async getSharedRecords(query: {
    status?: 'active' | 'expired',
    patientId?: string,
    sortBy?: 'sharedDate' | 'expiryDate' | 'patientName',
    order?: 'asc' | 'desc',
    page?: number,
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/doctors/shared-records${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      total: number;
      page: number;
      limit: number;
      records: Array<{
        _id: string;
        title: string;
        recordType: string;
        patient: {
          _id: string;
          firstName: string;
          lastName: string;
        };
        sharedDate: string;
        expiryDate: string;
        status: 'active' | 'expired';
        accessCount: number;
        lastAccessed: string | null;
      }>;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get details of a specific shared medical record
   * @param recordId ID of the shared record to fetch
   * @returns Detailed record information
   */
  static async getSharedRecordDetails(recordId: string) {
    return apiRequest<{
      _id: string;
      title: string;
      recordType: string;
      description: string;
      ipfsHash: string;
      contentHash: string;
      blockchainTxHash: string;
      originalFilename: string;
      mimeType: string;
      patient: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
      recordDate: string;
      sharedDate: string;
      expiryDate: string;
      status: 'active' | 'expired';
      accessCount: number;
      lastAccessed: string | null;
    }>(`/doctors/shared-records/${recordId}`, {
      method: 'GET',
    });
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };