import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface Contract {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  value?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  clientId: string;
  assignedLawyerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContractFilters {
  search?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

interface ContractsResponse {
  success: boolean;
  data: Contract[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API service functions
const fetchContracts = async (filters: ContractFilters = {}): Promise<ContractsResponse> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/v1/contracts?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch contracts');
  }
  return response.json();
};

const fetchContract = async (id: string): Promise<Contract> => {
  const response = await fetch(`/api/v1/contracts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch contract');
  }
  const result = await response.json();
  return result.data;
};

const createContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract> => {
  const response = await fetch('/api/v1/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contractData),
  });
  if (!response.ok) {
    throw new Error('Failed to create contract');
  }
  const result = await response.json();
  return result.data;
};

const updateContract = async ({ id, ...data }: Partial<Contract> & { id: string }): Promise<Contract> => {
  const response = await fetch(`/api/v1/contracts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update contract');
  }
  const result = await response.json();
  return result.data;
};

const deleteContract = async (id: string): Promise<void> => {
  const response = await fetch(`/api/v1/contracts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete contract');
  }
};

// Query keys factory
export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: ContractFilters) => [...contractKeys.lists(), filters] as const,
  infinite: (filters: ContractFilters) => [...contractKeys.lists(), 'infinite', filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  documents: (id: string) => [...contractKeys.detail(id), 'documents'] as const,
};

// Custom hooks
export const useContracts = (filters: ContractFilters = {}) => {
  return useQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => fetchContracts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: useCallback((data: ContractsResponse) => ({
      contracts: data.data,
      pagination: data.pagination
    }), []),
  });
};

// Infinite query for large datasets
export const useInfiniteContracts = (filters: Omit<ContractFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: contractKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => fetchContracts({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev ? firstPage.pagination.currentPage - 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useContract = (id: string) => {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => fetchContract(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContract,
    onMutate: async (newContract) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractKeys.lists() });

      // Snapshot the previous value
      const previousContracts = queryClient.getQueryData(contractKeys.lists());

      // Optimistically update to the new value
      const optimisticContract = {
        ...newContract,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Return a context object with the snapshotted value
      return { previousContracts, optimisticContract };
    },
    onError: (err, newContract, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContracts) {
        queryClient.setQueryData(contractKeys.lists(), context.previousContracts);
      }
    },
    onSuccess: (createdContract) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      
      // Set the new contract in detail cache
      queryClient.setQueryData(contractKeys.detail(createdContract.id), createdContract);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContract,
    onMutate: async (updatedContract) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractKeys.detail(updatedContract.id) });

      // Snapshot the previous value
      const previousContract = queryClient.getQueryData(contractKeys.detail(updatedContract.id));

      // Optimistically update to the new value
      queryClient.setQueryData(contractKeys.detail(updatedContract.id), (old: Contract | undefined) => {
        if (!old) return old;
        return { ...old, ...updatedContract, updatedAt: new Date().toISOString() };
      });

      return { previousContract };
    },
    onError: (err, updatedContract, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousContract) {
        queryClient.setQueryData(contractKeys.detail(updatedContract.id), context.previousContract);
      }
    },
    onSuccess: (data, variables) => {
      // Update the contract in detail cache
      queryClient.setQueryData(contractKeys.detail(variables.id), data);
      
      // Invalidate list queries to ensure they show updated data
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContract,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractKeys.lists() });
      await queryClient.cancelQueries({ queryKey: contractKeys.detail(deletedId) });

      // Snapshot the previous values
      const previousLists = queryClient.getQueriesData({ queryKey: contractKeys.lists() });
      const previousContract = queryClient.getQueryData(contractKeys.detail(deletedId));

      // Optimistically remove from all list queries
      queryClient.setQueriesData({ queryKey: contractKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((contract: Contract) => contract.id !== deletedId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1
          }
        };
      });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: contractKeys.detail(deletedId) });

      return { previousLists, previousContract, deletedId };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, restore the previous state
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousContract) {
        queryClient.setQueryData(contractKeys.detail(deletedId), context.previousContract);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
};

// Prefetch hook for optimization
export const usePrefetchContract = () => {
  const queryClient = useQueryClient();

  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: contractKeys.detail(id),
      queryFn: () => fetchContract(id),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  }, [queryClient]);
};