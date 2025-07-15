/**
 * useDebounced Hook Tests
 * Tests for the debounced search hook
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounced, useDebouncedSearch } from '../useDebounced';

// Mock timers
jest.useFakeTimers();

describe('useDebounced', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Functionality', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounced('initial', 300));
      
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      );
      
      expect(result.current).toBe('initial');
      
      // Change value
      rerender({ value: 'changed', delay: 300 });
      
      // Should still be initial value before delay
      expect(result.current).toBe('initial');
      
      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should now be changed value
      expect(result.current).toBe('changed');
    });

    it('should cancel previous timer when value changes quickly', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      );
      
      // First change
      rerender({ value: 'first', delay: 300 });
      
      // Second change before delay
      act(() => {
        jest.advanceTimersByTime(150);
      });
      rerender({ value: 'second', delay: 300 });
      
      // Third change before delay
      act(() => {
        jest.advanceTimersByTime(150);
      });
      rerender({ value: 'third', delay: 300 });
      
      // Should still be initial
      expect(result.current).toBe('initial');
      
      // Complete the delay
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should be the latest value
      expect(result.current).toBe('third');
    });
  });

  describe('Different Delay Values', () => {
    it('should work with different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 }
        }
      );
      
      rerender({ value: 'changed', delay: 500 });
      
      // Should not change before delay
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('initial');
      
      // Should change after delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('changed');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'initial', delay: 0 }
        }
      );
      
      rerender({ value: 'changed', delay: 0 });
      
      act(() => {
        jest.advanceTimersByTime(0);
      });
      
      expect(result.current).toBe('changed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: undefined, delay: 300 }
        }
      );
      
      expect(result.current).toBeUndefined();
      
      rerender({ value: 'defined', delay: 300 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('defined');
    });

    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: null, delay: 300 }
        }
      );
      
      expect(result.current).toBeNull();
      
      rerender({ value: 'not null', delay: 300 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('not null');
    });

    it('should handle object values', () => {
      const initialObj = { key: 'initial' };
      const changedObj = { key: 'changed' };
      
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: initialObj, delay: 300 }
        }
      );
      
      expect(result.current).toBe(initialObj);
      
      rerender({ value: changedObj, delay: 300 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(changedObj);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const { unmount, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      );
      
      rerender({ value: 'changed', delay: 300 });
      
      // Unmount before timer completes
      unmount();
      
      // Should not crash when timer would have fired
      act(() => {
        jest.advanceTimersByTime(300);
      });
    });
  });
});

describe('useDebouncedSearch', () => {
  const mockUpdateParams = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Functionality', () => {
    it('should update params after debounce delay', () => {
      renderHook(() => 
        useDebouncedSearch('search term', 'active', mockUpdateParams, 300)
      );
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'search term',
        status: 'active',
        page: 1
      });
    });

    it('should handle "all" filter by setting status to undefined', () => {
      renderHook(() => 
        useDebouncedSearch('search term', 'all', mockUpdateParams, 300)
      );
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'search term',
        status: undefined,
        page: 1
      });
    });

    it('should use default delay of 300ms', () => {
      renderHook(() => 
        useDebouncedSearch('search term', 'active', mockUpdateParams)
      );
      
      // Should not call before default delay
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(mockUpdateParams).not.toHaveBeenCalled();
      
      // Should call after default delay
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(mockUpdateParams).toHaveBeenCalled();
    });
  });

  describe('Parameter Changes', () => {
    it('should update params when search term changes', () => {
      const { rerender } = renderHook(
        ({ searchTerm, filter }) => 
          useDebouncedSearch(searchTerm, filter, mockUpdateParams, 300),
        {
          initialProps: { searchTerm: 'initial', filter: 'active' }
        }
      );
      
      rerender({ searchTerm: 'changed', filter: 'active' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'changed',
        status: 'active',
        page: 1
      });
    });

    it('should update params when filter changes', () => {
      const { rerender } = renderHook(
        ({ searchTerm, filter }) => 
          useDebouncedSearch(searchTerm, filter, mockUpdateParams, 300),
        {
          initialProps: { searchTerm: 'search', filter: 'active' }
        }
      );
      
      rerender({ searchTerm: 'search', filter: 'inactive' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'search',
        status: 'inactive',
        page: 1
      });
    });

    it('should debounce multiple rapid changes', () => {
      const { rerender } = renderHook(
        ({ searchTerm, filter }) => 
          useDebouncedSearch(searchTerm, filter, mockUpdateParams, 300),
        {
          initialProps: { searchTerm: 'initial', filter: 'all' }
        }
      );
      
      // Multiple rapid changes
      rerender({ searchTerm: 'first', filter: 'all' });
      act(() => { jest.advanceTimersByTime(100); });
      
      rerender({ searchTerm: 'second', filter: 'active' });
      act(() => { jest.advanceTimersByTime(100); });
      
      rerender({ searchTerm: 'final', filter: 'inactive' });
      act(() => { jest.advanceTimersByTime(300); });
      
      // Should only call once with final values
      expect(mockUpdateParams).toHaveBeenCalledTimes(1);
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'final',
        status: 'inactive',
        page: 1
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search term', () => {
      renderHook(() => 
        useDebouncedSearch('', 'active', mockUpdateParams, 300)
      );
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: '',
        status: 'active',
        page: 1
      });
    });

    it('should handle undefined search term', () => {
      renderHook(() => 
        useDebouncedSearch(undefined, 'active', mockUpdateParams, 300)
      );
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: undefined,
        status: 'active',
        page: 1
      });
    });

    it('should always reset page to 1', () => {
      renderHook(() => 
        useDebouncedSearch('search', 'active', mockUpdateParams, 300)
      );
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(mockUpdateParams).toHaveBeenCalledWith({
        search: 'search',
        status: 'active',
        page: 1
      });
    });
  });

  describe('Performance', () => {
    it('should not call updateParams unnecessarily', () => {
      const { rerender } = renderHook(
        ({ searchTerm, filter }) => 
          useDebouncedSearch(searchTerm, filter, mockUpdateParams, 300),
        {
          initialProps: { searchTerm: 'search', filter: 'active' }
        }
      );
      
      // Re-render with same props
      rerender({ searchTerm: 'search', filter: 'active' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should only call once, not twice
      expect(mockUpdateParams).toHaveBeenCalledTimes(1);
    });
  });
});