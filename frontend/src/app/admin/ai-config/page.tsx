'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Settings, 
  Brain, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  FileText,
  Shield,
  Database
} from 'lucide-react';

interface AIConfig {
  summaryGeneration: boolean;
  autoAnalysis: boolean;
  medicalImageAnalysis: boolean;
  prescriptionParsing: boolean;
  anomalyDetection: boolean;
  confidenceThreshold: number;
  maxProcessingTime: number;
  enabledHospitals: string[];
  apiEndpoint: string;
  modelVersion: string;
}

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>({
    summaryGeneration: true,
    autoAnalysis: true,
    medicalImageAnalysis: false,
    prescriptionParsing: true,
    anomalyDetection: true,
    confidenceThreshold: 85,
    maxProcessingTime: 30,
    enabledHospitals: ['city_general', 'st_mary', 'metro_emergency'],
    apiEndpoint: 'https://api.medichain.ai/v1',
    modelVersion: 'v2.1.3'
  });

  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const hospitals = [
    { id: 'city_general', name: 'City General Hospital' },
    { id: 'st_mary', name: 'St. Mary Medical Center' },
    { id: 'metro_emergency', name: 'Metro Emergency Hospital' },
    { id: 'university_medical', name: 'University Medical Center' },
    { id: 'children_hospital', name: "Children's Hospital" }
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => setSaving(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    // Simulate API test
    setTimeout(() => setTestingConnection(false), 3000);
  };

  const updateConfig = (key: keyof AIConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleHospital = (hospitalId: string) => {
    const isEnabled = config.enabledHospitals.includes(hospitalId);
    if (isEnabled) {
      updateConfig('enabledHospitals', config.enabledHospitals.filter(id => id !== hospitalId));
    } else {
      updateConfig('enabledHospitals', [...config.enabledHospitals, hospitalId]);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="AI Configuration"
          description="Configure AI processing settings and model parameters"
        >
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              <Zap className={`w-4 h-4 mr-2 ${testingConnection ? 'animate-pulse' : ''}`} />
              Test Connection
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={saving}
            >
              <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Save Configuration
            </Button>
          </div>
        </PageHeader>

        {/* AI Service Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="AI Requests Today"
            value="1,247"
            change={{ value: "+23% vs yesterday", trend: "up" }}
            icon={<Brain className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Average Response Time"
            value="1.2s"
            change={{ value: "Optimal performance", trend: "up" }}
            icon={<Clock className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Success Rate"
            value="99.7%"
            change={{ value: "High reliability", trend: "up" }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Active Hospitals"
            value={config.enabledHospitals.length.toString()}
            change={{ value: "AI enabled", trend: "neutral" }}
            icon={<Shield className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Main Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Features */}
          <Card title="AI Features">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Medical Summary Generation</h4>
                  <p className="text-sm text-gray-500">Generate AI-powered summaries of medical records</p>
                </div>
                <button
                  onClick={() => updateConfig('summaryGeneration', !config.summaryGeneration)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.summaryGeneration ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.summaryGeneration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Auto Analysis</h4>
                  <p className="text-sm text-gray-500">Automatically analyze uploaded medical documents</p>
                </div>
                <button
                  onClick={() => updateConfig('autoAnalysis', !config.autoAnalysis)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoAnalysis ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoAnalysis ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Medical Image Analysis</h4>
                  <p className="text-sm text-gray-500">AI analysis of X-rays, MRIs, and CT scans</p>
                </div>
                <button
                  onClick={() => updateConfig('medicalImageAnalysis', !config.medicalImageAnalysis)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.medicalImageAnalysis ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.medicalImageAnalysis ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Prescription Parsing</h4>
                  <p className="text-sm text-gray-500">Extract and interpret prescription information</p>
                </div>
                <button
                  onClick={() => updateConfig('prescriptionParsing', !config.prescriptionParsing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.prescriptionParsing ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.prescriptionParsing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Anomaly Detection</h4>
                  <p className="text-sm text-gray-500">Detect unusual patterns in medical data</p>
                </div>
                <button
                  onClick={() => updateConfig('anomalyDetection', !config.anomalyDetection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.anomalyDetection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.anomalyDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Performance Settings */}
          <Card title="Performance Settings">
            <div className="space-y-6">
              <div>
                <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold ({config.confidenceThreshold}%)
                </label>
                <input
                  type="range"
                  id="confidence"
                  min="50"
                  max="100"
                  value={config.confidenceThreshold}
                  onChange={(e) => updateConfig('confidenceThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Less Strict</span>
                  <span>More Strict</span>
                </div>
              </div>

              <div>
                <label htmlFor="processing-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Processing Time
                </label>
                <select
                  id="processing-time"
                  value={config.maxProcessingTime}
                  onChange={(e) => updateConfig('maxProcessingTime', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>

              <div>
                <label htmlFor="model-version" className="block text-sm font-medium text-gray-700 mb-2">
                  Model Version
                </label>
                <select
                  id="model-version"
                  value={config.modelVersion}
                  onChange={(e) => updateConfig('modelVersion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="v2.1.3">v2.1.3 (Current)</option>
                  <option value="v2.1.2">v2.1.2 (Stable)</option>
                  <option value="v2.2.0-beta">v2.2.0-beta (Preview)</option>
                </select>
              </div>

              <div>
                <label htmlFor="api-endpoint" className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  id="api-endpoint"
                  value={config.apiEndpoint}
                  onChange={(e) => updateConfig('apiEndpoint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.medichain.ai/v1"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Hospital Configuration */}
        <Card title="Hospital AI Access">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure which hospitals have access to AI features. Changes will take effect immediately.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitals.map((hospital) => (
                <div 
                  key={hospital.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    config.enabledHospitals.includes(hospital.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleHospital(hospital.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                      <p className="text-sm text-gray-500">
                        {config.enabledHospitals.includes(hospital.id) ? 'AI Enabled' : 'AI Disabled'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      config.enabledHospitals.includes(hospital.id) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          </Card>

        {/* System Status */}
        <Card title="AI Service Status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">Service Health</h4>
              <p className="text-sm text-green-600">Operational</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Model Status</h4>
              <p className="text-sm text-blue-600">Active</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">Queue Status</h4>
              <p className="text-sm text-purple-600">3 pending</p>
            </div>
          </div>
        </Card>

        {/* Warnings */}
        {!config.summaryGeneration && !config.autoAnalysis && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">AI Features Disabled</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Most AI features are currently disabled. This may impact the user experience.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
