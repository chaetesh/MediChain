import { config } from '../config/env';

// API configuration
const API_BASE_URL = config.api.baseUrl;
const TOKEN_KEY = config.auth.tokenKey;

// Types
export interface MedicalRecord {
  id: string;
  title: string;
  description?: string;
  recordType: 'lab_result' | 'prescription' | 'diagnosis' | 'imaging' | 'discharge_summary' | 'vaccination' | 'operation_report' | 'other';
  recordDate: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  hospitalId?: string;
  hospitalName?: string;
  ipfsHash: string;
  contentHash: string;
  blockchainHash?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, any>;
  isVerified: boolean;
  status: 'pending' | 'stored' | 'failed';
  sharedWith?: Array<{
    userId: string;
    userAddress: string;
    expirationTime: number;
    isRevoked: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDto {
  title: string;
  description?: string;
  recordType: MedicalRecord['recordType'];
  recordDate?: string;
  hospitalId?: string;
  patientId?: string;
  patientAddress: string;
  metadata?: Record<string, any>;
}

export interface ShareRecordDto {
  userToShareWithId: string;
  userToShareWithAddress: string;
  expirationTime: number;
}

export interface RevokeAccessDto {
  userToRevokeId: string;
  userToRevokeAddress: string;
}

export interface Patient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress?: string;
  profileData?: {
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalHistory?: {
      allergies?: string[];
      chronicConditions?: string[];
      medications?: string[];
      bloodType?: string;
      insuranceProvider?: string;
      insurancePolicyNumber?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Custom error class for API errors
class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Generic API request handler with proper error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {};

  // Get token from localStorage if available
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (multipart/form-data)
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
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
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For file downloads or non-JSON responses
      return response as any;
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

// Medical Records API service
export class MedicalRecordsService {
  /**
   * Create a new medical record with file upload
   */
  static async createRecord(
    recordData: CreateMedicalRecordDto,
    file: File
  ): Promise<MedicalRecord> {
    const formData = new FormData();
    
    // Add file first
    formData.append('file', file);
    
    // Add basic fields
    formData.append('title', recordData.title);
    if (recordData.description) {
      formData.append('description', recordData.description);
    }
    formData.append('recordType', recordData.recordType);
    formData.append('patientAddress', recordData.patientAddress);
    
    // Handle metadata specially - try sending as empty object if undefined
    if (recordData.metadata && Object.keys(recordData.metadata).length > 0) {
      // Only send metadata if it has properties
      try {
        const metadataJson = JSON.stringify(recordData.metadata);
        formData.append('metadata', metadataJson);
        console.log('Metadata JSON being sent:', metadataJson);
      } catch (error) {
        console.error('Error stringifying metadata:', error);
        // Send empty object as fallback
        formData.append('metadata', '{}');
      }
    } else {
      // Send empty object if no metadata
      formData.append('metadata', '{}');
    }
    
    // Add other optional fields
    if (recordData.recordDate) {
      formData.append('recordDate', recordData.recordDate);
    }
    if (recordData.hospitalId) {
      formData.append('hospitalId', recordData.hospitalId);
    }
    if (recordData.patientId) {
      formData.append('patientId', recordData.patientId);
    }

    // Debug: log all form data entries
    console.log('FormData entries being sent:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    return apiRequest<MedicalRecord>('/medical-records', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get all medical records (filtered by user role)
   */
  static async getAllRecords(params?: {
    patientId?: string;
  }): Promise<MedicalRecord[]> {
    const queryParams = new URLSearchParams();
    if (params?.patientId) {
      queryParams.append('patientId', params.patientId);
    }

    const endpoint = `/medical-records${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<MedicalRecord[]>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific medical record by ID
   */
  static async getRecord(
    id: string,
    patientAddress?: string
  ): Promise<MedicalRecord> {
    const queryParams = new URLSearchParams();
    if (patientAddress) {
      queryParams.append('patientAddress', patientAddress);
    }

    const endpoint = `/medical-records/${id}${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<MedicalRecord>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Download a medical record file
   */
  static async downloadRecordFile(
    id: string,
    patientAddress?: string
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (patientAddress) {
      queryParams.append('patientAddress', patientAddress);
    }

    const endpoint = `/medical-records/${id}/file${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiRequest<Response>(endpoint, {
      method: 'GET',
    });

    return response.blob();
  }

  /**
   * Share a medical record with another user
   */
  static async shareRecord(
    recordId: string,
    shareData: ShareRecordDto
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/medical-records/${recordId}/share`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  /**
   * Revoke access to a medical record
   */
  static async revokeAccess(
    recordId: string,
    revokeData: RevokeAccessDto
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/medical-records/${recordId}/revoke`, {
      method: 'POST',
      body: JSON.stringify(revokeData),
    });
  }

  /**
   * Verify a medical record on blockchain
   */
  static async verifyRecord(recordId: string): Promise<{
    isVerified: boolean;
    blockchainHash?: string;
    message: string;
  }> {
    return apiRequest<{
      isVerified: boolean;
      blockchainHash?: string;
      message: string;
    }>(`/medical-records/${recordId}/verify`, {
      method: 'POST',
    });
  }

  /**
   * Get doctor's patients (for doctors only)
   */
  static async getDoctorPatients(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/doctors/patients${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<{
      patients: Patient[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get patient details (for doctors only)
   */
  static async getPatientDetails(patientId: string): Promise<Patient> {
    return apiRequest<Patient>(`/doctors/patients/${patientId}`, {
      method: 'GET',
    });
  }

  /**
   * Search doctors (public endpoint)
   */
  static async searchDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
    hospitalId?: string;
  }): Promise<{
    doctors: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      hospitalId?: string;
      hospitalName?: string;
      profileData?: {
        specialization?: string;
        licenseNumber?: string;
        yearsOfExperience?: number;
        education?: string[];
        certifications?: string[];
        bio?: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.specialization) queryParams.append('specialization', params.specialization);
    if (params?.hospitalId) queryParams.append('hospitalId', params.hospitalId);

    const endpoint = `/doctors/public${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<{
      doctors: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        hospitalId?: string;
        hospitalName?: string;
        profileData?: {
          specialization?: string;
          licenseNumber?: string;
          yearsOfExperience?: number;
          education?: string[];
          certifications?: string[];
          bio?: string;
        };
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get AI summary for a medical record (patients only)
   */
  static async getAISummary(recordId: string): Promise<{
    recordId: string;
    aiSummary: {
      text: string;
      generatedAt: string;
      model: string;
    };
    extractedText: string;
    fhirResource: any;
  }> {
    return apiRequest<{
      recordId: string;
      aiSummary: {
        text: string;
        generatedAt: string;
        model: string;
      };
      extractedText: string;
      fhirResource: any;
    }>(`/medical-records/${recordId}/ai-summary`, {
      method: 'GET',
    });
  }
}

// Export the error class for use in components
export { ApiError };