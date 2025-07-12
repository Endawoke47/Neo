'use client';

import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { 
  TrendingUp, 
  FileText, 
  Scale, 
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
  BarChart3,
  Building2
} from 'lucide-react';

// Custom Badge Component with Corporate Theme
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-800',
    urgent: 'bg-error-100 text-error-800',
    high: 'bg-warning-100 text-warning-800',
    medium: 'bg-secondary-100 text-secondary-800',
    low: 'bg-success-100 text-success-800',
    active: 'bg-primary-100 text-primary-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

// Custom Card Components with Corporate Theme
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-neutral-200 shadow-corporate ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-neutral-600 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 pb-4 ${className}`}>
    {children}
  </div>
);

// Custom Button Component
const Button = ({ children, variant = 'default', size = 'default', className = '', onClick }: { 
  children: React.ReactNode; 
  variant?: string; 
  size?: string; 
  className?: string;
  onClick?: () => void;
}) => {
  const variantClasses = {
    default: 'bg-primary-600 text-white hover:bg-primary-700',
    outline: 'border border-primary-300 text-primary-700 hover:bg-primary-50',
    ghost: 'text-primary-700 hover:bg-primary-50',
    secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
  };
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default} ${className}`}
    >
      {children}
    </button>
  );
};

export default function DashboardPage() {
  const metrics = [
    {
      title: 'Active Matters',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'text-primary-600'
    },
    {
      title: 'Revenue (YTD)',
      value: 'KES 2.4M',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success-600'
    },
    {
      title: 'Pending Tasks',
      value: '8',
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: 'text-warning-600'
    },
    {
      title: 'Client Satisfaction',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-secondary-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'contract',
      title: 'New Contract Review Required',
      description: 'Service Agreement - TechCorp Ltd',
      time: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'dispute',
      title: 'Court Filing Deadline Approaching',
      description: 'Case #2024-CV-1234 - Response due in 3 days',
      time: '5 hours ago',
      priority: 'urgent'
    },
    {
      id: 3,
      type: 'entity',
      title: 'Annual Filing Completed',
      description: 'ABC Holdings Ltd - Annual returns submitted',
      time: '1 day ago',
      priority: 'low'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="urgent">Urgent</Badge>;
      case 'high':
        return <Badge variant="high">High</Badge>;
      case 'low':
        return <Badge variant="low">Low</Badge>;
      default:
        return <Badge>Normal</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
            <p className="mt-2 text-lg text-neutral-600">Welcome back! Here's what's happening with your legal practice.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {metrics.map((metric) => (
              <Card key={metric.title} className="hover:shadow-corporate-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-lg bg-opacity-10 ${metric.color.replace('text-', 'bg-')}`}>
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-neutral-500 truncate">{metric.title}</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-bold text-neutral-900">{metric.value}</div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            metric.trend === 'up' ? 'text-success-600' : 'text-error-600'
                          }`}>
                            {metric.trend === 'up' ? (
                              <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                            ) : (
                              <svg className="self-center flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="ml-1">{metric.change}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activities and Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest updates from your legal practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-neutral-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'contract' ? 'bg-primary-100' :
                          activity.type === 'dispute' ? 'bg-error-100' :
                          'bg-success-100'
                        }`}>
                          {activity.type === 'contract' && <FileText className="h-4 w-4 text-primary-600" />}
                          {activity.type === 'dispute' && <Scale className="h-4 w-4 text-error-600" />}
                          {activity.type === 'entity' && <Building2 className="h-4 w-4 text-success-600" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-neutral-900 truncate">{activity.title}</p>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(activity.priority)}
                            <span className="text-xs text-neutral-500">{activity.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 truncate">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used tools and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-20 flex-col space-y-2 bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200" variant="outline">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-medium">New Matter</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2 bg-secondary-50 hover:bg-secondary-100 text-secondary-700 border-secondary-200" variant="outline">
                    <Scale className="h-5 w-5" />
                    <span className="text-xs font-medium">File Dispute</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2 bg-success-50 hover:bg-success-100 text-success-700 border-success-200" variant="outline">
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">Add Entity</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2" variant="outline">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
