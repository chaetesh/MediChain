// User roles enum matching backend
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor', 
  HOSPITAL_ADMIN = 'hospital_admin',
  SYSTEM_ADMIN = 'system_admin',
}

// User interface matching backend user schema
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  walletAddress?: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  hospitalId?: string;
  profileData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Auth DTOs matching backend validation
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface WalletLoginDto {
  address: string;
  signature: string;
  message: string;
}

export interface WalletRegisterDto {
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface LinkWalletDto {
  walletAddress: string;
}

// API Response types
export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode: number;
}

// Frontend form types
export interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterFormData {
  // Basic Info
  role: UserRole;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Patient specific
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Doctor specific
  licenseNumber?: string;
  specialization?: string;
  department?: string;
  hospitalId?: string;
  
  // Hospital Admin specific
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalCity?: string;
  hospitalState?: string;
  hospitalZipCode?: string;
  hospitalPhone?: string;
  hospitalLicense?: string;
  hospitalWebsite?: string;
  
  // Agreement
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

// Validation error type
export interface ValidationErrors {
  [key: string]: string;
}