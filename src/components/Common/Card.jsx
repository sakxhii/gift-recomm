import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      className={clsx(
        'card',
        hover && 'card-hover',
        'transition-all duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', border = false }) => (
  <div className={clsx(
    'px-6 py-5',
    border && 'border-b border-gray-200 dark:border-gray-700',
    className
  )}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold text-gray-700 dark:text-gray-200',
    md: 'text-base font-semibold text-gray-900 dark:text-white',
    lg: 'text-lg font-semibold text-gray-900 dark:text-white',
    xl: 'text-xl font-semibold text-gray-900 dark:text-white'
  };

  return (
    <h3 className={clsx(sizeClasses[size], className)}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => (
  <p className={clsx('mt-1 text-sm text-gray-600 dark:text-gray-400', className)}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', padding = true }) => (
  <div className={clsx(padding && 'px-6 py-5', className)}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', border = true }) => (
  <div className={clsx(
    'px-6 py-4',
    border && 'border-t border-gray-200 dark:border-gray-700',
    className
  )}>
    {children}
  </div>
);

// Specialized card components
export const StatCard = ({ title, value, change, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700'
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export const ActionCard = ({ title, description, icon, actionText, onClick, variant = 'primary' }) => {
  const variantClasses = {
    primary: 'border-primary-200 bg-primary-50',
    secondary: 'border-gray-200 bg-gray-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50'
  };

  const buttonClasses = {
    primary: 'py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
    secondary: 'py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5',
    success: 'py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
    warning: 'py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
  };

  return (
    <Card className={`border-2 ${variantClasses[variant]} hover:border-primary-300 transition-colors`}>
      <CardContent className="text-center">
        <div className={`inline-flex p-3 rounded-lg ${variantClasses[variant]} mb-4`}>
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription className="mt-2">{description}</CardDescription>
        )}
        {actionText && (
          <button
            onClick={onClick}
            className={`mt-4 w-full ${buttonClasses[variant]}`}
          >
            {actionText}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default Card;