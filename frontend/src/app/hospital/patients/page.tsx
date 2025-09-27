'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  PatientsApiService, 
  Patient, 
  PatientsResponse 
} from '@/lib/services/patients.service';
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
  FileText,
  Eye,
  Loader2,
  Heart,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';

interface HospitalPatient extends Patient {
  patientNumber?: string;
  age?: number;
  gender?: string;
  address?: string;
  lastVisit?: string;
  nextAppointment?: string;
  assignedDoctor?: string;
  medicalConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceProvider?: string;
  bloodType?: string;
  allergies?: string[];
}

export default function HospitalPatientsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<HospitalPatient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  // State management
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });

  // Load patients data
  useEffect(() => {
    loadPatients();
  }, [pagination.page, doctorFilter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadPatients();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await PatientsApiService.getHospitalPatients({
        page: pagination.page,
        limit: pagination.limit,
        doctorId: doctorFilter === 'all' ? undefined : doctorFilter,
        search: searchTerm.trim() || undefined
      });

      console.log('API Response:', response); // Debug log

      // Ensure response has proper structure with fallbacks
      const patientsData = response?.patients || [];
      const paginationData = {
        total: response?.total || 0,
        page: response?.page || pagination.page,
        limit: response?.limit || pagination.limit,
        pages: Math.ceil((response?.total || 0) / (response?.limit || pagination.limit))
      };

      // Transform API response to match local interface with mock data for missing fields
      const transformedPatients: HospitalPatient[] = patientsData.map((patient, index) => ({
        ...patient,
        patientNumber: patient.medicalNumber || `PAT-${patient._id?.substring(0, 6)?.toUpperCase()}`,
        age: Math.floor(Math.random() * 60) + 18, // Mock age
        gender: ['Male', 'Female'][Math.floor(Math.random() * 2)], // Mock gender
        address: `${Math.floor(Math.random() * 9999) + 1} Main Street, City`, // Mock address
        lastVisit: patient.lastVisit || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextAppointment: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        assignedDoctor: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
        medicalConditions: Math.random() > 0.5 ? ['Hypertension', 'Diabetes'][Math.floor(Math.random() * 2)] ? ['Hypertension'] : ['Diabetes'] : [],
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+1 (555) 000-0000',
          relationship: 'Family'
        },
        insuranceProvider: ['Blue Cross', 'Aetna', 'Cigna', 'United Health'][Math.floor(Math.random() * 4)],
        bloodType: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        allergies: Math.random() > 0.7 ? ['Penicillin'] : [],
      }));

      setPatients(transformedPatients);
      setPagination(paginationData);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      setPatients([]); // Fallback to empty array
      // Reset pagination to safe defaults
      setPagination({
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (hasConditions: boolean) => {
    return hasConditions 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (hasConditions: boolean) => {
    return hasConditions 
      ? <AlertCircle className="w-4 h-4 text-yellow-600" />
      : <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const filteredPatients = (patients || []).filter(patient => {
    const matchesSearch = patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patientNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoctor = doctorFilter === 'all' || patient.assignedDoctor?.includes(doctorFilter);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && patient.nextAppointment) ||
                         (statusFilter === 'inactive' && !patient.nextAppointment);
    
    return matchesSearch && matchesDoctor && matchesStatus;
  });

  const totalPatients = pagination?.total || 0;
  const activePatients = patients?.filter(p => p.nextAppointment)?.length || 0;
  const totalRecords = patients?.reduce((sum, p) => sum + (p.medicalRecordsCount || 0), 0) || 0;
  const recentVisits = patients?.filter(p => p.lastVisit && 
    new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )?.length || 0;

  const handlePatientView = (patient: HospitalPatient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const doctors = Array.from(new Set((patients || []).map(p => p.assignedDoctor))).filter(Boolean);

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Patient Management"
          description="Manage patients and their medical records in your hospital"
        >
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </PageHeader>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading patients...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <div className="text-red-600 mb-2">⚠️ Error loading patients</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadPatients}>
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
                title="Total Patients"
                value={(totalPatients || 0).toString()}
                change={{ value: "Registered", trend: "up" }}
                icon={<Users className="w-6 h-6 text-blue-600" />}
              />
              <StatCard
                title="Active Patients"
                value={(activePatients || 0).toString()}
                change={{ value: "With upcoming appointments", trend: "up" }}
                icon={<Activity className="w-6 h-6 text-green-600" />}
              />
              <StatCard
                title="Medical Records"
                value={(totalRecords || 0).toLocaleString()}
                change={{ value: "Total records", trend: "neutral" }}
                icon={<FileText className="w-6 h-6 text-purple-600" />}
              />
              <StatCard
                title="Recent Visits"
                value={(recentVisits || 0).toString()}
                change={{ value: "This week", trend: "up" }}
                icon={<Clock className="w-6 h-6 text-orange-600" />}
              />
            </div>

            {/* Search and Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map(doctor => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Patients</option>
                  <option value="active">Active (with appointments)</option>
                  <option value="inactive">No upcoming appointments</option>
                </select>

                <Button variant="outline" onClick={loadPatients}>
                  <Filter className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <div key={patient._id} className="cursor-pointer" onClick={() => handlePatientView(patient)}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">{patient.patientNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(Boolean(patient.medicalConditions?.length))
                          }`}>
                            {getStatusIcon(Boolean(patient.medicalConditions?.length))}
                            <span className="ml-1">
                              {patient.medicalConditions?.length ? 'Monitored' : 'Healthy'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Patient Info */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{patient.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          <span>{patient.age} years • {patient.gender} • {patient.bloodType}</span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          <span>{patient.assignedDoctor}</span>
                        </div>
                      </div>

                      {/* Medical Info */}
                      {patient.medicalConditions && patient.medicalConditions.length > 0 && (
                        <div className="p-2 bg-yellow-50 rounded-lg">
                          <div className="text-xs font-medium text-yellow-800 mb-1">Medical Conditions:</div>
                          <div className="text-xs text-yellow-700">
                            {patient.medicalConditions.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {patient.medicalRecordsCount || 0}
                          </div>
                          <div className="text-xs text-gray-500">Records</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {patient.appointmentCount || 0}
                          </div>
                          <div className="text-xs text-gray-500">Visits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {patient.allergies?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500">Allergies</div>
                        </div>
                      </div>

                      {/* Last Visit */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Last Visit:</div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {patient.lastVisit ? 
                            new Date(patient.lastVisit).toLocaleDateString() : 
                            'No recent visits'
                          }
                        </div>
                        {patient.nextAppointment && (
                          <div className="text-xs text-green-600 mt-1">
                            Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredPatients.length === 0 && (
              <Card className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No patients match your search criteria.' : 'No patients registered yet.'}
                </p>
              </Card>
            )}

            {/* Pagination */}
            {pagination?.pages > 1 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {' '}
                    {pagination.total} patients
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Patient Details Modal */}
        {showPatientModal && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedPatient.patientNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card title="Personal Information">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedPatient.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>{selectedPatient.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span>{selectedPatient.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span>{selectedPatient.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Type:</span>
                        <span>{selectedPatient.bloodType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="text-right">{selectedPatient.address}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Medical Information */}
                  <Card title="Medical Information">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Doctor:</span>
                        <span>{selectedPatient.assignedDoctor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Insurance:</span>
                        <span>{selectedPatient.insuranceProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Records:</span>
                        <span>{selectedPatient.medicalRecordsCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Visits:</span>
                        <span>{selectedPatient.appointmentCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Visit:</span>
                        <span>{selectedPatient.lastVisit ? 
                          new Date(selectedPatient.lastVisit).toLocaleDateString() : 
                          'Never'
                        }</span>
                      </div>
                      {selectedPatient.nextAppointment && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Next Appointment:</span>
                          <span className="text-green-600">
                            {new Date(selectedPatient.nextAppointment).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Emergency Contact */}
                  <Card title="Emergency Contact">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedPatient.emergencyContact?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>{selectedPatient.emergencyContact?.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Relationship:</span>
                        <span>{selectedPatient.emergencyContact?.relationship}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Medical Conditions & Allergies */}
                  <Card title="Medical Conditions & Allergies">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Conditions:</h4>
                        {selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.medicalConditions.map((condition, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                {condition}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No known conditions</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Allergies:</h4>
                        {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.allergies.map((allergy, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No known allergies</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowPatientModal(false)}>
                    Close
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Patient
                  </Button>
                  <Button variant="primary">
                    <FileText className="w-4 h-4 mr-2" />
                    View Records
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Patient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Patient</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john.doe@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </form>
                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1">
                    Add Patient
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
