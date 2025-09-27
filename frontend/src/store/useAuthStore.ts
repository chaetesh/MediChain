import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginDto, RegisterDto } from '../lib/types/auth.types';
import { AuthApiService, ApiErrorClass } from '../lib/services/auth.service';

// Simplified user interface for frontend state
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  walletAddress?: string;
  hospitalId?: string;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  
  // Async actions
  login: (data: LoginDto) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterDto) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

// Transform backend User to frontend AuthUser
const transformUser = (backendUser: User): AuthUser => ({
  id: backendUser._id,
  email: backendUser.email,
  firstName: backendUser.firstName,
  lastName: backendUser.lastName,
  role: backendUser.role,
  walletAddress: backendUser.walletAddress,
  hospitalId: backendUser.hospitalId,
  isVerified: backendUser.emailVerified,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),
        
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      logout: async () => {
        try {
          await AuthApiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
      
      login: async (data: LoginDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthApiService.login(data);
          const user = transformUser(response.user);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof ApiErrorClass 
            ? error.message 
            : 'An unexpected error occurred';
            
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          return { success: false, error: errorMessage };
        }
      },
      
      register: async (data: RegisterDto) => {
        set({ isLoading: true, error: null });
        
        try {
          await AuthApiService.register(data);
          
          set({
            isLoading: false,
            error: null,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof ApiErrorClass 
            ? error.message 
            : 'An unexpected error occurred';
            
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          return { success: false, error: errorMessage };
        }
      },
      
      refreshToken: async () => {
        try {
          await AuthApiService.refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout the user
          set({
            user: null,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
        }
      },
      
      loadUserProfile: async () => {
        if (!AuthApiService.isAuthenticated()) {
          return;
        }
        
        try {
          set({ isLoading: true });
          const profile = await AuthApiService.getProfile();
          const user = transformUser(profile);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to load user profile:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Failed to load user profile',
          });
        }
      },
    }),
    {
      name: 'medichain-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export type { AuthUser, UserRole };
