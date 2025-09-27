'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { SystemAdminApiService, User as ApiUser } from '@/lib/services/system-admin.service';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Ban, 
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';

// Updated User interface to match API response
interface User extends ApiUser {
  id?: string; // Keep for backward compatibility
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Stats states
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    pendingIssues: 0
  });

  // Load users data
  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      
      // Note: Backend doesn't support status filtering yet, so we'll filter client-side
      
      if (searchTerm.trim()) {
        params.searchTerm = searchTerm.trim(); // Backend expects 'searchTerm', not 'search'
      }
      
      const response = await SystemAdminApiService.getUsers(params);
      
      // Apply client-side status filtering since backend doesn't support it
      let filteredUsers = response.users;
      if (selectedStatus !== 'all') {
        filteredUsers = response.users.filter(user => {
          if (selectedStatus === 'active') return user.isActive;
          if (selectedStatus === 'inactive') return !user.isActive;
          return true;
        });
      }
      
      setUsers(filteredUsers);
      setPagination({
        total: response.pagination.total, // Use original total from backend
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalPages: response.pagination.pages
      });
      
      // Calculate stats based on filtered users
      const activeCount = filteredUsers.filter(user => user.isActive).length;
      setStats(prev => ({
        ...prev,
        totalUsers: response.pagination.total, // Show total from backend
        activeUsers: activeCount // Show active count from filtered results
      }));
      
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      await SystemAdminApiService.updateUserStatus(userId, newStatus);
      
      // Update user in local state
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isActive: newStatus === 'active' }
          : user
      ));
      
      // Show success message (you might want to add a toast notification)
      console.log(`User status updated to ${newStatus}`);
      
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Failed to update user status');
    }
  };

  // Effects
  useEffect(() => {
    loadUsers(1);
  }, [selectedRole, selectedStatus]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadUsers(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <AlertCircle className="w-4 h-4 text-yellow-600" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient':
        return 'bg-blue-100 text-blue-800';
      case 'doctor':
        return 'bg-green-100 text-green-800';
      case 'hospital_admin':
        return 'bg-purple-100 text-purple-800';
      case 'system_admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['system_admin']}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage all users across the MediChain.AI platform"
        >
          <Button variant="primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </PageHeader>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={() => loadUsers(pagination.page)}
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={pagination.total?.toLocaleString() || '0'}
            change={{ value: `${stats.activeUsers || 0} active`, trend: "up" }}
            icon={<Users className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers?.toLocaleString() || '0'}
            change={{ 
              value: `${Math.round(((stats.activeUsers || 0) / Math.max(pagination.total || 1, 1)) * 100)}% active`, 
              trend: "up" 
            }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Total Pages"
            value={pagination.totalPages?.toString() || '0'}
            change={{ value: `Page ${pagination.page || 1}`, trend: "neutral" }}
            icon={<UserPlus className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="Per Page"
            value={pagination.limit?.toString() || '10'}
            change={{ value: "Results", trend: "neutral" }}
            icon={<Filter className="w-6 h-6 text-orange-600" />}
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="hospital_admin">Hospital Admins</option>
              <option value="system_admin">System Admins</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button variant="outline" onClick={() => loadUsers(1)}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {`${user.firstName} ${user.lastName}`}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.walletAddress && (
                            <div className="text-xs text-gray-400 font-mono">
                              {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(user.isActive)}
                          <span className="ml-2 text-sm text-gray-900">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className={`p-1 rounded ${
                              user.isActive 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => handleStatusChange(
                              user._id, 
                              user.isActive ? 'inactive' : 'active'
                            )}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(pagination.totalPages || 0) > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(((pagination.page || 1) - 1) * (pagination.limit || 10)) + 1} to {' '}
                {Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.total || 0)} of {' '}
                {pagination.total || 0} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(pagination.page || 1) === 1}
                  onClick={() => loadUsers((pagination.page || 1) - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {pagination.page || 1} of {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                  onClick={() => loadUsers((pagination.page || 1) + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
