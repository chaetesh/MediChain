'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  HospitalApiService, 
  HospitalDoctor, 
  HospitalDoctorsResponse 
} from '@/lib/services/hospital.service';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Ban, 
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Award,
  Building,
  Eye,
  Loader2
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  experience: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
  lastLogin: string;
  patientsServed: number;
  recordsUploaded: number;
  verified: boolean;
}

export default function HospitalDoctorsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  });

  // Load doctors data
  useEffect(() => {
    loadDoctors();
  }, [departmentFilter, pagination.page]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await HospitalApiService.getHospitalDoctors({
        page: pagination.page,
        limit: pagination.limit,
        department: departmentFilter === 'all' ? undefined : departmentFilter
      });

      // Transform API response to match local interface
      const transformedDoctors: Doctor[] = response.doctors.map(doctor => ({
        id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`.trim(),
        email: doctor.email,
        phone: doctor.phone || 'Not provided',
        specialization: doctor.specialization || 'General Practice',
        department: doctor.department || 'General',
        licenseNumber: doctor.licenseNumber || 'Not provided',
        experience: doctor.experience || 0,
        status: doctor.status,
        joinedDate: doctor.joinedDate,
        lastLogin: doctor.lastLogin || 'Never',
        patientsServed: doctor.patientsServed,
        recordsUploaded: doctor.recordsUploaded,
        verified: doctor.verified
      }));

      setDoctors(transformedDoctors);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
      setDoctors([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Cardiovascular',
    'Emergency',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'General Medicine'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'suspended':
        return <Ban className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || doctor.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.status === 'active').length;
  const totalPatients = doctors.reduce((sum, d) => sum + d.patientsServed, 0);
  const totalRecords = doctors.reduce((sum, d) => sum + d.recordsUploaded, 0);

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Doctor Management"
          description="Manage doctors and medical staff in your hospital"
        >
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        </PageHeader>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading doctors...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <div className="text-red-600 mb-2">⚠️ Error loading doctors</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadDoctors}>
              Try Again
            </Button>
          </Card>
        )}

        {/* Main Content - only show when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Doctors"
                value={totalDoctors.toString()}
                change={{ value: "+2 this month", trend: "up" }}
                icon={<Users className="w-6 h-6 text-blue-600" />}
              />
              <StatCard
                title="Active Doctors"
                value={activeDoctors.toString()}
                change={{ value: `${Math.round((activeDoctors / totalDoctors) * 100)}% active`, trend: "up" }}
                icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              />
              <StatCard
                title="Patients Served"
                value={totalPatients.toLocaleString()}
                change={{ value: "All doctors combined", trend: "neutral" }}
                icon={<Users className="w-6 h-6 text-purple-600" />}
              />
              <StatCard
                title="Records Uploaded"
                value={totalRecords.toLocaleString()}
                change={{ value: "All doctors combined", trend: "neutral" }}
                icon={<Award className="w-6 h-6 text-orange-600" />}
              />
            </div>

            {/* Search and Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Export List
                </Button>
              </div>
            </Card>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-500">{doctor.specialization}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doctor.verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doctor.status)}`}>
                          {getStatusIcon(doctor.status)}
                          <span className="ml-1 capitalize">{doctor.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{doctor.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{doctor.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        <span>{doctor.department} Department</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{doctor.patientsServed}</div>
                        <div className="text-xs text-gray-500">Patients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{doctor.recordsUploaded}</div>
                        <div className="text-xs text-gray-500">Records</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined: {new Date(doctor.joinedDate).toLocaleDateString()}
                        </div>
                        <div>Last login: {new Date(doctor.lastLogin).toLocaleDateString()}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        {doctor.status === 'active' && (
                          <button className="p-1 text-red-600 hover:text-red-800">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredDoctors.length === 0 && (
              <Card className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-500">No doctors match your current filters.</p>
              </Card>
            )}

            {/* Department Summary */}
            <Card title="Department Overview">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {departments.map((dept) => {
                  const deptDoctors = doctors.filter(d => d.department === dept);
                  const activeDeptDoctors = deptDoctors.filter(d => d.status === 'active');
                  
                  return (
                    <div key={dept} className="text-center p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{dept}</h4>
                      <div className="text-2xl font-bold text-blue-600">{activeDeptDoctors.length}</div>
                      <div className="text-xs text-gray-500">of {deptDoctors.length} doctors</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}


        {/* Add Doctor Modal - outside main content conditional */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Doctor</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john.smith@hospital.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cardiology"
                    />
                  </div>
                </form>
                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1">
                    Add Doctor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
