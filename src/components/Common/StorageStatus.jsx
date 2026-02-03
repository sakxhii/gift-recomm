import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useAppStats } from '../../hooks/useLocalStorage';
import storage from '../../utils/storage';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

const StorageStatus = ({ showManageButton = true }) => {
  const navigate = useNavigate();
  const { stats } = useAppStats();
  const [isExporting, setIsExporting] = useState(false);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageColor = (percentage) => {
    if (percentage < 60) return 'text-green-600 bg-green-100';
    if (percentage < 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStorageIcon = (percentage) => {
    if (percentage < 60) return <CheckCircle size={16} className="text-green-600" />;
    if (percentage < 85) return <AlertCircle size={16} className="text-yellow-600" />;
    return <AlertCircle size={16} className="text-red-600" />;
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const result = storage.exportAllData();

      if (result.success && result.url) {
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", result.url);
        downloadAnchorNode.setAttribute("download", result.fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else {
        alert('Export failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader border>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-primary-50 mr-3">
              <Database size={20} className="text-primary-600" />
            </div>
            <div>
              <CardTitle>Storage Status</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Local data management</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStorageColor(stats.storageUsage.percentage)}`}>
            {getStorageIcon(stats.storageUsage.percentage)}
            <span className="text-sm font-medium">{stats.storageUsage.percentage.toFixed(1)}% used</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Storage bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Used: {stats.storageUsage.formatted}</span>
            <span>Max: 10MB</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${stats.storageUsage.percentage < 60 ? 'bg-green-500' :
                stats.storageUsage.percentage < 85 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              style={{ width: `${Math.min(stats.storageUsage.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold text-gray-900">{stats.totalProfiles}</div>
            <div className="text-sm text-gray-600">Profiles</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold text-gray-900">{stats.totalGiftsGiven}</div>
            <div className="text-sm text-gray-600">Gifts Given</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold text-gray-900">${stats.totalSpent}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold text-gray-900">
              {stats.lastBackup ? '✓' : '—'}
            </div>
            <div className="text-sm text-gray-600">Last Backup</div>
          </div>
        </div>

        {/* Warning and action */}
        {stats.storageUsage.percentage > 70 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Storage approaching limit</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider exporting your data or removing unused images to free up space.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </button>

          {showManageButton && (
            <button
              className="flex-1 btn btn-secondary"
              onClick={() => navigate('/settings')}
            >
              Manage Storage
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Data is stored locally in your browser. Export regularly to prevent data loss.
        </p>
      </CardContent>
    </Card>
  );
};

export default StorageStatus;