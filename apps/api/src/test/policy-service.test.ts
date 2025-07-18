/**
 * Policy Service Testing - A+++++ Quality Assurance
 * Comprehensive testing of policy-based authorization
 */

import { policyService } from '../core/policy.service';
import { jest } from '@jest/globals';

describe('Policy Service - A+++++ Architecture Testing', () => {
  beforeEach(() => {
    // Clear any cached policies
    policyService.clearCache();
    jest.clearAllMocks();
  });

  describe('Policy Registration', () => {
    it('should register policies successfully', () => {
      const policy = {
        name: 'test-policy',
        rules: [
          {
            resource: 'Client',
            action: 'create',
            conditions: {
              role: ['ADMIN', 'PARTNER']
            }
          }
        ]
      };

      policyService.registerPolicy(policy);
      const stats = policyService.getStats();
      
      expect(stats.rulesCount).toBeGreaterThan(0);
    });

    it('should override existing policies with same name', () => {
      const policy1 = {
        name: 'test-policy',
        rules: [{ resource: 'Client', action: 'create', conditions: { role: ['ADMIN'] } }]
      };
      
      const policy2 = {
        name: 'test-policy',
        rules: [{ resource: 'Client', action: 'create', conditions: { role: ['PARTNER'] } }]
      };

      policyService.registerPolicy(policy1);
      policyService.registerPolicy(policy2);
      
      const stats = policyService.getStats();
      expect(stats.rulesCount).toBe(1); // Should only have one rule after override
    });
  });

  describe('Authorization Checks', () => {
    beforeEach(() => {
      // Register test policies
      policyService.registerPolicy({
        name: 'client-management',
        rules: [
          {
            resource: 'Client',
            action: 'create',
            conditions: {
              role: ['ADMIN', 'PARTNER', 'ASSOCIATE']
            }
          },
          {
            resource: 'Client',
            action: 'delete',
            conditions: {
              role: ['ADMIN', 'PARTNER']
            }
          },
          {
            resource: 'Client',
            action: 'view',
            conditions: {
              role: ['ADMIN', 'PARTNER', 'ASSOCIATE', 'PARALEGAL']
            }
          }
        ]
      });
    });

    it('should allow access when user has required role', async () => {
      const mockUser = {
        id: 'user123',
        role: 'ADMIN',
        permissions: []
      };

      const canCreate = await policyService.canExecute('user123', 'CreateClientCommand', mockUser);
      expect(canCreate).toBe(true);
    });

    it('should deny access when user lacks required role', async () => {
      const mockUser = {
        id: 'user123',
        role: 'CLIENT',
        permissions: []
      };

      const canCreate = await policyService.canExecute('user123', 'CreateClientCommand', mockUser);
      expect(canCreate).toBe(false);
    });

    it('should handle multiple role requirements', async () => {
      const adminUser = { id: 'admin', role: 'ADMIN', permissions: [] };
      const clientUser = { id: 'client', role: 'CLIENT', permissions: [] };

      const adminCanDelete = await policyService.canExecute('admin', 'DeleteClientCommand', adminUser);
      const clientCanDelete = await policyService.canExecute('client', 'DeleteClientCommand', clientUser);

      expect(adminCanDelete).toBe(true);
      expect(clientCanDelete).toBe(false);
    });

    it('should handle permission-based authorization', async () => {
      policyService.registerPolicy({
        name: 'permission-based',
        rules: [
          {
            resource: 'Matter',
            action: 'create',
            conditions: {
              permissions: ['matter.create']
            }
          }
        ]
      });

      const userWithPermission = {
        id: 'user1',
        role: 'ASSOCIATE',
        permissions: ['matter.create']
      };

      const userWithoutPermission = {
        id: 'user2',
        role: 'ASSOCIATE',
        permissions: []
      };

      const canCreate1 = await policyService.canExecute('user1', 'CreateMatterCommand', userWithPermission);
      const canCreate2 = await policyService.canExecute('user2', 'CreateMatterCommand', userWithoutPermission);

      expect(canCreate1).toBe(true);
      expect(canCreate2).toBe(false);
    });
  });

  describe('Complex Policy Conditions', () => {
    beforeEach(() => {
      policyService.registerPolicy({
        name: 'complex-conditions',
        rules: [
          {
            resource: 'Contract',
            action: 'approve',
            conditions: {
              role: ['PARTNER'],
              'context.contractValue': { '<': 100000 }
            }
          },
          {
            resource: 'Contract',
            action: 'approve',
            conditions: {
              role: ['ADMIN'],
              'context.contractValue': { '>=': 0 }
            }
          }
        ]
      });
    });

    it('should evaluate complex conditions correctly', async () => {
      const partnerUser = { id: 'partner', role: 'PARTNER', permissions: [] };
      const adminUser = { id: 'admin', role: 'ADMIN', permissions: [] };

      const lowValueContext = { contractValue: 50000 };
      const highValueContext = { contractValue: 150000 };

      // Partner can approve low-value contracts
      const partnerLowValue = await policyService.canExecute(
        'partner', 
        'ApproveContractCommand', 
        partnerUser,
        lowValueContext
      );

      // Partner cannot approve high-value contracts
      const partnerHighValue = await policyService.canExecute(
        'partner', 
        'ApproveContractCommand', 
        partnerUser,
        highValueContext
      );

      // Admin can approve any value
      const adminHighValue = await policyService.canExecute(
        'admin', 
        'ApproveContractCommand', 
        adminUser,
        highValueContext
      );

      expect(partnerLowValue).toBe(true);
      expect(partnerHighValue).toBe(false);
      expect(adminHighValue).toBe(true);
    });

    it('should handle missing context gracefully', async () => {
      const partnerUser = { id: 'partner', role: 'PARTNER', permissions: [] };

      // No context provided - should default to false for safety
      const canApprove = await policyService.canExecute(
        'partner', 
        'ApproveContractCommand', 
        partnerUser
      );

      expect(canApprove).toBe(false);
    });
  });

  describe('Policy Caching', () => {
    it('should cache policy evaluation results', async () => {
      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      policyService.registerPolicy({
        name: 'cached-policy',
        rules: [
          {
            resource: 'Test',
            action: 'create',
            conditions: { role: ['ADMIN'] }
          }
        ]
      });

      // First call - should evaluate and cache
      const result1 = await policyService.canExecute('user123', 'TestCommand', mockUser);
      
      // Second call - should use cache
      const result2 = await policyService.canExecute('user123', 'TestCommand', mockUser);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      
      // Verify cache is working by checking stats
      const stats = policyService.getStats();
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should clear cache when requested', async () => {
      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      // Make a call to populate cache
      await policyService.canExecute('user123', 'TestCommand', mockUser);
      
      // Clear cache
      policyService.clearCache();
      
      // Verify cache is cleared
      const stats = policyService.getStats();
      expect(stats.cacheHits).toBe(0);
    });
  });

  describe('Policy Statistics', () => {
    it('should track policy evaluation statistics', async () => {
      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      policyService.registerPolicy({
        name: 'stats-test',
        rules: [
          {
            resource: 'Test',
            action: 'create',
            conditions: { role: ['ADMIN'] }
          }
        ]
      });

      // Make several policy evaluations
      await policyService.canExecute('user123', 'TestCommand', mockUser);
      await policyService.canExecute('user123', 'TestCommand', mockUser);
      await policyService.canExecute('user123', 'TestCommand', mockUser);

      const stats = policyService.getStats();
      
      expect(stats.rulesCount).toBeGreaterThan(0);
      expect(stats.evaluationCount).toBeGreaterThan(0);
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should reset statistics correctly', () => {
      policyService.registerPolicy({
        name: 'reset-test',
        rules: [
          {
            resource: 'Test',
            action: 'create',
            conditions: { role: ['ADMIN'] }
          }
        ]
      });

      // Clear and verify reset
      policyService.clearCache();
      const stats = policyService.getStats();
      
      expect(stats.cacheHits).toBe(0);
      expect(stats.evaluationCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed policy rules gracefully', () => {
      const malformedPolicy = {
        name: 'malformed',
        rules: [
          {
            // Missing required fields
            action: 'create'
          }
        ]
      };

      expect(() => {
        policyService.registerPolicy(malformedPolicy as any);
      }).not.toThrow(); // Should handle gracefully, not crash
    });

    it('should return false for unknown commands', async () => {
      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      const canExecute = await policyService.canExecute('user123', 'UnknownCommand', mockUser);
      
      expect(canExecute).toBe(false);
    });

    it('should handle null/undefined user context', async () => {
      const canExecute1 = await policyService.canExecute('user123', 'TestCommand', null as any);
      const canExecute2 = await policyService.canExecute('user123', 'TestCommand', undefined as any);
      
      expect(canExecute1).toBe(false);
      expect(canExecute2).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should evaluate policies within reasonable time limits', async () => {
      // Register multiple policies
      for (let i = 0; i < 100; i++) {
        policyService.registerPolicy({
          name: `policy-${i}`,
          rules: [
            {
              resource: 'Test',
              action: 'create',
              conditions: { role: ['ADMIN'] }
            }
          ]
        });
      }

      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      const startTime = performance.now();
      await policyService.canExecute('user123', 'TestCommand', mockUser);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should scale well with multiple concurrent evaluations', async () => {
      policyService.registerPolicy({
        name: 'concurrent-test',
        rules: [
          {
            resource: 'Test',
            action: 'create',
            conditions: { role: ['ADMIN'] }
          }
        ]
      });

      const mockUser = { id: 'user123', role: 'ADMIN', permissions: [] };
      
      const promises = Array.from({ length: 50 }, () => 
        policyService.canExecute('user123', 'TestCommand', mockUser)
      );

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(50);
      expect(results.every(result => result === true)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});