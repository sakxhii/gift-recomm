import React from 'react';
import { Settings as SettingsIcon, Download, Upload, Trash2, Database, Shield, Bell, Palette, CheckCircle, Edit2, Key } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../Common/Card';
import storage from '../../utils/storage';
import { useAlert } from '../Common/Alert';
import ConfirmationModal from '../Common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import StorageStatus from '../Common/StorageStatus';

const Settings = () => {
  const { showAlert } = useAlert();
  const { theme, changeTheme } = useTheme();
  const [apiKey, setApiKey] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);
  const [resetModal, setResetModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState('data');

  React.useEffect(() => {
    const settings = storage.getSettings();
    if (settings.geminiApiKey) {
      setApiKey(settings.geminiApiKey);
      setIsEditing(false);
    }
  }, []);

  const handleSaveKey = () => {
    // 1. Immediate visual feedback
    showAlert('info', 'Starting save process...');

    try {
      const trimmedKey = apiKey.trim();
      if (!trimmedKey) {
        showAlert('warning', 'Key is empty!');
        return;
      }

      // 2. Direct save to localStorage (Bypassing utility class for testing)
      const existingRaw = localStorage.getItem('giftwise_settings');
      let currentSettings = {};
      try {
        if (existingRaw) {
          const decoded = decodeURIComponent(atob(existingRaw));
          currentSettings = JSON.parse(decoded);
        }
      } catch (e) { console.error('Read error', e); }

      const newSettings = { ...currentSettings, geminiApiKey: trimmedKey };
      const jsonStr = JSON.stringify(newSettings);
      const encrypted = btoa(encodeURIComponent(jsonStr));
      localStorage.setItem('giftwise_settings', encrypted);

      showAlert('success', 'Key saved successfully!');
      setIsEditing(false);
    } catch (e) {
      showAlert('error', 'CRITICAL ERROR: ' + e.message);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storage.getAll()));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "giftwise_backup_" + new Date().toISOString().split('T')[0] + ".json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showAlert('success', 'Data export started');
    } catch (error) {
      console.error('Export failed:', error);
      showAlert('error', 'Failed to export data');
    }
  };

  const handleResetClick = () => {
    setResetModal(true);
  };

  const confirmReset = () => {
    storage.clear();
    setResetModal(false);
    window.location.reload();
  };

  const handleClearCache = () => {
    // For now just a placeholder or could clear specific keys if we had them split up
    showAlert('info', 'Cache cleared (simulated)');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your app preferences and data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection('data')}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'data'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Database size={18} className="mr-3" />
                  Data Management
                </button>
                <button
                  onClick={() => setActiveSection('privacy')}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'privacy'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Shield size={18} className="mr-3" />
                  Privacy & Security
                </button>
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'notifications'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Bell size={18} className="mr-3" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveSection('appearance')}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'appearance'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Palette size={18} className="mr-3" />
                  Appearance
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeSection === 'data' && (
            <>
              {/* Data Management Card */}
              <Card>
                <CardHeader border>
                  <div className="flex items-center">
                    <Database size={20} className="text-primary-600 mr-3" />
                    <CardTitle>Data Management</CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {/* AI Configuration Section */}
                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">AI Configuration</h3>
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-blue-800">
                            To enable real AI recommendations, please provide a free Google Gemini API Key.
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold ml-1">
                              Get one here
                            </a>.
                          </p>
                        </div>
                        {!isEditing ? (
                          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-full text-green-600">
                                <CheckCircle size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-green-900">API Key Configured</p>
                                <div className="flex items-center gap-2 text-sm text-green-700">
                                  <Key size={14} />
                                  <span className="font-mono">•••••••••••••••••••••</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 transition-colors"
                            >
                              <Edit2 size={14} />
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-grow">
                              <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your Gemini API Key here"
                                className="w-full pl-4 pr-16 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                              />
                              <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                              >
                                {showKey ? 'HIDE' : 'SHOW'}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              {apiKey && (
                                <button
                                  onClick={() => setIsEditing(false)}
                                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                id="save-api-key-btn"
                                onClick={handleSaveKey}
                                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                              >
                                Save Key
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Your key is stored locally in your browser and never sent to our servers.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Export & Backup</h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleExport}
                          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Download size={18} className="text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Export All Data</p>
                              <p className="text-sm text-gray-600">Download JSON backup file</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">Recommended weekly</span>
                        </button>

                        <button className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors opacity-50 cursor-not-allowed">
                          <div className="flex items-center">
                            <Upload size={18} className="text-blue-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Import Data</p>
                              <p className="text-sm text-gray-600">Restore from backup file</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">Coming soon</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Data Cleanup</h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleClearCache}
                          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Trash2 size={18} className="text-yellow-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Clear Image Cache</p>
                              <p className="text-sm text-gray-600">Remove uploaded images (keep data)</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">Free up space</span>
                        </button>

                        <button
                          onClick={handleResetClick}
                          className="flex items-center justify-between w-full p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Trash2 size={18} className="text-red-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Reset All Data</p>
                              <p className="text-sm text-gray-600">Delete everything and start fresh</p>
                            </div>
                          </div>
                          <span className="text-sm text-red-600">Danger zone</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Status */}
              <StorageStatus showManageButton={false} />
            </>
          )}

          {activeSection === 'privacy' && (
            <Card>
              <CardHeader border>
                <div className="flex items-center">
                  <Shield size={20} className="text-primary-600 mr-3" />
                  <CardTitle>Privacy & Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield size={20} className="text-green-700" />
                      <h3 className="font-semibold text-green-900">Local-First Privacy</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      GiftWise operates entirely in your browser. Your contact data, photos, and personal notes never leave your device unless you use the optional Gemini AI feature (which only processes data you explicitly request).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Share Anonymous Analytics</p>
                        <p className="text-sm text-gray-500">Help us improve by sharing crash reports and usage patterns.</p>
                      </div>
                      <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Allow AI Data Processing</p>
                        <p className="text-sm text-gray-500">Permit sending images to Google Gemini for OCR.</p>
                      </div>
                      <div className="w-11 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader border>
                <div className="flex items-center">
                  <Bell size={20} className="text-primary-600 mr-3" />
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    We're working on adding smart reminders for birthdays, anniversaries, and gift suggestions. Stay tuned!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader border>
                <div className="flex items-center">
                  <Palette size={20} className="text-primary-600 mr-3" />
                  <CardTitle>Appearance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Theme Preference</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => changeTheme('light')}
                        className={`p-4 border-2 rounded-xl text-center shadow-sm transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 mx-auto mb-2 border border-gray-200 flex items-center justify-center">
                          ☀️
                        </div>
                        <span className={`font-medium block ${theme === 'light' ? 'text-primary-700' : 'text-gray-900'}`}>Light</span>
                      </button>

                      <button
                        onClick={() => changeTheme('dark')}
                        className={`p-4 border-2 rounded-xl text-center shadow-sm transition-all ${theme === 'dark' ? 'border-primary-500 bg-gray-800' : 'border-gray-200 bg-gray-900 opacity-90 hover:opacity-100'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-800 mx-auto mb-2 border border-gray-700 flex items-center justify-center">
                          🌙
                        </div>
                        <span className="font-medium text-white block">Dark</span>
                      </button>

                      <button
                        onClick={() => changeTheme('system')}
                        className={`p-4 border-2 rounded-xl text-center shadow-sm transition-all ${theme === 'system' ? 'border-primary-500 bg-gray-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white mx-auto mb-2 border border-gray-300 flex items-center justify-center">
                          🖥️
                        </div>
                        <span className={`font-medium block ${theme === 'system' ? 'text-primary-700' : 'text-gray-900'}`}>System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={confirmReset}
        title="Reset All Data"
        message="WARNING: This will delete ALL your data including profiles, gifts, and settings. This action cannot be undone. Are you sure?"
        confirmText="Yes, Delete Everything"
        isDanger={true}
      />
    </div>
  );
};

export default Settings;