'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole, LoginFormData } from '@/lib/types/auth.types';

// Component that handles search params
function LoginMessages() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showHospitalPendingMessage, setShowHospitalPendingMessage] = useState(false);
  const searchParams = useSearchParams();

  // Check for registration success messages
  useEffect(() => {
    const registered = searchParams.get('registered');
    const hospitalPending = searchParams.get('hospital_pending');
    
    if (registered === 'true') {
      setShowSuccessMessage(true);
      if (hospitalPending === 'true') {
        setShowHospitalPendingMessage(true);
      }
      
      // Clear URL parameters after showing message
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Hide messages after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowHospitalPendingMessage(false);
      }, 10000);
    }
  }, [searchParams]);

  return (
    <>
      {/* Success Messages */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">Registration successful!</p>
              <p className="text-sm text-green-600">You can now log in with your credentials.</p>
            </div>
          </div>
        </div>
      )}

      {showHospitalPendingMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">Hospital Registration Pending</p>
              <p className="text-sm text-blue-600">
                Your hospital registration is pending approval. You can log in, but hospital features will be limited until approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    role: UserRole.PATIENT
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login({
      email: formData.email,
      password: formData.password,
    });
    
    if (result.success) {
      // Redirect to unified dashboard - role-based content is shown within the dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            I am a
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={UserRole.PATIENT}>Patient</option>
            <option value={UserRole.DOCTOR}>Doctor</option>
            <option value={UserRole.HOSPITAL_ADMIN}>Hospital Admin</option>
            <option value={UserRole.SYSTEM_ADMIN}>System Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to MediChain.AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </p>
        </div>

        <Suspense fallback={<div></div>}>
          <LoginMessages />
        </Suspense>

        <LoginForm />

        <div className="text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
