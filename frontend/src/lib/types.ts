export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  title: string;
  description: string;
  recordType: 'consultation' | 'lab_result' | 'prescription' | 'imaging' | 'surgery' | 'emergency';
  date: string;
  files: FileRecord[];
  aiSummary?: string;
  isPublic: boolean;
  blockchainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Patient {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  walletAddress?: string;
  qrCode: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  email: string;
  name: string;
  licenseNumber: string;
  specialization: string;
  department: string;
  hospitalId: string;
  phone: string;
  isVerified: boolean;
  canAccessAI: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  adminEmail: string;
  isApproved: boolean;
  departments: string[];
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    isActive: boolean;
    expiresAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AccessLog {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  recordId: string;
  accessType: 'view' | 'download' | 'share' | 'upload';
  method: 'qr' | 'otp' | 'direct' | 'wallet';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'patient' | 'doctor' | 'hospital_admin' | 'system_admin';
  action: 'view' | 'upload' | 'share' | 'download' | 'delete' | 'modify';
  resourceType: 'patient_record' | 'user_account' | 'hospital_data' | 'system_config';
  resourceId: string;
  resourceName: string;
  ipAddress: string;
  location: string;
  success: boolean;
  details?: string;
}

export interface AIConfiguration {
  id: string;
  hospitalId?: string;
  feature: 'prescription_analysis' | 'medical_summary' | 'drug_interaction' | 'symptom_analysis';
  isEnabled: boolean;
  confidence_threshold: number;
  last_updated: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userRole: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}
