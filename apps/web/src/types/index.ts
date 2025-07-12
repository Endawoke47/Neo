// TypeScript Type Definitions
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  position?: string;
  department?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  barNumber?: string;
  jurisdictions: string[];
  specializations: string[];
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';

export type Plan = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  country: string;
  timezone: string;
  plan: Plan;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  role: TeamRole;
  permissions: string[];
  joinedAt: Date;
  user: User;
  organization: Organization;
}

// Authentication Types
export type TokenType = 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD' | 'VERIFY_EMAIL' | 'TWO_FACTOR';

export interface Token {
  id: string;
  token: string;
  type: TokenType;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Session {
  id: string;
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

// Legal Entity Types
export type Status = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

export interface Entity {
  id: string;
  organizationId: string;
  title: string;
  entityType: string;
  registrationNumber: string;
  jurisdiction: string;
  incorporationDate?: Date;
  status: Status;
  priority: Priority;
  description?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  parentEntityId?: string;
  parentEntity?: Entity;
  subsidiaries: Entity[];
  contracts: Contract[];
  events: CorporateEvent[];
  documents: Document[];
  activities: Activity[];
}

// Contract Management Types
export interface Contract {
  id: string;
  organizationId: string;
  title: string;
  contractNumber?: string;
  contractType: string;
  value: number;
  currency: string;
  executionDate?: Date;
  expiryDate?: Date;
  status: Status;
  priority: Priority;
  description?: string;
  content?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  entityId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  parties: ContractParty[];
  clauses: ContractClause[];
  milestones: ContractMilestone[];
  amendments: ContractAmendment[];
  documents: Document[];
  activities: Activity[];
  aiAnalyses: AIAnalysis[];
}

export interface ContractParty {
  id: string;
  contractId: string;
  name: string;
  role: string;
  type: string;
  contact?: string;
}

export interface ContractClause {
  id: string;
  contractId: string;
  clauseType: string;
  title: string;
  content: string;
  order: number;
}

export interface ContractMilestone {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  dueDate: Date;
  completedAt?: Date;
  value?: number;
  status: Status;
}

export interface ContractAmendment {
  id: string;
  contractId: string;
  amendmentNo: number;
  description: string;
  effectiveDate: Date;
  changes: Record<string, any>;
  createdById: string;
  createdAt: Date;
}

// Dispute Management Types
export interface Dispute {
  id: string;
  organizationId: string;
  title: string;
  caseNumber?: string;
  disputeType: string;
  court?: string;
  filingDate?: Date;
  status: Status;
  priority: Priority;
  claimAmount?: number;
  currency: string;
  description?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  parties: DisputeParty[];
  evidence: Evidence[];
  hearings: Hearing[];
  documents: Document[];
  activities: Activity[];
  aiAnalyses: AIAnalysis[];
}

export interface DisputeParty {
  id: string;
  disputeId: string;
  name: string;
  role: string;
  represented: boolean;
  counsel?: string;
}

export interface Evidence {
  id: string;
  disputeId: string;
  title: string;
  description?: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  hash: string;
  uploadedById: string;
  uploadedAt: Date;
  admissibility: string;
  privileged: boolean;
  confidential: boolean;
  chainOfCustody: CustodyEntry[];
  annotations: EvidenceAnnotation[];
}

export interface CustodyEntry {
  id: string;
  evidenceId: string;
  action: string;
  userId: string;
  details?: string;
  timestamp: Date;
  verified: boolean;
}

export interface EvidenceAnnotation {
  id: string;
  evidenceId: string;
  userId: string;
  text: string;
  pageNumber?: number;
  coordinates?: Record<string, any>;
  timestamp: Date;
}

export interface Hearing {
  id: string;
  disputeId: string;
  hearingDate: Date;
  hearingType: string;
  location?: string;
  judge?: string;
  outcome?: string;
  notes?: string;
}

// Matter Management Types
export interface Matter {
  id: string;
  organizationId: string;
  title: string;
  matterNumber?: string;
  matterType: string;
  client: string;
  value?: number;
  currency: string;
  status: Status;
  priority: Priority;
  deadline?: Date;
  description?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  team: MatterTeam[];
  tasks: Task[];
  documents: Document[];
  timeEntries: TimeEntry[];
  activities: Activity[];
}

export interface MatterTeam {
  id: string;
  matterId: string;
  userId: string;
  role: string;
}

// Risk Management Types
export interface Risk {
  id: string;
  organizationId: string;
  title: string;
  riskType: string;
  description: string;
  impact: string;
  likelihood: string;
  riskScore: number;
  status: Status;
  priority: Priority;
  owner?: string;
  mitigationPlan?: string;
  reviewDate?: Date;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  mitigations: RiskMitigation[];
  assessments: RiskAssessment[];
  activities: Activity[];
}

export interface RiskMitigation {
  id: string;
  riskId: string;
  action: string;
  responsibleUser?: string;
  dueDate?: Date;
  completedAt?: Date;
  status: Status;
}

export interface RiskAssessment {
  id: string;
  riskId: string;
  assessmentDate: Date;
  impact: string;
  likelihood: string;
  score: number;
  notes?: string;
  assessedById: string;
}

// Policy Management Types
export interface Policy {
  id: string;
  organizationId: string;
  title: string;
  policyNumber?: string;
  policyType: string;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
  status: Status;
  priority: Priority;
  description?: string;
  content?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  training: TrainingProgram[];
  violations: PolicyViolation[];
  reviews: PolicyReview[];
  documents: Document[];
  activities: Activity[];
}

export interface TrainingProgram {
  id: string;
  policyId: string;
  title: string;
  description?: string;
  type: string;
  duration: number;
  passingScore: number;
  validityPeriod?: number;
  content: Record<string, any>;
  certifications: UserCertification[];
}

export interface UserCertification {
  id: string;
  userId: string;
  programId: string;
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  score?: number;
  status: string;
  progress: number;
  certificateUrl?: string;
  attempts: number;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  reportedById: string;
  violatorId?: string;
  description: string;
  severity: string;
  status: Status;
  resolution?: string;
  reportedAt: Date;
  resolvedAt?: Date;
}

export interface PolicyReview {
  id: string;
  policyId: string;
  reviewerId: string;
  reviewDate: Date;
  nextReview: Date;
  changes?: string;
  approved: boolean;
}

// Document Management Types
export interface Document {
  id: string;
  organizationId: string;
  title: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  status: Status;
  tags: string[];
  metadata?: Record<string, any>;
  uploadedById: string;
  entityId?: string;
  contractId?: string;
  disputeId?: string;
  matterId?: string;
  policyId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  versions: DocumentVersion[];
  activities: Activity[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  changes?: string;
  uploadedById: string;
  uploadedAt: Date;
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  status: Status;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  assignedToId?: string;
  createdById: string;
  matterId?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Task[];
  parentTaskId?: string;
  activities: Activity[];
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  userId: string;
  matterId: string;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
  rate?: number;
  createdAt: Date;
}

// Activity & Audit Types
export interface Activity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Corporate Events Types
export interface CorporateEvent {
  id: string;
  entityId: string;
  type: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  attendees: string[];
  documents: string[];
  reminderDays: number;
  status: string;
  recurring?: string;
}

// AI & ML Types
export interface AIAnalysis {
  id: string;
  modelType: string;
  modelVersion: string;
  entityType: string;
  entityId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  processingTime: number;
  createdAt: Date;
}

export interface MLPattern {
  id: string;
  userId: string;
  action: string;
  module: string;
  context: Record<string, any>;
  timestamp: Date;
  outcome: string;
  timeSpent: number;
  sequence: string[];
}

// Billing & Payments Types
export interface Billing {
  id: string;
  organizationId: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  plan: Plan;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  billingId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  position?: string;
}

// Dashboard Types
export interface DashboardStats {
  activeMatters: number;
  revenue: number;
  aiActions: number;
  complianceScore: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: any[];
  aiInsights: any[];
  recentActivities: Activity[];
}

// AI Service Types
export interface AIServiceResponse {
  success: boolean;
  data: any;
  error?: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}
