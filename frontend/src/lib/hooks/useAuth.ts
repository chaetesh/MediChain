import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthApiService } from '../services/auth.service';

/**
 * Custom hook for authentication functionality
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUserProfile,
    refreshToken,
    setError,
  } = useAuthStore();

  // Auto-load user profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (AuthApiService.isAuthenticated() && !user) {
        await loadUserProfile();
      }
    };

    initAuth();
  }, [user, loadUserProfile]);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshToken]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    loadUserProfile,
    refreshToken,
    setError,

    // Computed values
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
    isHospitalAdmin: user?.role === 'hospital_admin',
    isSystemAdmin: user?.role === 'system_admin',
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
  };
};

/**
 * Hook for protecting routes that require authentication
 */
export const useRequireAuth = (redirectTo: string = '/auth/login') => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook for protecting routes based on user role
 */
export const useRequireRole = (
  allowedRoles: string[],
  redirectTo: string = '/dashboard'
) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!allowedRoles.includes(user.role)) {
        window.location.href = redirectTo;
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, redirectTo]);

  return { user, isAuthenticated, isLoading };
};