import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { VirtualizedList } from '@counselflow/ui/components/VirtualizedList';
import { debounce } from '@counselflow/ui/utils';
import CaseCard from './CaseCard';
import { LegalCase, filterCases, getUniqueValues } from '../../services/legal-data.service';

interface CaseListProps {
  cases: LegalCase[];
  onCreateCase?: () => void;
  onViewCase?: (id: string) => void;
  onEditCase?: (id: string) => void;
  onDeleteCase?: (id: string) => void;
}

interface Filters {
  search: string;
  country: string;
  module: string;
  status: string;
  priority: string;
}

const CaseList = React.memo<CaseListProps>(({
  cases,
  onCreateCase,
  onViewCase,
  onEditCase,
  onDeleteCase
}) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    country: '',
    module: '',
    status: '',
    priority: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filter options
  const filterOptions = useMemo(() => ({
    countries: getUniqueValues(cases, 'country'),
    modules: getUniqueValues(cases, 'module'),
    statuses: getUniqueValues(cases, 'status'),
    priorities: getUniqueValues(cases, 'priority')
  }), [cases]);

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    return filterCases(cases, filters);
  }, [cases, filters]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((search: string) => {
      setFilters(prev => ({ ...prev, search }));
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      country: '',
      module: '',
      status: '',
      priority: ''
    });
  }, []);

  const renderCaseItem = useCallback((case_: LegalCase, index: number) => (
    <div className="p-2" key={case_.id}>
      <CaseCard
        case_={case_}
        onView={onViewCase}
        onEdit={onEditCase}
        onDelete={onDeleteCase}
      />
    </div>
  ), [onViewCase, onEditCase, onDeleteCase]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Legal Cases</h2>
          <button
            onClick={onCreateCase}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </button>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search cases..."
              onChange={handleSearchChange}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Countries</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              
              <select
                value={filters.module}
                onChange={(e) => handleFilterChange('module', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Modules</option>
                {filterOptions.modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                {filterOptions.priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {filteredCases.length} of {cases.length} cases
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Virtualized Case List */}
      <div className="flex-1 overflow-hidden">
        {filteredCases.length > 0 ? (
          <VirtualizedList
            items={filteredCases}
            height={600}
            itemHeight={220}
            renderItem={renderCaseItem}
            className="p-2"
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">No cases found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters to see all cases
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CaseList.displayName = 'CaseList';

export default CaseList;