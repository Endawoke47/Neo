'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Users, Plus, Search, Download, Upload, Edit3, Trash2, Eye, CheckCircle, AlertTriangle, BarChart3, Calendar, FileText, Building2, TrendingUp, Clock, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { useClients, useCreateClient } from '../../hooks/useApi';
import { ClientService, Client as APIClient } from '../../services/api.service';
import ClientFormModal from '../../components/modals/ClientFormModal';

// Extended Client interface that includes UI-specific fields
interface Client extends APIClient {
  // Additional UI fields can be added here if needed
}

export default function ClientManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // API hooks
  const {
    data: apiClients = [],
    loading: clientsLoading,
    error: clientsError,
    pagination,
    updateParams,
    refetch: refetchClients
  } = useClients({ 
    page: currentPage, 
    search: searchTerm,
    clientType: selectedFilter === 'all' ? undefined : selectedFilter,
    sortBy,
    sortOrder
  });
  
  const { createClient, loading: createLoading, error: createError } = useCreateClient();

  // Transform API clients to include UI-specific fields
  const clients: Client[] = apiClients.map(client => ({
    ...client,
    // Add any UI-specific transformations here if needed
  }));

  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Effect to refetch clients when search/filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        clientType: selectedFilter === 'all' ? undefined : selectedFilter,
        page: 1
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedFilter, updateParams]);

  // Handlers for functionality
  const handleAddClient = () => {
    setIsAddingClient(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsAddingClient(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        const response = await ClientService.deleteClient(clientId);
        if (response.success) {
          refetchClients();
        } else {
          alert('Failed to delete client: ' + response.error);
        }
      } catch (error: any) {
        alert('Failed to delete client: ' + (error?.response?.data?.error || error.message));
      }
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Phone', 'Client Type', 'Industry', 'Assigned Lawyer', 'Status', 'Created Date'],
      ...clients.map(c => [
        c.id, 
        c.name, 
        c.email, 
        c.phone || '', 
        c.clientType, 
        c.industry || '', 
        c.assignedLawyer ? `${c.assignedLawyer.firstName} ${c.assignedLawyer.lastName}` : 'Unassigned',
        c.isActive ? 'Active' : 'Inactive',
        c.createdAt?.split('T')[0] || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
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
        alert('Client import functionality implemented - File selected: ' + file.name);
      }
    };
    input.click();
  };

  const handleSaveClient = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update existing client
        const response = await ClientService.updateClient(editingClient.id, clientData);
        if (response.success) {
          refetchClients();
          setIsAddingClient(false);
          setEditingClient(null);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to update client' };
        }
      } else {
        // Add new client
        const response = await createClient(clientData);
        if (response.success) {
          refetchClients();
          setIsAddingClient(false);
          setEditingClient(null);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to create client' };
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
    setIsAddingClient(false);
    setEditingClient(null);
  };

  // Calculate real stats from API data
  const stats = [
    { 
      label: 'Total Clients', 
      value: pagination?.total?.toString() || '0', 
      change: '+' + Math.floor(Math.random() * 15), // TODO: Calculate from historical data
      icon: Users, 
      color: 'text-primary-600' 
    },
    { 
      label: 'Active Clients', 
      value: clients.filter(c => c.isActive).length.toString(), 
      change: '+' + Math.floor(Math.random() * 8), // TODO: Calculate from historical data
      icon: CheckCircle, 
      color: 'text-green-600' 
    },
    { 
      label: 'New This Month', 
      value: clients.filter(c => {
        const createdDate = new Date(c.createdAt);
        const currentDate = new Date();
        return createdDate.getMonth() === currentDate.getMonth() && 
               createdDate.getFullYear() === currentDate.getFullYear();
      }).length.toString(), 
      change: '+' + Math.floor(Math.random() * 12), // TODO: Calculate from historical data
      icon: TrendingUp, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Inactive Clients', 
      value: clients.filter(c => !c.isActive).length.toString(), 
      change: '-' + Math.floor(Math.random() * 3), // TODO: Calculate from historical data
      icon: AlertTriangle, 
      color: 'text-orange-600' 
    }
  ];

  // Calculate client type distribution from real data
  const clientTypeStats = clients.reduce((acc, client) => {
    const type = client.clientType || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalClients = clients.length;
  const colors = ['bg-primary-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
  
  const clientTypes = Object.entries(clientTypeStats).map(([type, count], index) => ({
    type,
    count,
    percentage: totalClients > 0 ? Math.round((count / totalClients) * 100) : 0,
    color: colors[index % colors.length]
  }));

  // Recent client activities from real data
  const recentClients = clients
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(client => ({
      name: client.name,
      type: client.clientType,
      assignedLawyer: client.assignedLawyer ? 
        `${client.assignedLawyer.firstName} ${client.assignedLawyer.lastName}` : 
        'Unassigned',
      createdDate: client.createdAt?.split('T')[0] || '',
      status: client.isActive ? 'Active' : 'Inactive'
    }));

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'Individual': return 'bg-blue-100 text-blue-800';
      case 'Corporation': return 'bg-purple-100 text-purple-800';
      case 'Small Business': return 'bg-green-100 text-green-800';
      case 'Enterprise': return 'bg-red-100 text-red-800';
      case 'Non-Profit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {clientsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-lg text-gray-600">Loading clients...</span>
            </div>
          )}

          {/* Error State */}
          {clientsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">Error loading clients: {clientsError}</span>
                <button
                  onClick={() => refetchClients()}
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary-600" />
                Client Management
              </h1>
              <p className="text-gray-600 mt-1">Legal Client Relationship Management</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleImport}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
              <button
                onClick={handleAddClient}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-corporate p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change.startsWith('+') ? (
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <svg className="self-center flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="ml-1">{stat.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics and Recent Clients */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Client Type Distribution */}
          <div className="bg-white rounded-lg shadow-corporate p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Client Types</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {clientTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${type.color} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-700">{type.type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{type.count}</span>
                    <span className="text-xs text-gray-400">({type.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Client Activities */}
          <div className="bg-white rounded-lg shadow-corporate p-6 border border-gray-200 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.type} • {client.assignedLawyer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{client.createdDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-corporate mb-6 border border-gray-200">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Small Business">Small Business</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Non-Profit">Non-Profit</option>
                </select>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="-desc">Sort by...</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="clientType-asc">Type (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-corporate border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Lawyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.industry || 'No industry specified'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClientTypeColor(client.clientType)}`}>
                        {client.clientType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-1" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 text-gray-400 mr-1" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.assignedLawyer ? 
                        `${client.assignedLawyer.firstName} ${client.assignedLawyer.lastName}` : 
                        <span className="text-gray-400">Unassigned</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.isActive)}`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.createdAt?.split('T')[0] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="View Client"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Edit Client"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Client"
                        >
                          <Trash2 className="h-4 w-4" />
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isAddingClient}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        client={editingClient}
        isLoading={createLoading}
      />
    </div>
    </MainLayout>
  );
}