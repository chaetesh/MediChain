import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// User types
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  HOSPITAL_ADMIN = 'hospital_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  walletAddress?: string;
  specialization?: string; // For doctors
  licenseNumber?: string; // For doctors
  yearsOfExperience?: number; // For doctors
  hospitalId?: string; // For doctors and hospital admins
  medicalNumber?: string; // For patients
  emergencyContact?: string; // For patients
  address?: string;
  dateOfBirth?: Date; // For patients
  gender?: 'male' | 'female' | 'other'; // For patients
  bloodType?: string; // For patients
  allergies?: string[]; // For patients
  chronicConditions?: string[]; // For patients
  insuranceProvider?: string; // For patients
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUsersQuery {
  role?: UserRole;
  hospitalId?: string;
  specialization?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UsersResponse {
  total: number;
  page: number;
  limit: number;
  users: User[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  yearsOfExperience?: number;
  emergencyContact?: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
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

// Users API service
export class UsersApiService {
  /**
   * Get all users with optional filters
   */
  static async getUsers(query: GetUsersQuery = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<UsersResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User> {
    return apiRequest<User>(`/users/${userId}`, {
      method: 'GET',
    });
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
    return apiRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Get patients
   */
  static async getPatients(
    query: Omit<GetUsersQuery, 'role'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      role: UserRole.PATIENT,
    });
  }

  /**
   * Get doctors
   */
  static async getDoctors(
    query: Omit<GetUsersQuery, 'role'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      role: UserRole.DOCTOR,
    });
  }

  /**
   * Get doctors by hospital ID
   */
  static async getDoctorsByHospital(
    hospitalId: string,
    query: Omit<GetUsersQuery, 'hospitalId' | 'role'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      role: UserRole.DOCTOR,
      hospitalId,
    });
  }

  /**
   * Get doctors by specialization
   */
  static async getDoctorsBySpecialization(
    specialization: string,
    query: Omit<GetUsersQuery, 'specialization' | 'role'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      role: UserRole.DOCTOR,
      specialization,
    });
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(
    searchTerm: string,
    query: Omit<GetUsersQuery, 'search'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      search: searchTerm,
    });
  }

  /**
   * Get patient medical profile (extended patient data)
   */
  static async getPatientMedicalProfile(patientId: string): Promise<User> {
    return this.getUserById(patientId);
  }

  /**
   * Update patient medical information
   */
  static async updatePatientMedicalInfo(
    patientId: string,
    medicalData: {
      allergies?: string[];
      chronicConditions?: string[];
      insuranceProvider?: string;
      emergencyContact?: string;
      bloodType?: string;
    }
  ): Promise<User> {
    return this.updateUser(patientId, medicalData);
  }

  /**
   * Get doctor profile with specialization details
   */
  static async getDoctorProfile(doctorId: string): Promise<User> {
    return this.getUserById(doctorId);
  }

  /**
   * Update doctor professional information
   */
  static async updateDoctorProfile(
    doctorId: string,
    professionalData: {
      specialization?: string;
      yearsOfExperience?: number;
      licenseNumber?: string;
    }
  ): Promise<User> {
    return this.updateUser(doctorId, professionalData);
  }

  /**
   * Get active users only
   */
  static async getActiveUsers(
    query: Omit<GetUsersQuery, 'isActive'> = {}
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...query,
      isActive: true,
    });
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };