'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Shield, 
  Eye, 
  Clock, 
  User, 
  Search, 
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Building,
  FileText,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Globe,
  Wifi
} from 'lucide-react';

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'doctor' | 'patient' | 'hospital_admin' | 'nurse' | 'staff';
  action: 'login' | 'logout' | 'view_record' | 'upload_record' | 'edit_record' | 'delete_record' | 'share_record' | 'export_data' | 'failed_login';
  resource?: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  device: 'desktop' | 'mobile' | 'tablet';
  location: string;
  status: 'success' | 'failed' | 'blocked' | 'suspicious';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  department?: string;
  patientId?: string;
  recordId?: string;
  duration?: number; // for session duration
}

export default function HospitalAccessLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Mock data
  const accessLogs: AccessLog[] = [
    {
      id: 'LOG001',
      userId: 'D001',
      userName: 'Dr. Sarah Wilson',
      userRole: 'doctor',
      action: 'view_record',
      resource: 'Patient Medical Record #MED-2023-001',
      timestamp: '2024-07-24T09:15:32Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      device: 'desktop',
      location: 'New York, NY',
      status: 'success',
      riskLevel: 'low',
      sessionId: 'SES001',
      department: 'Cardiology',
      patientId: 'P001',
      recordId: 'REC001',
      duration: 15
    },
    {
      id: 'LOG002',
      userId: 'P001',
      userName: 'Sarah Johnson',
      userRole: 'patient',
      action: 'login',
      timestamp: '2024-07-24T08:30:15Z',
      ipAddress: '198.51.100.42',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      device: 'mobile',
      location: 'Brooklyn, NY',
      status: 'success',
      riskLevel: 'low',
      sessionId: 'SES002',
      duration: 45
    },
    {
      id: 'LOG003',
      userId: 'HA001',
      userName: 'Michael Thompson',
      userRole: 'hospital_admin',
      action: 'export_data',
      resource: 'Patient Analytics Report',
      timestamp: '2024-07-24T10:45:22Z',
      ipAddress: '10.0.0.25',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      device: 'desktop',
      location: 'Manhattan, NY',
      status: 'success',
      riskLevel: 'medium',
      sessionId: 'SES003',
      department: 'Administration',
      duration: 120
    },
    {
      id: 'LOG004',
      userId: 'UNKNOWN',
      userName: 'Unknown User',
      userRole: 'doctor',
      action: 'failed_login',
      timestamp: '2024-07-24T11:22:18Z',
      ipAddress: '203.0.113.15',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      device: 'desktop',
      location: 'Unknown Location',
      status: 'failed',
      riskLevel: 'high',
      sessionId: 'SES004'
    },
    {
      id: 'LOG005',
      userId: 'D002',
      userName: 'Dr. Michael Chen',
      userRole: 'doctor',
      action: 'upload_record',
      resource: 'Neurological Assessment Report',
      timestamp: '2024-07-24T14:30:45Z',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      device: 'desktop',
      location: 'Queens, NY',
      status: 'success',
      riskLevel: 'low',
      sessionId: 'SES005',
      department: 'Neurology',
      patientId: 'P002',
      duration: 25
    },
    {
      id: 'LOG006',
      userId: 'P003',
      userName: 'Emily Chen',
      userRole: 'patient',
      action: 'share_record',
      resource: 'Medical Record #MED-2023-003',
      timestamp: '2024-07-24T16:15:33Z',
      ipAddress: '172.16.0.100',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
      device: 'tablet',
      location: 'Bronx, NY',
      status: 'success',
      riskLevel: 'medium',
      sessionId: 'SES006',
      duration: 8
    },
    {
      id: 'LOG007',
      userId: 'SUSPICIOUS',
      userName: 'Blocked User',
      userRole: 'patient',
      action: 'view_record',
      resource: 'Multiple Patient Records',
      timestamp: '2024-07-24T18:45:12Z',
      ipAddress: '185.220.101.5',
      userAgent: 'Suspicious Bot Activity',
      device: 'desktop',
      location: 'Unknown Location',
      status: 'blocked',
      riskLevel: 'critical',
      sessionId: 'SES007'
    },
    {
      id: 'LOG008',
      userId: 'N001',
      userName: 'Jessica Martinez',
      userRole: 'nurse',
      action: 'edit_record',
      resource: 'Patient Vitals #VIT-2023-045',
      timestamp: '2024-07-24T12:20:55Z',
      ipAddress: '192.168.1.120',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      device: 'desktop',
      location: 'Staten Island, NY',
      status: 'success',
      riskLevel: 'low',
      sessionId: 'SES008',
      department: 'Emergency',
      patientId: 'P004',
      duration: 18
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-orange-100 text-orange-800';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'blocked': return <Shield className="w-4 h-4 text-orange-600" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'logout': return <UserX className="w-4 h-4 text-gray-600" />;
      case 'view_record': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'upload_record': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'edit_record': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'delete_record': return <FileText className="w-4 h-4 text-red-600" />;
      case 'share_record': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'export_data': return <Download className="w-4 h-4 text-indigo-600" />;
      case 'failed_login': return <Lock className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      (log.resource && log.resource.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || log.riskLevel === riskFilter;
    const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;
    
    return matchesSearch && matchesAction && matchesStatus && matchesRisk && matchesRole;
  });

  // Statistics
  const totalLogs = accessLogs.length;
  const todayLogs = accessLogs.filter(log => 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const failedAttempts = accessLogs.filter(log => log.status === 'failed').length;
  const blockedAttempts = accessLogs.filter(log => log.status === 'blocked').length;
  const suspiciousActivity = accessLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length;
  const uniqueUsers = new Set(accessLogs.map(log => log.userId)).size;

  const handleLogSelect = (log: AccessLog) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Access Logs"
          description="Monitor and audit all system access and user activities"
        >
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </PageHeader>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Access Events"
            value={totalLogs.toString()}
            change={{ value: `${todayLogs} today`, trend: "neutral" }}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Failed Attempts"
            value={failedAttempts.toString()}
            change={{ value: `${Math.round((failedAttempts / totalLogs) * 100)}% of total`, trend: "down" }}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
          />
          <StatCard
            title="Blocked Access"
            value={blockedAttempts.toString()}
            change={{ value: "Security blocks", trend: "down" }}
            icon={<Shield className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="Suspicious Activity"
            value={suspiciousActivity.toString()}
            change={{ value: "High risk events", trend: "down" }}
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Unique Users"
            value={uniqueUsers.toString()}
            change={{ value: "Active users", trend: "neutral" }}
            icon={<User className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="Record Views"
            value={accessLogs.filter(l => l.action === 'view_record').length.toString()}
            change={{ value: "Patient records accessed", trend: "neutral" }}
            icon={<Eye className="w-6 h-6 text-indigo-600" />}
          />
          <StatCard
            title="Data Exports"
            value={accessLogs.filter(l => l.action === 'export_data').length.toString()}
            change={{ value: "Data export events", trend: "neutral" }}
            icon={<Download className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Record Uploads"
            value={accessLogs.filter(l => l.action === 'upload_record').length.toString()}
            change={{ value: "New records added", trend: "up" }}
            icon={<FileText className="w-6 h-6 text-teal-600" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view_record">View Record</option>
              <option value="upload_record">Upload Record</option>
              <option value="edit_record">Edit Record</option>
              <option value="share_record">Share Record</option>
              <option value="export_data">Export Data</option>
              <option value="failed_login">Failed Login</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
              <option value="suspicious">Suspicious</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="patient">Patients</option>
              <option value="hospital_admin">Hospital Admin</option>
              <option value="nurse">Nurses</option>
              <option value="staff">Staff</option>
            </select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced
            </Button>
          </div>
        </Card>

        {/* Access Logs */}
        <Card title={`Access Logs (${filteredLogs.length} entries)`}>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleLogSelect(log)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{log.userName}</h3>
                        <span className="text-sm text-gray-500 capitalize">({log.userRole.replace('_', ' ')})</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(log.riskLevel)}`}>
                          {log.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 capitalize">
                        {log.action.replace('_', ' ')}: {log.resource || 'System access'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{log.location}</span>
                        </div>
                        <div className="flex items-center">
                          {getDeviceIcon(log.device)}
                          <span className="ml-1 capitalize">{log.device}</span>
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                      <span className="ml-1 capitalize">{log.status}</span>
                    </span>
                  </div>
                </div>

                {log.department && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Department: </span>
                    <span className="text-xs font-medium text-gray-700">{log.department}</span>
                  </div>
                )}

                {log.duration && (
                  <div className="text-xs text-gray-500">
                    Session duration: {log.duration} minutes
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No access logs found</h3>
              <p className="text-gray-500">No logs match your current search criteria.</p>
            </div>
          )}
        </Card>

        {/* Log Details Modal */}
        {showLogModal && selectedLog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Access Log Details</h3>
                  <button 
                    onClick={() => setShowLogModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* User Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{selectedLog.userName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-2 font-medium capitalize">{selectedLog.userRole.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">User ID:</span>
                        <span className="ml-2 font-medium">{selectedLog.userId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 font-medium">{selectedLog.department || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Action Details</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Action:</span>
                        <span className="ml-2 font-medium capitalize">{selectedLog.action.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Resource:</span>
                        <span className="ml-2 font-medium">{selectedLog.resource || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <span className="ml-2 font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                      </div>
                      {selectedLog.duration && (
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium">{selectedLog.duration} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Technical Details</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">IP Address:</span>
                        <span className="ml-2 font-medium">{selectedLog.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Device:</span>
                        <span className="ml-2 font-medium capitalize">{selectedLog.device}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 font-medium">{selectedLog.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Session ID:</span>
                        <span className="ml-2 font-medium">{selectedLog.sessionId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">User Agent:</span>
                        <span className="ml-2 font-medium text-xs break-all">{selectedLog.userAgent}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Assessment */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Security Assessment</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                          {getStatusIcon(selectedLog.status)}
                          <span className="ml-1 capitalize">{selectedLog.status}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Risk Level:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(selectedLog.riskLevel)}`}>
                          {selectedLog.riskLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient/Record Information */}
                  {(selectedLog.patientId || selectedLog.recordId) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Related Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedLog.patientId && (
                          <div>
                            <span className="text-gray-500">Patient ID:</span>
                            <span className="ml-2 font-medium">{selectedLog.patientId}</span>
                          </div>
                        )}
                        {selectedLog.recordId && (
                          <div>
                            <span className="text-gray-500">Record ID:</span>
                            <span className="ml-2 font-medium">{selectedLog.recordId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowLogModal(false)} className="flex-1">
                    Close
                  </Button>
                  <Button variant="primary" className="flex-1">
                    Flag for Review
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
