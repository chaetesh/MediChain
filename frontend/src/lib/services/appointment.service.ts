import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Appointment types based on backend schema
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
}

export interface CreateAppointmentDto {
  patientId?: string;
  doctorId: string;
  hospitalId?: string;
  date: Date;
  duration: number;
  type: AppointmentType;
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  reason?: string;
}

export interface GetAppointmentsQueryDto {
  status?: 'upcoming' | 'past' | 'cancelled';
  date?: string;
  patientId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    medicalNumber?: string;
    phone?: string;
    email?: string;
  };
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  hospitalId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  location?: string;
  meetingLink?: string;
  reminder?: boolean;
  reminderTime?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentResponse {
  total: number;
  page: number;
  limit: number;
  appointments: Appointment[];
}

export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  workingHours: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  availableSlots: Array<{
    date: string;
    slots: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
  bookedSlots: Array<{
    date: string;
    slots: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
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

// Appointment API service
export class AppointmentApiService {
  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    return apiRequest<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get appointments for a patient
   */
  static async getPatientAppointments(
    query: GetAppointmentsQueryDto = {}
  ): Promise<AppointmentResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/appointments/patient${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AppointmentResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get appointments for a doctor
   */
  static async getDoctorAppointments(
    query: GetAppointmentsQueryDto = {}
  ): Promise<AppointmentResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/appointments/doctor${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AppointmentResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get appointments for a hospital
   */
  static async getHospitalAppointments(
    query: GetAppointmentsQueryDto = {}
  ): Promise<AppointmentResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/appointments/hospital${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AppointmentResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    data: UpdateAppointmentStatusDto
  ): Promise<{ _id: string; status: string; updatedAt: Date }> {
    return apiRequest<{ _id: string; status: string; updatedAt: Date }>(
      `/appointments/${appointmentId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Get doctor availability
   */
  static async getDoctorAvailability(
    doctorId: string,
    query: {
      date?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<DoctorAvailability> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/appointments/availability/${doctorId}${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<DoctorAvailability>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Cancel an appointment (convenience method)
   */
  static async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{ _id: string; status: string; updatedAt: Date }> {
    return this.updateAppointmentStatus(appointmentId, {
      status: AppointmentStatus.CANCELLED,
      reason,
    });
  }

  /**
   * Confirm an appointment (convenience method)
   */
  static async confirmAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{ _id: string; status: string; updatedAt: Date }> {
    return this.updateAppointmentStatus(appointmentId, {
      status: AppointmentStatus.CONFIRMED,
      reason,
    });
  }

  /**
   * Complete an appointment (convenience method)
   */
  static async completeAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{ _id: string; status: string; updatedAt: Date }> {
    return this.updateAppointmentStatus(appointmentId, {
      status: AppointmentStatus.COMPLETED,
      reason,
    });
  }

  /**
   * Reschedule an appointment (convenience method)
   */
  static async rescheduleAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{ _id: string; status: string; updatedAt: Date }> {
    return this.updateAppointmentStatus(appointmentId, {
      status: AppointmentStatus.RESCHEDULED,
      reason,
    });
  }
}

// Export all types and enums for use in components
export { ApiErrorClass };