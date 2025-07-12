'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Scale, Shield, Loader2, Eye, EyeOff } from 'lucide-react';

// Custom UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled = false, type = 'button' }: { 
  children: React.ReactNode; 
  variant?: string; 
  size?: string; 
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variantClasses = {
    default: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-blue-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, className = '' }: {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
    />
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

const Alert = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variantClasses = {
    default: 'bg-primary-50 border-blue-200 text-primary-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  
  return (
    <div className={`rounded-md border p-4 ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Mock authentication for demo
      if (email && password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store auth token
        if (rememberMe) {
          localStorage.setItem('counselflow_token', 'mock-jwt-token');
        } else {
          sessionStorage.setItem('counselflow_token', 'mock-jwt-token');
        }
        
        router.push('/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Intelligent contract analysis and risk assessment'
    },
    {
      icon: Scale,
      title: 'Comprehensive Legal Management',
      description: 'Complete matter, dispute, and entity management'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with data encryption'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">CounselFlow</h1>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your AI-powered legal practice management system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Contact your administrator
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">Demo Credentials</Badge>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Email:</strong> demo@counselflow.com</p>
                <p><strong>Password:</strong> demo123</p>
                <p className="text-xs text-gray-500 mt-2">
                  Use any email and password for demo access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Why Choose CounselFlow?
          </h3>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>© 2025 CounselFlow. All rights reserved.</p>
      </div>
    </div>
  );
}
