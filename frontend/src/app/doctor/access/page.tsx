'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Search, 
  QrCode, 
  Key, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  FileText,
  Shield,
  Scan,
  Smartphone
} from 'lucide-react';

interface AccessRequest {
  id: string;
  patientName: string;
  patientId: string;
  requestType: 'qr_scan' | 'otp_request' | 'emergency_access';
  status: 'pending' | 'granted' | 'denied' | 'expired';
  requestedAt: string;
  expiresAt?: string;
  purpose: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

export default function DoctorAccessPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [qrScanActive, setQrScanActive] = useState(false);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([
    {
      id: '1',
      patientName: 'Sarah Johnson',
      patientId: 'P001234',
      requestType: 'otp_request',
      status: 'granted',
      requestedAt: '2024-07-20T10:30:00Z',
      expiresAt: '2024-07-20T11:30:00Z',
      purpose: 'Regular consultation',
      urgency: 'routine'
    },
    {
      id: '2',
      patientName: 'Michael Chen',
      patientId: 'P001235',
      requestType: 'qr_scan',
      status: 'pending',
      requestedAt: '2024-07-20T10:15:00Z',
      purpose: 'Follow-up examination',
      urgency: 'routine'
    }
  ]);

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle OTP verification
    console.log('OTP submitted:', otpCode);
    setOtpCode('');
  };

  const handleQrScan = () => {
    setQrScanActive(!qrScanActive);
    // In a real app, this would activate the camera for QR scanning
  };

  const handleEmergencyAccess = () => {
    // Handle emergency access request
    console.log('Emergency access requested');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'denied':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'routine':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = accessRequests.filter(request =>
    request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="space-y-6">
        <PageHeader
          title="Patient Access"
          description="Request and manage access to patient medical records"
        />

        {/* Access Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Scanner */}
          <Card title="QR Code Access">
            <div className="text-center space-y-4">
              <div className="mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {qrScanActive ? (
                  <div className="text-blue-600">
                    <Scan className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Scanning...</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <QrCode className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Scan Patient QR</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Scan the patient's QR code to instantly access their medical records
              </p>
              <Button 
                variant={qrScanActive ? "danger" : "primary"} 
                onClick={handleQrScan}
                className="w-full"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {qrScanActive ? 'Stop Scanning' : 'Start QR Scanner'}
              </Button>
            </div>
          </Card>

          {/* OTP Access */}
          <Card title="OTP Access">
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Patient's OTP Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-mono"
                />
              </div>
              <p className="text-sm text-gray-600">
                Ask the patient to share their temporary OTP code for record access
              </p>
              <Button type="submit" variant="primary" className="w-full" disabled={otpCode.length !== 6}>
                <Key className="w-4 h-4 mr-2" />
                Verify OTP
              </Button>
            </form>
          </Card>
        </div>

        {/* Patient Search */}
        <Card title="Search Patient Records">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-sm text-gray-600">
              Search for patients to request access to their records. Access requests require patient approval.
            </p>
          </div>
        </Card>

        {/* Emergency Access */}
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800">Emergency Access</h3>
              <p className="text-sm text-red-700 mt-1">
                In case of medical emergencies, you can request immediate access to patient records. 
                This action will be logged and reviewed by administrators.
              </p>
              <Button 
                variant="danger" 
                onClick={handleEmergencyAccess}
                className="mt-3"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Emergency Access
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Access Requests */}
        <Card title="Recent Access Requests">
          <div className="space-y-4">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{request.patientName}</h4>
                        <p className="text-sm text-gray-500">ID: {request.patientId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Method:</span> {request.requestType.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Purpose:</span> {request.purpose}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Urgency:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Requested: {new Date(request.requestedAt).toLocaleString()}</span>
                    {request.expiresAt && (
                      <span>Expires: {new Date(request.expiresAt).toLocaleString()}</span>
                    )}
                  </div>

                  {request.status === 'granted' && (
                    <div className="mt-3">
                      <Button size="sm" variant="primary">
                        <FileText className="w-4 h-4 mr-1" />
                        View Records
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No access requests</h3>
                <p className="text-gray-500">Your recent access requests will appear here.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Access Instructions */}
        <Card title="How to Access Patient Records">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">QR Code</h4>
              <p className="text-sm text-gray-600">
                Ask patient to show their QR code and scan it with the scanner above
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">OTP Code</h4>
              <p className="text-sm text-gray-600">
                Patient generates a temporary code in their app and shares it with you
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Emergency</h4>
              <p className="text-sm text-gray-600">
                For life-threatening situations, request emergency access (will be logged)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
