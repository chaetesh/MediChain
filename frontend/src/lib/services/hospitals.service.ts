import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Hospital types
export interface Hospital {
  _id: string;
  id?: string; // Backend may return id instead of _id
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  website?: string;
  description?: string;
  specialties: string[];
  facilities: string[];
  rating?: number;
  totalBeds?: number;
  availableBeds?: number;
  established?: Date;
  license?: string;
  accreditation?: string[];
  emergencyServices?: boolean;
  latitude?: number;
  longitude?: number;
  images?: string[];
  logo?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  yearsOfExperience: number;
  qualifications: string[];
}

export interface GetHospitalsQuery {
  search?: string;
  specialty?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
  hasEmergency?: boolean;
  minRating?: number;
}

export interface GetHospitalDoctorsQuery {
  page?: number;
  limit?: number;
  department?: string;
  specialization?: string;
  search?: string;
}

export interface HospitalsResponse {
  hospitals: Hospital[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface HospitalDoctorsResponse {
  hospital: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  doctors: Doctor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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

// Hospitals API service
export class HospitalsApiService {
  /**
   * Get hospitals for registration dropdown (public endpoint - no authentication required)
   */
  static async getHospitalsForRegistration(query: {
    search?: string;
    city?: string;
    state?: string;
    limit?: number;
  } = {}): Promise<{ hospitals: Array<{ id: string; name: string; city: string; state: string; address: string }> }> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/hospitals/public/registration${queryString ? `?${queryString}` : ''}`;
    
    // Don't use authentication for this endpoint
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new ApiErrorClass(
          data.message || `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      return data;
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

  /**
   * Get all hospitals with optional filters (using public endpoint)
   */
  static async getHospitals(query: GetHospitalsQuery = {}): Promise<HospitalsResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/hospitals${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<HospitalsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get hospital by ID (using public endpoint)
   */
  static async getHospitalById(hospitalId: string): Promise<Hospital> {
    return apiRequest<Hospital>(`/hospitals/${hospitalId}`, {
      method: 'GET',
    });
  }

  /**
   * Get doctors for a specific hospital (using public endpoint)
   */
  static async getHospitalDoctors(
    hospitalId: string, 
    query: GetHospitalDoctorsQuery = {}
  ): Promise<HospitalDoctorsResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/hospitals/${hospitalId}/doctors${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<HospitalDoctorsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Search hospitals by name or location
   */
  static async searchHospitals(
    searchTerm: string,
    query: Omit<GetHospitalsQuery, 'search'> = {}
  ): Promise<HospitalsResponse> {
    return this.getHospitals({
      ...query,
      search: searchTerm,
    });
  }

  /**
   * Get hospitals by city
   */
  static async getHospitalsByCity(
    city: string,
    query: Omit<GetHospitalsQuery, 'city'> = {}
  ): Promise<HospitalsResponse> {
    return this.getHospitals({
      ...query,
      city,
    });
  }

  /**
   * Get hospitals by state
   */
  static async getHospitalsByState(
    state: string,
    query: Omit<GetHospitalsQuery, 'state'> = {}
  ): Promise<HospitalsResponse> {
    return this.getHospitals({
      ...query,
      state,
    });
  }

  /**
   * Search doctors in a specific hospital
   */
  static async searchHospitalDoctors(
    hospitalId: string,
    searchTerm: string,
    query: Omit<GetHospitalDoctorsQuery, 'search'> = {}
  ): Promise<HospitalDoctorsResponse> {
    return this.getHospitalDoctors(hospitalId, {
      ...query,
      search: searchTerm,
    });
  }

  /**
   * Get doctors by department in a hospital
   */
  static async getHospitalDoctorsByDepartment(
    hospitalId: string,
    department: string,
    query: Omit<GetHospitalDoctorsQuery, 'department'> = {}
  ): Promise<HospitalDoctorsResponse> {
    return this.getHospitalDoctors(hospitalId, {
      ...query,
      department,
    });
  }

  /**
   * Get doctors by specialization in a hospital
   */
  static async getHospitalDoctorsBySpecialization(
    hospitalId: string,
    specialization: string,
    query: Omit<GetHospitalDoctorsQuery, 'specialization'> = {}
  ): Promise<HospitalDoctorsResponse> {
    return this.getHospitalDoctors(hospitalId, {
      ...query,
      specialization,
    });
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };