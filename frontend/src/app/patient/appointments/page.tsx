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
  MapPin,
  Building,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Star,
  Heart,
  Stethoscope,
  Activity,
  CreditCard,
  FileText
} from 'lucide-react';
import { 
  AppointmentApiService,
  AppointmentStatus,
  AppointmentType,
  CreateAppointmentDto,
  Appointment as ApiAppointment,
  AppointmentResponse,
  DoctorAvailability
} from '@/lib/services/appointment.service';
import { DoctorsApiService, Doctor as ApiDoctor } from '@/lib/services/doctors.service';
import { HospitalsApiService, Hospital as ApiHospital } from '@/lib/services/hospitals.service';
import { ApiErrorClass } from '@/lib/services/auth.service';

// Mapped types for UI compatibility
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  hospitalId: string;
  rating: number;
  experience: number;
  consultationFee: number;
  avatar?: string;
  availableSlots: {
    date: string;
    times: string[];
  }[];
  nextAvailableDate: string;
  qualifications: string[];
  languages: string[];
  about: string;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  specialties: string[];
  facilities: string[];
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'confirmed';
  type: 'consultation' | 'follow-up' | 'emergency' | 'in_person' | 'virtual';
  symptoms?: string;
  notes?: string;
  fee: number;
}

export default function PatientAppointmentPage() {
  const [activeTab, setActiveTab] = useState<'book' | 'scheduled'>('book');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('in_person');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  
  // API data states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch doctors, hospitals, and appointments in parallel
        const [doctorsResponse, hospitalsResponse, appointmentsResponse] = await Promise.all([
          DoctorsApiService.getDoctors({ page: 1, limit: 50 }),
          HospitalsApiService.getHospitals({ page: 1, limit: 50 }),
          AppointmentApiService.getPatientAppointments({ page: 1, limit: 50 })
        ]);

        // Map API doctors to UI doctors
        const mappedDoctors: Doctor[] = doctorsResponse.doctors.map(apiDoctor => ({
          id: apiDoctor._id,
          name: `${apiDoctor.firstName} ${apiDoctor.lastName}`,
          specialization: apiDoctor.specialization,
          hospital: apiDoctor.hospital?.name || 'Unknown Hospital',
          hospitalId: apiDoctor.hospital?._id || apiDoctor.hospitalId || '',
          rating: apiDoctor.rating || 4.5,
          experience: apiDoctor.yearsOfExperience || 0,
          consultationFee: apiDoctor.consultationFee || 200,
          avatar: apiDoctor.avatar,
          availableSlots: [], // Will be populated when needed
          nextAvailableDate: new Date().toISOString().split('T')[0],
          qualifications: apiDoctor.qualifications || [],
          languages: apiDoctor.languages || ['English'],
          about: apiDoctor.about || 'Experienced medical professional'
        }));

        // Map API hospitals to UI hospitals
        const mappedHospitals: Hospital[] = hospitalsResponse.hospitals.map(apiHospital => ({
          id: apiHospital._id,
          name: apiHospital.name,
          address: apiHospital.address,
          phone: apiHospital.phone,
          email: apiHospital.email,
          rating: apiHospital.rating || 4.5,
          specialties: apiHospital.specialties,
          facilities: apiHospital.facilities
        }));

        // Map API appointments to UI appointments
        const mappedAppointments: Appointment[] = appointmentsResponse.appointments.map(apiAppointment => ({
          id: apiAppointment._id,
          doctorId: apiAppointment.doctorId._id,
          doctorName: `Dr. ${apiAppointment.doctorId.firstName} ${apiAppointment.doctorId.lastName}`,
          hospitalName: 'Hospital Name', // You might need to fetch this separately
          date: new Date(apiAppointment.startTime).toISOString().split('T')[0],
          time: new Date(apiAppointment.startTime).toTimeString().slice(0, 5),
          status: apiAppointment.status as any,
          type: apiAppointment.type === AppointmentType.IN_PERSON ? 'in_person' : 'virtual',
          symptoms: apiAppointment.title,
          notes: apiAppointment.notes,
          fee: 200 // This should come from doctor's consultation fee
        }));

        setDoctors(mappedDoctors);
        setHospitals(mappedHospitals);
        setAppointments(mappedAppointments);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof ApiErrorClass ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch doctor availability when a doctor is selected
  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Next 2 weeks

      // Try to fetch availability from API, but fallback to mock data if it fails
      try {
        const availability = await AppointmentApiService.getDoctorAvailability(doctorId, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        setDoctorAvailability(availability);

        // Update the selected doctor's available slots
        if (selectedDoctor && selectedDoctor.id === doctorId) {
          const updatedDoctor = {
            ...selectedDoctor,
            availableSlots: availability.availableSlots.map(slot => ({
              date: slot.date,
              times: slot.slots.map(s => s.startTime)
            }))
          };
          setSelectedDoctor(updatedDoctor);
        }
      } catch (apiError) {
        console.warn('API availability failed, using mock data:', apiError);
        
        // Generate mock availability for next 7 days
        const mockSlots = [];
        for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          // Skip weekends for demo
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            mockSlots.push({
              date: date.toISOString().split('T')[0],
              times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
            });
          }
        }

        // Update the selected doctor with mock slots
        if (selectedDoctor && selectedDoctor.id === doctorId) {
          const updatedDoctor = {
            ...selectedDoctor,
            availableSlots: mockSlots
          };
          setSelectedDoctor(updatedDoctor);
        }
      }
    } catch (err) {
      console.error('Error in fetchDoctorAvailability:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['all', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Gynecology', 'Internal Medicine'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialization === selectedSpecialty;
    const matchesHospital = selectedHospital === 'all' || doctor.hospitalId === selectedHospital;
    
    return matchesSearch && matchesSpecialty && matchesHospital;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setSelectedDate('');
    setSelectedTime('');
    setSymptoms('');
    setNotes('');
    // Fetch availability when doctor is selected
    fetchDoctorAvailability(doctor.id);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create the appointment date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Create the appointment data object
      const appointmentData: any = {
        doctorId: selectedDoctor.id,
        date: appointmentDate,
        duration: 30, // Default 30 minutes
        type: appointmentType as AppointmentType,
        reason: symptoms,
        notes: notes
      };

      // Only include hospitalId if it's a valid non-empty string
      if (selectedDoctor.hospitalId && selectedDoctor.hospitalId.trim() && selectedDoctor.hospitalId !== '') {
        appointmentData.hospitalId = selectedDoctor.hospitalId;
      }

      await AppointmentApiService.createAppointment(appointmentData);
      
      // Refresh appointments list
      const appointmentsResponse = await AppointmentApiService.getPatientAppointments({ page: 1, limit: 50 });
      const mappedAppointments: Appointment[] = appointmentsResponse.appointments.map(apiAppointment => ({
        id: apiAppointment._id,
        doctorId: apiAppointment.doctorId._id,
        doctorName: `Dr. ${apiAppointment.doctorId.firstName} ${apiAppointment.doctorId.lastName}`,
        hospitalName: 'Hospital Name',
        date: new Date(apiAppointment.startTime).toISOString().split('T')[0],
        time: new Date(apiAppointment.startTime).toTimeString().slice(0, 5),
        status: apiAppointment.status as any,
        type: apiAppointment.type === AppointmentType.IN_PERSON ? 'in_person' : 'virtual',
        symptoms: apiAppointment.title,
        notes: apiAppointment.notes,
        fee: selectedDoctor.consultationFee
      }));
      setAppointments(mappedAppointments);
      
      setShowBookingModal(false);
      setSelectedDoctor(null);
      setError(null);
      
      // Show success message (you might want to use a toast notification)
      alert('Appointment booked successfully!');
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const totalAppointments = appointments.length;
  const scheduledAppointments = appointments.filter((a: Appointment) => a.status === 'scheduled').length;
  const completedAppointments = appointments.filter((a: Appointment) => a.status === 'completed').length;
  const upcomingToday = appointments.filter((a: Appointment) => 
    a.status === 'scheduled' && new Date(a.date).toDateString() === new Date().toDateString()
  ).length;

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setLoading(true);
      await AppointmentApiService.cancelAppointment(appointmentId, 'Cancelled by patient');
      
      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const }
          : apt
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && appointments.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['patient']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error && appointments.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['patient']}>
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

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="space-y-6">
        <PageHeader
          title="Appointments"
          description="Book new appointments and manage your scheduled visits"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Appointments"
            value={totalAppointments.toString()}
            change={{ value: "All time", trend: "neutral" }}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Scheduled"
            value={scheduledAppointments.toString()}
            change={{ value: "Upcoming visits", trend: "up" }}
            icon={<Clock className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="Completed"
            value={completedAppointments.toString()}
            change={{ value: "Past visits", trend: "neutral" }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Today"
            value={upcomingToday.toString()}
            change={{ value: "Appointments today", trend: "neutral" }}
            icon={<Activity className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('book')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'book'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              My Appointments ({scheduledAppointments})
            </button>
          </nav>
        </div>

        {activeTab === 'book' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search doctors or hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty === 'all' ? 'All Specialties' : specialty}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Hospitals</option>
                  {hospitals.map(hospital => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </Card>

            {/* Doctors List */}
            <Card title={`Available Doctors (${filteredDoctors.length} found)`}>
              <div className="space-y-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                          <p className="text-blue-600 font-medium mb-1">{doctor.specialization}</p>
                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <Building className="w-4 h-4 mr-1" />
                            <span>{doctor.hospital}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span>{doctor.rating}</span>
                            </div>
                            <span>{doctor.experience} years experience</span>
                            <span className="font-medium text-green-600">${doctor.consultationFee}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="primary" 
                        onClick={() => handleBookAppointment(doctor)}
                        className="ml-4"
                      >
                        Book Appointment
                      </Button>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 text-sm">{doctor.about}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Qualifications:</span>
                        <div className="mt-1 space-y-1">
                          {doctor.qualifications.map((qual, index) => (
                            <span key={index} className="block text-gray-600">{qual}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Languages:</span>
                        <div className="mt-1">
                          <span className="text-gray-600">{doctor.languages.join(', ')}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Next Available:</span>
                        <div className="mt-1">
                          <span className="text-green-600 font-medium">
                            {new Date(doctor.nextAvailableDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="text-center py-8">
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                  <p className="text-gray-500">No doctors match your current search criteria.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <Card title="My Appointments">
              <div className="space-y-4">
                {appointments.map((appointment: Appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                          <p className="text-sm text-gray-600">{appointment.hospitalName}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                            <Clock className="w-4 h-4 ml-3 mr-1" />
                            <span>{appointment.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1 capitalize">{appointment.status}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2 capitalize">{appointment.type}</span>
                      </div>
                      <div>
                        <span className="font-medium">Fee:</span>
                        <span className="ml-2 text-green-600 font-medium">${appointment.fee}</span>
                      </div>
                    </div>

                    {appointment.symptoms && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Symptoms:</span>
                        <p className="text-sm text-gray-600 mt-1">{appointment.symptoms}</p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="danger" size="sm">
                            Cancel
                          </Button>
                        </>
                      )}
                      {appointment.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          View Report
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {appointments.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
                  <p className="text-gray-500">You don't have any appointments yet. Book your first appointment!</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedDoctor && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Book Appointment</h3>
                  <button 
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Doctor Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
                    <p className="text-blue-600 text-sm">{selectedDoctor.specialization}</p>
                    <p className="text-gray-600 text-sm">{selectedDoctor.hospital}</p>
                    <p className="text-green-600 font-medium text-sm mt-1">Fee: ${selectedDoctor.consultationFee}</p>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="in_person">In-Person Consultation</option>
                      <option value="virtual">Virtual Consultation</option>
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    {selectedDoctor.availableSlots.length === 0 ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center text-sm text-gray-500">
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Loading available dates...
                            </>
                          ) : (
                            'Loading availability...'
                          )}
                        </div>
                      </div>
                    ) : (
                      <select
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime(''); // Clear selected time when date changes
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a date ({selectedDoctor.availableSlots.length} available)</option>
                        {selectedDoctor.availableSlots.map((slot) => (
                          <option key={slot.date} value={slot.date}>
                            {new Date(slot.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Times ({selectedDoctor.availableSlots
                          .find(slot => slot.date === selectedDate)
                          ?.times.length || 0} slots)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedDoctor.availableSlots
                          .find(slot => slot.date === selectedDate)
                          ?.times.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                                selectedTime === time
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                  : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {time}
                            </button>
                          )) || (
                          <div className="col-span-3 text-sm text-gray-500 text-center py-2">
                            No available times for this date
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms / Reason for Visit
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={3}
                      placeholder="Please describe your symptoms or reason for the visit..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Any additional information..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowBookingModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleConfirmBooking}
                    disabled={!selectedDate || !selectedTime || !symptoms.trim()}
                    className="flex-1"
                  >
                    Book Appointment
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
