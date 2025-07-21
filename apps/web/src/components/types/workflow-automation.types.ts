// Workflow Automation Types
// Defines the complete type system for workflow management and automation

export enum WorkflowType {
  DOCUMENT_REVIEW = 'document_review',
  CLIENT_ONBOARDING = 'client_onboarding',
  CASE_INTAKE = 'case_intake',
  LEGAL_RESEARCH = 'legal_research',
  CONTRACT_ANALYSIS = 'contract_analysis',
  COMPLIANCE_CHECK = 'compliance_check',
  MATTER_PREPARATION = 'matter_preparation',
  APPROVAL_PROCESS = 'approval_process',
  CUSTOM = 'custom'
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export enum WorkflowPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum WorkflowComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  ADVANCED = 'advanced'
}

export enum StepType {
  START = 'start',
  END = 'end',
  TASK = 'task',
  TASK_ASSIGNMENT = 'task_assignment',
  EMAIL_NOTIFICATION = 'email_notification',
  DOCUMENT_GENERATION = 'document_generation',
  APPROVAL_GATE = 'approval_gate',
  CONDITIONAL_BRANCH = 'conditional_branch',
  API_CALL = 'api_call',
  DATA_VALIDATION = 'data_validation',
  DECISION = 'decision',
  APPROVAL = 'approval',
  AUTOMATION = 'automation',
  NOTIFICATION = 'notification',
  DELAY = 'delay',
  CONDITION = 'condition',
  LOOP = 'loop',
  PARALLEL = 'parallel',
  MERGE = 'merge'
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
  WAITING_APPROVAL = 'waiting_approval'
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  status: StepStatus;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  config?: {
    assignee?: string;
    dueDate?: string;
    estimatedTime?: number;
    requiredApprovals?: number;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    automationScript?: string;
    notificationRecipients?: string[];
    delayDuration?: number;
  };
  dependencies: string[];
  outputs: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  type: WorkflowType;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  complexity: WorkflowComplexity;
  version: string;
  steps: WorkflowStep[];
  connections: Array<{
    source: string;
    target: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>;
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event';
    config: Record<string, any>;
  }>;
  variables: Record<string, {
    type: string;
    defaultValue?: any;
    description?: string;
  }>;
  settings: {
    timeout?: number;
    retryCount?: number;
    notifyOnError?: boolean;
    allowParallelExecution?: boolean;
  };
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt?: string;
    tags: string[];
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  stepExecutions: Array<{
    stepId: string;
    status: StepStatus;
    startedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
    assignee?: string;
  }>;
  variables: Record<string, any>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    stepId?: string;
  }>;
  metadata: {
    triggeredBy: string;
    triggeredAt: string;
    context?: Record<string, any>;
  };
}
