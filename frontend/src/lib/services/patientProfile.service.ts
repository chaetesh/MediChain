import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Patient profile types
export interface PatientProfile {
  // Basic user info
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  
  // Profile data (stored in user's profileData field)
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bloodType?: string;
  
  // Medical info (arrays stored as JSON strings in profileData)
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  
  // Emergency contact (stored as object in profileData)
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Preferences (stored in profileData)
  preferences?: {
    notifications?: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy?: {
      shareWithResearchers: boolean;
      allowEmergencyAccess: boolean;
      dataRetention: string;
    };
    security?: {
      twoFactorAuth: boolean;
      biometricAuth: boolean;
      sessionTimeout: string;
    };
  };
  
  // Metadata
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientProfileDto {
  firstName?: string;
  lastName?: string;
  profileData?: {
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    preferences?: {
      notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
      privacy?: {
        shareWithResearchers: boolean;
        allowEmergencyAccess: boolean;
        dataRetention: string;
      };
      security?: {
        twoFactorAuth: boolean;
        biometricAuth: boolean;
        sessionTimeout: string;
      };
    };
  };
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

export class PatientProfileApiService {
  /**
   * Get current patient's profile
   */
  static async getMyProfile(): Promise<PatientProfile> {
    return apiRequest<PatientProfile>('/users/profile', {
      method: 'GET',
    });
  }

  /**
   * Update current patient's profile
   */
  static async updateMyProfile(updateData: UpdatePatientProfileDto): Promise<PatientProfile> {
    // Get current user profile to get the ID
    const user = await AuthApiService.getProfile();
    if (!user?._id) {
      throw new ApiErrorClass('User not authenticated', 401);
    }

    return apiRequest<PatientProfile>(`/users/${user._id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Get patient profile by ID (for healthcare providers)
   */
  static async getPatientProfile(patientId: string): Promise<PatientProfile> {
    return apiRequest<PatientProfile>(`/users/${patientId}`, {
      method: 'GET',
    });
  }

  /**
   * Normalize patient profile data from API response
   */
  static normalizeProfileData(apiData: any): PatientProfile {
    const profileData = apiData.profileData || {};
    
    return {
      ...apiData,
      phone: profileData.phone || '',
      dateOfBirth: profileData.dateOfBirth || '',
      gender: profileData.gender || 'male',
      address: profileData.address || '',
      bloodType: profileData.bloodType || 'A+',
      allergies: Array.isArray(profileData.allergies) 
        ? profileData.allergies 
        : (typeof profileData.allergies === 'string' 
          ? JSON.parse(profileData.allergies || '[]') 
          : []),
      chronicConditions: Array.isArray(profileData.chronicConditions) 
        ? profileData.chronicConditions 
        : (typeof profileData.chronicConditions === 'string' 
          ? JSON.parse(profileData.chronicConditions || '[]') 
          : []),
      medications: Array.isArray(profileData.medications) 
        ? profileData.medications 
        : (typeof profileData.medications === 'string' 
          ? JSON.parse(profileData.medications || '[]') 
          : []),
      emergencyContact: profileData.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      preferences: profileData.preferences || {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        privacy: {
          shareWithResearchers: false,
          allowEmergencyAccess: true,
          dataRetention: '5years'
        },
        security: {
          twoFactorAuth: false,
          biometricAuth: false,
          sessionTimeout: '30min'
        }
      }
    };
  }

  /**
   * Convert profile data for API update
   */
  static prepareProfileUpdateData(profileData: any): UpdatePatientProfileDto {
    return {
      firstName: profileData.personalInfo?.firstName,
      lastName: profileData.personalInfo?.lastName,
      profileData: {
        phone: profileData.personalInfo?.phone,
        dateOfBirth: profileData.personalInfo?.dateOfBirth,
        gender: profileData.personalInfo?.gender,
        address: profileData.personalInfo?.address,
        bloodType: profileData.medicalInfo?.bloodType,
        allergies: profileData.medicalInfo?.allergies,
        chronicConditions: profileData.medicalInfo?.chronicConditions,
        medications: profileData.medicalInfo?.medications,
        emergencyContact: profileData.personalInfo?.emergencyContact,
        preferences: profileData.preferences
      }
    };
  }
}

export { ApiErrorClass };