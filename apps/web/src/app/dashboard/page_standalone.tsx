'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Scale, 
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
  BarChart3,
  Building2,
  Shield,
  Brain,
  Menu,
  Search,
  Bell,
  User,
  Home,
  Briefcase,
  Users,
  Settings
} from 'lucide-react';

// Custom Badge Component
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    low: 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

// Custom Card Components
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
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default} ${className}`}
    >
      {children}
    </button>
  );
};

// Custom Progress Component
const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentActivities] = useState([
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
  ]);

  const metrics = [
    {
      title: 'Active Matters',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Briefcase,
      color: 'text-primary-600'
    },
    {
      title: 'Revenue (YTD)',
      value: 'KES 2.4M',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Pending Tasks',
      value: '8',
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Client Satisfaction',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-purple-600'
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Matters', href: '/matter-management', icon: Briefcase, current: false },
    { name: 'Contracts', href: '/contract-management', icon: FileText, current: false },
    { name: 'Disputes', href: '/dispute-management', icon: Scale, current: false },
    { name: 'Entities', href: '/entity-management', icon: Building2, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <nav className="mt-5 flex-1 space-y-1 px-2">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-primary-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">CounselFlow</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-primary-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top nav */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Welcome back! Here's what's happening with your legal practice.</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {metrics.map((metric) => (
                  <Card key={metric.title}>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <metric.icon className={`h-8 w-8 ${metric.color}`} />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{metric.title}</dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">{metric.value}</div>
                              <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
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
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest updates across your legal matters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {activity.type === 'contract' && <FileText className="h-5 w-5 text-primary-500" />}
                            {activity.type === 'dispute' && <Scale className="h-5 w-5 text-red-500" />}
                            {activity.type === 'entity' && <Building2 className="h-5 w-5 text-green-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                              {getPriorityBadge(activity.priority)}
                            </div>
                            <p className="text-sm text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Button variant="outline" className="w-full">
                        View All Activities
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="h-20 flex-col space-y-2">
                        <FileText className="h-5 w-5" />
                        <span className="text-xs">New Contract</span>
                      </Button>
                      <Button className="h-20 flex-col space-y-2" variant="outline">
                        <Scale className="h-5 w-5" />
                        <span className="text-xs">New Dispute</span>
                      </Button>
                      <Button className="h-20 flex-col space-y-2" variant="outline">
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
        </main>
      </div>
    </div>
  );
}
