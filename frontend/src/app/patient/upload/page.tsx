'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  MedicalRecordsService, 
  CreateMedicalRecordDto,
  ApiError 
} from '@/lib/services/medical-records.service';
import { FileText, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function PatientUploadPage() {
  const { user, loadUserProfile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState<CreateMedicalRecordDto['recordType']>('lab_result');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load user profile if needed when user is authenticated but missing wallet address
  useEffect(() => {
    if (user && !user.walletAddress) {
      // Try to load the user profile to get wallet address
      loadUserProfile();
    }
  }, [user?.id]); // Only depend on user ID to avoid infinite loops

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(''); // Clear any previous errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('User authentication required');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);

    try {
      const recordData: CreateMedicalRecordDto = {
        title: title.trim(),
        description: description.trim(),
        recordType,
        patientAddress: user.walletAddress || 'no-wallet-connected',
        metadata: {
          uploadedBy: 'patient',
          uploadSource: 'patient-portal',
          hasWallet: !!user.walletAddress,
          uploadTimestamp: new Date().toISOString()
        }
      };

      console.log('Record data being sent:', recordData); // Debug log

      await MedicalRecordsService.createRecord(recordData, file);
      
      // Success - reset form
      setTitle('');
      setDescription('');
      setRecordType('lab_result');
      setFile(null);
      setSuccess(true);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to upload record. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Medical Record</h1>
          <p className="text-gray-600">Add new health records securely to your account.</p>
        </div>

        {!user?.walletAddress && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Wallet Not Connected</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  For blockchain verification, please connect your wallet. You can still upload records, but they won't be stored on the blockchain.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card title="Upload Record">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Blood Test Results"
              />
            </div>
            
            <div>
              <label htmlFor="recordType" className="block text-sm font-medium text-gray-700">Record Type</label>
              <select
                id="recordType"
                name="recordType"
                required
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as CreateMedicalRecordDto['recordType'])}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lab_result">Lab Result</option>
                <option value="prescription">Prescription</option>
                <option value="diagnosis">Diagnosis</option>
                <option value="imaging">Imaging</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="vaccination">Vaccination</option>
                <option value="operation_report">Operation Report</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe the record"
              />
            </div>
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">File</label>
              <input
                id="file"
                name="file"
                type="file"
                required
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom"
              />
              {file && (
                <div className="mt-2 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PDF, JPG, PNG, DOC, DOCX, DICOM (Max: 10MB)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <span className="text-sm text-green-600 font-medium">Record uploaded successfully!</span>
                  <p className="text-xs text-green-600 mt-1">
                    Your record is being processed and will be stored securely on IPFS and the blockchain.
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isUploading || !file}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading to IPFS...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 mr-2" />
                    Upload Record
                  </span>
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}