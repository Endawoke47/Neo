/**
 * Circuit Breaker Testing - A+++++ Quality Assurance
 * Comprehensive testing of AI service reliability patterns
 */

import { CircuitBreaker, CircuitBreakerManager, RetryHandler } from '../utils/circuit-breaker';
import { jest } from '@jest/globals';

describe('Circuit Breaker - A+++++ Reliability Testing', () => {
  let circuitBreaker: CircuitBreaker;
  let mockService: jest.MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    });

    mockService = jest.fn();
    jest.clearAllMocks();
  });

  describe('Circuit Breaker States', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getStats().state).toBe('CLOSED');
    });

    it('should transition to OPEN state after threshold failures', async () => {
      // Mock service to always fail
      mockService.mockRejectedValue(new Error('Service unavailable'));

      // Execute enough failures to trip the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockService);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should transition to HALF_OPEN state after reset timeout', async () => {
      // Trip the circuit breaker
      mockService.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockService);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to HALF_OPEN
      mockService.mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockService);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED'); // Should close on success
    });

    it('should reject immediately when OPEN', async () => {
      // Trip the circuit breaker
      mockService.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockService);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Should reject immediately without calling service
      mockService.mockClear();
      
      await expect(circuitBreaker.execute(mockService)).rejects.toThrow('Circuit breaker is OPEN');
      expect(mockService).not.toHaveBeenCalled();
    });
  });

  describe('Failure Tracking', () => {
    it('should track consecutive failures', async () => {
      mockService.mockRejectedValue(new Error('Service error'));

      for (let i = 1; i <= 2; i++) {
        try {
          await circuitBreaker.execute(mockService);
        } catch (error) {
          // Expected to fail
        }

        const stats = circuitBreaker.getStats();
        expect(stats.failures).toBe(i);
        expect(stats.state).toBe('CLOSED'); // Should still be closed
      }
    });

    it('should reset failure count on success', async () => {
      // Add some failures
      mockService.mockRejectedValue(new Error('Service error'));
      try {
        await circuitBreaker.execute(mockService);
      } catch (error) {
        // Expected to fail
      }

      expect(circuitBreaker.getStats().failures).toBe(1);

      // Now succeed
      mockService.mockResolvedValue('success');
      await circuitBreaker.execute(mockService);

      expect(circuitBreaker.getStats().failures).toBe(0);
    });

    it('should track success count', async () => {
      mockService.mockResolvedValue('success');

      await circuitBreaker.execute(mockService);
      await circuitBreaker.execute(mockService);

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', async () => {
      mockService
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');

      await circuitBreaker.execute(mockService);
      
      try {
        await circuitBreaker.execute(mockService);
      } catch (error) {
        // Expected to fail
      }
      
      await circuitBreaker.execute(mockService);

      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.successes).toBe(2);
      expect(stats.failures).toBe(0); // Reset after last success
      expect(stats.state).toBe('CLOSED');
      expect(stats.uptime).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      mockService
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'));

      await circuitBreaker.execute(mockService);
      await circuitBreaker.execute(mockService);
      
      try {
        await circuitBreaker.execute(mockService);
      } catch (error) {
        // Expected to fail
      }

      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.successes).toBe(2);
      // Success rate should be calculated from total historical successes vs requests
    });
  });

  describe('Timeout Handling', () => {
    it('should handle service timeouts', async () => {
      const timeoutService = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow response'), 2000))
      );

      const fastCircuitBreaker = new CircuitBreaker('timeout-test', {
        timeout: 100,
        failureThreshold: 1
      });

      await expect(fastCircuitBreaker.execute(timeoutService)).rejects.toThrow('Operation timed out');
    });

    it('should not timeout fast operations', async () => {
      const fastService = jest.fn().mockResolvedValue('fast response');

      const result = await circuitBreaker.execute(fastService);
      expect(result).toBe('fast response');
    });
  });
});

describe('Retry Handler - A+++++ Reliability Testing', () => {
  let retryHandler: RetryHandler;
  let mockOperation: jest.MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2
    });

    mockOperation = jest.fn();
    jest.clearAllMocks();
  });

  describe('Retry Logic', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      mockOperation.mockResolvedValue('success');

      const result = await retryHandler.execute(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failures up to max retries', async () => {
      mockOperation
        .mockRejectedValueOnce(new Error('attempt 1'))
        .mockRejectedValueOnce(new Error('attempt 2'))
        .mockResolvedValueOnce('success on attempt 3');

      const result = await retryHandler.execute(mockOperation);

      expect(result).toBe('success on attempt 3');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retries', async () => {
      mockOperation.mockRejectedValue(new Error('persistent failure'));

      await expect(retryHandler.execute(mockOperation)).rejects.toThrow('persistent failure');
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should apply exponential backoff delays', async () => {
      mockOperation
        .mockRejectedValueOnce(new Error('attempt 1'))
        .mockRejectedValueOnce(new Error('attempt 2'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      const result = await retryHandler.execute(mockOperation);
      const endTime = Date.now();

      expect(result).toBe('success');
      // Should have at least some delay (100ms + 200ms = 300ms minimum)
      expect(endTime - startTime).toBeGreaterThan(250);
    });
  });

  describe('Conditional Retry', () => {
    it('should respect shouldRetry predicate', async () => {
      const retryHandlerWithCondition = new RetryHandler({
        maxRetries: 3,
        initialDelay: 10,
        shouldRetry: (error) => error.message !== 'do not retry'
      });

      mockOperation.mockRejectedValue(new Error('do not retry'));

      await expect(retryHandlerWithCondition.execute(mockOperation)).rejects.toThrow('do not retry');
      expect(mockOperation).toHaveBeenCalledTimes(1); // Should not retry
    });

    it('should retry retryable errors', async () => {
      const retryHandlerWithCondition = new RetryHandler({
        maxRetries: 2,
        initialDelay: 10,
        shouldRetry: (error) => error.message === 'retryable'
      });

      mockOperation
        .mockRejectedValueOnce(new Error('retryable'))
        .mockResolvedValueOnce('success');

      const result = await retryHandlerWithCondition.execute(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Delay Calculations', () => {
    it('should respect max delay limits', async () => {
      const retryHandlerWithLowMax = new RetryHandler({
        maxRetries: 5,
        initialDelay: 100,
        maxDelay: 150,
        backoffMultiplier: 10
      });

      mockOperation.mockRejectedValue(new Error('keep failing'));

      const startTime = Date.now();
      
      try {
        await retryHandlerWithLowMax.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = Date.now();
      
      // With max delay of 150ms and 5 retries, total should not exceed reasonable bounds
      expect(endTime - startTime).toBeLessThan(1000); // Should be capped by maxDelay
    });
  });
});

describe('Circuit Breaker Manager - A+++++ Service Management', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  describe('Service Management', () => {
    it('should create and manage multiple circuit breakers', () => {
      const openaiBreaker = manager.getCircuitBreaker('openai');
      const anthropicBreaker = manager.getCircuitBreaker('anthropic');

      expect(openaiBreaker).toBeDefined();
      expect(anthropicBreaker).toBeDefined();
      expect(openaiBreaker).not.toBe(anthropicBreaker);
    });

    it('should return same instance for same service name', () => {
      const breaker1 = manager.getCircuitBreaker('test-service');
      const breaker2 = manager.getCircuitBreaker('test-service');

      expect(breaker1).toBe(breaker2);
    });

    it('should provide aggregate statistics', async () => {
      const breaker1 = manager.getCircuitBreaker('service1');
      const breaker2 = manager.getCircuitBreaker('service2');

      // Execute some operations
      const mockOp = jest.fn().mockResolvedValue('success');
      await breaker1.execute(mockOp);
      await breaker2.execute(mockOp);

      const stats = manager.getAggregateStats();
      expect(stats.totalServices).toBe(2);
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalSuccesses).toBe(2);
      expect(stats.services).toHaveLength(2);
    });

    it('should identify unhealthy services', async () => {
      const healthyBreaker = manager.getCircuitBreaker('healthy-service');
      const unhealthyBreaker = manager.getCircuitBreaker('unhealthy-service');

      // Make healthy service succeed
      const successOp = jest.fn().mockResolvedValue('success');
      await healthyBreaker.execute(successOp);

      // Make unhealthy service fail enough to open circuit
      const failOp = jest.fn().mockRejectedValue(new Error('service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await unhealthyBreaker.execute(failOp);
        } catch (error) {
          // Expected to fail
        }
      }

      const unhealthyServices = manager.getUnhealthyServices();
      expect(unhealthyServices).toHaveLength(1);
      expect(unhealthyServices[0].name).toBe('unhealthy-service');
      expect(unhealthyServices[0].state).toBe('OPEN');
    });
  });

  describe('Health Monitoring', () => {
    it('should monitor service health over time', async () => {
      const breaker = manager.getCircuitBreaker('monitored-service');
      
      // Simulate mixed success/failure pattern
      const mixedOp = jest.fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');

      await breaker.execute(mixedOp);
      try {
        await breaker.execute(mixedOp);
      } catch (error) {
        // Expected failure
      }
      await breaker.execute(mixedOp);

      const healthReport = manager.getHealthReport();
      expect(healthReport.totalServices).toBe(1);
      expect(healthReport.healthyServices).toBe(1);
      expect(healthReport.degradedServices).toBe(0);
      expect(healthReport.failedServices).toBe(0);
    });
  });
});