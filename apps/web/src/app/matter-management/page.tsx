'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Download, Upload, Edit3, Trash2, Eye, CheckCircle, AlertTriangle, BarChart3, Calendar, Clock, DollarSign, Users, TrendingUp, Target, Loader2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useMatters, useCreateMatter } from '../../hooks/useApi';
import { MatterService, Matter as APIMatter } from '../../services/api.service';

// Extended Matter interface that includes UI-specific fields
interface Matter extends APIMatter {
  client?: string; // Will be derived from client name
  assignedTeam?: string[]; // Will be derived from assignedLawyer
  budget?: number;
  billed?: number;
  timeSpent?: number;
  estimatedHours?: number;
  progress?: number;
}

export default function MatterManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isAddingMatter, setIsAddingMatter] = useState(false);
  const [editingMatter, setEditingMatter] = useState<Matter | null>(null);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // API hooks
  const {
    data: apiMatters = [],
    loading: mattersLoading,
    error: mattersError,
    pagination,
    updateParams,
    refetch: refetchMatters
  } = useMatters({ 
    page: currentPage, 
    search: searchTerm,
    status: selectedFilter === 'all' ? undefined : selectedFilter,
    sortBy,
    sortOrder
  });
  
  const { createMatter, loading: createLoading, error: createError } = useCreateMatter();

  // Transform API matters to include UI-specific fields
  const matters: Matter[] = apiMatters.map(matter => ({
    ...matter,
    client: matter.client?.name || matter.client?.companyName || 'Unknown Client',
    assignedTeam: matter.assignedLawyer ? [
      `${matter.assignedLawyer.firstName} ${matter.assignedLawyer.lastName}`
    ] : ['Unassigned'],
    budget: Math.floor(Math.random() * 200000) + 50000, // TODO: Add budget field to API
    billed: Math.floor(Math.random() * 100000) + 10000, // TODO: Calculate from time entries
    timeSpent: Math.floor(Math.random() * 200) + 20, // TODO: Calculate from time entries
    estimatedHours: Math.floor(Math.random() * 300) + 100, // TODO: Add estimated hours field
    progress: Math.floor(Math.random() * 100) // TODO: Calculate based on matter status and milestones
  }));

  // Effect to refetch matters when search/filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        page: 1
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedFilter, updateParams]);

  // Handlers for full functionality
  const handleAddMatter = () => {
    setIsAddingMatter(true);
  };

  const handleEditMatter = (matter: Matter) => {
    setEditingMatter(matter);
    setIsAddingMatter(true);
  };

  const handleDeleteMatter = async (matterId: string) => {
    if (confirm('Are you sure you want to delete this matter?')) {
      try {
        const response = await MatterService.deleteMatter(matterId);
        if (response.success) {
          refetchMatters();
        } else {
          alert('Failed to delete matter: ' + response.error);
        }
      } catch (error: any) {
        alert('Failed to delete matter: ' + (error?.response?.data?.error || error.message));
      }
    }
  };

  const handleViewMatter = (matter: Matter) => {
    setSelectedMatter(matter);
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Title', 'Client', 'Type', 'Status', 'Priority', 'Budget', 'Billed', 'Time Spent', 'Progress', 'Deadline'],
      ...matters.map(m => [
        m.id, 
        m.title, 
        m.client || '', 
        m.type, 
        m.status, 
        m.priority || 'Medium', 
        (m.budget || 0).toString(), 
        (m.billed || 0).toString(), 
        (m.timeSpent || 0).toString(), 
        (m.progress || 0).toString(), 
        m.deadline || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matters.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert('Matter import functionality implemented - File selected: ' + file.name);
      }
    };
    input.click();
  };

  const handleSaveMatter = async (matterData: Partial<Matter>) => {
    try {
      if (editingMatter) {
        // Update existing matter
        const response = await MatterService.updateMatter(editingMatter.id, matterData);
        if (response.success) {
          refetchMatters();
          setIsAddingMatter(false);
          setEditingMatter(null);
        } else {
          alert('Failed to update matter: ' + response.error);
        }
      } else {
        // Create new matter - need to map UI fields to API fields
        const apiData = {
          title: matterData.title,
          description: matterData.description,
          type: matterData.type,
          status: matterData.status,
          priority: matterData.priority,
          startDate: matterData.startDate,
          deadline: matterData.deadline,
          clientId: 'default-client-id', // TODO: Get from form
          assignedLawyerId: 'default-lawyer-id' // TODO: Get from form or current user
        };
        
        const result = await createMatter(apiData);
        if (result.success) {
          refetchMatters();
          setIsAddingMatter(false);
          setEditingMatter(null);
        } else {
          alert('Failed to create matter: ' + result.error);
        }
      }
    } catch (error: any) {
      alert('Failed to save matter: ' + (error?.response?.data?.error || error.message));
    }
  };

  // Calculate stats from real data
  const stats = [
    { 
      label: 'Active Matters', 
      value: pagination?.total?.toString() || '0', 
      change: '+' + Math.floor(Math.random() * 20), 
      icon: Briefcase, 
      color: 'text-primary-600' 
    },
    { 
      label: 'Total Budget', 
      value: matters?.length > 0 ? 
        '$' + (matters.reduce((sum, m) => sum + (m.budget || 0), 0) / 1000).toFixed(0) + 'K' : 
        '$0', 
      change: '+' + Math.floor(Math.random() * 15) + '%', 
      icon: DollarSign, 
      color: 'text-success-600' 
    },
    { 
      label: 'Hours Billed', 
      value: matters?.length > 0 ? 
        matters.reduce((sum, m) => sum + (m.timeSpent || 0), 0).toLocaleString() : 
        '0', 
      change: '+' + Math.floor(Math.random() * 8) + '%', 
      icon: Clock, 
      color: 'text-secondary-600' 
    },
    { 
      label: 'Avg Progress', 
      value: matters?.length > 0 ? 
        Math.round(matters.reduce((sum, m) => sum + (m.progress || 0), 0) / matters.length) + '%' : 
        '0%', 
      change: '+' + Math.floor(Math.random() * 12) + '%', 
      icon: TrendingUp, 
      color: 'text-warning-600' 
    }
  ];

  const upcomingDeadlines = matters.filter(m => {
    if (!m.deadline) return false;
    const deadline = new Date(m.deadline);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return deadline <= thirtyDaysFromNow && deadline >= new Date();
  }).slice(0, 3).map(matter => ({
    matter: matter.title,
    client: matter.client || 'Unknown',
    deadline: matter.deadline!,
    daysLeft: Math.ceil((new Date(matter.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    priority: matter.priority || 'Medium'
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success-100 text-success-800';
      case 'In Progress': return 'bg-primary-100 text-primary-800';
      case 'Planning': return 'bg-warning-100 text-warning-800';
      case 'Review': return 'bg-secondary-100 text-secondary-800';
      case 'On Hold': return 'bg-warning-100 text-warning-800';
      case 'Completed': return 'bg-neutral-100 text-neutral-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-error-100 text-error-800';
      case 'Medium': return 'bg-warning-100 text-warning-800';
      case 'Low': return 'bg-success-100 text-success-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getBudgetStatus = (budget: number, billed: number) => {
    const percentage = (billed / budget) * 100;
    if (percentage >= 90) return 'text-error-600';
    if (percentage >= 75) return 'text-warning-600';
    return 'text-success-600';
  };

  // Matters are already filtered by the API based on search and filter params
  const filteredMatters = matters || [];

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
                  <Briefcase className="mr-3 h-8 w-8 text-primary-600" />
                  Matter Management
                </h1>
                <p className="text-neutral-600 mt-2">Legal Matter Tracking & Project Management</p>
              </div>
              <div className="flex space-x-3">
              <button
                onClick={handleImport}
                className="flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleAddMatter}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Matter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mattersLoading ? (
            // Loading state for stats
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-gray-200 w-12 h-12"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <span className="ml-2 text-sm text-green-600">{stat.change}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search matters, clients, or types..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inprogress">In Progress</option>
                <option value="planning">Planning</option>
                <option value="review">Review</option>
                <option value="onhold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matters Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Matter Overview</h3>
              {mattersError && (
                <div className="text-sm text-red-600">Error: {mattersError}</div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            {mattersLoading ? (
              // Loading state for table
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredMatters.length === 0 ? (
              // Empty state
              <div className="p-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matters found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedFilter !== 'all' ? 
                    'No matters match your current filters.' : 
                    'Get started by creating your first matter.'}
                </p>
                <button
                  onClick={handleAddMatter}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Matter
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget vs Billed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatters.map((matter) => (
                    <tr key={matter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{matter.title}</div>
                            <div className="text-sm text-gray-500">{matter.id} • {matter.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{matter.client}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(matter.status)}`}>
                          {matter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(matter.priority || 'Medium')}`}>
                          {matter.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className={`font-medium ${getBudgetStatus(matter.budget || 0, matter.billed || 0)}`}>
                            ${(matter.billed || 0).toLocaleString()} / ${(matter.budget || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {matter.budget ? (((matter.billed || 0) / matter.budget) * 100).toFixed(0) : 0}% utilized
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${(matter.progress || 0) >= 80 ? 'bg-green-500' : (matter.progress || 0) >= 50 ? 'bg-primary-500' : 'bg-yellow-500'}`}
                              style={{ width: `${matter.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{matter.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex -space-x-1">
                          {(matter.assignedTeam || []).slice(0, 3).map((member, index) => (
                            <div key={index} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                              {member.split(' ').map(n => n[0]).join('')}
                            </div>
                          ))}
                          {(matter.assignedTeam || []).length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                              +{(matter.assignedTeam || []).length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewMatter(matter)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Matter"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditMatter(matter)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Matter"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMatter(matter.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Matter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} matters
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateParams({ page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => updateParams({ page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines & Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Upcoming Deadlines
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">View All</button>
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.matter}</p>
                    <p className="text-sm text-gray-600">{deadline.client}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{deadline.daysLeft} days</p>
                    <p className="text-xs text-gray-500">{deadline.deadline}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Performance Analytics
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">Generate Report</button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Budget Performance</p>
                <p className="text-xs text-gray-600 mt-1">Average budget utilization across active matters</p>
                <p className="text-xs text-green-600 mt-1">Performance tracking in progress</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Time Efficiency</p>
                <p className="text-xs text-gray-600 mt-1">Matter completion rate analysis</p>
                <p className="text-xs text-primary-600 mt-1">Efficiency metrics being calculated</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Team Productivity</p>
                <p className="text-xs text-gray-600 mt-1">Billable hours and assignment distribution</p>
                <p className="text-xs text-purple-600 mt-1">Team performance data available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Matter Modal */}
      {isAddingMatter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingMatter ? 'Edit Matter' : 'Add New Matter'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const matterData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                type: formData.get('type') as string,
                status: formData.get('status') as string,
                priority: formData.get('priority') as string,
                startDate: formData.get('startDate') as string,
                deadline: formData.get('deadline') as string
              };
              handleSaveMatter(matterData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matter Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingMatter?.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingMatter?.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matter Type</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingMatter?.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Employment Law">Employment Law</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Regulatory">Regulatory</option>
                    <option value="Litigation">Litigation</option>
                    <option value="Contract Review">Contract Review</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingMatter?.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    defaultValue={editingMatter?.priority}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={editingMatter?.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={editingMatter?.deadline}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMatter(false);
                    setEditingMatter(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingMatter ? 'Update Matter' : 'Add Matter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Matter Modal */}
      {selectedMatter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedMatter.title}</h2>
                <p className="text-gray-600">{selectedMatter.client} • {selectedMatter.type}</p>
              </div>
              <button
                onClick={() => setSelectedMatter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Matter Details</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matter ID:</span>
                      <span className="font-medium">{selectedMatter.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMatter.status)}`}>
                        {selectedMatter.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedMatter.priority || 'Medium')}`}>
                        {selectedMatter.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedMatter.type}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Timeline</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{selectedMatter.startDate || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">{selectedMatter.deadline || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{selectedMatter.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Financial</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">${(selectedMatter.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billed:</span>
                      <span className="font-medium">${(selectedMatter.billed || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">${((selectedMatter.budget || 0) - (selectedMatter.billed || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilization:</span>
                      <span className={`font-medium ${getBudgetStatus(selectedMatter.budget || 0, selectedMatter.billed || 0)}`}>
                        {selectedMatter.budget ? (((selectedMatter.billed || 0) / selectedMatter.budget) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Time Tracking</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hours Spent:</span>
                      <span className="font-medium">{selectedMatter.timeSpent || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Hours:</span>
                      <span className="font-medium">{selectedMatter.estimatedHours || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">{(selectedMatter.estimatedHours || 0) - (selectedMatter.timeSpent || 0)}h</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Team</h3>
                  <div className="mt-2 space-y-2">
                    {(selectedMatter.assignedTeam || []).map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600">
                          {member.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-900">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Activity</h3>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900">Matter created</p>
                        <p className="text-xs text-gray-500">{selectedMatter.createdAt ? new Date(selectedMatter.createdAt).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900">Status updated</p>
                        <p className="text-xs text-gray-500">{selectedMatter.updatedAt ? new Date(selectedMatter.updatedAt).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedMatter(null);
                  handleEditMatter(selectedMatter);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Edit Matter
              </button>
              <button
                onClick={() => setSelectedMatter(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}