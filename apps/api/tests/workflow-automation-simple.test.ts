// Legal Workflow Automation Tests - Simplified Version
// Phase 3: Feature 1 - Basic functionality tests for workflow automation service

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { WorkflowAutomationService } from '../src/services/workflow-automation.service';
import {
  WorkflowType,
  WorkflowStatus,
  WorkflowPriority,
  WorkflowComplexity,
  StepType,
  StepStatus,
  TriggerType,
  AnalyticsPeriod
} from '../src/types/workflow-automation.types';
import { LegalJurisdiction, SupportedLanguage } from '../src/types/ai.types';
import { LegalArea } from '../src/types/legal-research.types';

describe('WorkflowAutomationService', () => {
  let workflowService: WorkflowAutomationService;

  beforeEach(() => {
    workflowService = new WorkflowAutomationService();
  });

  // ============================================================================
  // BASIC WORKFLOW TESTS
  // ============================================================================

  describe('Basic Workflow Operations', () => {
    it('should create a simple workflow', async () => {
      const simpleWorkflow = {
        name: 'Simple Test Workflow',
        description: 'A basic workflow for testing',
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.SIMPLE,
        jurisdiction: LegalJurisdiction.SOUTH_AFRICA,
        legalArea: LegalArea.CORPORATE,
        version: '1.0.0',
        tags: ['test'],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: {
            maxRetries: 2,
            retryDelay: 1000
          }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false,
        steps: [
          {
            id: 'start',
            name: 'Start',
            description: 'Start the workflow',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            estimatedDuration: 0,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            description: 'End the workflow',
            type: StepType.END,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            estimatedDuration: 0,
            dependencies: ['start'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      const result = await workflowService.createWorkflow(simpleWorkflow);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Simple Test Workflow');
      expect(result.type).toBe(WorkflowType.CASE_INTAKE);
      expect(result.steps).toHaveLength(2);
      expect(result.usageCount).toBe(0);
    });

    it('should list workflows', async () => {
      // Create a test workflow first
      const testWorkflow = {
        name: 'Test List Workflow',
        type: WorkflowType.DOCUMENT_GENERATION,
        category: 'TEST',
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['start'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.SIMPLE,
        version: '1.0.0',
        tags: [],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: { maxRetries: 2, retryDelay: 1000 }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false
      };

      await workflowService.createWorkflow(testWorkflow);
      
      const result = await workflowService.listWorkflows();
      
      expect(result).toBeDefined();
      expect(result.workflows).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.workflows.length).toBeGreaterThan(0);
    });

    it('should get workflow by ID', async () => {
      const testWorkflow = {
        name: 'Get By ID Test',
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['start'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.SIMPLE,
        version: '1.0.0',
        tags: [],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: { maxRetries: 2, retryDelay: 1000 }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false
      };

      const created = await workflowService.createWorkflow(testWorkflow);
      const retrieved = await workflowService.getWorkflow(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe('Get By ID Test');
    });

    it('should return null for non-existent workflow', async () => {
      const result = await workflowService.getWorkflow('non-existent-id');
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // WORKFLOW EXECUTION TESTS
  // ============================================================================

  describe('Workflow Execution', () => {
    let testWorkflow: any;

    beforeEach(async () => {
      testWorkflow = await workflowService.createWorkflow({
        name: 'Execution Test Workflow',
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        priority: WorkflowPriority.HIGH,
        complexity: WorkflowComplexity.SIMPLE,
        version: '1.0.0',
        tags: [],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: { maxRetries: 2, retryDelay: 1000 }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false,
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'task',
            name: 'Task',
            type: StepType.TASK_ASSIGNMENT,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['start'],
            config: {
              assignedTo: ['user1'],
              description: 'Test task'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            order: 3,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['task'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });
    });

    it('should execute a workflow', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        priority: WorkflowPriority.HIGH,
        variables: { test: 'value' },
        context: {
          userId: 'test-user',
          organizationId: 'test-org'
        }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      
      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.status).toBe(WorkflowStatus.ACTIVE);
      expect(result.message).toContain('started');
    });

    it('should handle non-existent workflow execution', async () => {
      const executionRequest = {
        workflowId: 'non-existent',
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      
      expect(result.status).toBe(WorkflowStatus.ERROR);
      expect(result.message).toContain('not found');
    });

    it('should get execution status', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      const status = await workflowService.getExecutionStatus(result.executionId);
      
      expect(status).toBeDefined();
      expect(status!.id).toBe(result.executionId);
      expect(status!.workflowDefinitionId).toBe(testWorkflow.id);
    });

    it('should cancel execution', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      const cancelled = await workflowService.cancelExecution(result.executionId);
      
      expect(cancelled).toBe(true);
      
      const status = await workflowService.getExecutionStatus(result.executionId);
      expect(status!.status).toBe(WorkflowStatus.CANCELLED);
    });
  });

  // ============================================================================
  // ANALYTICS TESTS
  // ============================================================================

  describe('Workflow Analytics', () => {
    it('should generate analytics', async () => {
      const analytics = await workflowService.getWorkflowAnalytics({
        period: AnalyticsPeriod.LAST_30_DAYS
      });
      
      expect(analytics).toBeDefined();
      expect(analytics.analytics).toBeDefined();
      expect(analytics.summary).toBeDefined();
      expect(analytics.recommendations).toBeDefined();
      expect(Array.isArray(analytics.analytics)).toBe(true);
      expect(Array.isArray(analytics.recommendations)).toBe(true);
    });

    it('should handle analytics for specific workflows', async () => {
      const testWorkflow = await workflowService.createWorkflow({
        name: 'Analytics Test',
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['start'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.SIMPLE,
        version: '1.0.0',
        tags: [],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: { maxRetries: 2, retryDelay: 1000 }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false
      });

      const analytics = await workflowService.getWorkflowAnalytics({
        workflowIds: [testWorkflow.id],
        period: AnalyticsPeriod.LAST_30_DAYS
      });
      
      expect(analytics).toBeDefined();
      expect(analytics.analytics).toHaveLength(1);
      expect(analytics.analytics[0].workflowId).toBe(testWorkflow.id);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle workflow validation errors', async () => {
      const invalidWorkflow = {
        name: '', // Invalid: empty name
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        steps: [] // Invalid: no steps
      };

      await expect(workflowService.createWorkflow(invalidWorkflow as any))
        .rejects.toThrow();
    });

    it('should handle non-existent execution status requests', async () => {
      const status = await workflowService.getExecutionStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should handle non-existent execution cancellation', async () => {
      await expect(workflowService.cancelExecution('non-existent'))
        .rejects.toThrow();
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Workflow Performance', () => {
  let workflowService: WorkflowAutomationService;

  beforeEach(() => {
    workflowService = new WorkflowAutomationService();
  });

  it('should handle multiple concurrent workflows', async () => {
    const workflows = [];
    const promises = [];

    // Create multiple workflows concurrently
    for (let i = 0; i < 5; i++) {
      const promise = workflowService.createWorkflow({
        name: `Concurrent Workflow ${i}`,
        type: WorkflowType.CASE_INTAKE,
        category: 'PERFORMANCE_TEST',
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            order: 1,
            status: StepStatus.PENDING,
            isRequired: true,
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            order: 2,
            status: StepStatus.PENDING,
            isRequired: true,
            dependencies: ['start'],
            config: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.SIMPLE,
        version: '1.0.0',
        tags: [],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user',
        organizationId: 'test-org',
        language: SupportedLanguage.ENGLISH,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 5,
          timeoutMinutes: 30,
          retryPolicy: { maxRetries: 2, retryDelay: 1000 }
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onError: true,
          onApprovalRequired: true,
          channels: ['EMAIL']
        },
        permissions: {
          view: ['public'],
          edit: ['owner'],
          execute: ['authorized']
        },
        isTemplate: false
      });
      
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(5);
    results.forEach((workflow, index) => {
      expect(workflow.name).toBe(`Concurrent Workflow ${index}`);
      expect(workflow.id).toBeDefined();
    });
  });

  it('should handle multiple executions efficiently', async () => {
    // Create a test workflow
    const workflow = await workflowService.createWorkflow({
      name: 'Multi-Execution Test',
      type: WorkflowType.CASE_INTAKE,
      category: 'PERFORMANCE_TEST',
      steps: [
        {
          id: 'start',
          name: 'Start',
          type: StepType.START,
          order: 1,
          status: StepStatus.PENDING,
          isRequired: true,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'end',
          name: 'End',
          type: StepType.END,
          order: 2,
          status: StepStatus.PENDING,
          isRequired: true,
          dependencies: ['start'],
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      priority: WorkflowPriority.MEDIUM,
      complexity: WorkflowComplexity.SIMPLE,
      version: '1.0.0',
      tags: [],
      isActive: true,
      isPublic: false,
      createdBy: 'test-user',
      organizationId: 'test-org',
      language: SupportedLanguage.ENGLISH,
      variables: [],
      triggers: [],
      settings: {
        maxConcurrentExecutions: 5,
        timeoutMinutes: 30,
        retryPolicy: { maxRetries: 2, retryDelay: 1000 }
      },
      notifications: {
        onStart: false,
        onComplete: true,
        onError: true,
        onApprovalRequired: true,
        channels: ['EMAIL']
      },
      permissions: {
        view: ['public'],
        edit: ['owner'],
        execute: ['authorized']
      },
      isTemplate: false
    });

    // Execute the workflow multiple times
    const executionPromises = [];
    for (let i = 0; i < 3; i++) {
      const promise = workflowService.executeWorkflow({
        workflowId: workflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: { execution: i },
        context: { userId: 'test-user' }
      });
      executionPromises.push(promise);
    }

    const results = await Promise.all(executionPromises);
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.executionId).toBeDefined();
      expect(result.status).toBe(WorkflowStatus.ACTIVE);
    });
  });
});
