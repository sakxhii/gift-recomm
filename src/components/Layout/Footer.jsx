import React from 'react';
import { Github, Heart, Shield, Zap } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                <span className="text-white font-semibold text-xl">🎁</span>
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">GiftWise AI</h2>
                <p className="text-sm text-gray-500">Professional Gift Assistant</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Intelligent gift recommendations for professionals. 
              All data stays on your device.
            </p>
          </div>

          {/* Features column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600">
                <Shield size={14} className="mr-2 text-primary-600" />
                <span>Local Data Storage</span>
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Zap size={14} className="mr-2 text-primary-600" />
                <span>AI-Powered Suggestions</span>
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Heart size={14} className="mr-2 text-primary-600" />
                <span>Personalized Gift Tracking</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Status & Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Mode</span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                  Local
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Privacy</span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  On-Device
                </span>
              </div>
              <div className="pt-4">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github size={16} className="mr-2" />
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {currentYear} GiftWise AI. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <span className="text-xs text-gray-500">
                Version 1.0.0
              </span>
              <span className="text-xs text-gray-500">
                Built with React & Tailwind CSS
              </span>
              <span className="text-xs text-gray-500">
                For Professional Use
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              ⚠️ Remember: This app stores data locally. Export regularly to prevent data loss.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;