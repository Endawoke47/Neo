// API Service
// Centralized service for all API calls to the backend

import { apiClient } from '../lib/api-client';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  message?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  firm?: string;
  specialization?: string;
  barNumber?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  clientType: string;
  industry?: string;
  notes?: string;
  isActive: boolean;
  assignedLawyerId: string;
  assignedLawyer?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Matter {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  riskLevel: string;
  estimatedValue?: number;
  billableHours: number;
  statute_of_limitations?: string;
  clientId: string;
  client?: Client;
  assignedLawyerId: string;
  assignedLawyer?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  value?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  autoRenewal: boolean;
  renewalPeriod?: string;
  clientId: string;
  client?: Client;
  assignedLawyerId: string;
  assignedLawyer?: User;
  aiAnalyses?: AIAnalysisResult[];
  _count?: {
    documents: number;
    aiAnalyses: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysisResult {
  id: string;
  type: string;
  status: string;
  output?: string;
  confidence?: number;
  completedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  isConfidential: boolean;
  tags?: string[];
  uploadedById: string;
  uploadedBy?: User;
  clientId?: string;
  client?: Client;
  matterId?: string;
  matter?: Matter;
  contractId?: string;
  contract?: Contract;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  riskLevel: string;
  claimAmount?: number;
  currency: string;
  courtName?: string;
  caseNumber?: string;
  timeline?: string;
  matterId?: string;
  matter?: Matter;
  clientId: string;
  client?: Client;
  assignedLawyerId: string;
  assignedLawyer?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  status: string;
  incorporationDate?: string;
  lastFiling?: string;
  compliance: number;
  subsidiaries: number;
  riskLevel: string;
  clientId?: string;
  client?: Client;
  parentEntityId?: string;
  parentEntity?: Entity;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  category?: string;
  tags?: string[];
  assignedToId: string;
  assignedTo?: User;
  matterId?: string;
  matter?: Matter;
  contractId?: string;
  contract?: Contract;
  clientId?: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AIAnalysis {
  id: string;
  title: string;
  type: string;
  status: string;
  input?: any;
  output?: any;
  confidence?: number;
  model?: string;
  processingTime?: number;
  tokensUsed?: number;
  cost?: number;
  requestedById: string;
  requestedBy?: User;
  contractId?: string;
  contract?: Contract;
  matterId?: string;
  matter?: Matter;
  documentId?: string;
  document?: Document;
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalClients: number;
  totalMatters: number;
  totalContracts: number;
  totalDocuments: number;
  totalDisputes: number;
  activeMatters: number;
  pendingContracts: number;
  openDisputes: number;
  monthlyRevenue: number;
  recentActivity: any[];
  upcomingDeadlines: any[];
  riskAlerts: any[];
}

// Auth Service
export class AuthService {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: any }>> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  }

  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    firm?: string;
    specialization?: string;
    barNumber?: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User; tokens: any }>> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  static async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: any }>> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  static async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  }

  static async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  static async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.put('/auth/me', userData);
    return response.data;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  static async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }
}

// Client Service
export class ClientService {
  static async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    clientType?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Client>> {
    const response = await apiClient.get('/clients', { params });
    return response.data;
  }

  static async getClient(id: string): Promise<ApiResponse<Client>> {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  }

  static async createClient(clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    clientType: string;
    industry?: string;
    notes?: string;
    assignedLawyerId?: string;
  }): Promise<ApiResponse<Client>> {
    const response = await apiClient.post('/clients', clientData);
    return response.data;
  }

  static async updateClient(id: string, clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data;
  }

  static async deleteClient(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  }

  static async getClientStatsWithComparison(options?: {
    startDate?: Date;
    endDate?: Date;
    compareStartDate?: Date;
    compareEndDate?: Date;
  }): Promise<ApiResponse<any>> {
    const params: any = {};
    if (options?.startDate) params.startDate = options.startDate.toISOString();
    if (options?.endDate) params.endDate = options.endDate.toISOString();
    if (options?.compareStartDate) params.compareStartDate = options.compareStartDate.toISOString();
    if (options?.compareEndDate) params.compareEndDate = options.compareEndDate.toISOString();
    
    const response = await apiClient.get('/clients/stats', { params });
    return response.data;
  }

  static async bulkImportClients(clients: any[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/clients/bulk', { clients });
    return response.data;
  }
}

// Matter Service
export class MatterService {
  static async getMatters(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    clientId?: string;
  }): Promise<PaginatedResponse<Matter>> {
    const response = await apiClient.get('/matters', { params });
    return response.data;
  }

  static async getMatter(id: string): Promise<ApiResponse<Matter>> {
    const response = await apiClient.get(`/matters/${id}`);
    return response.data;
  }

  static async createMatter(matterData: {
    title: string;
    description?: string;
    type: string;
    status?: string;
    priority?: string;
    riskLevel?: string;
    estimatedValue?: number;
    clientId: string;
    assignedLawyerId: string;
    statute_of_limitations?: string;
  }): Promise<ApiResponse<Matter>> {
    const response = await apiClient.post('/matters', matterData);
    return response.data;
  }

  static async updateMatter(id: string, matterData: Partial<Matter>): Promise<ApiResponse<Matter>> {
    const response = await apiClient.put(`/matters/${id}`, matterData);
    return response.data;
  }

  static async deleteMatter(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/matters/${id}`);
    return response.data;
  }
}

// Contract Service
export class ContractService {
  static async getContracts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    clientId?: string;
  }): Promise<PaginatedResponse<Contract>> {
    const response = await apiClient.get('/contracts', { params });
    return response.data;
  }

  static async getContract(id: string): Promise<ApiResponse<Contract>> {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  }

  static async createContract(contractData: {
    title: string;
    description?: string;
    type: string;
    status?: string;
    value?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    autoRenewal?: boolean;
    renewalPeriod?: string;
    clientId: string;
    assignedLawyerId: string;
  }): Promise<ApiResponse<Contract>> {
    const response = await apiClient.post('/contracts', contractData);
    return response.data;
  }

  static async updateContract(id: string, contractData: Partial<Contract>): Promise<ApiResponse<Contract>> {
    const response = await apiClient.put(`/contracts/${id}`, contractData);
    return response.data;
  }

  static async deleteContract(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  }

  static async getContractStatsWithComparison(options?: {
    startDate?: Date;
    endDate?: Date;
    compareStartDate?: Date;
    compareEndDate?: Date;
  }): Promise<ApiResponse<any>> {
    const params: any = {};
    if (options?.startDate) params.startDate = options.startDate.toISOString();
    if (options?.endDate) params.endDate = options.endDate.toISOString();
    if (options?.compareStartDate) params.compareStartDate = options.compareStartDate.toISOString();
    if (options?.compareEndDate) params.compareEndDate = options.compareEndDate.toISOString();
    
    const response = await apiClient.get('/contracts/stats', { params });
    return response.data;
  }
}

// Document Service
export class DocumentService {
  static async getDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    category?: string;
    clientId?: string;
    matterId?: string;
    contractId?: string;
  }): Promise<PaginatedResponse<Document>> {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  }

  static async getDocument(id: string): Promise<ApiResponse<Document>> {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  }

  static async createDocument(documentData: {
    title: string;
    description?: string;
    type: string;
    category?: string;
    isConfidential?: boolean;
    tags?: string[];
    clientId?: string;
    matterId?: string;
    contractId?: string;
  }): Promise<ApiResponse<Document>> {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  }

  static async updateDocument(id: string, documentData: Partial<Document>): Promise<ApiResponse<Document>> {
    const response = await apiClient.put(`/documents/${id}`, documentData);
    return response.data;
  }

  static async deleteDocument(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  }

  static async uploadDocument(file: File, metadata: {
    title: string;
    description?: string;
    type: string;
    category?: string;
    isConfidential?: boolean;
    tags?: string[];
    clientId?: string;
    matterId?: string;
    contractId?: string;
  }, onProgress?: (progress: number) => void): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  static async downloadDocument(id: string): Promise<void> {
    await apiClient.downloadFile(`/documents/${id}/download`);
  }
}

// Dispute Service
export class DisputeService {
  static async getDisputes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    matterId?: string;
    clientId?: string;
  }): Promise<PaginatedResponse<Dispute>> {
    const response = await apiClient.get('/disputes', { params });
    return response.data;
  }

  static async getDispute(id: string): Promise<ApiResponse<Dispute>> {
    const response = await apiClient.get(`/disputes/${id}`);
    return response.data;
  }

  static async createDispute(disputeData: {
    title: string;
    description?: string;
    type: string;
    status?: string;
    priority?: string;
    riskLevel?: string;
    claimAmount?: number;
    currency?: string;
    courtName?: string;
    caseNumber?: string;
    timeline?: string;
    matterId?: string;
    clientId: string;
    assignedLawyerId: string;
  }): Promise<ApiResponse<Dispute>> {
    const response = await apiClient.post('/disputes', disputeData);
    return response.data;
  }

  static async updateDispute(id: string, disputeData: Partial<Dispute>): Promise<ApiResponse<Dispute>> {
    const response = await apiClient.put(`/disputes/${id}`, disputeData);
    return response.data;
  }

  static async deleteDispute(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/disputes/${id}`);
    return response.data;
  }
}

// Entity Service
export class EntityService {
  static async getEntities(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    jurisdiction?: string;
    clientId?: string;
  }): Promise<PaginatedResponse<Entity>> {
    const response = await apiClient.get('/entities', { params });
    return response.data;
  }

  static async getEntity(id: string): Promise<ApiResponse<Entity>> {
    const response = await apiClient.get(`/entities/${id}`);
    return response.data;
  }

  static async createEntity(entityData: {
    name: string;
    type: string;
    jurisdiction: string;
    status?: string;
    incorporationDate?: string;
    lastFiling?: string;
    compliance?: number;
    subsidiaries?: number;
    riskLevel?: string;
    clientId?: string;
    parentEntityId?: string;
  }): Promise<ApiResponse<Entity>> {
    const response = await apiClient.post('/entities', entityData);
    return response.data;
  }

  static async updateEntity(id: string, entityData: Partial<Entity>): Promise<ApiResponse<Entity>> {
    const response = await apiClient.put(`/entities/${id}`, entityData);
    return response.data;
  }

  static async deleteEntity(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/entities/${id}`);
    return response.data;
  }
}

// Task Service
export class TaskService {
  static async getTasks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    matterId?: string;
    contractId?: string;
    clientId?: string;
  }): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  }

  static async getTask(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  }

  static async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    estimatedHours?: number;
    category?: string;
    tags?: string[];
    assignedToId: string;
    matterId?: string;
    contractId?: string;
    clientId?: string;
  }): Promise<ApiResponse<Task>> {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  }

  static async updateTask(id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    const response = await apiClient.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  static async deleteTask(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  }

  static async updateTaskProgress(id: string, progress: number): Promise<ApiResponse<Task>> {
    const response = await apiClient.put(`/tasks/${id}/progress`, { progress });
    return response.data;
  }

  static async completeTask(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.put(`/tasks/${id}/complete`);
    return response.data;
  }
}

// AI Service
export class AIService {
  static async analyzeContract(data: {
    contractId: string;
    analysisType?: string;
    jurisdiction?: string;
    focusAreas?: string[];
  }): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.post('/ai/analyze/contract', data);
    return response.data;
  }

  static async analyzeDocument(data: {
    documentId: string;
    analysisType?: string;
    extractionTargets?: string[];
  }): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.post('/ai/analyze/document', data);
    return response.data;
  }

  static async performLegalResearch(data: {
    query: string;
    jurisdiction?: string;
    practiceArea?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
    sources?: string[];
  }): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.post('/ai/research/comprehensive', data);
    return response.data;
  }

  static async predictMatterOutcome(data: {
    matterId: string;
    predictionType?: string;
    factorsToConsider?: string[];
  }): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.post('/ai/predict/matter', data);
    return response.data;
  }

  static async performComplianceCheck(data: {
    entityType: string;
    entityId: string;
    regulations?: string[];
    jurisdiction?: string;
  }): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.post('/ai/check/compliance', data);
    return response.data;
  }

  static async getAnalysisHistory(params?: {
    entityType?: string;
    entityId?: string;
  }): Promise<ApiResponse<AIAnalysis[]>> {
    const response = await apiClient.get('/ai/history', { params });
    return response.data;
  }

  static async getAnalysis(id: string): Promise<ApiResponse<AIAnalysis>> {
    const response = await apiClient.get(`/ai/analysis/${id}`);
    return response.data;
  }

  static async getProviderStatus(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/ai/providers/status');
    return response.data;
  }

  static async getCapabilities(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/ai/capabilities');
    return response.data;
  }

  static async healthCheck(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/ai/health');
    return response.data;
  }
}

// Dashboard Service
export class DashboardService {
  static async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  }

  static async getRecentActivity(limit?: number): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/dashboard/activity', { params: { limit } });
    return response.data;
  }

  static async getUpcomingDeadlines(limit?: number): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/dashboard/deadlines', { params: { limit } });
    return response.data;
  }

  static async getRiskAlerts(limit?: number): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/dashboard/risks', { params: { limit } });
    return response.data;
  }

  static async getPerformanceMetrics(period?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/dashboard/performance', { params: { period } });
    return response.data;
  }
}

// User Service
export class UserService {
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  }

  static async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  }

  static async deactivateUser(id: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/users/${id}/deactivate`);
    return response.data;
  }

  static async activateUser(id: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/users/${id}/activate`);
    return response.data;
  }
}