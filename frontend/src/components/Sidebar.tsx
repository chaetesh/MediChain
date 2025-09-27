'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthUser } from '@/store/useAuthStore';
import { UserRole } from '@/lib/types/auth.types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  LogOut,
  Shield,
  Activity,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  children: ReactNode;
}

const Sidebar = ({ children }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      { href: '/dashboard', icon: Home, label: 'Dashboard' },
    ];

    switch (user.role) {
      case UserRole.SYSTEM_ADMIN:
        return [
          ...commonItems,
          { href: '/admin/users', icon: Users, label: 'User Management' },
          { href: '/admin/hospitals', icon: Building2, label: 'Hospital Management' },
          { href: '/admin/audit', icon: Shield, label: 'Audit Logs' },
          { href: '/admin/blockchain', icon: Activity, label: 'Blockchain Status' },
          { href: '/admin/ai-config', icon: Settings, label: 'AI Configuration' },
          { href: '/admin/support', icon: Bell, label: 'Support Tickets' },
        ];
      
      case UserRole.HOSPITAL_ADMIN:
        return [
          ...commonItems,
          { href: '/hospital/doctors', icon: Users, label: 'Doctor Management' },
          { href: '/hospital/patients', icon: Users, label: 'Patient Management' },
          { href: '/hospital/access-logs', icon: Shield, label: 'Access Logs' },
          { href: '/hospital/ai-settings', icon: Settings, label: 'AI Settings' },
          { href: '/hospital/billing', icon: FileText, label: 'Billing' },
          { href: '/hospital/analytics', icon: Activity, label: 'Analytics' },
           { href: '/hospital/appointments', icon: Bell, label: 'Appointments' },
          { href: '/hospital/support', icon: Bell, label: 'Support' },
        ];
      
      case UserRole.DOCTOR:
        return [
          ...commonItems,
          { href: '/doctor/search', icon: Search, label: 'Search Patients' },
          { href: '/doctor/appointments', icon: Bell, label: 'My Appointments' },
          { href: '/doctor/records', icon: FileText, label: 'Upload Records' },
          { href: '/doctor/shared-records', icon: Shield, label: 'Shared Records' },
          { href: '/doctor/access', icon: Shield, label: 'QR/OTP Access' },
          { href: '/doctor/profile', icon: Settings, label: 'Profile' },
        ];
      
      case UserRole.PATIENT:
        return [
          ...commonItems,
          { href: '/patient/appointments', icon: Bell, label: 'Appointments' },
          { href: '/patient/records', icon: FileText, label: 'My Records' },
          { href: '/patient/upload', icon: FileText, label: 'Upload Record' },
          { href: '/patient/share', icon: Shield, label: 'Share Record' },
          { href: '/patient/family', icon: Users, label: 'Family & Genetic Risk' },
          { href: '/patient/access-logs', icon: Activity, label: 'Access Logs' },
          { href: '/patient/wallet', icon: Settings, label: 'Wallet & Security' },
          { href: '/patient/settings', icon: Settings, label: 'Settings' },
        ];
      
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-gray-900">MediChain.AI</span>
        </Link>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium text-sm">
              {user?.firstName?.charAt(0)?.toUpperCase()}{user?.lastName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white shadow-sm">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
