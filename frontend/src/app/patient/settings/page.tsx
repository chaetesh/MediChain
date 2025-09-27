'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  PatientProfileApiService, 
  PatientProfile, 
  UpdatePatientProfileDto, 
  ApiErrorClass 
} from '@/lib/services/patientProfile.service';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  Edit,
  Smartphone,
  Globe,
  Database,
  Key,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  medicalInfo: {
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    medications: string[];
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy: {
      shareWithResearchers: boolean;
      allowEmergencyAccess: boolean;
      dataRetention: string;
    };
    security: {
      twoFactorAuth: boolean;
      biometricAuth: boolean;
      sessionTimeout: string;
    };
  };
}

export default function PatientSettingsPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  
  // Real profile data from API
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    medicalInfo: {
      bloodType: 'A+',
      allergies: [],
      chronicConditions: [],
      medications: []
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      privacy: {
        shareWithResearchers: false,
        allowEmergencyAccess: true,
        dataRetention: '5years'
      },
      security: {
        twoFactorAuth: false,
        biometricAuth: false,
        sessionTimeout: '30min'
      }
    }
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profileData = await PatientProfileApiService.getMyProfile();
      const normalizedData = PatientProfileApiService.normalizeProfileData(profileData);
      
      setProfile({
        personalInfo: {
          firstName: normalizedData.firstName || '',
          lastName: normalizedData.lastName || '',
          email: normalizedData.email || '',
          phone: normalizedData.phone || '',
          dateOfBirth: normalizedData.dateOfBirth || '',
          gender: normalizedData.gender || 'male',
          address: normalizedData.address || '',
          emergencyContact: normalizedData.emergencyContact || {
            name: '',
            relationship: '',
            phone: ''
          }
        },
        medicalInfo: {
          bloodType: normalizedData.bloodType || 'A+',
          allergies: normalizedData.allergies || [],
          chronicConditions: normalizedData.chronicConditions || [],
          medications: normalizedData.medications || []
        },
        preferences: {
          notifications: normalizedData.preferences?.notifications || {
            email: true,
            sms: false,
            push: true
          },
          privacy: normalizedData.preferences?.privacy || {
            shareWithResearchers: false,
            allowEmergencyAccess: true,
            dataRetention: '5years'
          },
          security: normalizedData.preferences?.security || {
            twoFactorAuth: false,
            biometricAuth: false,
            sessionTimeout: '30min'
          }
        }
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updateData = PatientProfileApiService.prepareProfileUpdateData(profile);
      await PatientProfileApiService.updateMyProfile(updateData);
      
      setEditMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof ApiErrorClass ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'medical', label: 'Medical Info', icon: Heart },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const handleInputChange = (section: keyof UserProfile, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section: keyof UserProfile, subsection: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayChange = (section: keyof UserProfile, field: string, index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].map((item: string, i: number) => 
          i === index ? value : item
        )
      }
    }));
  };

  const addArrayItem = (section: keyof UserProfile, field: string) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], '']
      }
    }));
  };

  const removeArrayItem = (section: keyof UserProfile, field: string, index: number) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="space-y-6">
        <PageHeader
          title="Account Settings"
          description="Manage your profile, privacy, and security preferences"
        >
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setEditMode(!editMode)}
              disabled={loading || saving}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
            {editMode && (
              <Button variant="primary" onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Error Message */}
        {error && (
          <Card>
            <div className="flex items-center p-4 text-red-800 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Loading profile...</span>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Profile Complete"
            value="95%"
            change={{ value: "Almost complete", trend: "up" }}
            icon={<User className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Security Score"
            value="High"
            change={{ value: "2FA enabled", trend: "up" }}
            icon={<Shield className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Data Shared"
            value="3 Providers"
            change={{ value: "This month", trend: "neutral" }}
            icon={<Globe className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="Last Updated"
            value="2 days ago"
            change={{ value: "Profile info", trend: "neutral" }}
            icon={<Calendar className="w-6 h-6 text-orange-600" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <Card title="Personal Information">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profile.personalInfo.firstName}
                        onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profile.personalInfo.lastName}
                        onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          value={profile.personalInfo.email}
                          onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                          disabled={!editMode}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          value={profile.personalInfo.phone}
                          onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                          disabled={!editMode}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={profile.personalInfo.dateOfBirth}
                        onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={profile.personalInfo.gender}
                        onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <textarea
                        value={profile.personalInfo.address}
                        onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                        disabled={!editMode}
                        rows={2}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={profile.personalInfo.emergencyContact.name}
                          onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'name', e.target.value)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <input
                          type="text"
                          value={profile.personalInfo.emergencyContact.relationship}
                          onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'relationship', e.target.value)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profile.personalInfo.emergencyContact.phone}
                          onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'phone', e.target.value)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Medical Information */}
            {activeTab === 'medical' && (
              <Card title="Medical Information">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                    <select
                      value={profile.medicalInfo.bloodType}
                      onChange={(e) => handleInputChange('medicalInfo', 'bloodType', e.target.value)}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                    <div className="space-y-2">
                      {profile.medicalInfo.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={allergy}
                            onChange={(e) => handleArrayChange('medicalInfo', 'allergies', index, e.target.value)}
                            disabled={!editMode}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Enter allergy"
                          />
                          {editMode && (
                            <Button 
                              variant="outline" 
                              onClick={() => removeArrayItem('medicalInfo', 'allergies', index)}
                              className="p-2"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <Button 
                          variant="outline" 
                          onClick={() => addArrayItem('medicalInfo', 'allergies')}
                          className="w-full"
                        >
                          + Add Allergy
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                    <div className="space-y-2">
                      {profile.medicalInfo.chronicConditions.map((condition, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) => handleArrayChange('medicalInfo', 'chronicConditions', index, e.target.value)}
                            disabled={!editMode}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Enter condition"
                          />
                          {editMode && (
                            <Button 
                              variant="outline" 
                              onClick={() => removeArrayItem('medicalInfo', 'chronicConditions', index)}
                              className="p-2"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <Button 
                          variant="outline" 
                          onClick={() => addArrayItem('medicalInfo', 'chronicConditions')}
                          className="w-full"
                        >
                          + Add Condition
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                    <div className="space-y-2">
                      {profile.medicalInfo.medications.map((medication, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={medication}
                            onChange={(e) => handleArrayChange('medicalInfo', 'medications', index, e.target.value)}
                            disabled={!editMode}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Enter medication"
                          />
                          {editMode && (
                            <Button 
                              variant="outline" 
                              onClick={() => removeArrayItem('medicalInfo', 'medications', index)}
                              className="p-2"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <Button 
                          variant="outline" 
                          onClick={() => addArrayItem('medicalInfo', 'medications')}
                          className="w-full"
                        >
                          + Add Medication
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card title="Privacy Settings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Share Data with Researchers</h3>
                      <p className="text-sm text-gray-500">Allow anonymized data to be used for medical research</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.shareWithResearchers}
                        onChange={(e) => handleNestedChange('preferences', 'privacy', 'shareWithResearchers', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Emergency Access</h3>
                      <p className="text-sm text-gray-500">Allow emergency responders to access critical information</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.allowEmergencyAccess}
                        onChange={(e) => handleNestedChange('preferences', 'privacy', 'allowEmergencyAccess', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
                    <select
                      value={profile.preferences.privacy.dataRetention}
                      onChange={(e) => handleNestedChange('preferences', 'privacy', 'dataRetention', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1year">1 Year</option>
                      <option value="5years">5 Years</option>
                      <option value="10years">10 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card title="Security Settings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${profile.preferences.security.twoFactorAuth ? 'text-green-600' : 'text-gray-500'}`}>
                        {profile.preferences.security.twoFactorAuth ? 'Enabled' : 'Disabled'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.security.twoFactorAuth}
                          onChange={(e) => handleNestedChange('preferences', 'security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Biometric Authentication</h3>
                      <p className="text-sm text-gray-500">Use fingerprint or face recognition for quick access</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${profile.preferences.security.biometricAuth ? 'text-green-600' : 'text-gray-500'}`}>
                        {profile.preferences.security.biometricAuth ? 'Enabled' : 'Disabled'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.security.biometricAuth}
                          onChange={(e) => handleNestedChange('preferences', 'security', 'biometricAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
                    <select
                      value={profile.preferences.security.sessionTimeout}
                      onChange={(e) => handleNestedChange('preferences', 'security', 'sessionTimeout', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="15min">15 Minutes</option>
                      <option value="30min">30 Minutes</option>
                      <option value="1hour">1 Hour</option>
                      <option value="4hours">4 Hours</option>
                    </select>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Access</h3>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Manage Connected Devices
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        Download My Data
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card title="Notification Preferences">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.email}
                        onChange={(e) => handleNestedChange('preferences', 'notifications', 'email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates via text message</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.sms}
                        onChange={(e) => handleNestedChange('preferences', 'notifications', 'sms', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 text-purple-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications in the app</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.push}
                        onChange={(e) => handleNestedChange('preferences', 'notifications', 'push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
