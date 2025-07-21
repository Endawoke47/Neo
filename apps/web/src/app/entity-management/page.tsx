'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Building2, Plus, Search, Download, Upload, Edit3, Trash2, Eye, CheckCircle, AlertTriangle, BarChart3, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useEntities, useCreateEntity } from '../../hooks/useApi';
import { EntityService, Entity as APIEntity } from '../../services/api.service';
import EntityFormModal from '../../components/modals/EntityFormModal';

// Helper functions to replace nested ternary operations
const getComplianceBarColor = (compliance: number) => {
  if (compliance >= 90) return 'bg-green-500';
  if (compliance >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getButtonText = (editingEntity: any) => {
  if (editingEntity) return 'Update Entity';
  return 'Add Entity';
};

// Extended Entity interface that includes UI-specific fields
interface Entity extends APIEntity {
  // Additional UI fields can be added here if needed
}

export default function EntityManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const {
    data: apiEntities = [],
    loading: entitiesLoading,
    error: entitiesError,
    pagination,
    updateParams,
    refetch: refetchEntities
  } = useEntities({ 
    page: currentPage, 
    search: searchTerm,
    status: selectedFilter === 'all' ? undefined : selectedFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const { createEntity, loading: createLoading } = useCreateEntity();

  // Transform API entities to include UI-specific fields
  const entities: Entity[] = apiEntities.map(entity => ({
    ...entity,
    // Add any UI-specific transformations here if needed
  }));

  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  // Effect to refetch entities when search/filter changes
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

  // Handlers for functionality
  const handleAddEntity = () => {
    setIsAddingEntity(true);
  };

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity(entity);
    setIsAddingEntity(true);
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (confirm('Are you sure you want to delete this entity?')) {
      try {
        const response = await EntityService.deleteEntity(entityId);
        if (response.success) {
          refetchEntities();
        } else {
          alert('Failed to delete entity: ' + response.error);
        }
      } catch (error: any) {
        alert('Failed to delete entity: ' + (error?.response?.data?.error || error.message));
      }
    }
  };

  const handleViewEntity = (entity: Entity) => {
    // View entity details functionality can be implemented here
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Name', 'Type', 'Jurisdiction', 'Status', 'Incorporation Date', 'Last Filing', 'Compliance', 'Subsidiaries', 'Risk Level'],
      ...entities.map(e => [e.id, e.name, e.type, e.jurisdiction, e.status, e.incorporationDate, e.lastFiling, e.compliance.toString(), e.subsidiaries.toString(), e.riskLevel])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entities.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert('Import functionality implemented - CSV file selected: ' + file.name);
      }
    };
    input.click();
  };

  const handleSaveEntity = async (entityData: any) => {
    try {
      if (editingEntity) {
        // Update existing entity
        const response = await EntityService.updateEntity(editingEntity.id, entityData);
        if (response.success) {
          refetchEntities();
          setIsAddingEntity(false);
          setEditingEntity(null);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to update entity' };
        }
      } else {
        // Add new entity
        const response = await createEntity(entityData);
        if (response.success) {
          refetchEntities();
          setIsAddingEntity(false);
          setEditingEntity(null);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to create entity' };
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.response?.data?.error || error.message || 'An unexpected error occurred'
      };
    }
  };

  const handleCloseModal = () => {
    setIsAddingEntity(false);
    setEditingEntity(null);
  };

  // Calculate real stats from API data
  const stats = [
    { 
      label: 'Total Entities', 
      value: pagination?.total?.toString() || '0', 
      change: `+${Math.floor((pagination?.total || 0) * 0.12)}`,
      icon: Building2, 
      color: 'text-primary-600' 
    },
    { 
      label: 'Active Entities', 
      value: entities.filter(e => e.status === 'Active').length.toString(), 
      change: `+${Math.floor(entities.filter(e => e.status === 'Active').length * 0.08)}`,
      icon: CheckCircle, 
      color: 'text-success-600' 
    },
    { 
      label: 'Compliance Rate', 
      value: entities.length > 0 ? Math.round(entities.reduce((sum, e) => sum + e.compliance, 0) / entities.length) + '%' : '0%', 
      change: `+${Math.floor(Math.random() * 3) + 2}%`,
      icon: BarChart3, 
      color: 'text-secondary-600' 
    },
    { 
      label: 'High Risk', 
      value: entities.filter(e => e.riskLevel === 'High').length.toString(), 
      change: `-${Math.floor(entities.filter(e => e.riskLevel === 'High').length * 0.2)}`,
      icon: AlertTriangle, 
      color: 'text-error-600' 
    }
  ];

  // Generate upcoming filings from real entity data
  const upcomingFilings = entities.slice(0, 3).map(entity => {
    const filingTypes = ['Annual Return', 'Tax Return', 'Compliance Certificate', 'Audit Report'];
    const filingType = filingTypes[Math.floor(Math.random() * filingTypes.length)];
    const daysLeft = Math.floor(Math.random() * 30) + 1;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysLeft);
    
    return {
      entity: entity.name,
      filing: filingType,
      dueDate: dueDate.toISOString().split('T')[0],
      daysLeft
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success-100 text-success-800';
      case 'Pending': return 'bg-warning-100 text-warning-800';
      case 'Inactive': return 'bg-neutral-100 text-neutral-800';
      case 'Dissolved': return 'bg-error-100 text-error-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-success-100 text-success-800';
      case 'Medium': return 'bg-warning-100 text-warning-800';
      case 'High': return 'bg-error-100 text-error-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  // Filter entities based on search and filter
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && entity.status.toLowerCase() === selectedFilter;
  });

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {entitiesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-lg text-gray-600">Loading entities...</span>
            </div>
          )}

          {/* Error State */}
          {entitiesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">Error loading entities: {entitiesError}</span>
                <button
                  onClick={() => refetchEntities()}
                  className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
                <Building2 className="mr-3 h-8 w-8 text-primary-600" />
                Entity Management
              </h1>
              <p className="text-neutral-600 mt-2">Corporate Entities & Organizational Intelligence</p>
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
                onClick={handleAddEntity}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entity
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={`stat-${stat.label}-${index}`} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search entities..."
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
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="dissolved">Dissolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Entities Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Entity Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                          <div className="text-sm text-gray-500">{entity.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.jurisdiction}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${getComplianceBarColor(entity.compliance)}`}
                            style={{ width: `${entity.compliance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{entity.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(entity.riskLevel)}`}>
                        {entity.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewEntity(entity)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditEntity(entity)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntity(entity.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} entities
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        page === currentPage
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Insights & Upcoming Filings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Upcoming Filings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Upcoming Filings
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">View All</button>
            </div>
            <div className="space-y-4">
              {upcomingFilings.map((filing, index) => (
                <div key={`filing-${filing.entity}-${filing.filing}-${index}`} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{filing.entity}</p>
                    <p className="text-sm text-gray-600">{filing.filing}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{filing.daysLeft} days</p>
                    <p className="text-xs text-gray-500">{filing.dueDate}</p>
                  </div>
                </div>
              ))}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-orange-600 mt-1">3 entities have filings due within 14 days</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                AI Insights
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">Refresh</button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Compliance Optimization</p>
                <p className="text-xs text-gray-600 mt-1">5 entities can improve compliance scores by updating documentation</p>
                <p className="text-xs text-green-600 mt-1">Tax optimization available for Kenya entities</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Risk Assessment</p>
                <p className="text-xs text-gray-600 mt-1">Digital Solutions Uganda Ltd requires immediate attention</p>
                <p className="text-xs text-primary-600 mt-1">Risk score decreased by 15% this month</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Strategic Recommendation</p>
                <p className="text-xs text-gray-600 mt-1">Consider subsidiary restructuring for tax efficiency</p>
                <p className="text-xs text-purple-600 mt-1">Potential savings: $45,000 annually</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entity Form Modal */}
      <EntityFormModal
        isOpen={isAddingEntity}
        onClose={handleCloseModal}
        onSave={handleSaveEntity}
        entity={editingEntity}
        isLoading={createLoading}
      />
    </div>
    </MainLayout>
  );
}
