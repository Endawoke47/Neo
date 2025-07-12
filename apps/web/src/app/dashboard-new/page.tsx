// AI-Powered Legal Management Dashboard
// User: Endawoke47
// Date: 2025-07-12 22:00:00 UTC

'use client';

import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileText,
  Scale,
  FolderOpen,
  Shield,
  ScrollText,
  Brain,
  BarChart3,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Calendar,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const modules = [
    {
      title: 'Entity Management',
      href: '/entity-management',
      icon: Building2,
      description: 'Corporate Entities & Organizational Intelligence',
      stats: { total: 127, active: 95, pending: 12 },
      color: 'bg-primary-500',
      status: 'Operational'
    },
    {
      title: 'Contract Management',
      href: '/contract-management',
      icon: FileText,
      description: 'AI-Powered Contract Lifecycle & Agreement Intelligence',
      stats: { total: 845, active: 234, expiring: 18 },
      color: 'bg-green-500',
      status: 'Optimized'
    },
    {
      title: 'Dispute Management',
      href: '/dispute-management',
      icon: Scale,
      description: 'Legal Disputes, Litigation & Conflict Resolution',
      stats: { total: 23, active: 8, resolved: 15 },
      color: 'bg-red-500',
      status: 'Active'
    },
    {
      title: 'Matter Management',
      href: '/matter-management',
      icon: FolderOpen,
      description: 'Case & Project Workflow Intelligence',
      stats: { total: 156, active: 67, completed: 89 },
      color: 'bg-purple-500',
      status: 'Efficient'
    },
    {
      title: 'Risk Management',
      href: '/risk-management',
      icon: Shield,
      description: 'AI-Driven Legal Risk Assessment & Mitigation',
      stats: { critical: 3, high: 12, medium: 28 },
      color: 'bg-orange-500',
      status: 'Monitoring'
    },
    {
      title: 'Policy Management',
      href: '/policy-management',
      icon: ScrollText,
      description: 'Corporate Policies, Compliance & Governance',
      stats: { policies: 89, compliant: 95, updates: 7 },
      color: 'bg-indigo-500',
      status: 'Compliant'
    },
    {
      title: 'Knowledge Management',
      href: '/knowledge-management',
      icon: Brain,
      description: 'Legal Knowledge Base & Institutional Intelligence',
      stats: { documents: 2340, templates: 156, searches: 890 },
      color: 'bg-teal-500',
      status: 'Learning'
    },
    {
      title: 'Licensing & Regulatory',
      href: '/licensing-regulatory',
      icon: BarChart3,
      description: 'Regulatory Compliance & Licensing Intelligence',
      stats: { licenses: 45, renewals: 8, filings: 23 },
      color: 'bg-yellow-500',
      status: 'Compliant'
    },
    {
      title: 'Outsourcing & Legal Spend',
      href: '/outsourcing-spend',
      icon: DollarSign,
      description: 'External Legal Services & Spend Intelligence',
      stats: { vendors: 34, spend: '$2.4M', savings: '15%' },
      color: 'bg-emerald-500',
      status: 'Optimized'
    },
    {
      title: 'Task Management',
      href: '/task-management',
      icon: CheckSquare,
      description: 'Legal Task & Workflow Automation Intelligence',
      stats: { tasks: 234, completed: 89, overdue: 5 },
      color: 'bg-pink-500',
      status: 'Productive'
    }
  ];

  const quickStats = [
    { label: 'Total Entities', value: '127', icon: Building2, trend: '+12%' },
    { label: 'Active Contracts', value: '234', icon: FileText, trend: '+8%' },
    { label: 'Open Matters', value: '67', icon: FolderOpen, trend: '-3%' },
    { label: 'Risk Score', value: '7.2/10', icon: Shield, trend: '+0.3' }
  ];

  const recentActivities = [
    { type: 'contract', message: 'Service Agreement with TechCorp expires in 30 days', time: '2 hours ago', urgent: true },
    { type: 'risk', message: 'High risk identified in subsidiary compliance audit', time: '4 hours ago', urgent: true },
    { type: 'matter', message: 'IP litigation case updated with new evidence', time: '6 hours ago', urgent: false },
    { type: 'task', message: 'Board resolution template created', time: '1 day ago', urgent: false },
    { type: 'policy', message: 'Data privacy policy updated for GDPR compliance', time: '2 days ago', urgent: false }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Legal Management Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview of your legal operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI-Powered Legal Modules */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">AI-Powered Legal Management Modules</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.color}`}>
                      <module.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {module.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={module.href}>
                    <Button className="w-full" variant="outline">
                      Access Module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${activity.urgent ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.urgent && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Task Completion Rate</span>
                  <span className="text-sm font-bold text-green-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Client Satisfaction</span>
                  <span className="text-sm font-bold text-primary-600">9.2/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">AI Efficiency Score</span>
                  <span className="text-sm font-bold text-purple-600">8.7/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
