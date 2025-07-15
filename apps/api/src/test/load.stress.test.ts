/**
 * Load and Stress Testing
 * High-volume testing for production readiness and scalability
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';

// Mock environment
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.NODE_ENV = 'test';

// Mock all external dependencies
jest.mock('../services/database.service', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@counselflow.com',
        role: 'ADMIN',
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    client: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    matter: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    contract: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { securityMiddleware } from '../middleware/security.middleware';
import { errorHandler } from '../middleware/error.middleware';

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  totalDuration: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

interface StressTestMetrics {
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
  };
  cpuUsage: {
    initial: NodeJS.CpuUsage;
    final: NodeJS.CpuUsage;
  };
  loadTestResult: LoadTestResult;
}

describe('Load and Stress Testing', () => {
  let app: express.Application;
  let authToken: string;

  const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json({ limit: '10mb' }));
    testApp.use(securityMiddleware);

    // API routes with different complexity levels
    testApp.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: Date.now() });
    });

    testApp.get('/api/light', (req, res) => {
      // Light computational load
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));
      res.json({ success: true, data });
    });

    testApp.get('/api/medium', async (req, res) => {
      // Medium computational load with simulated async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random(),
        computed: Math.sqrt(i),
      }));
      res.json({ success: true, count: data.length });
    });

    testApp.get('/api/heavy', async (req, res) => {
      // Heavy computational load
      await new Promise(resolve => setTimeout(resolve, 50));
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.sqrt(i);
      }
      res.json({ success: true, result, computed: Date.now() });
    });

    testApp.use('/api/protected', authMiddleware);
    testApp.get('/api/protected/resource', (req, res) => {
      res.json({ success: true, user: req.user, data: 'protected content' });
    });

    testApp.post('/api/data', (req, res) => {
      res.json({ success: true, received: req.body, timestamp: Date.now() });
    });

    // Database simulation endpoints
    testApp.get('/api/users', async (req, res) => {
      const { prisma } = require('../services/database.service');
      const users = await prisma.user.findMany();
      res.json({ success: true, users, count: users.length });
    });

    testApp.get('/api/clients', async (req, res) => {
      const { prisma } = require('../services/database.service');
      const clients = await prisma.client.findMany();
      res.json({ success: true, clients, count: clients.length });
    });

    testApp.use(errorHandler);
    return testApp;
  };

  beforeAll(() => {
    authToken = jwt.sign(
      { userId: 'user-1', email: 'test@counselflow.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  const executeLoadTest = async (
    endpoint: string,
    options: {
      concurrent: number;
      totalRequests: number;
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: any;
    }
  ): Promise<LoadTestResult> => {
    const { concurrent, totalRequests, method = 'GET', headers = {}, body } = options;
    const responseTimes: number[] = [];
    const results: { success: boolean; time: number }[] = [];
    
    const startTime = performance.now();
    const batches = Math.ceil(totalRequests / concurrent);

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrent, totalRequests - batch * concurrent);
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < batchSize; i++) {
        const requestPromise = (async () => {
          const requestStart = performance.now();
          
          try {
            let requestBuilder = request(app)[method.toLowerCase() as 'get' | 'post'](endpoint);
            
            // Add headers
            Object.entries(headers).forEach(([key, value]) => {
              requestBuilder = requestBuilder.set(key, value);
            });

            // Add body for POST requests
            if (method === 'POST' && body) {
              requestBuilder = requestBuilder.send(body);
            }

            const response = await requestBuilder;
            const requestEnd = performance.now();
            const responseTime = requestEnd - requestStart;

            responseTimes.push(responseTime);
            results.push({
              success: response.status >= 200 && response.status < 300,
              time: responseTime,
            });
          } catch (error) {
            const requestEnd = performance.now();
            const responseTime = requestEnd - requestStart;
            
            responseTimes.push(responseTime);
            results.push({ success: false, time: responseTime });
          }
        })();

        batchPromises.push(requestPromise);
      }

      await Promise.all(batchPromises);
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const requestsPerSecond = (totalRequests / totalDuration) * 1000;
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p95ResponseTime = sortedTimes[p95Index] || 0;
    const p99ResponseTime = sortedTimes[p99Index] || 0;

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      totalDuration,
      p95ResponseTime,
      p99ResponseTime,
    };
  };

  const measureResourceUsage = async <T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: StressTestMetrics }> => {
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();
    let peakMemory = initialMemory;

    // Monitor memory usage during operation
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage();
      if (currentMemory.heapUsed > peakMemory.heapUsed) {
        peakMemory = currentMemory;
      }
    }, 100);

    try {
      const result = await operation();
      
      clearInterval(memoryMonitor);
      const finalMemory = process.memoryUsage();
      const finalCpu = process.cpuUsage(initialCpu);

      return {
        result,
        metrics: {
          memoryUsage: {
            initial: initialMemory,
            peak: peakMemory,
            final: finalMemory,
          },
          cpuUsage: {
            initial: initialCpu,
            final: finalCpu,
          },
          loadTestResult: result as LoadTestResult,
        },
      };
    } catch (error) {
      clearInterval(memoryMonitor);
      throw error;
    }
  };

  describe('Basic Load Testing', () => {
    it('should handle 100 concurrent requests to health endpoint', async () => {
      const result = await executeLoadTest('/api/health', {
        concurrent: 20,
        totalRequests: 100,
      });

      expect(result.successfulRequests).toBeGreaterThan(95); // 95% success rate
      expect(result.averageResponseTime).toBeLessThan(100); // Average < 100ms
      expect(result.p95ResponseTime).toBeLessThan(200); // 95th percentile < 200ms
      expect(result.requestsPerSecond).toBeGreaterThan(50); // At least 50 RPS
    });

    it('should handle 200 requests to light computation endpoint', async () => {
      const result = await executeLoadTest('/api/light', {
        concurrent: 25,
        totalRequests: 200,
      });

      expect(result.successfulRequests).toBeGreaterThan(190); // 95% success rate
      expect(result.averageResponseTime).toBeLessThan(150);
      expect(result.p99ResponseTime).toBeLessThan(500);
      expect(result.requestsPerSecond).toBeGreaterThan(30);
    });

    it('should handle mixed load with authentication', async () => {
      const result = await executeLoadTest('/api/protected/resource', {
        concurrent: 15,
        totalRequests: 75,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(result.successfulRequests).toBeGreaterThan(70); // Allow for some rate limiting
      expect(result.averageResponseTime).toBeLessThan(200);
      expect(result.failedRequests).toBeLessThan(10); // Most failures should be rate limits, not errors
    });
  });

  describe('Medium Load Testing', () => {
    it('should maintain performance under medium computational load', async () => {
      const result = await executeLoadTest('/api/medium', {
        concurrent: 20,
        totalRequests: 100,
      });

      expect(result.successfulRequests).toBeGreaterThan(95);
      expect(result.averageResponseTime).toBeLessThan(300); // Higher threshold for computational load
      expect(result.p95ResponseTime).toBeLessThan(500);
      expect(result.requestsPerSecond).toBeGreaterThan(20);
    });

    it('should handle POST requests with payloads', async () => {
      const payload = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
        metadata: { timestamp: Date.now(), source: 'load-test' },
      };

      const result = await executeLoadTest('/api/data', {
        concurrent: 15,
        totalRequests: 60,
        method: 'POST',
        body: payload,
      });

      expect(result.successfulRequests).toBeGreaterThan(55);
      expect(result.averageResponseTime).toBeLessThan(400);
      expect(result.p99ResponseTime).toBeLessThan(1000);
    });

    it('should handle database simulation queries', async () => {
      const result = await executeLoadTest('/api/users', {
        concurrent: 10,
        totalRequests: 50,
      });

      expect(result.successfulRequests).toBeGreaterThan(45);
      expect(result.averageResponseTime).toBeLessThan(200);
      expect(result.requestsPerSecond).toBeGreaterThan(15);
    });
  });

  describe('High Load Testing', () => {
    it('should survive sustained high load', async () => {
      const { result, metrics } = await measureResourceUsage(async () => {
        return await executeLoadTest('/api/light', {
          concurrent: 30,
          totalRequests: 300,
        });
      });

      expect(result.successfulRequests).toBeGreaterThan(250); // Allow for some rate limiting
      expect(result.averageResponseTime).toBeLessThan(250);
      
      // Memory usage should not grow excessively
      const memoryGrowth = metrics.memoryUsage.peak.heapUsed - metrics.memoryUsage.initial.heapUsed;
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    });

    it('should handle burst traffic patterns', async () => {
      // Simulate burst traffic: rapid requests followed by normal load
      const burstResult = await executeLoadTest('/api/health', {
        concurrent: 50,
        totalRequests: 100,
      });

      // Wait a bit between bursts
      await new Promise(resolve => setTimeout(resolve, 1000));

      const normalResult = await executeLoadTest('/api/light', {
        concurrent: 10,
        totalRequests: 50,
      });

      // Both phases should succeed
      expect(burstResult.successfulRequests).toBeGreaterThan(80);
      expect(normalResult.successfulRequests).toBeGreaterThan(45);
      expect(normalResult.averageResponseTime).toBeLessThan(150); // Should recover quickly
    });
  });

  describe('Stress Testing', () => {
    it('should handle heavy computational load with resource monitoring', async () => {
      const { result, metrics } = await measureResourceUsage(async () => {
        return await executeLoadTest('/api/heavy', {
          concurrent: 5,
          totalRequests: 25,
        });
      });

      expect(result.successfulRequests).toBeGreaterThan(20);
      expect(result.averageResponseTime).toBeLessThan(2000); // Heavy operations take longer
      
      // Should not consume excessive CPU time
      const cpuTime = metrics.cpuUsage.final.user + metrics.cpuUsage.final.system;
      expect(cpuTime).toBeLessThan(10000000); // Less than 10 seconds of CPU time
    });

    it('should maintain stability under memory pressure', async () => {
      const largePayload = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          content: 'x'.repeat(1000), // 1KB per item
          metadata: { timestamp: Date.now(), index: i },
        })),
      };

      const { result, metrics } = await measureResourceUsage(async () => {
        return await executeLoadTest('/api/data', {
          concurrent: 10,
          totalRequests: 30,
          method: 'POST',
          body: largePayload,
        });
      });

      expect(result.successfulRequests).toBeGreaterThan(25);
      
      // Memory should be manageable
      const finalMemoryMB = metrics.memoryUsage.final.heapUsed / (1024 * 1024);
      expect(finalMemoryMB).toBeLessThan(500); // Less than 500MB
    });

    it('should recover from overload conditions', async () => {
      // Create overload condition
      const overloadPromise = executeLoadTest('/api/heavy', {
        concurrent: 20,
        totalRequests: 40,
      });

      // Wait for system to be under stress
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test recovery with light requests
      const recoveryResult = await executeLoadTest('/api/health', {
        concurrent: 5,
        totalRequests: 25,
      });

      await overloadPromise; // Wait for overload test to complete

      // Recovery requests should still succeed
      expect(recoveryResult.successfulRequests).toBeGreaterThan(20);
      expect(recoveryResult.averageResponseTime).toBeLessThan(300);
    });
  });

  describe('Endurance Testing', () => {
    it('should maintain performance over extended periods', async () => {
      const testDuration = 30000; // 30 seconds
      const intervalMs = 100; // Request every 100ms
      const expectedRequests = Math.floor(testDuration / intervalMs);
      
      const results: { success: boolean; responseTime: number }[] = [];
      const startTime = performance.now();

      while (performance.now() - startTime < testDuration) {
        const requestStart = performance.now();
        
        try {
          const response = await request(app).get('/api/health');
          const responseTime = performance.now() - requestStart;
          
          results.push({
            success: response.status === 200,
            responseTime,
          });
        } catch (error) {
          results.push({
            success: false,
            responseTime: performance.now() - requestStart,
          });
        }

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

      const successRate = results.filter(r => r.success).length / results.length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(200); // Consistent performance
      expect(results.length).toBeGreaterThan(expectedRequests * 0.8); // Reasonable request count
    });

    it('should handle gradual load increase', async () => {
      const phases = [
        { concurrent: 5, requests: 25, name: 'Phase 1' },
        { concurrent: 10, requests: 50, name: 'Phase 2' },
        { concurrent: 15, requests: 75, name: 'Phase 3' },
        { concurrent: 20, requests: 100, name: 'Phase 4' },
      ];

      const phaseResults: LoadTestResult[] = [];

      for (const phase of phases) {
        const result = await executeLoadTest('/api/light', {
          concurrent: phase.concurrent,
          totalRequests: phase.requests,
        });

        phaseResults.push(result);

        // Each phase should maintain reasonable performance
        expect(result.successfulRequests).toBeGreaterThan(phase.requests * 0.9);
        expect(result.averageResponseTime).toBeLessThan(300);

        // Brief pause between phases
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Performance should not degrade significantly across phases
      const responseTimes = phaseResults.map(r => r.averageResponseTime);
      const firstPhaseTime = responseTimes[0];
      const lastPhaseTime = responseTimes[responseTimes.length - 1];
      
      // Last phase should not be more than 3x slower than first phase
      expect(lastPhaseTime).toBeLessThan(firstPhaseTime * 3);
    });
  });

  describe('Failure Recovery Testing', () => {
    it('should recover gracefully from simulated failures', async () => {
      // Create an endpoint that fails intermittently
      app.get('/api/unreliable', (req, res) => {
        if (Math.random() < 0.3) { // 30% failure rate
          res.status(500).json({ success: false, error: 'Simulated failure' });
        } else {
          res.json({ success: true, data: 'Request succeeded' });
        }
      });

      const result = await executeLoadTest('/api/unreliable', {
        concurrent: 10,
        totalRequests: 100,
      });

      // Should have around 70% success rate due to simulated failures
      expect(result.successfulRequests).toBeGreaterThan(60);
      expect(result.successfulRequests).toBeLessThan(80);
      
      // Response times should still be reasonable for successful requests
      expect(result.averageResponseTime).toBeLessThan(200);
    });

    it('should maintain service availability during partial failures', async () => {
      // Test that healthy endpoints continue working when others fail
      const healthyResult = executeLoadTest('/api/health', {
        concurrent: 10,
        totalRequests: 50,
      });

      const failingResult = executeLoadTest('/api/nonexistent', {
        concurrent: 5,
        totalRequests: 25,
      });

      const [healthy, failing] = await Promise.all([healthyResult, failingResult]);

      // Healthy endpoint should maintain high success rate
      expect(healthy.successfulRequests).toBeGreaterThan(45);
      expect(healthy.averageResponseTime).toBeLessThan(150);

      // Failing endpoint should fail consistently but not affect healthy ones
      expect(failing.successfulRequests).toBe(0);
    });
  });

  afterAll(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });
});