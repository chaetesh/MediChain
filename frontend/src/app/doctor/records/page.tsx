'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  MedicalRecordsService, 
  CreateMedicalRecordDto, 
  ApiError 
} from '@/lib/services/medical-records.service';
import { 
  PatientsApiService, 
  Patient as ApiPatient, 
  MedicalRecord as ApiMedicalRecord
} from '@/lib/services/patients.service';
import { 
  Upload, 
  FileText, 
  User, 
  Search, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Download,
  Heart,
  Activity,
  Stethoscope,
  FileImage,
  Save
} from 'lucide-react';

// Extended local types for display
interface Patient extends ApiPatient {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  allergies: string[];
  chronicConditions: string[];
  walletAddress?: string; // Add wallet address property
}

interface MedicalRecordDisplay extends ApiMedicalRecord {
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  followUpDate?: string;
  files?: {
    name: string;
    type: string;
    size: string;
    url: string;
  }[];
  patientName?: string;
}

export default function DoctorRecordsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecordDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and form states
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [recordType, setRecordType] = useState('consultation');
  const [recordTitle, setRecordTitle] = useState('');
  const [description, setDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medications, setMedications] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
    loadRecords();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await PatientsApiService.getDoctorPatients({ limit: 50 });
      
      // Transform API patient data to display format
      const transformedPatients: Patient[] = response.patients.map(patient => ({
        ...patient,
        name: `${patient.firstName} ${patient.lastName}`,
        age: 0, // Age calculation will be done after getting patient details
        gender: 'other' as const, // Default gender
        allergies: [],
        chronicConditions: [],
        walletAddress: patient.walletAddress, // Include wallet address
      }));
      
      setPatients(transformedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const recordsData = await MedicalRecordsService.getAllRecords();
      
      // Transform records to display format using the service transformer
      const transformedRecords: MedicalRecordDisplay[] = recordsData.map(record => {
        const baseRecord = PatientsApiService.transformMedicalRecord(record);
        return {
          ...baseRecord,
          diagnosis: record.metadata?.diagnosis || '',
          treatment: record.metadata?.treatment || '',
          medications: record.metadata?.medications || [],
          followUpDate: record.metadata?.followUpDate,
          patientName: record.patientName || 'Unknown Patient',
          files: [{
            name: record.fileName,
            type: record.mimeType,
            size: `${(record.fileSize / 1024 / 1024).toFixed(1)} MB`,
            url: `#${record.id}`,
          }],
        };
      });
      
      setRecords(transformedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth?: string): number => {
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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.medicalNumber && patient.medicalNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowUploadModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRecord = async () => {
    if (!selectedPatient || uploadedFiles.length === 0) return;

    try {
      setLoading(true);

      // Validate that patient has wallet address
      if (!selectedPatient.walletAddress) {
        throw new Error('Patient wallet address is required but not available. Please ensure the patient has linked their wallet.');
      }

      const recordData: CreateMedicalRecordDto = {
        title: recordTitle,
        description,
        recordType: recordType as CreateMedicalRecordDto['recordType'],
        patientId: selectedPatient._id,
        patientAddress: selectedPatient.walletAddress || '', // Use patient's wallet address
        metadata: {
          diagnosis,
          treatment,
          medications: medications.split('\n').filter(med => med.trim()),
          followUpDate: followUpDate || undefined,
        },
      };

      // Upload the first file (for now, handle multiple files later)
      await MedicalRecordsService.createRecord(recordData, uploadedFiles[0]);
      
      // Reset form
      setRecordTitle('');
      setDescription('');
      setDiagnosis('');
      setTreatment('');
      setMedications('');
      setFollowUpDate('');
      setUploadedFiles([]);
      setShowUploadModal(false);
      setSelectedPatient(null);
      
      // Reload records
      await loadRecords();
      
      alert('Medical record uploaded successfully!');
    } catch (error) {
      console.error('Error uploading record:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to upload record';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="w-4 h-4" />;
      case 'lab_result':
        return <Activity className="w-4 h-4" />;
      case 'imaging':
        return <FileImage className="w-4 h-4" />;
      case 'prescription':
        return <Heart className="w-4 h-4" />;
      case 'surgery':
        return <FileText className="w-4 h-4" />;
      case 'emergency':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'lab_result':
        return 'bg-green-100 text-green-800';
      case 'imaging':
        return 'bg-purple-100 text-purple-800';
      case 'prescription':
        return 'bg-orange-100 text-orange-800';
      case 'surgery':
        return 'bg-red-100 text-red-800';
      case 'emergency':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRecords = records.length;
  const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]).length;
  const pendingRecords = records.filter(r => r.status === 'pending').length;

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <div className="space-y-6">
          <PageHeader
            title="Medical Records"
            description="Upload and manage patient medical records"
          />
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-2">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="space-y-6">
        <PageHeader
          title="Medical Records"
          description="Upload and manage patient medical records"
        >
          <Button variant="primary" onClick={() => setActiveTab('upload')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload New Record
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Records"
            value={totalRecords.toString()}
            change={{ value: "All time uploads", trend: "neutral" }}
            icon={<FileText className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Today's Records"
            value={todayRecords.toString()}
            change={{ value: "Uploaded today", trend: "up" }}
            icon={<Clock className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Pending Review"
            value={pendingRecords.toString()}
            change={{ value: "Awaiting review", trend: "neutral" }}
            icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="My Patients"
            value={patients.length.toString()}
            change={{ value: "Under your care", trend: "neutral" }}
            icon={<User className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Record
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
              Recent Records ({records.length})
            </button>
          </nav>
        </div>

        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Patient Search */}
            <Card title="Select Patient">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search patients by name or medical number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading patients...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => handlePatientSelect(patient)}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        patient.walletAddress 
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                          : 'border-orange-200 bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          patient.walletAddress ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            patient.walletAddress ? 'text-blue-600' : 'text-orange-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                          <p className="text-sm text-gray-500">{patient.medicalNumber}</p>
                          <p className="text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                          {!patient.walletAddress && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ No wallet linked - cannot upload records</p>
                          )}
                          <div className="mt-2">
                            <p className="text-xs text-gray-400">Last visit: {patient.lastVisit}</p>
                            {patient.allergies.length > 0 && (
                              <p className="text-xs text-red-600">Allergies: {patient.allergies.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredPatients.length === 0 && !loading && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-500">No patients match your search criteria.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card title="Recent Medical Records">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading records...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getRecordTypeColor(record.recordType)}`}>
                            {getRecordTypeIcon(record.recordType)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{record.title}</h3>
                            <p className="text-sm text-gray-600">{record.patientName}</p>
                            <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'stored' ? 'bg-green-100 text-green-800' : 
                          record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                        {record.diagnosis && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-900">Diagnosis: </span>
                            <span className="text-sm text-gray-600">{record.diagnosis}</span>
                          </div>
                        )}
                      </div>

                      {record.medications && record.medications.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-900">Medications: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.medications.map((med, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.files && record.files.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-900">Files: </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {record.files.map((file, idx) => (
                              <div key={idx} className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded text-xs">
                                <FileText className="w-3 h-3 text-gray-400" />
                                <span>{file.name} ({file.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.followUpDate && (
                        <div className="text-sm text-blue-600">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Follow-up scheduled: {new Date(record.followUpDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {records.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                  <p className="text-gray-500">You haven't uploaded any medical records yet.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Medical Record</h3>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Patient: {selectedPatient.name}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.medicalNumber}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Record Type
                      </label>
                      <select
                        value={recordType}
                        onChange={(e) => setRecordType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="lab_result">Lab Result</option>
                        <option value="imaging">Imaging</option>
                        <option value="prescription">Prescription</option>
                        <option value="surgery">Surgery</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Record Title
                    </label>
                    <input
                      type="text"
                      value={recordTitle}
                      onChange={(e) => setRecordTitle(e.target.value)}
                      placeholder="Enter record title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe the patient's condition and reason for visit..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosis
                    </label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={2}
                      placeholder="Enter diagnosis..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Treatment
                    </label>
                    <textarea
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      rows={2}
                      placeholder="Enter treatment plan..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medications
                    </label>
                    <textarea
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      rows={3}
                      placeholder="Enter medications, one per line..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Files
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom"
                    />

                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{file.name}</span>
                              <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <button 
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSubmitRecord}
                    disabled={!recordTitle.trim() || !description.trim() || uploadedFiles.length === 0 || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Record
                      </>
                    )}
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