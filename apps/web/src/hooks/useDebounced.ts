import { useState, useEffect } from 'react';

/**
 * Universal debounced value hook
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounced<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Universal debounced search hook with automatic API parameter updates
 * @param searchTerm - Current search term
 * @param selectedFilter - Current filter value
 * @param updateParams - Function to update API parameters
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export function useDebouncedSearch(
  searchTerm: string,
  selectedFilter: string,
  updateParams: (params: any) => void,
  delay: number = 300
) {
  const debouncedSearchTerm = useDebounced(searchTerm, delay);
  const debouncedFilter = useDebounced(selectedFilter, delay);

  useEffect(() => {
    updateParams({
      search: debouncedSearchTerm,
      status: debouncedFilter === 'all' ? undefined : debouncedFilter,
      page: 1
    });
  }, [debouncedSearchTerm, debouncedFilter, updateParams]);
}