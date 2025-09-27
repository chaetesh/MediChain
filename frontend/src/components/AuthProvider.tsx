'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthApiService } from '@/lib/services/auth.service';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { loadUserProfile, isAuthenticated, user, setLoading } = useAuthStore();

  useEffect(() => {
    // Only attempt to load profile if we have a stored auth token but no user data
    // This happens on page reload
    const initializeAuth = async () => {
      const hasToken = AuthApiService.isAuthenticated();
      
      if (hasToken && !user) {
        setLoading(true);
        try {
          await loadUserProfile();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // If loading profile fails, logout to clear invalid state
          await useAuthStore.getState().logout();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [loadUserProfile, user, setLoading]);

  return <>{children}</>;
}