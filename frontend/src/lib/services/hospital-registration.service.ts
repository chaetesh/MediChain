import { config } from '../config/env';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Hospital registration types
export interface HospitalRegistrationData {
  name: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode: string;
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
    password: string; // Add password field
  };
  departments?: string[];
  facilities?: string[];
  notes?: string;
}

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  totalDoctors: number;
  totalPatients: number;
  monthlyRecords: number;
  registeredAt: string;
  adminName: string;
  website?: string;
  registrationNumber?: string;
  departments?: string[];
  facilities?: string[];
  notes?: string;
}

export interface HospitalAdminApiResponse {
  total: number;
  page: number;
  limit: number;
  hospitals: Hospital[];
}

export class HospitalRegistrationService {
  /**
   * Register a new hospital (public endpoint - no authentication required)
   */
  static async registerHospital(hospitalData: HospitalRegistrationData): Promise<{
    message: string;
    hospitalId: string;
    status: string;
    adminAccount: {
      email: string;
    };
  }> {
    return apiRequest<{
      message: string;
      hospitalId: string;
      status: string;
      adminAccount: {
        email: string;
      };
    }>('/api/hospitals/register', {
      method: 'POST',
      body: JSON.stringify({
        name: hospitalData.name,
        address: hospitalData.address,
        city: hospitalData.city,
        state: hospitalData.state,
        country: hospitalData.country,
        zipCode: hospitalData.zipCode,
        email: hospitalData.email,
        phone: hospitalData.phone,
        website: hospitalData.website,
        registrationNumber: hospitalData.registrationNumber,
        adminDetails: {
          firstName: hospitalData.adminDetails.firstName,
          lastName: hospitalData.adminDetails.lastName,
          email: hospitalData.adminDetails.email,
          phone: hospitalData.adminDetails.phone,
          title: hospitalData.adminDetails.title,
          password: hospitalData.adminDetails.password, // Explicitly include password
        },
        departments: hospitalData.departments || [],
        facilities: hospitalData.facilities || [],
        notes: hospitalData.notes,
      }),
    });
  }

  /**
   * Get all hospitals for system admin
   */
  static async getHospitals(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<HospitalAdminApiResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/admin/hospitals${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<HospitalAdminApiResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get hospital details
   */
  static async getHospitalDetails(hospitalId: string): Promise<any> {
    return apiRequest<any>(`/admin/hospitals/${hospitalId}`, {
      method: 'GET',
    });
  }

  /**
   * Approve or reject a hospital
   */
  static async updateHospitalStatus(
    hospitalId: string, 
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<{ message: string; hospitalId: string; status: string }> {
    return apiRequest<{ message: string; hospitalId: string; status: string }>(
      `/admin/hospitals/${hospitalId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes: notes || '' }),
      }
    );
  }

  /**
   * Update hospital information
   */
  static async updateHospitalInfo(
    hospitalId: string, 
    hospitalData: Partial<Hospital>
  ): Promise<{ message: string; hospitalId: string }> {
    return apiRequest<{ message: string; hospitalId: string }>(
      `/admin/hospitals/${hospitalId}`,
      {
        method: 'PUT',
        body: JSON.stringify(hospitalData),
      }
    );
  }
}