import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, Users, Gift, Settings, Download, Menu, X, Bell, HelpCircle } from 'lucide-react';
import { useAppStats } from '../../hooks/useLocalStorage';
import { useAlert } from '../Common/Alert';
import logo from '../../assets/logo.png';

import storage from '../../utils/storage';
import HelpModal from '../Common/HelpModal';

const Header = () => {
  const location = useLocation();
  const { stats } = useAppStats();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Upload Card', href: '/upload', icon: Upload, current: location.pathname === '/upload' },
    { name: 'Profiles', href: '/profiles', icon: Users, current: location.pathname === '/profiles' },
    { name: 'Gift History', href: '/history', icon: Gift, current: location.pathname === '/history' },
    { name: 'Settings', href: '/settings', icon: Settings, current: location.pathname === '/settings' },
  ];

  const handleExport = () => {
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
    }
  };

  /* Add useAlert hook */
  const { showAlert } = useAlert();

  const handleNotification = () => {
    showAlert('info', 'No new notifications');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-soft">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden mr-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 transform hover:scale-105 transition-all duration-300">
                  <Gift className="text-white h-6 w-6" strokeWidth={2.5} />
                </div>
                <div className="ml-3 hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">GiftWise AI</h1>
                  <p className="text-xs text-gray-500 font-medium mt-1">Professional Gift Assistant</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${item.current
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon size={18} className="mr-2" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <button
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-soft"
              onClick={handleExport}
            >
              <Download size={16} />
              <span>Export Data</span>
            </button>

            <button
              onClick={handleNotification}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HelpCircle size={20} />
            </button>

            <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-600">Local Mode</span>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-slide-down">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-1 ${item.current
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={18} className="mr-3" />
                  {item.name}
                </Link>
              ))}

              <button
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg mx-1"
                onClick={handleExport}
              >
                <Download size={18} className="mr-3" />
                Export Data
              </button>

              <div className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Profiles: {stats.totalProfiles}</span>
                  <span>•</span>
                  <span>Gifts: {stats.totalGiftsGiven}</span>
                  <span>•</span>
                  <span>Local Storage</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
};

export default Header;