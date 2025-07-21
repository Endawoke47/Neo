'use client';

import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { DollarSign, Plus, Search, Download, Upload, Edit3, Trash2, Users, FileText } from 'lucide-react';

interface Vendor {  id: string;  name: string;  type: string;  location: string;  status: string;  totalSpend: number;  performanceRating: number;}interface LegalSpend {  id: string;  vendorName: string;  matter: string;  practiceArea: string;  amount: number;  status: string;  invoiceDate: string;  dueDate: string;}export default function OutsourcingLegalSpendPage() {  const [searchTerm, setSearchTerm] = useState('');  const [selectedFilter, setSelectedFilter] = useState('all');  const [activeTab, setActiveTab] = useState('vendors');  const [vendors] = useState<Vendor[]>([    {      id: 'VND001',      name: 'Kaplan & Stratton Advocates',      type: 'Law Firm',      location: 'Nairobi, Kenya',      status: 'Active',      totalSpend: 2850000,      performanceRating: 4.7    },    {      id: 'VND002',      name: 'Muthaura & Associates',      type: 'Boutique Firm',      location: 'Nairobi, Kenya',      status: 'Active',      totalSpend: 1650000,      performanceRating: 4.3    }  ]);  const [legalSpend] = useState<LegalSpend[]>([    {      id: 'INV001',      vendorName: 'Kaplan & Stratton Advocates',      matter: 'TechCorp Acquisition',      practiceArea: 'Corporate Law',      amount: 450000,      status: 'Paid',      invoiceDate: '2024-11-15',      dueDate: '2024-12-15'    },    {      id: 'INV002',      vendorName: 'Muthaura & Associates',      matter: 'Employment Policy Review',      practiceArea: 'Employment Law',      amount: 180000,      status: 'Pending',      invoiceDate: '2024-11-20',      dueDate: '2024-12-05'    }  ]);  const getStatusColor = (status: string) => {    switch (status) {      case 'Active': return 'bg-green-100 text-green-800';      case 'Paid': return 'bg-green-100 text-green-800';      case 'Pending': return 'bg-yellow-100 text-yellow-800';      default: return 'bg-gray-100 text-gray-800';    }  };  const renderStars = (rating: number, vendorId?: string) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={`star-${vendorId || ''}-${index}`}
        className={`text-sm ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && vendor.status.toLowerCase() === selectedFilter;
  });

  const filteredSpend = legalSpend.filter(spend => {
    const matchesSearch = spend.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && spend.status.toLowerCase() === selectedFilter;
  });

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="mr-3 h-8 w-8 text-green-600" />
                Outsourcing & Legal Spend
              </h1>
              <p className="text-gray-600 mt-1">Vendor Management & Legal Spend Analytics</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add {activeTab === 'vendors' ? 'Vendor' : 'Expense'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg text-green-600 bg-opacity-10">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Legal Spend</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">KES 4.5M</p>
                  <span className="ml-2 text-sm text-green-600">+12%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg text-primary-600 bg-opacity-10">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">8</p>
                  <span className="ml-2 text-sm text-gray-500">12 total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('vendors')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'vendors'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Vendors & Providers
              </button>
              <button
                onClick={() => setActiveTab('spend')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'spend'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Legal Spend & Invoices
              </button>
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab === 'vendors' ? 'vendors' : 'legal spend'}...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tables */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'vendors' ? 'Vendor Directory' : 'Legal Spend Tracking'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'vendors' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                            <div className="text-sm text-gray-500">{vendor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        KES {(vendor.totalSpend / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {renderStars(vendor.performanceRating, vendor.id)}
                          <span className="ml-2 text-sm text-gray-600">{vendor.performanceRating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSpend.map((spend) => (
                    <tr key={spend.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{spend.id}</div>
                            <div className="text-sm text-gray-500">{spend.practiceArea}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{spend.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{spend.matter}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        KES {spend.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(spend.status)}`}>
                          {spend.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{spend.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
                      </div>
      </div>
    </MainLayout>
  );
}

