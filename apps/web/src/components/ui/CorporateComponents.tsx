// Shared UI Components with Corporate Theme
import React from 'react';

// Standard Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'default', 
  className = '', 
  onClick,
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border-primary-600',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 border-secondary-600',
    outline: 'border border-primary-300 text-primary-700 hover:bg-primary-50 focus:ring-primary-500 bg-white',
    ghost: 'text-primary-700 hover:bg-primary-50 focus:ring-primary-500 border-transparent'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg 
        transition-colors focus:ring-2 focus:ring-offset-2 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${disabledClasses}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Standard Card Component
export const Card = ({ children, className = '', hover = false }: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) => (
  <div className={`
    bg-white rounded-lg border border-neutral-200 shadow-corporate
    ${hover ? 'hover:shadow-corporate-md transition-shadow' : ''}
    ${className}
  `}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-b border-neutral-100 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-neutral-600 mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

// Standard Badge Component
export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'active' | 'inactive' | 'high' | 'medium' | 'low';
  className?: string;
}) => {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    active: 'bg-success-100 text-success-800',
    inactive: 'bg-neutral-100 text-neutral-800',
    high: 'bg-error-100 text-error-800',
    medium: 'bg-warning-100 text-warning-800',
    low: 'bg-success-100 text-success-800'
  };
  
  return (
    <span className={`
      inline-flex px-2 py-1 text-xs font-semibold rounded-full 
      ${variantClasses[variant]} 
      ${className}
    `}>
      {children}
    </span>
  );
};

// Standard Input Component
export const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  disabled = false,
  required = false
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    className={`
      w-full px-3 py-2 border border-neutral-300 rounded-lg 
      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
      disabled:bg-neutral-50 disabled:text-neutral-500
      placeholder-neutral-500 text-neutral-900
      ${className}
    `}
  />
);

// Standard Select Component
export const Select = ({ 
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`
      w-full px-3 py-2 border border-neutral-300 rounded-lg 
      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
      disabled:bg-neutral-50 disabled:text-neutral-500
      text-neutral-900 bg-white
      ${className}
    `}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// Page Header Component
export const PageHeader = ({ 
  title, 
  description,
  actions,
  className = '' 
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <div className={`mb-8 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {description && (
          <p className="mt-2 text-lg text-neutral-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex space-x-3">
          {actions}
        </div>
      )}
    </div>
  </div>
);

// Status Indicator Component
export const StatusIndicator = ({ 
  status,
  className = ''
}: {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'high' | 'medium' | 'low';
  className?: string;
}) => {
  const statusConfig = {
    active: { color: 'bg-success-500', label: 'Active' },
    inactive: { color: 'bg-neutral-400', label: 'Inactive' },
    pending: { color: 'bg-warning-500', label: 'Pending' },
    completed: { color: 'bg-success-500', label: 'Completed' },
    cancelled: { color: 'bg-error-500', label: 'Cancelled' },
    high: { color: 'bg-error-500', label: 'High' },
    medium: { color: 'bg-warning-500', label: 'Medium' },
    low: { color: 'bg-success-500', label: 'Low' }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} mr-2`}></div>
      <span className="text-sm text-neutral-700">{config.label}</span>
    </div>
  );
};

export default {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Select,
  PageHeader,
  StatusIndicator
};
