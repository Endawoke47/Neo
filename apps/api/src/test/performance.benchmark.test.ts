/**
 * Performance Benchmark Testing - A+++++ Quality Assurance
 * Comprehensive performance testing for A+++++ architecture
 */

import { performance } from 'perf_hooks';
import { commandBus } from '../core/command-bus';
import { policyService } from '../core/policy.service';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { dbService } from '../config/database';

interface PerformanceMetrics {
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
  total: number;
}

function calculateMetrics(times: number[]): PerformanceMetrics {
  const sorted = times.sort((a, b) => a - b);
  const total = times.length;
  const sum = times.reduce((acc, time) => acc + time, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / total,
    p95: sorted[Math.floor(total * 0.95)],
    p99: sorted[Math.floor(total * 0.99)],
    total
  };
}

describe('Performance Benchmarks - A+++++ Architecture', () => {
  const BENCHMARK_ITERATIONS = 100;
  const PERFORMANCE_THRESHOLD_MS = 100; // 100ms threshold for most operations
  const STRESS_ITERATIONS = 1000;

  describe('Command Bus Performance', () => {
    beforeEach(() => {
      commandBus.clearHandlers();
    });

    it('should execute commands within performance thresholds', async () => {
      // Mock command for benchmarking
      class BenchmarkCommand {
        commandId = `bench-${Date.now()}`;
        executedAt?: Date;
        constructor(public data: string) {}
      }

      class BenchmarkHandler {
        async execute(command: BenchmarkCommand): Promise<string> {
          // Simulate minimal processing
          return `processed-${command.data}`;
        }
      }

      commandBus.register(BenchmarkCommand, new BenchmarkHandler());

      const executionTimes: number[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const command = new BenchmarkCommand(`test-${i}`);
        
        const startTime = performance.now();
        await commandBus.execute(command);
        const endTime = performance.now();
        
        executionTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(executionTimes);

      console.log('Command Bus Performance Metrics:', {
        ...metrics,
        unit: 'ms'
      });

      // Performance assertions
      expect(metrics.avg).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      expect(metrics.p95).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2);
      expect(metrics.p99).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 3);
    });

    it('should handle concurrent command execution efficiently', async () => {
      class ConcurrentCommand {
        commandId = `concurrent-${Date.now()}-${Math.random()}`;
        executedAt?: Date;
        constructor(public data: string) {}
      }

      class ConcurrentHandler {
        async execute(command: ConcurrentCommand): Promise<string> {
          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 1));
          return `processed-${command.data}`;
        }
      }

      commandBus.register(ConcurrentCommand, new ConcurrentHandler());

      const startTime = performance.now();

      // Execute 50 commands concurrently
      const promises = Array.from({ length: 50 }, (_, i) => 
        commandBus.execute(new ConcurrentCommand(`concurrent-${i}`))
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTimePerCommand = totalTime / 50;

      console.log('Concurrent Execution Metrics:', {
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgTimePerCommand: `${avgTimePerCommand.toFixed(2)}ms`,
        commandsExecuted: results.length
      });

      expect(results).toHaveLength(50);
      expect(avgTimePerCommand).toBeLessThan(50); // Should be much faster than sequential
      expect(totalTime).toBeLessThan(1000); // Total time should be reasonable
    });
  });

  describe('Policy Service Performance', () => {
    beforeEach(() => {
      policyService.clearCache();
    });

    it('should evaluate policies within performance thresholds', async () => {
      // Register comprehensive policy
      policyService.registerPolicy({
        name: 'benchmark-policy',
        rules: Array.from({ length: 10 }, (_, i) => ({
          resource: `Resource${i}`,
          action: 'create',
          conditions: {
            role: ['ADMIN', 'USER'],
            permissions: [`resource${i}.create`]
          }
        }))
      });

      const mockUser = {
        id: 'benchmark-user',
        role: 'ADMIN',
        permissions: Array.from({ length: 10 }, (_, i) => `resource${i}.create`)
      };

      const evaluationTimes: number[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const startTime = performance.now();
        await policyService.canExecute(`user-${i}`, 'TestCommand', mockUser);
        const endTime = performance.now();
        
        evaluationTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(evaluationTimes);

      console.log('Policy Evaluation Performance Metrics:', {
        ...metrics,
        unit: 'ms'
      });

      expect(metrics.avg).toBeLessThan(10); // Policy evaluation should be very fast
      expect(metrics.p95).toBeLessThan(20);
      expect(metrics.p99).toBeLessThan(50);
    });

    it('should benefit from caching on repeated evaluations', async () => {
      policyService.registerPolicy({
        name: 'cache-test',
        rules: [{
          resource: 'Test',
          action: 'create',
          conditions: { role: ['ADMIN'] }
        }]
      });

      const mockUser = { id: 'user', role: 'ADMIN', permissions: [] };

      // First evaluation (cold cache)
      const coldStart = performance.now();
      await policyService.canExecute('user', 'TestCommand', mockUser);
      const coldEnd = performance.now();
      const coldTime = coldEnd - coldStart;

      // Subsequent evaluations (warm cache)
      const warmTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const warmStart = performance.now();
        await policyService.canExecute('user', 'TestCommand', mockUser);
        const warmEnd = performance.now();
        warmTimes.push(warmEnd - warmStart);
      }

      const avgWarmTime = warmTimes.reduce((acc, time) => acc + time, 0) / warmTimes.length;

      console.log('Policy Caching Performance:', {
        coldTime: `${coldTime.toFixed(2)}ms`,
        avgWarmTime: `${avgWarmTime.toFixed(2)}ms`,
        speedupRatio: `${(coldTime / avgWarmTime).toFixed(1)}x`
      });

      // Warm cache should be significantly faster
      expect(avgWarmTime).toBeLessThan(coldTime);
      expect(avgWarmTime).toBeLessThan(5); // Cached evaluations should be very fast
    });
  });

  describe('Circuit Breaker Performance', () => {
    it('should have minimal overhead when circuit is closed', async () => {
      const circuitBreaker = new CircuitBreaker('performance-test', {
        failureThreshold: 5,
        resetTimeout: 1000
      });

      const mockOperation = jest.fn().mockResolvedValue('success');
      const executionTimes: number[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const startTime = performance.now();
        await circuitBreaker.execute(mockOperation);
        const endTime = performance.now();
        
        executionTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(executionTimes);

      console.log('Circuit Breaker Performance Metrics:', {
        ...metrics,
        unit: 'ms'
      });

      // Circuit breaker should add minimal overhead
      expect(metrics.avg).toBeLessThan(10);
      expect(metrics.p95).toBeLessThan(20);
    });

    it('should fail fast when circuit is open', async () => {
      const circuitBreaker = new CircuitBreaker('fail-fast-test', {
        failureThreshold: 3,
        resetTimeout: 5000
      });

      const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Test fail-fast performance
      const failFastTimes: number[] = [];

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail immediately
        }
        const endTime = performance.now();
        
        failFastTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(failFastTimes);

      console.log('Fail-Fast Performance Metrics:', {
        ...metrics,
        unit: 'ms'
      });

      // Fail-fast should be extremely quick
      expect(metrics.avg).toBeLessThan(1);
      expect(metrics.max).toBeLessThan(5);
      
      // Should not have called the actual operation
      expect(failingOperation).toHaveBeenCalledTimes(3); // Only during circuit tripping
    });
  });

  describe('Database Performance', () => {
    it('should handle connection pooling efficiently', async () => {
      // This test depends on your actual database service implementation
      if (!dbService.healthCheck) {
        console.log('Skipping database performance test - healthCheck not available');
        return;
      }

      const healthCheckTimes: number[] = [];

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        const isHealthy = await dbService.healthCheck();
        const endTime = performance.now();
        
        expect(isHealthy).toBe(true);
        healthCheckTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(healthCheckTimes);

      console.log('Database Health Check Performance:', {
        ...metrics,
        unit: 'ms'
      });

      expect(metrics.avg).toBeLessThan(50); // Database health checks should be fast
      expect(metrics.p95).toBeLessThan(100);
    });
  });

  describe('Memory Performance', () => {
    it('should not have significant memory leaks during stress testing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Stress test with many command executions
      class MemoryTestCommand {
        commandId = `memory-${Date.now()}-${Math.random()}`;
        executedAt?: Date;
        constructor(public data: string) {}
      }

      class MemoryTestHandler {
        async execute(command: MemoryTestCommand): Promise<string> {
          return `processed-${command.data}`;
        }
      }

      commandBus.register(MemoryTestCommand, new MemoryTestHandler());

      // Execute many commands
      for (let i = 0; i < STRESS_ITERATIONS; i++) {
        const command = new MemoryTestCommand(`stress-${i}`);
        await commandBus.execute(command);
        
        // Occasionally trigger garbage collection
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePerOp = memoryIncrease / STRESS_ITERATIONS;

      console.log('Memory Usage Analysis:', {
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
        finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
        increasePerOp: `${memoryIncreasePerOp.toFixed(2)} bytes`,
        operations: STRESS_ITERATIONS
      });

      // Memory increase should be reasonable
      expect(memoryIncreasePerOp).toBeLessThan(1000); // Less than 1KB per operation
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB total increase
    });
  });

  describe('End-to-End Performance', () => {
    it('should handle realistic workflow scenarios efficiently', async () => {
      // Simulate a realistic user workflow: policy check + command execution
      class WorkflowCommand {
        commandId = `workflow-${Date.now()}-${Math.random()}`;
        executedAt?: Date;
        constructor(public action: string, public userId: string) {}
      }

      class WorkflowHandler {
        async execute(command: WorkflowCommand): Promise<string> {
          // Simulate some business logic
          await new Promise(resolve => setTimeout(resolve, 5));
          return `completed-${command.action}`;
        }
      }

      commandBus.register(WorkflowCommand, new WorkflowHandler());

      policyService.registerPolicy({
        name: 'workflow-policy',
        rules: [{
          resource: 'Workflow',
          action: 'execute',
          conditions: { role: ['USER', 'ADMIN'] }
        }]
      });

      const mockUser = { id: 'workflow-user', role: 'USER', permissions: [] };
      const workflowTimes: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        // 1. Policy check
        const canExecute = await policyService.canExecute(`user-${i}`, 'WorkflowCommand', mockUser);
        expect(canExecute).toBe(true);
        
        // 2. Command execution
        const command = new WorkflowCommand(`action-${i}`, `user-${i}`);
        const result = await commandBus.execute(command);
        expect(result).toBe(`completed-action-${i}`);
        
        const endTime = performance.now();
        workflowTimes.push(endTime - startTime);
      }

      const metrics = calculateMetrics(workflowTimes);

      console.log('End-to-End Workflow Performance:', {
        ...metrics,
        unit: 'ms'
      });

      expect(metrics.avg).toBeLessThan(50); // Complete workflow should be fast
      expect(metrics.p95).toBeLessThan(100);
      expect(metrics.p99).toBeLessThan(200);
    });
  });
});