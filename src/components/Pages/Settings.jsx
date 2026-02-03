import React from 'react';
import { Settings as SettingsIcon, Download, Upload, Trash2, Database, Shield, Bell, Palette } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../Common/Card';
import storage from '../../utils/storage';
import { useAlert } from '../Common/Alert';

const Settings = () => {
  const { showAlert } = useAlert();
  const [apiKey, setApiKey] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    const settings = storage.getSettings();
    if (settings.geminiApiKey) {
      setApiKey(settings.geminiApiKey);
    }
  }, []);

  const handleSaveKey = () => {
    // 1. Immediate visual feedback
    window.alert('Starting save process...');

    try {
      const trimmedKey = apiKey.trim();
      if (!trimmedKey) {
        alert('Key is empty!');
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

      alert('DONE! Key saved directly to browser storage.');
      window.location.reload();
    } catch (e) {
      alert('CRITICAL ERROR: ' + e.message);
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

  const handleReset = () => {
    if (window.confirm('WARNING: This will delete ALL your data including profiles and settings. This action cannot be undone. Are you sure?')) {
      storage.clear();
      window.location.reload();
    }
  };

  const handleClearCache = () => {
    // For now just a placeholder or could clear specific keys if we had them split up
    showAlert('info', 'Cache cleared (simulated)');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your app preferences and data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg">
                  <Database size={18} className="mr-3" />
                  Data Management
                </button>
                <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Shield size={18} className="mr-3" />
                  Privacy & Security
                </button>
                <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Bell size={18} className="mr-3" />
                  Notifications
                </button>
                <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Palette size={18} className="mr-3" />
                  Appearance
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Management Card */}
          <Card>
            <CardHeader border>
              <div className="flex items-center">
                <SettingsIcon size={20} className="text-primary-600 mr-3" />
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
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Paste your Gemini API Key here"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <button
                        id="save-api-key-btn"
                        onClick={handleSaveKey}
                        className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Save Configuration
                      </button>
                    </div>
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
                      onClick={handleReset}
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

          {/* App Information Card */}
          <Card>
            <CardHeader border>
              <CardTitle>App Information</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">App Version</span>
                  <span className="text-sm font-medium text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Storage Mode</span>
                  <span className="text-sm font-medium text-green-700">Local Only</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Data Location</span>
                  <span className="text-sm font-medium text-gray-900">Browser Storage</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm font-medium text-gray-900">Never</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Remember: This app stores all data locally in your browser.
                  Export regularly to prevent data loss.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;