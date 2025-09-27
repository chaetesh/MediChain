'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { 
  WifiOff, 
  RefreshCw, 
  Download, 
  Upload, 
  HardDrive, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Users,
  Activity,
  RotateCcw,
  Database,
  Globe,
  Signal,
  Battery,
  Settings
} from 'lucide-react';

interface OfflineData {
  id: string;
  type: 'patient_record' | 'appointment' | 'prescription' | 'lab_result';
  title: string;
  description: string;
  timestamp: string;
  size: string;
  status: 'cached' | 'pending_sync' | 'synced' | 'failed';
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock offline data
  const mockOfflineData: OfflineData[] = [
    {
      id: 'off_001',
      type: 'patient_record',
      title: 'Patient Record - Sarah Johnson',
      description: 'Cardiology consultation notes and treatment plan',
      timestamp: '2024-07-22T10:30:00Z',
      size: '2.4 MB',
      status: 'pending_sync'
    },
    {
      id: 'off_002',
      type: 'appointment',
      title: 'Appointment Update - Dr. Michael Chen',
      description: 'Rescheduled appointment for July 25th',
      timestamp: '2024-07-22T09:15:00Z',
      size: '156 KB',
      status: 'cached'
    },
    {
      id: 'off_003',
      type: 'prescription',
      title: 'Prescription - Robert Martinez',
      description: 'New medication prescription for hypertension',
      timestamp: '2024-07-22T08:45:00Z',
      size: '89 KB',
      status: 'synced'
    },
    {
      id: 'off_004',
      type: 'lab_result',
      title: 'Lab Results - Emily Chen',
      description: 'Blood work results and analysis',
      timestamp: '2024-07-22T08:00:00Z',
      size: '1.2 MB',
      status: 'failed'
    },
    {
      id: 'off_005',
      type: 'patient_record',
      title: 'Patient Record - Michael Davis',
      description: 'Emergency department visit notes',
      timestamp: '2024-07-21T22:30:00Z',
      size: '3.1 MB',
      status: 'pending_sync'
    }
  ];

  useEffect(() => {
    setOfflineData(mockOfflineData);

    // Simulate network status checking
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800';
      case 'pending_sync': return 'bg-yellow-100 text-yellow-800';
      case 'cached': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending_sync': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cached': return <HardDrive className="w-4 h-4 text-blue-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'patient_record': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'appointment': return <Clock className="w-5 h-5 text-green-600" />;
      case 'prescription': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'lab_result': return <Activity className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const pendingItems = offlineData.filter(item => item.status === 'pending_sync');
  const cachedItems = offlineData.filter(item => item.status === 'cached');
  const failedItems = offlineData.filter(item => item.status === 'failed');
  const syncedItems = offlineData.filter(item => item.status === 'synced');

  const totalSize = offlineData.reduce((total, item) => {
    const size = parseFloat(item.size.replace(/[^\d.]/g, ''));
    const unit = item.size.includes('MB') ? 1024 : 1;
    return total + (size * unit);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isOnline ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isOnline ? (
                  <Globe className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isOnline ? 'Online Mode' : 'Offline Mode'}
                </h1>
                <p className="text-gray-600">
                  {isOnline 
                    ? 'Connected to MediChain.AI servers' 
                    : 'Working offline - Data will sync when connection is restored'
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {isOnline && pendingItems.length > 0 && (
                <Button 
                  variant="primary" 
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Sync All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Signal className={`w-5 h-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-xs text-gray-600">Connection Status</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {(totalSize / 1024).toFixed(1)} MB
                </p>
                <p className="text-xs text-gray-600">Cached Data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{pendingItems.length}</p>
                <p className="text-xs text-gray-600">Pending Sync</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Battery className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">85%</p>
                <p className="text-xs text-gray-600">Battery Level</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <Card title="Synchronization Progress">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Syncing offline data...</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Offline Data Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Sync Items */}
          <Card title={`Pending Sync (${pendingItems.length})`}>
            <div className="space-y-3">
              {pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">Pending</span>
                      </span>
                      <Button variant="outline" size="sm">
                        <Upload className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">All data is synchronized</p>
                </div>
              )}
            </div>
          </Card>

          {/* Cached Data */}
          <Card title={`Cached Data (${cachedItems.length})`}>
            <div className="space-y-3">
              {cachedItems.length > 0 ? (
                cachedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">Cached</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No cached data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Failed Sync Items */}
        {failedItems.length > 0 && (
          <Card title={`Failed Sync (${failedItems.length})`}>
            <div className="space-y-3">
              {failedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-sm text-red-600 mt-1">Sync failed - Check connection and try again</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">Failed</span>
                    </span>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Offline Settings */}
        <Card title="Offline Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cache Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-sync when online</span>
                  <button className="w-6 h-6 bg-green-500 rounded-full"></button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Cache patient records</span>
                  <button className="w-6 h-6 bg-green-500 rounded-full"></button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Cache medical images</span>
                  <button className="w-6 h-6 bg-gray-300 rounded-full"></button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Background sync</span>
                  <button className="w-6 h-6 bg-green-500 rounded-full"></button>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Storage Limits</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Maximum cache size:</span>
                  <span className="font-medium">500 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Current usage:</span>
                  <span className="font-medium">{(totalSize / 1024).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Available space:</span>
                  <span className="font-medium">{(500 - (totalSize / 1024)).toFixed(1)} MB</span>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Storage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Help & Tips */}
        <Card title="Offline Mode Tips">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Working Offline</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>View cached patient records and data</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Create new records and notes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Access recently downloaded files</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Continue documentation work</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">When Back Online</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <Upload className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Automatic sync of offline changes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Download className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Download latest updates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Refresh cached data</span>
                </li>
                <li className="flex items-start space-x-2">
                  <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Resolve any sync conflicts</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
