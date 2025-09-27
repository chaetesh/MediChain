import { RegisterFormData, ValidationErrors, UserRole } from '../types/auth.types';

/**
 * Password validation rules
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  // Check for number or special character
  if (!/(?=.*\d)|(?=.*\W)/.test(password)) {
    return 'Password must contain at least one number or special character';
  }
  
  return null;
};

/**
 * Email validation
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address';
  }
  
  return null;
};

/**
 * Phone validation
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please provide a valid phone number';
  }
  
  return null;
};

/**
 * Validate step 1 of registration form
 */
export const validateRegistrationStep1 = (formData: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Email validation
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Password validation
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  // Confirm password
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // First name
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  // Last name
  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  // Phone
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;

  return errors;
};

/**
 * Validate step 2 of registration form (role-specific fields)
 */
export const validateRegistrationStep2 = (formData: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  switch (formData.role) {
    case UserRole.PATIENT:
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.address?.trim()) {
        errors.address = 'Address is required';
      }
      if (!formData.emergencyContactName?.trim()) {
        errors.emergencyContactName = 'Emergency contact name is required';
      }
      if (!formData.emergencyContactPhone?.trim()) {
        errors.emergencyContactPhone = 'Emergency contact phone is required';
      }
      if (!formData.emergencyContactRelation?.trim()) {
        errors.emergencyContactRelation = 'Emergency contact relation is required';
      }
      break;

    case UserRole.DOCTOR:
      if (!formData.licenseNumber?.trim()) {
        errors.licenseNumber = 'Medical license number is required';
      }
      if (!formData.specialization?.trim()) {
        errors.specialization = 'Medical specialization is required';
      }
      if (!formData.department?.trim()) {
        errors.department = 'Department is required';
      }
      break;

    case UserRole.HOSPITAL_ADMIN:
      if (!formData.hospitalName?.trim()) {
        errors.hospitalName = 'Hospital name is required';
      }
      if (!formData.hospitalAddress?.trim()) {
        errors.hospitalAddress = 'Hospital address is required';
      }
      if (!formData.hospitalPhone?.trim()) {
        errors.hospitalPhone = 'Hospital phone is required';
      }
      if (!formData.hospitalLicense?.trim()) {
        errors.hospitalLicense = 'Hospital license is required';
      }
      break;
  }

  return errors;
};

/**
 * Validate step 3 of registration form (agreements)
 */
export const validateRegistrationStep3 = (formData: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.agreeToTerms) {
    errors.agreement = 'You must agree to the Terms of Service';
  }

  if (!formData.agreeToPrivacy) {
    errors.agreement = 'You must agree to the Privacy Policy';
  }

  if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
    errors.agreement = 'You must agree to both Terms of Service and Privacy Policy';
  }

  return errors;
};

/**
 * Get user-friendly role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.PATIENT:
      return 'Patient';
    case UserRole.DOCTOR:
      return 'Doctor';
    case UserRole.HOSPITAL_ADMIN:
      return 'Hospital Administrator';
    case UserRole.SYSTEM_ADMIN:
      return 'System Administrator';
    default:
      return role;
  }
};

/**
 * Format form data for API submission
 */
export const formatRegisterData = (formData: RegisterFormData) => {
  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    role: formData.role,
  };
};