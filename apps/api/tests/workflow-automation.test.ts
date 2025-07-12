// Legal Workflow Automation Tests
// Phase 3: Feature 1 - Comprehensive test suite for workflow automation service
// Testing workflow creation, execution, analytics, and error handling

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
import { LegalJurisdiction } from '../src/types/ai.types';
import { LegalArea } from '../src/types/legal-research.types';

describe('WorkflowAutomationService', () => {
  let workflowService: WorkflowAutomationService;

  beforeEach(() => {
    workflowService = new WorkflowAutomationService();
  });

  // ============================================================================
  // WORKFLOW DEFINITION TESTS
  // ============================================================================

  describe('Workflow Definition Management', () => {
    it('should create a new workflow definition', async () => {
      const workflowData = {
        name: 'Test Case Intake Workflow',
        description: 'A test workflow for case intake process',
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        priority: WorkflowPriority.MEDIUM,
        complexity: WorkflowComplexity.MODERATE,
        jurisdiction: LegalJurisdiction.SOUTH_AFRICA,
        legalArea: LegalArea.CORPORATE,
        version: '1.0.0',
        tags: ['case-intake', 'client-onboarding'],
        isActive: true,
        isPublic: false,
        createdBy: 'test-user-123',
        organizationId: 'org-123',
        language: 'en' as any,
        variables: [],
        triggers: [],
        settings: {
          maxConcurrentExecutions: 10,
          timeoutMinutes: 60,
          retryPolicy: {
            maxRetries: 3,
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
            name: 'Start Process',
            description: 'Initialize case intake workflow',
            type: StepType.START,
            isRequired: true,
            estimatedDuration: 0,
            config: {}
          },
          {
            id: 'collect-client-info',
            name: 'Collect Client Information',
            description: 'Gather basic client details',
            type: StepType.TASK_ASSIGNMENT,
            isRequired: true,
            estimatedDuration: 300000, // 5 minutes
            dependencies: ['start'],
            config: {
              formId: 'client-intake-form',
              fields: ['name', 'email', 'phone', 'case_type']
            }
          },
          {
            id: 'notify-team',
            name: 'Notify Legal Team',
            description: 'Send notification to assigned legal team',
            type: StepType.EMAIL_NOTIFICATION,
            isRequired: true,
            estimatedDuration: 30000, // 30 seconds
            dependencies: ['collect-client-info'],
            config: {
              recipients: ['legal-team@firm.com'],
              subject: 'New Case Intake: {{client_name}}',
              message: 'A new case intake has been initiated for {{client_name}}'
            }
          },
          {
            id: 'end',
            name: 'End Process',
            description: 'Complete case intake workflow',
            type: StepType.END,
            isRequired: true,
            estimatedDuration: 0,
            dependencies: ['notify-team'],
            config: {}
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData);

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.type).toBe(workflowData.type);
      expect(workflow.steps).toHaveLength(4);
      expect(workflow.usageCount).toBe(0);
      expect(workflow.createdAt).toBeDefined();
      expect(workflow.updatedAt).toBeDefined();
    });

    it('should validate workflow definition requirements', async () => {
      const invalidWorkflowData = {
        name: '', // Invalid: empty name
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        steps: [] // Invalid: no steps
      };

      await expect(workflowService.createWorkflow(invalidWorkflowData as any))
        .rejects.toThrow('Workflow name is required');
    });

    it('should validate workflow steps structure', async () => {
      const workflowWithInvalidSteps = {
        name: 'Test Workflow',
        type: WorkflowType.DOCUMENT_GENERATION,
        category: 'DOCUMENT_MANAGEMENT',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: StepType.TASK_ASSIGNMENT,
            isRequired: true,
            config: {}
          }
          // Missing START and END steps
        ]
      };

      await expect(workflowService.createWorkflow(workflowWithInvalidSteps as any))
        .rejects.toThrow('Workflow must have a START step');
    });

    it('should update an existing workflow', async () => {
      // First create a workflow
      const workflow = await workflowService.createWorkflow({
        name: 'Original Workflow',
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        steps: [
          {
            id: 'start',
            name: 'Start',
            type: StepType.START,
            isRequired: true,
            config: {}
          },
          {
            id: 'end',
            name: 'End',
            type: StepType.END,
            isRequired: true,
            dependencies: ['start'],
            config: {}
          }
        ]
      } as any);

      // Update the workflow
      const updates = {
        name: 'Updated Workflow',
        description: 'This workflow has been updated'
      };

      const updatedWorkflow = await workflowService.updateWorkflow(workflow.id, updates);

      expect(updatedWorkflow.name).toBe('Updated Workflow');
      expect(updatedWorkflow.description).toBe('This workflow has been updated');
      expect(updatedWorkflow.updatedAt).not.toEqual(workflow.updatedAt);
    });

    it('should list workflows with filters', async () => {
      // Create multiple workflows
      await workflowService.createWorkflow({
        name: 'Case Intake Workflow',
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        isActive: true,
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
        ]
      } as any);

      await workflowService.createWorkflow({
        name: 'Document Generation Workflow',
        type: WorkflowType.DOCUMENT_GENERATION,
        category: 'DOCUMENT_MANAGEMENT',
        isActive: false,
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
        ]
      } as any);

      // Test filtering by type
      const caseIntakeWorkflows = await workflowService.listWorkflows({
        type: WorkflowType.CASE_INTAKE
      });

      expect(caseIntakeWorkflows.workflows).toHaveLength(1);
      expect(caseIntakeWorkflows.workflows[0].type).toBe(WorkflowType.CASE_INTAKE);

      // Test filtering by active status
      const activeWorkflows = await workflowService.listWorkflows({
        isActive: true
      });

      expect(activeWorkflows.workflows.every(w => w.isActive)).toBe(true);
    });

    it('should delete a workflow', async () => {
      const workflow = await workflowService.createWorkflow({
        name: 'Workflow to Delete',
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
        ]
      } as any);

      const deleted = await workflowService.deleteWorkflow(workflow.id);
      expect(deleted).toBe(true);

      const retrievedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(retrievedWorkflow).toBeNull();
    });
  });

  // ============================================================================
  // WORKFLOW EXECUTION TESTS
  // ============================================================================

  describe('Workflow Execution', () => {
    let testWorkflow: any;

    beforeEach(async () => {
      testWorkflow = await workflowService.createWorkflow({
        name: 'Test Execution Workflow',
        type: WorkflowType.CASE_INTAKE,
        category: 'CASE_MANAGEMENT',
        priority: WorkflowPriority.HIGH,
        isActive: true,
        steps: [
          {
            id: 'start',
            name: 'Start Process',
            type: StepType.START,
            isRequired: true,
            estimatedDuration: 0,
            config: {}
          },
          {
            id: 'email-notification',
            name: 'Send Email',
            type: StepType.EMAIL_NOTIFICATION,
            isRequired: true,
            estimatedDuration: 30000,
            dependencies: ['start'],
            config: {
              recipients: ['test@example.com'],
              subject: 'Test Notification',
              message: 'This is a test notification'
            }
          },
          {
            id: 'end',
            name: 'End Process',
            type: StepType.END,
            isRequired: true,
            estimatedDuration: 0,
            dependencies: ['email-notification'],
            config: {}
          }
        ]
      } as any);
    });

    it('should execute a workflow successfully', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        priority: WorkflowPriority.HIGH,
        variables: {
          client_name: 'John Doe',
          client_email: 'john.doe@example.com'
        },
        context: {
          userId: 'test-user-123',
          organizationId: 'org-123'
        }
      };

      const result = await workflowService.executeWorkflow(executionRequest);

      expect(result.executionId).toBeDefined();
      expect(result.status).toBe(WorkflowStatus.ACTIVE);
      expect(result.message).toContain('started');
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });

    it('should handle workflow execution errors gracefully', async () => {
      const executionRequest = {
        workflowId: 'non-existent-workflow',
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);

      expect(result.status).toBe(WorkflowStatus.ERROR);
      expect(result.message).toContain('not found');
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should track execution status', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: { test: 'value' },
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      
      // Allow some time for execution to progress
      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = await workflowService.getExecutionStatus(result.executionId);

      expect(execution).toBeDefined();
      expect(execution!.id).toBe(result.executionId);
      expect(execution!.workflowDefinitionId).toBe(testWorkflow.id);
      expect(execution!.status).toBeDefined();
      expect(execution!.startTime).toBeDefined();
    });

    it('should cancel a running execution', async () => {
      const executionRequest = {
        workflowId: testWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      
      // Cancel the execution immediately
      const cancelled = await workflowService.cancelExecution(result.executionId);
      expect(cancelled).toBe(true);

      const execution = await workflowService.getExecutionStatus(result.executionId);
      expect(execution!.status).toBe(WorkflowStatus.CANCELLED);
      expect(execution!.endTime).toBeDefined();
    });

    it('should retry a failed execution', async () => {
      // Create a workflow that will fail
      const failingWorkflow = await workflowService.createWorkflow({
        name: 'Failing Workflow',
        type: WorkflowType.DOCUMENT_GENERATION,
        category: 'TEST',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          {
            id: 'failing-step',
            name: 'Failing Step',
            type: StepType.API_CALL,
            isRequired: true,
            dependencies: ['start'],
            config: { endpoint: 'invalid-endpoint' }
          },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['failing-step'], config: {} }
        ]
      } as any);

      const executionRequest = {
        workflowId: failingWorkflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      };

      const result = await workflowService.executeWorkflow(executionRequest);
      
      // Wait for execution to complete (and potentially fail)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to retry
      const retryResult = await workflowService.retryExecution(result.executionId);
      expect(retryResult.executionId).toBe(result.executionId);
    });
  });

  // ============================================================================
  // WORKFLOW ANALYTICS TESTS
  // ============================================================================

  describe('Workflow Analytics', () => {
    let testWorkflows: any[] = [];

    beforeEach(async () => {
      // Create test workflows and execute them
      for (let i = 0; i < 3; i++) {
        const workflow = await workflowService.createWorkflow({
          name: `Test Analytics Workflow ${i + 1}`,
          type: WorkflowType.CASE_INTAKE,
          category: 'ANALYTICS_TEST',
          steps: [
            { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
            { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
          ]
        } as any);

        testWorkflows.push(workflow);

        // Execute each workflow a few times
        for (let j = 0; j < 2; j++) {
          await workflowService.executeWorkflow({
            workflowId: workflow.id,
            triggerType: TriggerType.MANUAL_START,
            variables: { test: `execution-${j}` },
            context: { userId: 'analytics-user' }
          });
        }
      }

      // Allow executions to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should generate workflow analytics', async () => {
      const analyticsRequest = {
        workflowIds: testWorkflows.map(w => w.id),
        period: AnalyticsPeriod.LAST_30_DAYS
      };

      const analytics = await workflowService.getWorkflowAnalytics(analyticsRequest);

      expect(analytics.analytics).toBeDefined();
      expect(analytics.analytics.length).toBe(testWorkflows.length);
      expect(analytics.summary).toBeDefined();
      expect(analytics.recommendations).toBeDefined();

      // Check analytics structure
      const firstAnalytics = analytics.analytics[0];
      expect(firstAnalytics.workflowId).toBeDefined();
      expect(firstAnalytics.workflowName).toBeDefined();
      expect(firstAnalytics.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(firstAnalytics.successRate).toBeGreaterThanOrEqual(0);
      expect(firstAnalytics.successRate).toBeLessThanOrEqual(1);
    });

    it('should calculate summary statistics', async () => {
      const analytics = await workflowService.getWorkflowAnalytics({
        period: AnalyticsPeriod.LAST_30_DAYS
      });

      expect(analytics.summary).toBeDefined();
      expect(analytics.summary.totalWorkflows).toBeGreaterThan(0);
      expect(analytics.summary.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(analytics.summary.averageSuccessRate).toBeGreaterThanOrEqual(0);
      expect(analytics.summary.averageSuccessRate).toBeLessThanOrEqual(1);
    });

    it('should generate recommendations', async () => {
      const analytics = await workflowService.getWorkflowAnalytics({
        period: AnalyticsPeriod.LAST_30_DAYS
      });

      expect(analytics.recommendations).toBeDefined();
      expect(Array.isArray(analytics.recommendations)).toBe(true);
    });

    it('should filter analytics by period', async () => {
      const last7Days = await workflowService.getWorkflowAnalytics({
        period: AnalyticsPeriod.LAST_7_DAYS
      });

      const last30Days = await workflowService.getWorkflowAnalytics({
        period: AnalyticsPeriod.LAST_30_DAYS
      });

      expect(last7Days.analytics).toBeDefined();
      expect(last30Days.analytics).toBeDefined();
      
      // Both should have analytics, but periods should be different
      last7Days.analytics.forEach(analytics => {
        expect(analytics.period).toBe(AnalyticsPeriod.LAST_7_DAYS);
      });

      last30Days.analytics.forEach(analytics => {
        expect(analytics.period).toBe(AnalyticsPeriod.LAST_30_DAYS);
      });
    });
  });

  // ============================================================================
  // STEP EXECUTION TESTS
  // ============================================================================

  describe('Step Execution', () => {
    it('should execute document generation steps', async () => {
      const workflow = await workflowService.createWorkflow({
        name: 'Document Generation Test',
        type: WorkflowType.DOCUMENT_GENERATION,
        category: 'DOCUMENT_MANAGEMENT',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          {
            id: 'generate-doc',
            name: 'Generate Document',
            type: StepType.DOCUMENT_GENERATION,
            isRequired: true,
            dependencies: ['start'],
            config: {
              templateId: 'contract-template',
              outputFormat: ['PDF', 'DOCX']
            }
          },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['generate-doc'], config: {} }
        ]
      } as any);

      const result = await workflowService.executeWorkflow({
        workflowId: workflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: { client_name: 'Test Client' },
        context: { userId: 'test-user' }
      });

      // Allow execution to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      const execution = await workflowService.getExecutionStatus(result.executionId);
      expect(execution!.status).toBe(WorkflowStatus.COMPLETED);
    });

    it('should execute email notification steps', async () => {
      const workflow = await workflowService.createWorkflow({
        name: 'Email Notification Test',
        type: WorkflowType.CASE_INTAKE,
        category: 'NOTIFICATION',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          {
            id: 'send-email',
            name: 'Send Email',
            type: StepType.EMAIL_NOTIFICATION,
            isRequired: true,
            dependencies: ['start'],
            config: {
              recipients: ['test@example.com'],
              subject: 'Test Subject {{variable}}',
              message: 'Test message with {{variable}}'
            }
          },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['send-email'], config: {} }
        ]
      } as any);

      const result = await workflowService.executeWorkflow({
        workflowId: workflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: { variable: 'replacement value' },
        context: { userId: 'test-user' }
      });

      // Allow execution to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const execution = await workflowService.getExecutionStatus(result.executionId);
      expect(execution!.status).toBe(WorkflowStatus.COMPLETED);
    });

    it('should handle approval gate steps', async () => {
      const workflow = await workflowService.createWorkflow({
        name: 'Approval Gate Test',
        type: WorkflowType.DOCUMENT_APPROVAL,
        category: 'APPROVAL',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          {
            id: 'approval-gate',
            name: 'Approval Required',
            type: StepType.APPROVAL_GATE,
            isRequired: true,
            dependencies: ['start'],
            config: {
              approvers: ['manager@example.com'],
              approvalType: 'SINGLE',
              autoApproveAfter: 1 // Auto-approve after 1 minute for testing
            }
          },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['approval-gate'], config: {} }
        ]
      } as any);

      const result = await workflowService.executeWorkflow({
        workflowId: workflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      });

      // Allow execution to complete (auto-approval)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const execution = await workflowService.getExecutionStatus(result.executionId);
      expect(execution!.status).toBe(WorkflowStatus.COMPLETED);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid workflow IDs', async () => {
      const workflow = await workflowService.getWorkflow('invalid-id');
      expect(workflow).toBeNull();
    });

    it('should handle invalid execution IDs', async () => {
      const execution = await workflowService.getExecutionStatus('invalid-execution-id');
      expect(execution).toBeNull();
    });

    it('should prevent deletion of workflows with active executions', async () => {
      const workflow = await workflowService.createWorkflow({
        name: 'Active Execution Workflow',
        type: WorkflowType.CASE_INTAKE,
        category: 'TEST',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
        ]
      } as any);

      // Start an execution
      await workflowService.executeWorkflow({
        workflowId: workflow.id,
        triggerType: TriggerType.MANUAL_START,
        variables: {},
        context: { userId: 'test-user' }
      });

      // Try to delete the workflow
      await expect(workflowService.deleteWorkflow(workflow.id))
        .rejects.toThrow('Cannot delete workflow with active executions');
    });

    it('should handle execution cancellation of non-existent executions', async () => {
      await expect(workflowService.cancelExecution('non-existent-execution'))
        .rejects.toThrow('Execution not found');
    });

    it('should handle retry of non-existent executions', async () => {
      const result = await workflowService.retryExecution('non-existent-execution');
      expect(result.status).toBe(WorkflowStatus.ERROR);
      expect(result.message).toContain('not found');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Workflow Integration Tests', () => {
  let workflowService: WorkflowAutomationService;

  beforeEach(() => {
    workflowService = new WorkflowAutomationService();
  });

  it('should handle complex workflow with multiple step types', async () => {
    const complexWorkflow = await workflowService.createWorkflow({
      name: 'Complex Integration Workflow',
      type: WorkflowType.CASE_INTAKE,
      category: 'INTEGRATION_TEST',
      complexity: WorkflowComplexity.COMPLEX,
      steps: [
        { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
        {
          id: 'data-validation',
          name: 'Validate Data',
          type: StepType.DATA_VALIDATION,
          isRequired: true,
          dependencies: ['start'],
          config: {}
        },
        {
          id: 'conditional-branch',
          name: 'Check Conditions',
          type: StepType.CONDITIONAL_BRANCH,
          isRequired: true,
          dependencies: ['data-validation'],
          conditions: [{ id: 'cond1', expression: 'client_type === "premium"' }],
          config: {}
        },
        {
          id: 'send-notification',
          name: 'Send Notification',
          type: StepType.EMAIL_NOTIFICATION,
          isRequired: true,
          dependencies: ['conditional-branch'],
          config: {
            recipients: ['team@example.com'],
            subject: 'Complex Workflow Executed',
            message: 'The complex workflow has been executed successfully'
          }
        },
        {
          id: 'delay-step',
          name: 'Wait Period',
          type: StepType.DELAY,
          isRequired: false,
          dependencies: ['send-notification'],
          config: { delayMinutes: 1 }
        },
        { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['delay-step'], config: {} }
      ]
    } as any);

    const result = await workflowService.executeWorkflow({
      workflowId: complexWorkflow.id,
      triggerType: TriggerType.MANUAL_START,
      variables: {
        client_type: 'premium',
        client_name: 'Premium Client'
      },
      context: { userId: 'integration-test-user' }
    });

    expect(result.executionId).toBeDefined();
    expect(result.status).toBe(WorkflowStatus.ACTIVE);

    // Allow sufficient time for complex execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    const execution = await workflowService.getExecutionStatus(result.executionId);
    expect(execution).toBeDefined();
    expect(execution!.completedSteps.length).toBeGreaterThan(0);
  });

  it('should provide comprehensive analytics for multiple workflows', async () => {
    // Create and execute multiple workflows
    const workflows = [];
    const executionResults = [];

    for (let i = 0; i < 5; i++) {
      const workflow = await workflowService.createWorkflow({
        name: `Analytics Test Workflow ${i + 1}`,
        type: i % 2 === 0 ? WorkflowType.CASE_INTAKE : WorkflowType.DOCUMENT_GENERATION,
        category: 'ANALYTICS_INTEGRATION_TEST',
        steps: [
          { id: 'start', name: 'Start', type: StepType.START, isRequired: true, config: {} },
          { id: 'end', name: 'End', type: StepType.END, isRequired: true, dependencies: ['start'], config: {} }
        ]
      } as any);

      workflows.push(workflow);

      // Execute each workflow multiple times
      for (let j = 0; j < 3; j++) {
        const result = await workflowService.executeWorkflow({
          workflowId: workflow.id,
          triggerType: TriggerType.MANUAL_START,
          variables: { iteration: j },
          context: { userId: `user-${i}` }
        });
        executionResults.push(result);
      }
    }

    // Allow all executions to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get comprehensive analytics
    const analytics = await workflowService.getWorkflowAnalytics({
      workflowIds: workflows.map(w => w.id),
      period: AnalyticsPeriod.LAST_30_DAYS
    });

    expect(analytics.analytics).toHaveLength(5);
    expect(analytics.summary.totalWorkflows).toBe(5);
    expect(analytics.summary.totalExecutions).toBe(15); // 5 workflows × 3 executions each
    expect(analytics.recommendations).toBeDefined();

    // Verify individual workflow analytics
    analytics.analytics.forEach((workflowAnalytics, index) => {
      expect(workflowAnalytics.workflowId).toBe(workflows[index].id);
      expect(workflowAnalytics.totalExecutions).toBe(3);
      expect(workflowAnalytics.successRate).toBeGreaterThanOrEqual(0);
    });
  });
});
