'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/Card';
import { 
  MedicalRecordsService, 
  MedicalRecord,
  ApiError 
} from '@/lib/services/medical-records.service';
import { 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Filter,
  Search,
  Calendar,
  User,
  Building2,
  Activity,
  Brain,
  AlertTriangle
} from 'lucide-react';

const recordTypeColors = {
  lab_result: 'bg-green-100 text-green-800',
  prescription: 'bg-purple-100 text-purple-800',
  diagnosis: 'bg-blue-100 text-blue-800',
  imaging: 'bg-orange-100 text-orange-800',
  discharge_summary: 'bg-gray-100 text-gray-800',
  vaccination: 'bg-teal-100 text-teal-800',
  operation_report: 'bg-red-100 text-red-800',
  other: 'bg-yellow-100 text-yellow-800'
};

function PatientRecordsContent() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const recordsData = await MedicalRecordsService.getAllRecords();
      console.log('Records data received:', recordsData);
      console.log('First record structure:', recordsData[0]);
      console.log('First record ID field:', recordsData[0]?.id);
      setRecords(recordsData);
    } catch (error) {
      console.error('Error loading records:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (recordId: string, patientAddress?: string) => {
    try {
      console.log('Attempting to download file with ID:', recordId, 'Type:', typeof recordId);
      if (!recordId || recordId === 'undefined') {
        console.error('Invalid record ID:', recordId);
        alert('Error: Invalid record ID');
        return;
      }
      
      const blob = await MedicalRecordsService.downloadRecordFile(recordId, patientAddress);
      const record = records.find(r => r.id === recordId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record?.fileName || 'medical-record';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to download file';
      alert(`Error: ${errorMessage}`);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || record.recordType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Health Records</h1>
        <p className="text-gray-600">View and manage your medical records securely stored on the blockchain.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="lab_result">Lab Results</option>
              <option value="prescription">Prescriptions</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="imaging">Imaging</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="vaccination">Vaccination</option>
              <option value="operation_report">Operation Report</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Records Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading your medical records...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${recordTypeColors[record.recordType as keyof typeof recordTypeColors]}`}>
                        {record.recordType.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{record.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(record.recordDate).toLocaleDateString()}</span>
                  </div>
                  {record.doctorName && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{record.doctorName}</span>
                    </div>
                  )}
                  {record.hospitalName && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>{record.hospitalName}</span>
                    </div>
                  )}
                </div>

                {record.metadata?.aiSummary && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">AI Summary</span>
                    </div>
                    <p className="text-sm text-blue-800">{record.metadata.aiSummary}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-1">
                    <Activity className={`w-4 h-4 ${record.isVerified ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-600">
                      {record.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedRecord(record)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadFile(record.id, record.patientId)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredRecords.length === 0 && !loading && (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'You don\'t have any medical records yet.'
            }
          </p>
        </Card>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedRecord.title}</h2>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedRecord.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Date</h3>
                    <p className="text-gray-600">{new Date(selectedRecord.recordDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${recordTypeColors[selectedRecord.recordType as keyof typeof recordTypeColors]}`}>
                      {selectedRecord.recordType.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedRecord.doctorName && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Doctor</h3>
                      <p className="text-gray-600">{selectedRecord.doctorName}</p>
                    </div>
                  )}
                  {selectedRecord.hospitalName && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Hospital</h3>
                      <p className="text-gray-600">{selectedRecord.hospitalName}</p>
                    </div>
                  )}
                </div>

                {selectedRecord.metadata?.aiSummary && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800">{selectedRecord.metadata.aiSummary}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">File</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedRecord.fileName}</p>
                          <p className="text-sm text-gray-600">{(selectedRecord.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadFile(selectedRecord.id, selectedRecord.patientId)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Blockchain</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Hash: {selectedRecord.contentHash}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: {selectedRecord.isVerified ? 'Verified on Polygon' : 'Pending verification'}
                    </p>
                    {selectedRecord.blockchainHash && (
                      <p className="text-sm text-gray-600 mt-1">
                        Blockchain Hash: {selectedRecord.blockchainHash}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4 border-t">
                  <button 
                    onClick={() => handleDownloadFile(selectedRecord.id, selectedRecord.patientId)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    Share Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientRecordsPage() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <PatientRecordsContent />
    </ProtectedRoute>
  );
}
