import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { LegalCase, filterCases } from '../../services/legal-data.service';

// API service functions (replace with actual API calls)
const fetchLegalCases = async (): Promise<LegalCase[]> => {
  // Mock API call - replace with actual API
  const response = await fetch('/api/v1/legal-cases');
  if (!response.ok) {
    throw new Error('Failed to fetch legal cases');
  }
  return response.json();
};

const createLegalCase = async (caseData: Partial<LegalCase>): Promise<LegalCase> => {
  const response = await fetch('/api/v1/legal-cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData),
  });
  if (!response.ok) {
    throw new Error('Failed to create legal case');
  }
  return response.json();
};

const updateLegalCase = async ({ id, ...data }: Partial<LegalCase> & { id: string }): Promise<LegalCase> => {
  const response = await fetch(`/api/v1/legal-cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update legal case');
  }
  return response.json();
};

const deleteLegalCase = async (id: string): Promise<void> => {
  const response = await fetch(`/api/v1/legal-cases/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete legal case');
  }
};

// Query keys factory
export const legalCaseKeys = {
  all: ['legal-cases'] as const,
  lists: () => [...legalCaseKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...legalCaseKeys.lists(), filters] as const,
  details: () => [...legalCaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...legalCaseKeys.details(), id] as const,
};

// Custom hooks
export const useLegalCases = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: legalCaseKeys.list(filters),
    queryFn: fetchLegalCases,
    select: useCallback((data: LegalCase[]) => {
      return filterCases(data, filters);
    }, [filters]),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLegalCase = (id: string) => {
  return useQuery({
    queryKey: legalCaseKeys.detail(id),
    queryFn: async () => {
      const cases = await fetchLegalCases();
      const case_ = cases.find(c => c.id === id);
      if (!case_) {
        throw new Error('Legal case not found');
      }
      return case_;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateLegalCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLegalCase,
    onSuccess: (newCase) => {
      // Update the list cache
      queryClient.setQueryData(legalCaseKeys.all, (old: LegalCase[] = []) => [...old, newCase]);
      
      // Invalidate all list queries to ensure they refetch with new data
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create legal case:', error);
    },
  });
};

export const useUpdateLegalCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLegalCase,
    onSuccess: (updatedCase) => {
      // Update the specific case in cache
      queryClient.setQueryData(legalCaseKeys.detail(updatedCase.id), updatedCase);
      
      // Update the case in list cache
      queryClient.setQueryData(legalCaseKeys.all, (old: LegalCase[] = []) =>
        old.map(case_ => case_.id === updatedCase.id ? updatedCase : case_)
      );
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update legal case:', error);
    },
  });
};

export const useDeleteLegalCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLegalCase,
    onSuccess: (_, deletedId) => {
      // Remove from list cache
      queryClient.setQueryData(legalCaseKeys.all, (old: LegalCase[] = []) =>
        old.filter(case_ => case_.id !== deletedId)
      );
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: legalCaseKeys.detail(deletedId) });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete legal case:', error);
    },
  });
};

// Prefetch hook for optimization
export const usePrefetchLegalCase = () => {
  const queryClient = useQueryClient();

  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: legalCaseKeys.detail(id),
      queryFn: async () => {
        const cases = await fetchLegalCases();
        return cases.find(c => c.id === id);
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  }, [queryClient]);
};

// Optimistic update hook
export const useOptimisticUpdateCase = () => {
  const queryClient = useQueryClient();

  return useCallback((id: string, updates: Partial<LegalCase>) => {
    // Optimistically update the cache
    queryClient.setQueryData(legalCaseKeys.detail(id), (old: LegalCase | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });

    queryClient.setQueryData(legalCaseKeys.all, (old: LegalCase[] = []) =>
      old.map(case_ => case_.id === id ? { ...case_, ...updates } : case_)
    );
  }, [queryClient]);
};