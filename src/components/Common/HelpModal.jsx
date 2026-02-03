import React, { useState } from 'react';
import { X, Camera, Image, Lightbulb, AlertCircle, CheckCircle, Zap } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('upload');

  if (!isOpen) return null;

  const tabs = [
    { id: 'upload', label: 'Upload Tips', icon: Camera },
    { id: 'ocr', label: 'OCR Help', icon: Image },
    { id: 'troubleshoot', label: 'Troubleshooting', icon: AlertCircle }
  ];

  const tips = {
    upload: [
      {
        icon: <Lightbulb size={18} className="text-yellow-600" />,
        title: 'Good Lighting',
        description: 'Use even lighting to avoid shadows on the card'
      },
      {
        icon: <Camera size={18} className="text-blue-600" />,
        title: 'Steady Hands',
        description: 'Hold the camera steady and square to the card'
      },
      {
        icon: <Zap size={18} className="text-purple-600" />,
        title: 'Contrast',
        description: 'Place card on a contrasting background'
      },
      {
        icon: <CheckCircle size={18} className="text-green-600" />,
        title: 'Focus',
        description: 'Ensure text is clear and not blurry'
      }
    ],
    ocr: [
      {
        icon: '📱',
        title: 'Phone Camera',
        description: 'Modern phone cameras work best for OCR'
      },
      {
        icon: '📄',
        title: 'Flat Surface',
        description: 'Place card on a flat surface when taking photo'
      },
      {
        icon: '🎯',
        title: 'Center Card',
        description: 'Keep the card centered in the frame'
      },
      {
        icon: '⚡',
        title: 'Auto-Enhance',
        description: 'Enable auto-enhance for better results'
      }
    ],
    troubleshoot: [
      {
        icon: '🔧',
        title: 'Mock Mode',
        description: 'If OCR fails, the app will use sample data'
      },
      {
        icon: '🔄',
        title: 'Refresh Page',
        description: 'Try refreshing if OCR initialization fails'
      },
      {
        icon: '📶',
        title: 'Network Connection',
        description: 'Ensure you have stable internet for OCR'
      },
      {
        icon: '💾',
        title: 'Browser Support',
        description: 'Use Chrome, Firefox, or Edge for best results'
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm mr-3">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tips & Troubleshooting</h3>
                  <p className="text-primary-100 text-sm">Get the best results from OCR</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <Icon size={20} className="mb-1" />
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Content */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips[activeTab].map((tip, index) => (
                <div key={index} className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 mr-4 mt-0.5">
                    {typeof tip.icon === 'string' ? (
                      <span className="text-2xl">{tip.icon}</span>
                    ) : (
                      tip.icon
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Status Info */}
            <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-200">
              <h4 className="font-medium text-primary-900 mb-2">Current OCR Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-primary-700">Engine:</p>
                  <p className="text-sm font-medium text-primary-900">
                    Tesseract.js v4
                  </p>
                </div>
                <div>
                  <p className="text-sm text-primary-700">Language:</p>
                  <p className="text-sm font-medium text-primary-900">
                    English
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 btn btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('tesseract.js-cache');
                  window.location.reload();
                }}
                className="flex-1 btn btn-secondary"
              >
                Clear OCR Cache
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Note: OCR requires downloading language data on first use. 
              This may fail in some network environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;