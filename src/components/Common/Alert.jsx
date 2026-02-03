import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, X, Info, Zap } from 'lucide-react';

const Alert = ({ type, message, onClose, autoClose = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const alertConfig = {
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-down`}>
      <div className={`${config.bgColor} border ${config.borderColor} rounded-xl shadow-lg p-4`}>
        <div className="flex items-start">
          <Icon size={20} className={`${config.iconColor} mr-3 flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className={`ml-4 p-1 ${config.textColor} hover:opacity-70`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (type, message, autoClose = 5000) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message, autoClose }]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  useEffect(() => {
    const handleShowAlert = (event) => {
      const { type, message, autoClose } = event.detail;
      showAlert(type, message, autoClose);
    };

    window.addEventListener('show-alert', handleShowAlert);
    return () => window.removeEventListener('show-alert', handleShowAlert);
  }, []);

  return (
    <>
      {children}
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          autoClose={alert.autoClose}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </>
  );
};

export const useAlert = () => {
  const showAlert = (type, message, autoClose) => {
    // Dispatch custom event that AlertProvider will listen to
    window.dispatchEvent(new CustomEvent('show-alert', {
      detail: { type, message, autoClose }
    }));
  };

  return { showAlert };
};