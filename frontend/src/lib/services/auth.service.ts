import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  RegisterResponse,
  WalletLoginDto,
  WalletRegisterDto,
  LinkWalletDto,
  RefreshTokenResponse,
  User,
  ApiError
} from '../types/auth.types';
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
  };  try {
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

// Authentication API service
export class AuthApiService {
  /**
   * Register a new user with email and password
   */
  static async register(data: RegisterDto): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login with email and password
   */
  static async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token in localStorage
    if (typeof window !== 'undefined' && response.access_token) {
      localStorage.setItem(TOKEN_KEY, response.access_token);
    }

    return response;
  }

  /**
   * Login with wallet signature
   */
  static async walletLogin(data: WalletLoginDto): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/wallet/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token in localStorage
    if (typeof window !== 'undefined' && response.access_token) {
      localStorage.setItem(TOKEN_KEY, response.access_token);
    }

    return response;
  }

  /**
   * Register a new user with wallet
   */
  static async walletRegister(data: WalletRegisterDto): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/wallet/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Link wallet to existing user account
   */
  static async linkWallet(data: LinkWalletDto): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/wallet/link', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    return apiRequest<User>('/auth/profile', {
      method: 'GET',
    });
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await apiRequest<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
    });

    // Update token in localStorage
    if (typeof window !== 'undefined' && response.access_token) {
      localStorage.setItem(TOKEN_KEY, response.access_token);
    }

    return response;
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    // Remove token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }
}

// Export the error class for use in components
export { ApiErrorClass };