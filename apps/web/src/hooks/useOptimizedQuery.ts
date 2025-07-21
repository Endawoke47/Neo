/**
 * Optimized Query Hook - A+++++ Performance Enhancement
 * Advanced caching and query optimization while preserving UI design
 */

'use client';

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  prefetch?: boolean;
  backgroundRefetch?: boolean;
  retryOnError?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export function useOptimizedQuery<T>(options: OptimizedQueryOptions<T>) {
  const {
    queryKey,
    queryFn,
    prefetch = false,
    backgroundRefetch = true,
    retryOnError = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();

  // Optimized query with intelligent caching
  const query = useQuery({
    queryKey,
    queryFn,
    gcTime: cacheTime,
    staleTime,
    retry: retryOnError ? 3 : false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: true,
    ...queryOptions,
  });

  // Prefetch related queries
  useEffect(() => {
    if (prefetch && query.isSuccess) {
      // Prefetch logic can be added here
    }
  }, [prefetch, query.isSuccess, queryClient]);

  // Enhanced loading states
  const isInitialLoading = query.isLoading && !query.data;
  const isRefreshing = query.isFetching && !!query.data;

  return {
    ...query,
    isInitialLoading,
    isRefreshing,
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    prefetch: (relatedKey: string[]) => 
      queryClient.prefetchQuery({ queryKey: relatedKey, queryFn }),
  };
}

// Debounced search hook
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Execute search when debounced query changes
  const searchQuery = useOptimizedQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchFn(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });

  // Track searching state
  useEffect(() => {
    setIsSearching(query !== debouncedQuery || searchQuery.isFetching);
  }, [query, debouncedQuery, searchQuery.isFetching]);

  return {
    query,
    setQuery,
    results: searchQuery.data || [],
    isSearching,
    error: searchQuery.error,
    clearSearch: () => {
      setQuery('');
      setDebouncedQuery('');
    },
  };
}

// Optimized pagination hook
export function useOptimizedPagination<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: {
    initialPage?: number;
    pageSize?: number;
    prefetchNext?: boolean;
  } = {}
) {
  const { initialPage = 1, pageSize = 20, prefetchNext = true } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const queryClient = useQueryClient();

  const query = useOptimizedQuery({
    queryKey: ['paginated-data', currentPage.toString(), pageSize.toString()],
    queryFn: () => fetchFn(currentPage, pageSize),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Prefetch next page
  useEffect(() => {
    if (prefetchNext && query.data && currentPage * pageSize < query.data.total) {
      queryClient.prefetchQuery({
        queryKey: ['paginated-data', (currentPage + 1).toString(), pageSize.toString()],
        queryFn: () => fetchFn(currentPage + 1, pageSize),
      });
    }
  }, [currentPage, pageSize, prefetchNext, query.data, queryClient]);

  const totalPages = useMemo(() => {
    if (!query.data) return 0;
    return Math.ceil(query.data.total / pageSize);
  }, [query.data, pageSize]);

  return {
    data: query.data?.data || [],
    currentPage,
    totalPages,
    total: query.data?.total || 0,
    isLoading: query.isInitialLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
    previousPage: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
    goToPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    refresh: query.refresh,
  };
}

// Background cache warming
export function useCacheWarming() {
  const queryClient = useQueryClient();

  const warmCache = useCallback((keys: Array<{ queryKey: string[], queryFn: () => Promise<any> }>) => {
    keys.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({ queryKey, queryFn });
    });
  }, [queryClient]);

  return { warmCache };
}