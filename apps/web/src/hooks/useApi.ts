// Custom hooks for API data fetching
// Provides reusable hooks for common API operations with loading, error, and data states

import { useState, useEffect, useCallback } from 'react';
import {
  ClientService,
  MatterService,
  ContractService,
  DocumentService,
  DisputeService,
  EntityService,
  TaskService,
  AIService,
  DashboardService,
  UserService,
  Client,
  Matter,
  Contract,
  Document,
  Dispute,
  Entity,
  Task,
  AIAnalysis,
  DashboardStats,
  User,
  PaginatedResponse,
  ApiResponse
} from '../services/api.service';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Generic hook for paginated API calls
export function usePaginatedApi<T>(
  apiCall: (params?: any) => Promise<PaginatedResponse<T>>,
  initialParams: any = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0
  });
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams?: any) => {
    try {
      setLoading(true);
      setError(null);
      const currentParams = newParams || params;
      const response = await apiCall(currentParams);
      
      if (response.success) {
        setData(response.data);
        setPagination({
          page: response.page,
          total: response.total,
          totalPages: response.totalPages
        });
      } else {
        setError('Failed to fetch data');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      updateParams({ page: pagination.page + 1 });
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      updateParams({ page: pagination.page - 1 });
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      updateParams({ page });
    }
  };

  return {
    data,
    loading,
    error,
    pagination,
    params,
    updateParams,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchData()
  };
}

// Client hooks
export function useClients(params?: any) {
  return usePaginatedApi<Client>(ClientService.getClients, params);
}

export function useClient(id: string) {
  return useApi<Client>(() => ClientService.getClient(id), [id]);
}

export function useClientStats(options?: {
  startDate?: Date;
  endDate?: Date;
  compareStartDate?: Date;
  compareEndDate?: Date;
}) {
  return useApi<any>(() => ClientService.getClientStatsWithComparison(options), [options]);
}

// Matter hooks
export function useMatters(params?: any) {
  return usePaginatedApi<Matter>(MatterService.getMatters, params);
}

export function useMatter(id: string) {
  return useApi<Matter>(() => MatterService.getMatter(id), [id]);
}

// Contract hooks
export function useContracts(params?: any) {
  return usePaginatedApi<Contract>(ContractService.getContracts, params);
}

export function useContract(id: string) {
  return useApi<Contract>(() => ContractService.getContract(id), [id]);
}

export function useContractStats(options?: {
  startDate?: Date;
  endDate?: Date;
  compareStartDate?: Date;
  compareEndDate?: Date;
}) {
  return useApi<any>(() => ContractService.getContractStatsWithComparison(options), [options]);
}

// Document hooks
export function useDocuments(params?: any) {
  return usePaginatedApi<Document>(DocumentService.getDocuments, params);
}

export function useDocument(id: string) {
  return useApi<Document>(() => DocumentService.getDocument(id), [id]);
}

// Dispute hooks
export function useDisputes(params?: any) {
  return usePaginatedApi<Dispute>(DisputeService.getDisputes, params);
}

export function useDispute(id: string) {
  return useApi<Dispute>(() => DisputeService.getDispute(id), [id]);
}

// Entity hooks
export function useEntities(params?: any) {
  return usePaginatedApi<Entity>(EntityService.getEntities, params);
}

export function useEntity(id: string) {
  return useApi<Entity>(() => EntityService.getEntity(id), [id]);
}

// Task hooks
export function useTasks(params?: any) {
  return usePaginatedApi<Task>(TaskService.getTasks, params);
}

export function useTask(id: string) {
  return useApi<Task>(() => TaskService.getTask(id), [id]);
}

// Dashboard hooks
export function useDashboardStats() {
  return useApi<DashboardStats>(() => DashboardService.getStats());
}

export function useRecentActivity(limit?: number) {
  return useApi<any[]>(() => DashboardService.getRecentActivity(limit), [limit]);
}

export function useUpcomingDeadlines(limit?: number) {
  return useApi<any[]>(() => DashboardService.getUpcomingDeadlines(limit), [limit]);
}

export function useRiskAlerts(limit?: number) {
  return useApi<any[]>(() => DashboardService.getRiskAlerts(limit), [limit]);
}

export function usePerformanceMetrics(period?: string) {
  return useApi(() => DashboardService.getPerformanceMetrics(period), [period]);
}

// AI Analysis hooks
export function useAIAnalysisHistory(params?: any) {
  return useApi<AIAnalysis[]>(() => AIService.getAnalysisHistory(params), [params]);
}

export function useAIAnalysis(id: string) {
  return useApi<AIAnalysis>(() => AIService.getAnalysis(id), [id]);
}

export function useAIProviderStatus() {
  return useApi(() => AIService.getProviderStatus());
}

export function useAICapabilities() {
  return useApi(() => AIService.getCapabilities());
}

// User hooks
export function useUsers(params?: any) {
  return usePaginatedApi<User>(UserService.getUsers, params);
}

export function useUser(id: string) {
  return useApi<User>(() => UserService.getUser(id), [id]);
}

// Custom hooks for specific actions
export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = async (clientData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ClientService.createClient(clientData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create client');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createClient, loading, error };
}

export function useCreateMatter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatter = async (matterData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await MatterService.createMatter(matterData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create matter');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create matter';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createMatter, loading, error };
}

export function useCreateContract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContract = async (contractData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ContractService.createContract(contractData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create contract');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create contract';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createContract, loading, error };
}

export function useCreateDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDocument = async (documentData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await DocumentService.createDocument(documentData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create document');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create document';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createDocument, loading, error };
}

export function useUploadDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadDocument = async (file: File, metadata: any) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      
      const response = await DocumentService.uploadDocument(
        file, 
        metadata, 
        (progressPercent) => setProgress(progressPercent)
      );
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to upload document');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to upload document';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return { uploadDocument, loading, error, progress };
}

export function useCreateDispute() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDispute = async (disputeData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await DisputeService.createDispute(disputeData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create dispute');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create dispute';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createDispute, loading, error };
}

// Entity mutation hooks
export function useCreateEntity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEntity = async (entityData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await EntityService.createEntity(entityData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create entity');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create entity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createEntity, loading, error };
}

// Task mutation hooks
export function useCreateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (taskData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await TaskService.createTask(taskData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create task');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create task';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createTask, loading, error };
}

export function useUpdateTaskProgress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (taskId: string, progress: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await TaskService.updateTaskProgress(taskId, progress);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to update task progress');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to update task progress';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { updateProgress, loading, error };
}

// AI Analysis actions
export function useAnalyzeContract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContract = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AIService.analyzeContract(data);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to analyze contract');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to analyze contract';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { analyzeContract, loading, error };
}

export function usePerformLegalResearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performResearch = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AIService.performLegalResearch(data);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to perform research');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to perform research';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { performResearch, loading, error };
}