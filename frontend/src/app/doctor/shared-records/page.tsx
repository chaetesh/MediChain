"use client";

import { useState, useEffect } from 'react';
import { DoctorsApiService } from '@/lib/services/doctors.service';
import { MedicalRecordsService } from '@/lib/services/medical-records.service';
import { Shield, FileCheck, Calendar, Clock, Search, User, FileText, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types/auth.types';

interface SharedRecord {
  _id: string;
  title: string;
  recordType: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  sharedDate: string;
  expiryDate: string;
  status: 'active' | 'expired';
  accessCount: number;
  lastAccessed: string | null;
}

interface RecordDetails {
  _id: string;
  title: string;
  recordType: string;
  description: string;
  ipfsHash: string;
  contentHash: string;
  blockchainTxHash: string;
  originalFilename: string;
  mimeType: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recordDate: string;
  sharedDate: string;
  expiryDate: string;
  status: 'active' | 'expired';
  accessCount: number;
  lastAccessed: string | null;
}

const SharedRecordsPage = () => {
  const [records, setRecords] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [recordDetails, setRecordDetails] = useState<RecordDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const recordsPerPage = 9;

  const [currentSharedRecords, setCurrentSharedRecords] = useState<any[]>([]);
  const [loadingCurrent, setLoadingCurrent] = useState<boolean>(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedRecords();
    fetchCurrentSharedRecords();
  }, [currentPage, activeFilter]);

  // Fetch all shared records
  const fetchSharedRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await DoctorsApiService.getSharedRecords({
        page: currentPage,
        limit: recordsPerPage,
        status: activeFilter as 'active' | 'expired' | undefined
      });
      
      setRecords(response.records);
      setTotalPages(Math.ceil(response.total / recordsPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching shared records:', err);
      setError('Failed to fetch shared records. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch blockchain verified currently shared records
  const fetchCurrentSharedRecords = async () => {
    try {
      setLoadingCurrent(true);
      setCurrentError(null);
      
      // Use the new API endpoint
      const response = await MedicalRecordsService.getCurrentSharedRecords();
      setCurrentSharedRecords(response.records);
      setLoadingCurrent(false);
    } catch (err) {
      console.error('Error fetching currently shared records:', err);
      setCurrentError('Failed to fetch blockchain-verified shared records.');
      setLoadingCurrent(false);
    }
  };

  const handleViewDetails = async (recordId: string) => {
    try {
      setLoadingDetails(true);
      setSelectedRecord(recordId);
      setShowModal(true);
      
      const details = await DoctorsApiService.getSharedRecordDetails(recordId);
      setRecordDetails(details);
      setLoadingDetails(false);
    } catch (err) {
      console.error('Error fetching record details:', err);
      setRecordDetails(null);
      setLoadingDetails(false);
    }
  };

  const handleSearch = () => {
    // In a real app, we'd call the API with search term
    // For now, we'll just filter the existing records
    setCurrentPage(1);
  };

  const filteredRecords = records.filter(record => 
    record.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const getPatientName = (patient: { firstName: string; lastName: string }) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  // Pagination UI
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex">
          <button 
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 border border-gray-300 ${
                currentPage === page 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button 
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  // Record detail modal
  const renderRecordDetailModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Medical Record Details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {loadingDetails ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : !recordDetails ? (
              <div className="text-center text-red-600 py-10">
                Failed to load record details. Please try again.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Record Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Title</p>
                        <p className="font-medium">{recordDetails.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Record Type</p>
                        <p>{recordDetails.recordType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p>{recordDetails.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Record Date</p>
                        <p>{format(new Date(recordDetails.recordDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Sharing Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Patient</p>
                        <p className="font-medium">{getPatientName(recordDetails.patient)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shared On</p>
                        <p>{format(new Date(recordDetails.sharedDate), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expires On</p>
                        <p>{format(new Date(recordDetails.expiryDate), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recordDetails.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {recordDetails.status === 'active' ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Access Count</p>
                        <p>{recordDetails.accessCount}</p>
                      </div>
                      {recordDetails.lastAccessed && (
                        <div>
                          <p className="text-sm text-gray-500">Last Accessed</p>
                          <p>{format(new Date(recordDetails.lastAccessed), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Blockchain Verification</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Hash</p>
                        <p className="font-mono text-xs break-all">{recordDetails.blockchainTxHash}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IPFS Hash</p>
                        <p className="font-mono text-xs break-all">{recordDetails.ipfsHash}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Content Hash</p>
                        <p className="font-mono text-xs break-all">{recordDetails.contentHash}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Original Filename</p>
                        <p>{recordDetails.originalFilename}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                  {recordDetails.ipfsHash && (
                    <a 
                      href={`https://gateway.ipfs.io/ipfs/${recordDetails.ipfsHash}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      <Button variant="outline">
                        View Document
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Shared Medical Records" 
          description="View medical records that have been shared with you"
        >
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
          </div>
        </PageHeader>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-2">
            <Button 
              variant={activeFilter === null ? 'primary' : 'outline'} 
              onClick={() => handleFilterChange(null)}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === 'active' ? 'primary' : 'outline'} 
              onClick={() => handleFilterChange('active')}
            >
              Active
            </Button>
            <Button 
              variant={activeFilter === 'expired' ? 'primary' : 'outline'} 
              onClick={() => handleFilterChange('expired')}
            >
              Expired
            </Button>
          </div>
          
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Search className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Blockchain Verified Currently Shared Records Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Blockchain Verified Currently Shared Records
        </h2>
        
        {loadingCurrent ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : currentError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
            {currentError}
          </div>
        ) : currentSharedRecords.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 bg-gray-50 rounded-lg">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No blockchain-verified active shared records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSharedRecords.map((record) => (
              <div 
                key={record._id} 
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all border border-blue-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {record.title}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileCheck className="h-4 w-4 mr-2" />
                      <span>{record.recordType}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>From: {record.patientId?.firstName} {record.patientId?.lastName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Date: {format(new Date(record.recordDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={() => handleViewDetails(record._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Shared Records</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No shared records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <div 
              key={record._id} 
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {record.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'active' ? 'Active' : 'Expired'}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileCheck className="h-4 w-4 mr-2" />
                    <span>{record.recordType}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>From: {getPatientName(record.patient)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Shared: {format(new Date(record.sharedDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Expires: {format(new Date(record.expiryDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => handleViewDetails(record._id)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {renderPagination()}
      {renderRecordDetailModal()}
      </div>
    </ProtectedRoute>
  );
};

export default SharedRecordsPage;