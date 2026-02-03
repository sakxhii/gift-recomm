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
    border && 'border-b border-gray-200',
    className
  )}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold text-gray-700',
    md: 'text-base font-semibold text-gray-900',
    lg: 'text-lg font-semibold text-gray-900',
    xl: 'text-xl font-semibold text-gray-900'
  };
  
  return (
    <h3 className={clsx(sizeClasses[size], className)}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => (
  <p className={clsx('mt-1 text-sm text-gray-600', className)}>
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
    border && 'border-t border-gray-200',
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
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
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
            className={`mt-4 w-full btn ${buttonClasses[variant]}`}
          >
            {actionText}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default Card;