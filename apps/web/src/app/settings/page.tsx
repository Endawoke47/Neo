'use client';

import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Palette, 
  Database, 
  Wifi, 
  Smartphone, 
  Key, 
  Mail, 
  Phone, 
  Save, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  Lock,
  Unlock,
  Camera,
  QrCode,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-primary-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    marketing: false
  });
  const [security, setSecurity] = useState({
    twoFactor: true,
    biometric: false,
    sessionTimeout: '30',
    passwordExpiry: '90'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Yadel',
    lastName: 'Endawoke',
    email: 'yadel@counselflow.com',
    phone: '+254712345678',
    organization: 'CounselFlow Ultimate',
    role: 'Super Administrator',
    timezone: 'Africa/Nairobi',
    language: 'English',
    bio: 'Lead Legal Technology Developer focusing on AI-powered legal solutions for African markets.'
  });

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
  };

  const handleSaveSecurity = () => {
    alert('Security settings updated successfully!');
  };

  const handleSaveNotifications = () => {
    alert('Notification preferences updated successfully!');
  };

  const handleExportData = () => {
    alert('Data export initiated. You will receive a download link via email within 24 hours.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion request submitted. Please check your email for confirmation.');
    }
  };

  const handleResetPassword = () => {
    alert('Password reset link sent to your email address.');
  };

  const handleEnable2FA = () => {
    alert('Two-factor authentication setup initiated. Please scan the QR code with your authenticator app.');
  };

  const handleBackupData = () => {
    alert('Data backup created successfully. Backup stored securely in cloud storage.');
  };

  const handleTestNotification = () => {
    alert('Test notification sent! Check your email, SMS, and push notifications.');
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="w-8 h-8 mr-3 text-primary-600" />
              Settings
            </h1>
            <p className="text-gray-600 mt-1">System Configuration & User Preferences</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'appearance', label: 'Appearance', icon: Palette },
                { id: 'integrations', label: 'Integrations', icon: Wifi },
                { id: 'data', label: 'Data & Privacy', icon: Database }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {profileData.firstName[0]}{profileData.lastName[0]}
                      </div>
                      <div className="space-y-2">
                        <button className="flex items-center px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </button>
                        <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size 2MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <input
                          type="text"
                          value={profileData.organization}
                          onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select 
                          value={profileData.role} 
                          onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Super Administrator">Super Administrator</option>
                          <option value="Administrator">Administrator</option>
                          <option value="Senior Lawyer">Senior Lawyer</option>
                          <option value="Junior Lawyer">Junior Lawyer</option>
                          <option value="Paralegal">Paralegal</option>
                          <option value="Client">Client</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select 
                          value={profileData.timezone} 
                          onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                          <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                          <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select 
                          value={profileData.language} 
                          onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="English">English</option>
                          <option value="Swahili">Swahili</option>
                          <option value="French">French</option>
                          <option value="Arabic">Arabic</option>
                          <option value="Portuguese">Portuguese</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Type</span>
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Premium</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Verification Status</span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Member Since</span>
                        <span className="text-sm font-medium">Jan 2024</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Login</span>
                        <span className="text-sm font-medium">2 hours ago</span>
                      </div>
                    </div>
                    <button className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload ID Document
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      Password & Authentication
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter current password"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={handleResetPassword}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Two-Factor Authentication
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Authenticator App</p>
                        <p className="text-sm text-gray-500">Use an app like Google Authenticator</p>
                      </div>
                      <ToggleSwitch
                        checked={security.twoFactor}
                        onChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Biometric Login</p>
                        <p className="text-sm text-gray-500">Fingerprint or Face ID</p>
                      </div>
                      <ToggleSwitch
                        checked={security.biometric}
                        onChange={(checked) => setSecurity({ ...security, biometric: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                      <select 
                        value={security.sessionTimeout} 
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={handleEnable2FA}
                        className="flex items-center w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Setup 2FA
                      </button>
                      <button 
                        onClick={handleSaveSecurity}
                        className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Preferences
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Get notified about important updates via email</p>
                      </div>
                      <ToggleSwitch
                        checked={notifications.email}
                        onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive urgent alerts via text message</p>
                      </div>
                      <ToggleSwitch
                        checked={notifications.sms}
                        onChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Browser and mobile app notifications</p>
                      </div>
                      <ToggleSwitch
                        checked={notifications.push}
                        onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-gray-500">Updates about new features and products</p>
                      </div>
                      <ToggleSwitch
                        checked={notifications.marketing}
                        onChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                      />
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex space-x-3">
                      <button 
                        onClick={handleSaveNotifications}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </button>
                      <button 
                        onClick={handleTestNotification}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Test Notifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance & Theme
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-500">Switch to dark theme for better night viewing</p>
                      </div>
                      <ToggleSwitch
                        checked={isDarkMode}
                        onChange={setIsDarkMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Theme Color</label>
                      <div className="flex space-x-2">
                        {[
                          { color: 'blue', class: 'bg-primary-500' },
                          { color: 'green', class: 'bg-green-500' },
                          { color: 'purple', class: 'bg-purple-500' },
                          { color: 'red', class: 'bg-red-500' },
                          { color: 'orange', class: 'bg-orange-500' }
                        ].map((theme) => (
                          <button
                            key={theme.color}
                            className={`w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 ${theme.class}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Font Size</label>
                      <select 
                        defaultValue="medium"
                        className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                  </div>
                  <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Save className="w-4 h-4 mr-2" />
                    Save Appearance Settings
                  </button>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Wifi className="w-5 h-5 mr-2" />
                      Third-Party Integrations
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {[
                        { name: 'Google Calendar', description: 'Sync hearings and deadlines', connected: true },
                        { name: 'Microsoft Outlook', description: 'Email and calendar integration', connected: false },
                        { name: 'Slack', description: 'Team communication notifications', connected: true },
                        { name: 'Dropbox', description: 'Document storage and sharing', connected: false },
                        { name: 'Zoom', description: 'Virtual hearing integration', connected: true },
                        { name: 'WhatsApp Business', description: 'Client communication', connected: false }
                      ].map((integration, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-gray-500">{integration.description}</p>
                          </div>
                          <button className={`flex items-center px-3 py-1 text-sm rounded-lg transition-colors ${
                            integration.connected 
                              ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}>
                            {integration.connected ? (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Disconnect
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Connect
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Data Management
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={handleExportData}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </button>
                      <button 
                        onClick={handleBackupData}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Create Backup
                      </button>
                    </div>
                    <div className="border-t pt-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <h3 className="font-medium text-red-900">Danger Zone</h3>
                        </div>
                        <p className="text-sm text-red-700 mt-1">These actions cannot be undone.</p>
                        <button 
                          onClick={handleDeleteAccount}
                          className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors mt-3"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}

