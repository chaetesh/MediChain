'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { 
  PatientsApiService, 
  PatientDetails, 
  MedicalRecord, 
  ApiErrorClass 
} from '@/lib/services/patients.service';
import { 
  Search, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  Clock,
  Eye,
  Filter,
  Download,
  Share2,
  Activity
} from 'lucide-react';

// Component that handles patient details with search params
function PatientDetailsContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load patient details
      const patientData = await PatientsApiService.getPatientDetails(patientId);
      setPatient(patientData);
      
      // Load patient's medical records
      const recordsData = await PatientsApiService.getPatientMedicalRecords(patientId);
      setMedicalRecords(recordsData);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getRecordTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'blood test':
      case 'lab_result':
        return 'bg-red-100 text-red-800';
      case 'x-ray':
      case 'imaging':
        return 'bg-blue-100 text-blue-800';
      case 'prescription':
        return 'bg-green-100 text-green-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'mri':
        return 'bg-indigo-100 text-indigo-800';
      case 'ct scan':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="text-center max-w-md">
          <div className="p-6">
            <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Patient</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="primary" onClick={loadPatientData}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="text-center max-w-md">
          <div className="p-6">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
            <p className="text-gray-500 mb-4">
              The requested patient could not be found or you don't have access to their records.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Details"
        description={`Medical records and information for ${patient.firstName} ${patient.lastName}`}
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="primary">
            <FileText className="w-4 h-4 mr-2" />
            New Record
          </Button>
        </div>
      </PageHeader>

      {/* Patient Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card title="Patient Information">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</h3>
                <p className="text-sm text-gray-500">Patient ID: {patient.medicalNumber}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Age:</span>
                <span className="font-medium">{patient.age} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium">{patient.gender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Blood Type:</span>
                <span className="font-medium">{patient.bloodType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Visit:</span>
                <span className="font-medium">{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'No visits recorded'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card title="Contact Information">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card title="Emergency Contact">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{patient.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              <p className="font-medium">{patient.emergencyContact.relationship}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{patient.emergencyContact.phone}</p>
            </div>
          </div>
        </Card>
      </div>

        {/* Medical Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medical History */}
          <Card title="Medical History">
            <div className="space-y-2">
              {patient.chronicConditions.length > 0 ? (
                patient.chronicConditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{condition}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No significant medical history recorded</p>
              )}
            </div>
          </Card>

          {/* Allergies */}
          <Card title="Known Allergies">
            <div className="space-y-2">
              {patient.allergies.length > 0 ? (
                patient.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{allergy}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No known allergies</p>
              )}
            </div>
          </Card>
        </div>

      {/* Recent Medical Records */}
      <Card title="Recent Medical Records">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {medicalRecords.length} total records
            </div>
          </div>
          
          <div className="space-y-3">
            {medicalRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-sm text-gray-700">{record.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center pt-4">
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              View All Records ({medicalRecords.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="primary" className="flex flex-col items-center p-4 h-20">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-sm">Add Record</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center p-4 h-20">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-sm">Schedule</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center p-4 h-20">
            <Share2 className="w-6 h-6 mb-1" />
            <span className="text-sm">Share Records</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center p-4 h-20">
            <Download className="w-6 h-6 mb-1" />
            <span className="text-sm">Export Data</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PatientDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading patient data...</p>
          </div>
        </div>
      }>
        <PatientDetailsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
