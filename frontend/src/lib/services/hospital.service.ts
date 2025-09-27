import { config } from '../config/env';

// API configuration
const API_BASE_URL = config.api.baseUrl;
const TOKEN_KEY = config.auth.tokenKey;

// Custom error class for API errors
class ApiErrorClass extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Generic API request helper
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // Add /api prefix to all endpoints since backend uses global prefix 'api'
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage if available
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
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
    
    // Handle network errors or other issues
    console.error('API request failed:', error);
    throw new ApiErrorClass('Network error or server unavailable', 500);
  }
};

export interface HospitalDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  experience?: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
  lastLogin?: string;
  patientsServed: number;
  recordsUploaded: number;
  verified: boolean;
  hospitalId: string;
}

export interface HospitalDoctorsResponse {
  doctors: HospitalDoctor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface HospitalProfile {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  licenseNumber: string;
  establishedYear: number;
  totalBeds: number;
  availableBeds: number;
  departments: string[];
  accreditations: string[];
  isActive: boolean;
}

export class HospitalApiService {
  private static readonly BASE_URL = '/hospitals';

  static async getHospitalProfile(): Promise<HospitalProfile> {
    return apiRequest<HospitalProfile>(`${this.BASE_URL}/profile`);
  }

  static async getHospitalDoctors(options: {
    page?: number;
    limit?: number;
    department?: string;
  } = {}): Promise<HospitalDoctorsResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.department) params.append('department', options.department);

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_URL}/doctors?${queryString}` : `${this.BASE_URL}/doctors`;
    
    return apiRequest<HospitalDoctorsResponse>(endpoint);
  }

  static async updateHospitalProfile(profileData: Partial<HospitalProfile>): Promise<HospitalProfile> {
    return apiRequest<HospitalProfile>(`${this.BASE_URL}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  static async addDoctor(doctorData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialization: string;
    department: string;
    licenseNumber: string;
  }): Promise<{ message: string; doctorId: string }> {
    return apiRequest<{ message: string; doctorId: string }>(`${this.BASE_URL}/doctors`, {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  static async updateDoctorStatus(doctorId: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${this.BASE_URL}/doctors/${doctorId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async getHospitalPatients(options: {
    page?: number;
    limit?: number;
    doctorId?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.doctorId) params.append('doctorId', options.doctorId);

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_URL}/patients?${queryString}` : `${this.BASE_URL}/patients`;
    
    return apiRequest<any>(endpoint);
  }

  static async getHospitalAnalytics(): Promise<any> {
    return apiRequest<any>(`${this.BASE_URL}/analytics`);
  }

  static async getBillingReports(startDate?: Date, endDate?: Date): Promise<any> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_URL}/billing-reports?${queryString}` : `${this.BASE_URL}/billing-reports`;
    
    return apiRequest<any>(endpoint);
  }

  static async getBills(options: {
    page?: number;
    limit?: number;
    status?: string;
    department?: string;
    search?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.department && options.department !== 'all') params.append('department', options.department);
    if (options.search) params.append('search', options.search);

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_URL}/bills?${queryString}` : `${this.BASE_URL}/bills`;
    
    return apiRequest<any>(endpoint);
  }

  static async getPayments(options: {
    page?: number;
    limit?: number;
    method?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.method && options.method !== 'all') params.append('method', options.method);
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());

    const queryString = params.toString();
    const endpoint = queryString ? `${this.BASE_URL}/payments?${queryString}` : `${this.BASE_URL}/payments`;
    
    return apiRequest<any>(endpoint);
  }

  static async createBill(billData: any): Promise<any> {
    return apiRequest<any>(`${this.BASE_URL}/bills`, {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  }

  static async recordPayment(paymentData: any): Promise<any> {
    return apiRequest<any>(`${this.BASE_URL}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}