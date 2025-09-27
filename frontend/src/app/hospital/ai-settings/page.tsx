'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  Brain, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Sliders, 
  Database, 
  Shield, 
  Zap, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Monitor, 
  Cpu, 
  HardDrive, 
  Wifi, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  Upload, 
  Download, 
  Info, 
  Eye, 
  EyeOff, 
  Lightbulb, 
  Stethoscope, 
  FileText, 
  Users, 
  Heart, 
  Microscope,
  ScanLine,
  Target,
  BarChart3,
  Bot,
  MessageSquare,
  Sparkles,
  Plus
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  type: 'diagnostic' | 'predictive' | 'nlp' | 'imaging';
  version: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  accuracy: number;
  lastTrained: string;
  description: string;
  capabilities: string[];
  isEnabled: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  frequency: number;
  lastExecuted?: string;
  description: string;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
}

export default function HospitalAISettingsPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'automation' | 'insights' | 'performance' | 'security'>('models');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  // Mock data
  const aiModels: AIModel[] = [
    {
      id: 'model_001',
      name: 'Cardiology Diagnostic Assistant',
      type: 'diagnostic',
      version: '2.1.0',
      status: 'active',
      accuracy: 94.2,
      lastTrained: '2024-07-15',
      description: 'Advanced AI model for cardiac condition diagnosis and risk assessment',
      capabilities: ['ECG Analysis', 'Heart Sound Analysis', 'Risk Stratification', 'Treatment Recommendations'],
      isEnabled: true
    },
    {
      id: 'model_002',
      name: 'Radiology Image Analyzer',
      type: 'imaging',
      version: '3.0.1',
      status: 'active',
      accuracy: 96.8,
      lastTrained: '2024-07-10',
      description: 'Deep learning model for medical image analysis and anomaly detection',
      capabilities: ['X-Ray Analysis', 'CT Scan Interpretation', 'MRI Processing', 'Abnormality Detection'],
      isEnabled: true
    },
    {
      id: 'model_003',
      name: 'Patient Risk Predictor',
      type: 'predictive',
      version: '1.8.2',
      status: 'active',
      accuracy: 89.5,
      lastTrained: '2024-07-08',
      description: 'Predictive model for patient readmission and complication risk',
      capabilities: ['Readmission Prediction', 'Complication Risk', 'Length of Stay', 'Resource Planning'],
      isEnabled: true
    },
    {
      id: 'model_004',
      name: 'Clinical Documentation AI',
      type: 'nlp',
      version: '2.3.0',
      status: 'training',
      accuracy: 92.1,
      lastTrained: '2024-07-05',
      description: 'Natural language processing for automated clinical documentation',
      capabilities: ['Voice Transcription', 'Medical Coding', 'Documentation Analysis', 'Clinical Summarization'],
      isEnabled: false
    },
    {
      id: 'model_005',
      name: 'Drug Interaction Checker',
      type: 'diagnostic',
      version: '1.5.0',
      status: 'active',
      accuracy: 98.7,
      lastTrained: '2024-07-12',
      description: 'AI system for detecting drug interactions and adverse effects',
      capabilities: ['Drug Interaction Detection', 'Allergy Checking', 'Dosage Optimization', 'Side Effect Prediction'],
      isEnabled: true
    }
  ];

  const automationRules: AutomationRule[] = [
    {
      id: 'rule_001',
      name: 'Automatic Vital Signs Monitoring',
      trigger: 'Patient vitals received',
      action: 'Check against normal ranges and alert if abnormal',
      isActive: true,
      frequency: 1440, // every minute
      lastExecuted: '2024-07-22T14:30:00Z',
      description: 'Continuously monitor patient vital signs and generate alerts for abnormal readings'
    },
    {
      id: 'rule_002',
      name: 'Lab Result Analysis',
      trigger: 'New lab results available',
      action: 'Analyze results and flag critical values',
      isActive: true,
      frequency: 5,
      lastExecuted: '2024-07-22T14:25:00Z',
      description: 'Automatically analyze incoming lab results and highlight critical values for immediate attention'
    },
    {
      id: 'rule_003',
      name: 'Appointment Reminder System',
      trigger: '24 hours before appointment',
      action: 'Send automated reminder to patient',
      isActive: true,
      frequency: 1440,
      lastExecuted: '2024-07-22T10:00:00Z',
      description: 'Send automated appointment reminders to patients via SMS and email'
    },
    {
      id: 'rule_004',
      name: 'Prescription Refill Alerts',
      trigger: 'Medication running low',
      action: 'Notify patient and doctor for refill',
      isActive: false,
      frequency: 720,
      description: 'Monitor patient medication supply and send refill reminders when needed'
    },
    {
      id: 'rule_005',
      name: 'Bed Availability Optimization',
      trigger: 'Patient discharge initiated',
      action: 'Update bed status and notify housekeeping',
      isActive: true,
      frequency: 1,
      lastExecuted: '2024-07-22T13:45:00Z',
      description: 'Automatically manage bed availability and coordinate housekeeping for faster turnaround'
    }
  ];

  const aiInsights: AIInsight[] = [
    {
      id: 'insight_001',
      type: 'recommendation',
      title: 'Optimize Emergency Department Staffing',
      description: 'AI analysis suggests increasing nursing staff by 15% during evening shifts to reduce patient wait times.',
      confidence: 87,
      impact: 'high',
      timestamp: '2024-07-22T12:00:00Z',
      isRead: false
    },
    {
      id: 'insight_002',
      type: 'alert',
      title: 'Unusual Pattern in Cardiac Admissions',
      description: 'Detected 23% increase in cardiac emergency admissions over the past week. Consider reviewing protocols.',
      confidence: 92,
      impact: 'critical',
      timestamp: '2024-07-22T10:30:00Z',
      isRead: false
    },
    {
      id: 'insight_003',
      type: 'prediction',
      title: 'Seasonal Flu Outbreak Prediction',
      description: 'Based on current trends, expect 40% increase in flu cases over next 2 weeks. Prepare additional resources.',
      confidence: 78,
      impact: 'medium',
      timestamp: '2024-07-22T09:15:00Z',
      isRead: true
    },
    {
      id: 'insight_004',
      type: 'optimization',
      title: 'Medication Inventory Optimization',
      description: 'AI recommends adjusting medication stock levels to reduce waste by $15,000 monthly while maintaining availability.',
      confidence: 85,
      impact: 'medium',
      timestamp: '2024-07-21T16:20:00Z',
      isRead: true
    },
    {
      id: 'insight_005',
      type: 'recommendation',
      title: 'Equipment Maintenance Schedule',
      description: 'Predictive analysis suggests advancing maintenance for MRI Unit 2 by 3 weeks to prevent potential downtime.',
      confidence: 94,
      impact: 'high',
      timestamp: '2024-07-21T14:45:00Z',
      isRead: false
    }
  ];

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModelStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-600" />;
      case 'training': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnostic': return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'predictive': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'nlp': return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'imaging': return <ScanLine className="w-5 h-5 text-orange-600" />;
      default: return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'prediction': return <Target className="w-5 h-5 text-blue-600" />;
      case 'optimization': return <Sparkles className="w-5 h-5 text-green-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleModelStatus = (modelId: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling model ${modelId}`);
  };

  const toggleAutomationRule = (ruleId: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling automation rule ${ruleId}`);
  };

  // Statistics
  const activeModels = aiModels.filter(model => model.status === 'active').length;
  const trainingModels = aiModels.filter(model => model.status === 'training').length;
  const activeRules = automationRules.filter(rule => rule.isActive).length;
  const unreadInsights = aiInsights.filter(insight => !insight.isRead).length;
  const avgAccuracy = aiModels.reduce((sum, model) => sum + model.accuracy, 0) / aiModels.length;

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="AI Configuration & Settings"
          description="Manage AI models, automation rules, and intelligent insights for your hospital"
        >
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Config
            </Button>
            <Button variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </PageHeader>

        {/* AI Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Active AI Models"
            value={activeModels.toString()}
            change={{ value: `${trainingModels} training`, trend: "up" }}
            icon={<Brain className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Automation Rules"
            value={activeRules.toString()}
            change={{ value: `${automationRules.length - activeRules} inactive`, trend: "neutral" }}
            icon={<Zap className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="AI Insights"
            value={unreadInsights.toString()}
            change={{ value: "unread insights", trend: "up" }}
            icon={<Lightbulb className="w-6 h-6 text-yellow-600" />}
          />
          <StatCard
            title="Avg Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            change={{ value: "across all models", trend: "up" }}
            icon={<Target className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="System Status"
            value="Operational"
            change={{ value: "All systems running", trend: "up" }}
            icon={<Shield className="w-6 h-6 text-green-600" />}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('models')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'models'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              AI Models ({aiModels.length})
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'automation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Automation ({automationRules.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lightbulb className="w-4 h-4 inline mr-2" />
              AI Insights ({unreadInsights})
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Performance
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Security
            </button>
          </nav>
        </div>

        {activeTab === 'models' && (
          <div className="space-y-6">
            <Card title="AI Models Configuration">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Models Configuration</h3>
                <Button variant="primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Deploy New Model
                </Button>
              </div>
              <div className="space-y-4">
                {aiModels.map((model) => (
                  <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getModelTypeIcon(model.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{model.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getModelStatusColor(model.status)}`}>
                              {getModelStatusIcon(model.status)}
                              <span className="ml-1 capitalize">{model.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Version: {model.version}</span>
                            <span>Accuracy: {model.accuracy}%</span>
                            <span>Last Trained: {new Date(model.lastTrained).toLocaleDateString()}</span>
                            <span className="capitalize">Type: {model.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleModelStatus(model.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {model.isEnabled ? (
                            <ToggleRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelConfig(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Capabilities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {model.capabilities.map((capability, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <Card title="Automation Rules">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
                <Button variant="primary" onClick={() => setShowAutomationModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </div>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                          <div className="space-y-1 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Trigger:</span> {rule.trigger}
                            </div>
                            <div>
                              <span className="font-medium">Action:</span> {rule.action}
                            </div>
                            <div className="flex items-center space-x-4">
                              <span>Frequency: Every {rule.frequency} minutes</span>
                              {rule.lastExecuted && (
                                <span>Last executed: {new Date(rule.lastExecuted).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAutomationRule(rule.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {rule.isActive ? (
                            <ToggleRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <Card title="AI-Generated Insights & Recommendations">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI-Generated Insights & Recommendations</h3>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Insights
                </Button>
              </div>
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`border rounded-lg p-4 ${
                      insight.isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                          {getInsightTypeIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                              {insight.impact.toUpperCase()}
                            </span>
                            {!insight.isRead && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="capitalize">Type: {insight.type}</span>
                            <span>Confidence: {insight.confidence}%</span>
                            <span>Generated: {new Date(insight.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          {insight.isRead ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <Button variant="outline" size="sm">
                          Take Action
                        </Button>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>AI Confidence Level</span>
                        <span>{insight.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            insight.confidence >= 90 ? 'bg-green-500' :
                            insight.confidence >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Model Performance Metrics">
                <div className="space-y-4">
                  {aiModels.filter(model => model.status === 'active').map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getModelTypeIcon(model.type)}
                        <div>
                          <p className="font-medium text-gray-900">{model.name}</p>
                          <p className="text-sm text-gray-600">{model.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{model.accuracy}%</p>
                        <p className="text-sm text-gray-600">Accuracy</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="System Resource Usage">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }} />
                      </div>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '23%' }} />
                      </div>
                      <span className="text-sm font-medium">23%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium">Network</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '82%' }} />
                      </div>
                      <span className="text-sm font-medium">82%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card title="AI Processing Statistics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24,587</div>
                  <div className="text-sm text-gray-600">Predictions Made Today</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">2.4s</div>
                  <div className="text-sm text-gray-600">Average Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">99.7%</div>
                  <div className="text-sm text-gray-600">System Uptime</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card title="AI Security & Compliance">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Data Privacy Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Data Encryption</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Audit Logging</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Data Anonymization</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">HIPAA Compliance Mode</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Access Controls</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Role-based Access</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Multi-factor Auth</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Session Timeout</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">API Rate Limiting</span>
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Compliance Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">HIPAA Compliant</p>
                        <p className="text-sm text-green-700">All requirements met</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">SOC 2 Type II</p>
                        <p className="text-sm text-green-700">Certified</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">ISO 27001</p>
                        <p className="text-sm text-green-700">Compliant</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Model Configuration Modal */}
        {showModelConfig && selectedModel && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Configure {selectedModel.name}
                  </h3>
                  <button 
                    onClick={() => setShowModelConfig(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Model Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium capitalize">{selectedModel.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-2 font-medium">{selectedModel.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <span className="ml-2 font-medium">{selectedModel.accuracy}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getModelStatusColor(selectedModel.status)}`}>
                          {selectedModel.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Configuration Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confidence Threshold
                        </label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          defaultValue="85" 
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>85%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Processing Priority
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-retrain Schedule
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Manual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModelConfig(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button variant="primary" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
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
