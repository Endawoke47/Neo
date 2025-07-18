/**
 * Enhanced Table - A+++++ Performance
 * High-performance table with your existing design aesthetics
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { VirtualizedList } from '../performance/VirtualizedList';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  className?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  onRowClick?: (row: T, index: number) => void;
  emptyState?: React.ReactNode;
}

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  className = "",
  searchable = false,
  filterable = false,
  sortable = true,
  pagination = false,
  rowHeight = 60,
  maxHeight = 400,
  onRowClick,
  emptyState
}: EnhancedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig && sortable) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, filters, searchable, sortable]);

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, [sortable]);

  // Render table header
  const renderHeader = () => (
    <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
        {columns.map((column, index) => (
          <div
            key={String(column.key) + index}
            className={`text-left text-xs font-medium text-neutral-500 uppercase tracking-wider ${column.className || ''}`}
          >
            {column.sortable !== false && sortable ? (
              <button
                onClick={() => handleSort(String(column.key))}
                className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
              >
                <span>{column.header}</span>
                {sortConfig?.key === column.key ? (
                  sortConfig.direction === 'asc' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )
                ) : (
                  <div className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span>{column.header}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render table row
  const renderRow = useCallback((row: T, index: number) => (
    <div
      className={`bg-white border-b border-neutral-100 px-4 py-3 hover:bg-neutral-50 transition-colors ${
        onRowClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onRowClick?.(row, index)}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
        {columns.map((column, colIndex) => {
          const value = row[column.key as keyof T];
          return (
            <div
              key={String(column.key) + colIndex}
              className={`text-sm text-neutral-900 ${column.className || ''}`}
            >
              {column.render ? column.render(value, row, index) : String(value || '')}
            </div>
          );
        })}
      </div>
    </div>
  ), [columns, onRowClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 ${className}`}>
        <LoadingSkeleton type="table" rows={5} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden ${className}`}>
      {/* Search and Filter Bar */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
            {filterable && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">Filters</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Header */}
      {renderHeader()}

      {/* Table Body */}
      {processedData.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {emptyState || <p>No data available</p>}
        </div>
      ) : (
        <VirtualizedList
          items={processedData}
          itemHeight={rowHeight}
          containerHeight={maxHeight}
          renderItem={renderRow}
          className="divide-y divide-neutral-100"
        />
      )}
    </div>
  );
}

// Enhanced table with built-in pagination
export function PaginatedTable<T extends Record<string, any>>(
  props: EnhancedTableProps<T> & {
    pageSize?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    totalCount?: number;
  }
) {
  const {
    pageSize = 20,
    currentPage = 1,
    onPageChange,
    totalCount,
    data,
    ...tableProps
  } = props;

  const paginatedData = useMemo(() => {
    if (!props.pagination) return data;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, props.pagination]);

  const totalPages = Math.ceil((totalCount || data.length) / pageSize);

  return (
    <div>
      <EnhancedTable {...tableProps} data={paginatedData} />
      
      {props.pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount || data.length)} of {totalCount || data.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}