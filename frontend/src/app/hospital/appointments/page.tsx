'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Star,
  Stethoscope,
  Activity,
  CreditCard,
  FileText,
  Eye,
  Edit,
  MessageSquare,
  Video,
  Users,
  TrendingUp,
  DollarSign,
  Building,
  Download
} from 'lucide-react';
import { 
  AppointmentApiService,
  AppointmentStatus,
  AppointmentType,
  AppointmentResponse,
  Appointment as ApiAppointment
} from '@/lib/services/appointment.service';
import { DoctorsApiService, Doctor as ApiDoctor } from '@/lib/services/doctors.service';
import { ApiErrorClass } from '@/lib/services/auth.service';

// Mapped interfaces for UI compatibility
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  phone: string;
  email: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'in-progress' | 'confirmed';
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'in_person' | 'virtual';
  symptoms: string;
  consultationFee: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  appointmentMode: 'in-person' | 'video-call' | 'phone-call';
  department: string;
  room?: string;
}

export default function HospitalAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history' | 'overview'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // API data states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true);
      try {
        // Fetch hospital appointments and doctors in parallel
        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          AppointmentApiService.getHospitalAppointments({ page: 1, limit: 100 }),
          DoctorsApiService.getDoctors({ page: 1, limit: 100 })
        ]);

        // Map API doctors to UI doctors
        const mappedDoctors: Doctor[] = doctorsResponse.doctors.map(apiDoctor => ({
          id: apiDoctor._id,
          name: `${apiDoctor.firstName} ${apiDoctor.lastName}`,
          specialization: apiDoctor.specialization,
          department: apiDoctor.specialization, // Using specialization as department for now
          phone: apiDoctor.phone || 'N/A',
          email: apiDoctor.email
        }));

        // Map API appointments to UI appointments
        const mappedAppointments: Appointment[] = appointmentsResponse.appointments.map(apiAppointment => ({
          id: apiAppointment._id,
          doctorId: apiAppointment.doctorId._id,
          doctorName: `Dr. ${apiAppointment.doctorId.firstName} ${apiAppointment.doctorId.lastName}`,
          doctorSpecialization: apiAppointment.doctorId.specialization || 'General',
          patientId: apiAppointment.patientId._id,
          patientName: `${apiAppointment.patientId.firstName} ${apiAppointment.patientId.lastName}`,
          patientAge: 30, // This would need to be calculated from patient DOB
          patientPhone: apiAppointment.patientId.phone || 'N/A',
          date: new Date(apiAppointment.startTime).toISOString().split('T')[0],
          time: new Date(apiAppointment.startTime).toTimeString().slice(0, 5),
          duration: Math.round((new Date(apiAppointment.endTime).getTime() - new Date(apiAppointment.startTime).getTime()) / (1000 * 60)),
          status: apiAppointment.status === AppointmentStatus.CONFIRMED ? 'confirmed' : apiAppointment.status as any,
          type: apiAppointment.type === AppointmentType.IN_PERSON ? 'in_person' : 'virtual',
          symptoms: apiAppointment.title,
          consultationFee: 200, // This should come from doctor's profile
          urgencyLevel: 'medium' as const, // This could be derived from appointment type
          appointmentMode: apiAppointment.type === AppointmentType.IN_PERSON ? 'in-person' : 'video-call',
          department: apiAppointment.doctorId.specialization || 'General',
          room: undefined // This would come from appointment location data
        }));

        setDoctors(mappedDoctors);
        setAppointments(mappedAppointments);
        setError(null);
      } catch (err) {
        console.error('Error fetching hospital data:', err);
        setError(err instanceof ApiErrorClass ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  const departments = ['all', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics', 'Emergency'];

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  // Show loading state
  if (loading && appointments.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['hospital_admin']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading hospital data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error && appointments.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['hospital_admin']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'no-show': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'in-progress': return <Activity className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(apt => new Date(apt.date).toDateString() === today);
  const upcomingAppointments = appointments.filter(apt => new Date(apt.date) > new Date());
  const historyAppointments = appointments.filter(apt => new Date(apt.date) < new Date() || apt.status === 'completed');

  const getCurrentAppointments = () => {
    switch (activeTab) {
      case 'today': return todayAppointments;
      case 'upcoming': return upcomingAppointments;
      case 'history': return historyAppointments;
      case 'overview': return appointments;
      default: return appointments;
    }
  };

  const filteredAppointments = getCurrentAppointments().filter(appointment => {
    const matchesSearch = 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || appointment.department === departmentFilter;
    const matchesDoctor = doctorFilter === 'all' || appointment.doctorId === doctorFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesDoctor;
  });

  // Statistics
  const totalAppointments = appointments.length;
  const todayCount = todayAppointments.length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const revenue = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.consultationFee, 0);
  const inProgressCount = appointments.filter(a => a.status === 'in-progress').length;
  const noShowCount = appointments.filter(a => a.status === 'no-show').length;

  // Department statistics
  const departmentStats = departments.slice(1).map(dept => {
    const deptAppointments = appointments.filter(a => a.department === dept);
    return {
      name: dept,
      total: deptAppointments.length,
      completed: deptAppointments.filter(a => a.status === 'completed').length,
      revenue: deptAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.consultationFee, 0),
      doctors: doctors.filter(d => d.department === dept).length
    };
  });

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <PageHeader
          title="Hospital Appointments"
          description="Monitor and manage all doctor appointments across departments"
        >
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </PageHeader>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Appointments"
            value={totalAppointments.toString()}
            change={{ value: "All time", trend: "neutral" }}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Today's Schedule"
            value={todayCount.toString()}
            change={{ value: `${inProgressCount} in progress`, trend: "up" }}
            icon={<Clock className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="Completed"
            value={completedCount.toString()}
            change={{ value: `${Math.round((completedCount / totalAppointments) * 100)}% completion rate`, trend: "up" }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Revenue Generated"
            value={`$${revenue.toLocaleString()}`}
            change={{ value: "From completed visits", trend: "up" }}
            icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="w-4 h-4 inline mr-2" />
              Overview ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'today'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Today ({todayCount})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              History ({historyAppointments.length})
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Department Overview */}
            <Card title="Department Performance">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentStats.map((dept) => (
                  <div key={dept.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <span className="text-sm text-gray-500">{dept.doctors} doctors</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Appointments:</span>
                        <span className="font-medium">{dept.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">{dept.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium text-purple-600">${dept.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-medium">
                          {dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </Card>

        {/* Appointments List */}
        <Card title={`Appointments (${filteredAppointments.length} found)`}>
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleAppointmentSelect(appointment)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(appointment.urgencyLevel)}`}>
                          {appointment.urgencyLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Doctor: {appointment.doctorName} • {appointment.doctorSpecialization}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{appointment.time} ({appointment.duration} min)</span>
                        </div>
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          <span>{appointment.department}</span>
                        </div>
                        {appointment.room && (
                          <span>{appointment.room}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status.replace('-', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">Symptoms:</span>
                    <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2 capitalize">{appointment.type.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Mode:</span>
                      <span className="ml-2 capitalize">{appointment.appointmentMode.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Fee:</span>
                      <span className="ml-2 text-green-600 font-medium">${appointment.consultationFee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>Patient: {appointment.patientAge} years</span>
                    <span>{appointment.patientPhone}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-blue-600 hover:text-blue-800" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-green-600 hover:text-green-800" title="Contact Patient">
                      <Phone className="w-4 h-4" />
                    </button>
                    {appointment.appointmentMode === 'video-call' && (
                      <button className="p-1 text-purple-600 hover:text-purple-800" title="Video Call">
                        <Video className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">No appointments match your current search criteria.</p>
            </div>
          )}
        </Card>

        {/* Appointment Details Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                  <button 
                    onClick={() => setShowAppointmentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Patient & Doctor Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.patientName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Age:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.patientAge} years</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.patientPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Doctor Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.doctorName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Specialization:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.doctorSpecialization}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-2 font-medium">{selectedAppointment.department}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Appointment Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 font-medium">{new Date(selectedAppointment.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <span className="ml-2 font-medium">{selectedAppointment.time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">{selectedAppointment.duration} minutes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Room:</span>
                        <span className="ml-2 font-medium">{selectedAppointment.room || 'TBD'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium capitalize">{selectedAppointment.type.replace('-', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fee:</span>
                        <span className="ml-2 font-medium text-green-600">${selectedAppointment.consultationFee}</span>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Symptoms/Reason</h4>
                    <p className="text-gray-700">{selectedAppointment.symptoms}</p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAppointmentModal(false)} className="flex-1">
                    Close
                  </Button>
                  <Button variant="primary" className="flex-1">
                    Contact Doctor
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
