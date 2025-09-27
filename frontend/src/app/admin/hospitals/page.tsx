'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { SystemAdminApiService, AdminHospital } from '@/lib/services/system-admin.service';
import { 
  Building2, 
  Search, 
  MapPin, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Ban,
  Loader2
} from 'lucide-react';

interface Hospital extends AdminHospital {
  id: string;
}

export default function HospitalManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hospitals, setHospitals] = useState<AdminHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalHospitals, setTotalHospitals] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState<AdminHospital | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const limit = 10;

  // Fetch hospitals data
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SystemAdminApiService.getHospitals({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      
      setHospitals(response.hospitals);
      setTotalHospitals(response.total);
    } catch (err: any) {
      console.error('Error fetching hospitals:', err);
      setError(err.message || 'Failed to fetch hospitals');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospitals on component mount and when filters change
  useEffect(() => {
    fetchHospitals();
  }, [page, statusFilter]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1); // Reset to first page when searching
      fetchHospitals();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle approve hospital
  const handleApproveHospital = async (hospitalId: string) => {
    try {
      await SystemAdminApiService.updateHospitalStatus(hospitalId, 'approved', 'Hospital approved by system admin');
      fetchHospitals(); // Refresh the list
    } catch (err: any) {
      console.error('Error approving hospital:', err);
      setError(err.message || 'Failed to approve hospital');
    }
  };

  // Handle reject hospital
  const handleRejectHospital = async (hospitalId: string) => {
    try {
      await SystemAdminApiService.updateHospitalStatus(hospitalId, 'rejected', 'Hospital rejected by system admin');
      fetchHospitals(); // Refresh the list
    } catch (err: any) {
      console.error('Error rejecting hospital:', err);
      setError(err.message || 'Failed to reject hospital');
    }
  };

  // Handle view hospital details
  const handleViewDetails = async (hospital: AdminHospital) => {
    setSelectedHospital(hospital);
    setShowDetailsModal(true);
  };

  // Handle add hospital
  const handleAddHospital = () => {
    setShowAddModal(true);
  };

  // Calculate statistics
  const approvedHospitals = hospitals.filter(h => h.status === 'approved').length;
  const pendingHospitals = hospitals.filter(h => h.status === 'pending').length;
  const totalDoctors = hospitals.reduce((sum, h) => sum + h.totalDoctors, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHospitals = hospitals;

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Management"
          description="Manage hospital registrations and monitor hospital activity"
        >
          <Button variant="primary" onClick={handleAddHospital}>
            <Plus className="w-4 h-4 mr-2" />
            Add Hospital
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Hospitals"
            value={totalHospitals.toString()}
            change={{ value: `${hospitals.length} loaded`, trend: "neutral" }}
            icon={<Building2 className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Approved Hospitals"
            value={approvedHospitals.toString()}
            change={{ value: totalHospitals > 0 ? `${Math.round((approvedHospitals / totalHospitals) * 100)}% approved` : "0% approved", trend: "up" }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Pending Reviews"
            value={pendingHospitals.toString()}
            change={{ value: pendingHospitals > 0 ? "Requires action" : "All reviewed", trend: pendingHospitals > 0 ? "neutral" : "up" }}
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
          />
          <StatCard
            title="Total Doctors"
            value={totalDoctors.toString()}
            change={{ value: "Across all hospitals", trend: "neutral" }}
            icon={<Users className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Error Message */}
        {error && (
          <Card>
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchHospitals}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search hospitals..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>

            <Button variant="outline">
              Export Data
            </Button>
          </div>
        </Card>

        {/* Hospitals Grid */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading hospitals...</span>
            </div>
          </Card>
        ) : filteredHospitals.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters' 
                  : 'No hospitals have been registered yet'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital) => (
              <Card key={hospital._id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {hospital.city}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hospital.status)}`}>
                      {getStatusIcon(hospital.status)}
                      <span className="ml-1 capitalize">{hospital.status}</span>
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{hospital.address}</p>
                    <p>{hospital.email}</p>
                    <p>{hospital.phone}</p>
                    <p><span className="font-medium">Admin:</span> {hospital.adminName}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{hospital.totalDoctors}</div>
                      <div className="text-xs text-gray-500">Doctors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{hospital.totalPatients}</div>
                      <div className="text-xs text-gray-500">Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{hospital.monthlyRecords}</div>
                      <div className="text-xs text-gray-500">Records/Month</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Registered: {new Date(hospital.registeredAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 text-blue-600 hover:text-blue-800"
                        onClick={() => handleViewDetails(hospital)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      {hospital.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleApproveHospital(hospital._id)}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleRejectHospital(hospital._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pending Approvals - Show if there are pending hospitals */}
        {pendingHospitals > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                <p className="text-sm text-gray-600">
                  {pendingHospitals} hospital{pendingHospitals !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
              <Button variant="primary">
                Review Pending
              </Button>
            </div>
          </Card>
        )}

        {/* Hospital Details Modal */}
        {showDetailsModal && selectedHospital && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Hospital Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedHospital.status)}`}>
                      {selectedHospital.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHospital.address}, {selectedHospital.city}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHospital.adminName}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Doctors</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.totalDoctors}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Patients</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.totalPatients}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Records</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedHospital.monthlyRecords}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registered</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedHospital.registeredAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                {selectedHospital.status === 'pending' && (
                  <>
                    <Button 
                      variant="success"
                      onClick={() => {
                        handleApproveHospital(selectedHospital._id);
                        setShowDetailsModal(false);
                      }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => {
                        handleRejectHospital(selectedHospital._id);
                        setShowDetailsModal(false);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Hospital Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Hospital</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This functionality would typically include a comprehensive form for hospital registration. 
                  For now, you can redirect to a dedicated hospital registration page or implement the form inline.
                </p>
                <div className="flex space-x-3">
                  <Button variant="primary" onClick={() => setShowAddModal(false)}>
                    Go to Registration Form
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
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
