'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Share2, 
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Eye,
  RefreshCw,
  Calendar,
  UserCheck,
  Search,
  FileText
} from 'lucide-react';
import { User, UserRole, UsersApiService } from '@/lib/services/users.service';
import { DoctorsApiService, Doctor } from '@/lib/services/doctors.service';
import { MedicalRecordsService } from '@/lib/services/medical-records.service';
import { toast } from 'react-hot-toast';

interface MedicalRecord {
  _id: string; // This should be consistent with what we're getting from getAllRecords
  title: string;
  date: string;
  type: string;
  status?: string;
}

interface SharedRecord {
  id: string;
  recordId: string;
  doctorId: string;
  doctorName: string;
  sharedDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'revoked';
}

export default function PatientSharePage() {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);

  // Fetch doctors and medical records
  useEffect(() => {
    fetchDoctors();
    fetchMedicalRecords();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      // Using the public doctors endpoint that returns doctor details
      const response = await DoctorsApiService.getDoctors();
      
      // The Doctor interface doesn't include walletAddress, so we need to fetch the users
      // with their wallet addresses for the selected doctors
      // For now, we'll use the doctors but we need to get their wallet addresses separately
      
      setDoctors(response.doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    setIsLoading(true);
    try {
      const records = await MedicalRecordsService.getAllRecords();
      setMedicalRecords(records.map(record => ({
        _id: record.id, // Use id from the service interface
        title: record.title,
        date: new Date(record.createdAt).toLocaleDateString(),
        type: record.recordType,
        status: record.status
      })));
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Failed to load medical records");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };
  
  const handleDoctorSelection = (doctorId: string) => {
    setSelectedDoctor(doctorId);
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shareRecords = async () => {
    // Validate selections
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one medical record to share');
      return;
    }

    if (!selectedDoctor) {
      toast.error('Please select a doctor to share with');
      return;
    }

    setIsSharing(true);
    
    try {
      // Find the selected doctor
      const doctor = doctors.find(doc => doc._id === selectedDoctor);
      
      if (!doctor) {
        toast.error('Selected doctor not found');
        setIsSharing(false);
        return;
      }
      
      // The /users/:id endpoint is protected and returns 403 Forbidden unless you're the user or admin
      // Instead of using UsersApiService.getUserById, we'll call a special endpoint to get just the wallet
      // address or use a demo address for now
      
      // Demo implementation - in production, you would need a backend endpoint to get this securely
      let doctorWalletAddress = doctor.walletAddress;
      try {
        // Alternative approach: Call a special backend endpoint for patients to get doctor wallet address
        // For now, we'll create a "demo" address based on doctor ID to simulate the process
        // In real implementation, your backend would need to expose this data through a secure endpoint
        console.log("Using demo wallet address:", doctorWalletAddress);
      } catch (error) {
        console.error("Error with doctor's wallet address:", error);
      }
      
      if (!doctorWalletAddress) {
        toast.error('Could not generate a wallet address for the selected doctor');
        setIsSharing(false);
        return;
      }

      // Calculate expiration time in Unix timestamp (seconds)
      const expiryTimeInSeconds = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);

      // Share each selected record with the doctor
      for (const recordId of selectedRecords) {
        await MedicalRecordsService.shareRecord(recordId, {
          userToShareWithId: doctor._id,
          userToShareWithAddress: doctorWalletAddress, // Use the retrieved wallet address
          expirationTime: expiryTimeInSeconds
        });
      }

      toast.success(`Successfully shared ${selectedRecords.length} record(s) with Dr. ${doctor.firstName} ${doctor.lastName}`);
      
      // Reset selections
      setSelectedRecords([]);
      setSelectedDoctor('');
      
      // Refresh shared records
      fetchSharedRecords();
    } catch (error) {
      console.error('Error sharing records:', error);
      toast.error('Failed to share records. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const fetchSharedRecords = async () => {
    // This would need to be implemented based on your API
    // For now, we'll just use mock data
    setSharedRecords([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-green-600';
      case 'expired': return 'text-gray-600';
      case 'revoked': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired': return <Clock className="w-4 h-4 text-gray-600" />;
      case 'revoked': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <PageHeader
          title="Share Medical Records"
          description="Securely share your medical records with healthcare providers"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Available Records" 
            value={medicalRecords.length.toString()} 
            icon={<FileText className="w-6 h-6" />} 
          />
          <StatCard 
            title="Selected Records" 
            value={selectedRecords.length.toString()} 
            icon={<CheckCircle className="w-6 h-6" />} 
          />
          <StatCard 
            title="Available Doctors" 
            value={doctors.length.toString()} 
            icon={<UserCheck className="w-6 h-6" />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Medical Records */}
          <div className="lg:col-span-6">
            <Card title="Select Medical Records">
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search records..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading records...</p>
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No medical records found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {medicalRecords.map((record) => (
                    <div 
                      key={record._id}
                      onClick={() => toggleRecordSelection(record._id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecords.includes(record._id) 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{record.title}</h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500 space-x-3">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {record.date}
                            </span>
                            <span>{record.type}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <input 
                            type="checkbox" 
                            checked={selectedRecords.includes(record._id)} 
                            onChange={() => {}} // Handled by the div onClick
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Share Settings */}
          <div className="lg:col-span-6">
            <Card title="Share with Doctor">
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">Search Doctor</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by name or email..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">No doctors found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                  {filteredDoctors.map((doctor) => (
                    <div 
                      key={doctor._id}
                      onClick={() => handleDoctorSelection(doctor._id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDoctor === doctor._id 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>{doctor.email}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <input 
                            type="radio" 
                            name="doctor" 
                            checked={selectedDoctor === doctor._id} 
                            onChange={() => {}} // Handled by the div onClick
                            className="h-5 w-5 text-blue-600 rounded-full focus:ring-blue-500" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">Access Duration</label>
                <div className="flex items-center space-x-4">
                  {[1, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExpiryDays(days)}
                      className={`px-3 py-2 text-sm rounded-md ${
                        expiryDays === days
                          ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {days} {days === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">Share selected medical records for specific consultations</p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  variant="primary" 
                  onClick={shareRecords} 
                  disabled={selectedRecords.length === 0 || !selectedDoctor || isSharing}
                  className="w-full"
                >
                  {isSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Medical Records
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Security Features */}
        <Card title="Security Features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-start">
                <Shield className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">End-to-End Encryption</h4>
                  <p className="text-sm text-gray-600">All shared records are encrypted and secured on the blockchain</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-2 mt-0.5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Time-Limited Access</h4>
                  <p className="text-sm text-gray-600">Records automatically expire after the specified duration</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <Eye className="w-5 h-5 mr-2 mt-0.5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Access Tracking</h4>
                  <p className="text-sm text-gray-600">Monitor when and who accessed your shared records</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
