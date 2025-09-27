import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Patient types based on backend responses
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  walletAddress?: string; // Add wallet address field
  lastVisit?: string;
  appointmentCount?: number;
  completedAppointments?: number;
  medicalRecordsCount?: number;
  medicalNumber?: string;
}

export interface PatientDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  medicalNumber: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }>;
  bloodType: string;
  height?: string;
  weight?: string;
  lastVisit?: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  description: string;
  recordType: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  doctorName?: string;
  hospitalName?: string;
  isVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  total: number;
  page: number;
  limit: number;
  patients: Patient[];
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

// Patients API service
export class PatientsApiService {
  /**
   * Get hospital's patients (for hospital admins)
   */
  static async getHospitalPatients(options: {
    page?: number;
    limit?: number;
    doctorId?: string;
    search?: string;
  } = {}): Promise<PatientsResponse> {
    const searchParams = new URLSearchParams();
    
    if (options.page) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit) {
      searchParams.append('limit', options.limit.toString());
    }
    if (options.doctorId) {
      searchParams.append('doctorId', options.doctorId);
    }
    if (options.search) {
      searchParams.append('search', options.search);
    }

    const queryString = searchParams.toString();
    const endpoint = `/hospitals/patients${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PatientsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get doctor's patients (for doctors only)
   */
  static async getDoctorPatients(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<PatientsResponse> {
    const searchParams = new URLSearchParams();
    
    if (options.page) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit) {
      searchParams.append('limit', options.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/doctors/patients${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PatientsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get patient details by ID (for doctors only)
   */
  static async getPatientDetails(patientId: string): Promise<PatientDetails> {
    return apiRequest<PatientDetails>(`/doctors/patients/${patientId}`, {
      method: 'GET',
    });
  }

  /**
   * Get patient's medical records
   */
  static async getPatientMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    return apiRequest<MedicalRecord[]>(`/medical-records?patientId=${patientId}`, {
      method: 'GET',
    });
  }

  /**
   * Get a specific medical record
   */
  static async getMedicalRecord(recordId: string, patientAddress?: string): Promise<MedicalRecord> {
    const searchParams = new URLSearchParams();
    if (patientAddress) {
      searchParams.append('patientAddress', patientAddress);
    }

    const queryString = searchParams.toString();
    const endpoint = `/medical-records/${recordId}${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<MedicalRecord>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Download a medical record file
   */
  static async downloadMedicalRecordFile(recordId: string, patientAddress?: string): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (patientAddress) {
      searchParams.append('patientAddress', patientAddress);
    }

    const queryString = searchParams.toString();
    const endpoint = `/medical-records/${recordId}/file${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
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
   * Share a medical record with another user
   */
  static async shareRecord(
    recordId: string,
    shareData: {
      userToShareWithId: string;
      userToShareWithAddress: string;
      expirationTime: number;
    }
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/medical-records/${recordId}/share`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  /**
   * Revoke access to a medical record
   */
  static async revokeRecordAccess(
    recordId: string,
    revokeData: {
      userToRevokeId: string;
      userToRevokeAddress: string;
    }
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/medical-records/${recordId}/revoke`, {
      method: 'POST',
      body: JSON.stringify(revokeData),
    });
  }

  /**
   * Verify a medical record on blockchain
   */
  static async verifyMedicalRecord(recordId: string): Promise<{
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
   * Transform backend patient data to frontend patient interface
   */
  static transformPatientData(backendPatient: any): Patient {
    return {
      _id: backendPatient._id,
      firstName: backendPatient.firstName,
      lastName: backendPatient.lastName,
      email: backendPatient.email,
      phone: backendPatient.phone || 'No phone provided',
      lastVisit: backendPatient.lastVisit,
      appointmentCount: backendPatient.appointmentCount || 0,
      completedAppointments: backendPatient.completedAppointments || 0,
      medicalRecordsCount: backendPatient.medicalRecordsCount || 0,
      medicalNumber: backendPatient.medicalNumber || `MED-${backendPatient._id?.toString().substring(0, 4) || '0000'}`,
    };
  }

  /**
   * Transform backend patient details to frontend interface
   */
  static transformPatientDetails(backendPatientDetails: any): PatientDetails {
    return {
      _id: backendPatientDetails._id,
      firstName: backendPatientDetails.firstName,
      lastName: backendPatientDetails.lastName,
      email: backendPatientDetails.email,
      medicalNumber: backendPatientDetails.medicalNumber || `MED-${backendPatientDetails._id?.toString().substring(0, 4) || '0000'}`,
      age: backendPatientDetails.age || 0,
      gender: backendPatientDetails.gender || 'Unknown',
      phone: backendPatientDetails.phone || 'No phone provided',
      address: backendPatientDetails.address || 'No address provided',
      insuranceProvider: backendPatientDetails.insuranceProvider,
      insuranceNumber: backendPatientDetails.insuranceNumber,
      emergencyContact: backendPatientDetails.emergencyContact || {
        name: 'Not provided',
        relationship: 'Unknown',
        phone: 'Not provided'
      },
      allergies: backendPatientDetails.allergies || [],
      chronicConditions: backendPatientDetails.chronicConditions || [],
      medications: backendPatientDetails.medications || [],
      bloodType: backendPatientDetails.bloodType || 'Unknown',
      height: backendPatientDetails.height,
      weight: backendPatientDetails.weight,
      lastVisit: backendPatientDetails.lastVisit,
      notes: backendPatientDetails.notes,
    };
  }

  /**
   * Transform backend medical record to frontend interface
   */
  static transformMedicalRecord(backendRecord: any): MedicalRecord {
    return {
      id: backendRecord.id || backendRecord._id,
      type: backendRecord.recordType || 'Other',
      date: backendRecord.recordDate || backendRecord.createdAt,
      description: backendRecord.description || backendRecord.title,
      recordType: backendRecord.recordType || 'other',
      title: backendRecord.title,
      fileName: backendRecord.fileName,
      fileSize: backendRecord.fileSize,
      mimeType: backendRecord.mimeType,
      doctorName: backendRecord.doctorName,
      hospitalName: backendRecord.hospitalName,
      isVerified: backendRecord.isVerified || false,
      status: backendRecord.status || 'pending',
      createdAt: backendRecord.createdAt,
      updatedAt: backendRecord.updatedAt,
    };
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };