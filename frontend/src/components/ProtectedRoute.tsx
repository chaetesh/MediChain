'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  console.log(isAuthenticated, isLoading, user);  
  const router = useRouter();

  useEffect(() => {

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <Sidebar>{children}</Sidebar>;
};

export default ProtectedRoute;
