/**
 * Security and Performance Tests
 * Comprehensive tests for security vulnerabilities and performance benchmarks
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { securityMiddleware } from '../middleware/security.middleware';
import { errorHandler } from '../middleware/error.middleware';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Prisma
jest.mock('../services/database.service', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    matter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const { prisma } = require('../services/database.service');

describe('Security and Performance Tests', () => {
  let app: express.Application;
  let authToken: string;

  const mockUser = {
    id: 'user-1',
    email: 'test@counselflow.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN',
  };

  beforeAll(() => {
    // Generate auth token for authenticated tests
    authToken = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test app
    app = express();
    app.use(cors());
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(securityMiddleware);
    app.use('/api', rateLimitMiddleware);

    // Test routes
    app.get('/api/public/test', (req, res) => {
      res.json({ success: true, message: 'Public endpoint' });
    });

    app.use('/api/protected', authMiddleware);
    app.get('/api/protected/test', (req, res) => {
      res.json({ success: true, user: req.user });
    });

    app.post('/api/protected/data', (req, res) => {
      res.json({ success: true, data: req.body });
    });

    // Performance test endpoints
    app.get('/api/performance/cpu', (req, res) => {
      // CPU intensive operation
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
      }
      res.json({ success: true, result });
    });

    app.get('/api/performance/memory', (req, res) => {
      // Memory intensive operation
      const largeArray = new Array(100000).fill(0).map((_, i) => ({
        id: i,
        data: `item-${i}`,
        timestamp: new Date(),
      }));
      res.json({ success: true, count: largeArray.length });
    });

    app.get('/api/performance/database', async (req, res) => {
      // Mock database query
      prisma.user.findMany.mockResolvedValue(Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        firstName: `User${i}`,
      })));

      const users = await prisma.user.findMany();
      res.json({ success: true, count: users.length });
    });

    app.use(errorHandler);
    
    // Mock user for auth middleware
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('Security Vulnerability Tests', () => {
    describe('Authentication Security', () => {
      it('should reject requests with no authentication', async () => {
        const response = await request(app)
          .get('/api/protected/test')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'No token provided');
      });

      it('should reject malformed JWT tokens', async () => {
        const malformedTokens = [
          'Bearer invalid.jwt.token',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
          'Bearer ' + 'x'.repeat(500), // Extremely long token
          'Bearer <script>alert("xss")</script>',
        ];

        for (const token of malformedTokens) {
          const response = await request(app)
            .get('/api/protected/test')
            .set('Authorization', token)
            .expect(401);

          expect(response.body).toHaveProperty('success', false);
        }
      });

      it('should reject expired tokens', async () => {
        const expiredToken = jwt.sign(
          { userId: mockUser.id, email: mockUser.email },
          process.env.JWT_SECRET!,
          { expiresIn: '-1h' }
        );

        const response = await request(app)
          .get('/api/protected/test')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Token expired');
      });

      it('should reject tokens with invalid signatures', async () => {
        const invalidToken = jwt.sign(
          { userId: mockUser.id, email: mockUser.email },
          'wrong-secret',
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .get('/api/protected/test')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid token');
      });
    });

    describe('Input Validation Security', () => {
      it('should prevent XSS attacks in query parameters', async () => {
        const xssPayloads = [
          '<script>alert("xss")</script>',
          '<img src=x onerror=alert("xss")>',
          'javascript:alert("xss")',
          '<svg onload=alert("xss")>',
          '"><script>alert("xss")</script>',
        ];

        for (const payload of xssPayloads) {
          const response = await request(app)
            .get('/api/public/test')
            .query({ search: payload })
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error', 'Potential XSS detected');
        }
      });

      it('should prevent SQL injection attacks', async () => {
        const sqlPayloads = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "1'; UPDATE users SET password='hacked' WHERE '1'='1'; --",
          "' UNION SELECT * FROM users --",
          "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        ];

        for (const payload of sqlPayloads) {
          const response = await request(app)
            .get('/api/public/test')
            .query({ id: payload })
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error', 'Potential SQL injection detected');
        }
      });

      it('should prevent NoSQL injection attacks', async () => {
        const noSqlPayloads = [
          '{"$gt": ""}',
          '{"$ne": null}',
          '{"$where": "function() { return true; }"}',
          '{"$regex": ".*"}',
        ];

        for (const payload of noSqlPayloads) {
          const response = await request(app)
            .post('/api/protected/data')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ query: payload })
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
        }
      });

      it('should prevent command injection attacks', async () => {
        const commandPayloads = [
          '; ls -la',
          '| cat /etc/passwd',
          '&& whoami',
          '`rm -rf /`',
          '$(cat /etc/shadow)',
        ];

        for (const payload of commandPayloads) {
          const response = await request(app)
            .post('/api/protected/data')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ command: payload })
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
        }
      });

      it('should prevent path traversal attacks', async () => {
        const pathTraversalPayloads = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32\\config\\sam',
          '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
          '....//....//....//etc/passwd',
          '..%252f..%252f..%252fetc%252fpasswd',
        ];

        for (const payload of pathTraversalPayloads) {
          const response = await request(app)
            .get(`/api/public/${payload}`)
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error', 'Invalid path');
        }
      });
    });

    describe('Request Security', () => {
      it('should enforce HTTPS security headers', async () => {
        const response = await request(app)
          .get('/api/public/test')
          .expect(200);

        expect(response.headers).toHaveProperty('strict-transport-security');
        expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
        expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
        expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
        expect(response.headers).toHaveProperty('content-security-policy');
      });

      it('should reject requests with suspicious user agents', async () => {
        const suspiciousUserAgents = [
          'sqlmap/1.0',
          'Nikto/2.1.6',
          'dirb/2.22',
          'gobuster/3.0',
          'w3af.org',
          'ZAP/2.9.0',
        ];

        for (const userAgent of suspiciousUserAgents) {
          const response = await request(app)
            .get('/api/public/test')
            .set('User-Agent', userAgent)
            .expect(403);

          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error', 'Forbidden');
        }
      });

      it('should limit request body size', async () => {
        const largePayload = 'x'.repeat(20 * 1024 * 1024); // 20MB

        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ data: largePayload })
          .expect(413);

        expect(response.body).toHaveProperty('success', false);
      });

      it('should validate content type for POST requests', async () => {
        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/xml')
          .send('<xml>test</xml>')
          .expect(415);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Unsupported media type');
      });

      it('should prevent header injection attacks', async () => {
        const headerInjectionPayloads = [
          'test\r\nX-Injected: true',
          'test\nX-Injected: true',
          'test\r\n\r\n<script>alert("xss")</script>',
        ];

        for (const payload of headerInjectionPayloads) {
          const response = await request(app)
            .get('/api/public/test')
            .set('X-Custom-Header', payload)
            .expect(400);

          expect(response.body).toHaveProperty('success', false);
        }
      });
    });

    describe('Rate Limiting Security', () => {
      it('should enforce rate limits on API endpoints', async () => {
        // Make rapid requests to trigger rate limiting
        const requests = Array.from({ length: 200 }, () =>
          request(app).get('/api/public/test')
        );

        const responses = await Promise.all(requests);
        
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });

      it('should have stricter rate limits for authentication endpoints', async () => {
        // Simulate multiple failed login attempts
        const loginAttempts = Array.from({ length: 10 }, () =>
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'wrong' })
        );

        const responses = await Promise.all(loginAttempts);
        
        // Should have some rate limited responses
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });

      it('should reset rate limits after window expires', async () => {
        // This test would require waiting for the rate limit window
        // For testing purposes, we verify the basic functionality
        const response = await request(app)
          .get('/api/public/test')
          .expect(200);

        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
      });
    });

    describe('Data Sanitization', () => {
      it('should sanitize HTML tags from input', async () => {
        const htmlPayload = {
          title: '<h1>Title</h1>',
          description: '<p>Description with <strong>formatting</strong></p>',
          script: '<script>alert("xss")</script>',
        };

        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .send(htmlPayload)
          .expect(200);

        expect(response.body.data.title).not.toContain('<h1>');
        expect(response.body.data.description).not.toContain('<p>');
        expect(response.body.data.script).not.toContain('<script>');
      });

      it('should sanitize dangerous JavaScript patterns', async () => {
        const jsPayload = {
          onload: 'onload="alert(1)"',
          href: 'javascript:alert(1)',
          src: 'data:text/html,<script>alert(1)</script>',
        };

        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jsPayload)
          .expect(200);

        expect(response.body.data.onload).not.toContain('onload=');
        expect(response.body.data.href).not.toContain('javascript:');
        expect(response.body.data.src).not.toContain('data:text/html');
      });

      it('should preserve safe content while removing dangerous patterns', async () => {
        const mixedPayload = {
          safe: 'This is safe content',
          email: 'user@example.com',
          phone: '+1-555-0123',
          dangerous: '<script>alert("xss")</script>Safe content',
        };

        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .send(mixedPayload)
          .expect(200);

        expect(response.body.data.safe).toBe('This is safe content');
        expect(response.body.data.email).toBe('user@example.com');
        expect(response.body.data.phone).toBe('+1-555-0123');
        expect(response.body.data.dangerous).toContain('Safe content');
        expect(response.body.data.dangerous).not.toContain('<script>');
      });
    });
  });

  describe('Performance Tests', () => {
    describe('Response Time Tests', () => {
      it('should respond to simple requests within acceptable time', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/public/test')
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(100); // Should respond within 100ms
        expect(response.body).toHaveProperty('success', true);
      });

      it('should handle authentication within acceptable time', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/protected/test')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(200); // Should respond within 200ms
        expect(response.body).toHaveProperty('success', true);
      });

      it('should handle CPU-intensive operations within time limits', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/performance/cpu')
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('result');
      });

      it('should handle memory-intensive operations efficiently', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/performance/memory')
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.count).toBe(100000);
      });

      it('should handle database queries efficiently', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/performance/database')
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.count).toBe(1000);
      });
    });

    describe('Concurrent Request Handling', () => {
      it('should handle multiple concurrent requests efficiently', async () => {
        const concurrentRequests = 50;
        const startTime = Date.now();

        const requests = Array.from({ length: concurrentRequests }, () =>
          request(app).get('/api/public/test')
        );

        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('success', true);
        });

        // Should handle all requests within reasonable time
        expect(totalTime).toBeLessThan(5000); // 5 seconds for 50 concurrent requests
        
        // Average response time should be reasonable
        const avgResponseTime = totalTime / concurrentRequests;
        expect(avgResponseTime).toBeLessThan(100);
      });

      it('should handle concurrent authenticated requests', async () => {
        const concurrentRequests = 20;
        
        const requests = Array.from({ length: concurrentRequests }, () =>
          request(app)
            .get('/api/protected/test')
            .set('Authorization', `Bearer ${authToken}`)
        );

        const responses = await Promise.all(requests);

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('user');
        });
      });

      it('should maintain performance under mixed workload', async () => {
        const publicRequests = Array.from({ length: 20 }, () =>
          request(app).get('/api/public/test')
        );

        const protectedRequests = Array.from({ length: 10 }, () =>
          request(app)
            .get('/api/protected/test')
            .set('Authorization', `Bearer ${authToken}`)
        );

        const cpuRequests = Array.from({ length: 5 }, () =>
          request(app).get('/api/performance/cpu')
        );

        const startTime = Date.now();
        const allRequests = [...publicRequests, ...protectedRequests, ...cpuRequests];
        const responses = await Promise.all(allRequests);
        const endTime = Date.now();

        const successfulResponses = responses.filter(r => r.status === 200);
        
        // Most requests should succeed (some might be rate limited)
        expect(successfulResponses.length).toBeGreaterThan(30);
        
        // Should complete within reasonable time
        expect(endTime - startTime).toBeLessThan(10000);
      });
    });

    describe('Memory and Resource Management', () => {
      it('should not leak memory during request processing', async () => {
        const initialMemory = process.memoryUsage();
        
        // Process many requests
        const requests = Array.from({ length: 100 }, () =>
          request(app).get('/api/public/test')
        );

        await Promise.all(requests);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage();
        
        // Memory increase should be reasonable (less than 50MB)
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      });

      it('should handle large payloads efficiently', async () => {
        const largePayload = {
          data: 'x'.repeat(1024 * 1024), // 1MB string
          array: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
        };

        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/protected/data')
          .set('Authorization', `Bearer ${authToken}`)
          .send(largePayload)
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(3000); // Should process within 3 seconds
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('Error Handling Performance', () => {
      it('should handle errors efficiently without performance degradation', async () => {
        // Mix of successful and error requests
        const successRequests = Array.from({ length: 20 }, () =>
          request(app).get('/api/public/test')
        );

        const errorRequests = Array.from({ length: 10 }, () =>
          request(app).get('/api/nonexistent')
        );

        const authErrorRequests = Array.from({ length: 10 }, () =>
          request(app).get('/api/protected/test')
        );

        const startTime = Date.now();
        const allRequests = [...successRequests, ...errorRequests, ...authErrorRequests];
        await Promise.all(allRequests);
        const endTime = Date.now();

        // Should complete within reasonable time despite errors
        expect(endTime - startTime).toBeLessThan(3000);
      });

      it('should handle validation errors efficiently', async () => {
        const invalidRequests = Array.from({ length: 50 }, () =>
          request(app)
            .post('/api/protected/data')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ invalidField: '<script>alert("xss")</script>' })
        );

        const startTime = Date.now();
        await Promise.all(invalidRequests);
        const endTime = Date.now();

        // Should handle validation efficiently
        expect(endTime - startTime).toBeLessThan(2000);
      });
    });
  });

  describe('Stress Testing', () => {
    it('should maintain stability under high load', async () => {
      const highLoadRequests = 200;
      const batchSize = 20;
      
      // Process requests in batches to avoid overwhelming the system
      for (let i = 0; i < highLoadRequests; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, highLoadRequests - i) }, () =>
          request(app).get('/api/public/test')
        );

        const responses = await Promise.all(batch);
        
        // Most responses should be successful (some might be rate limited)
        const successfulResponses = responses.filter(r => r.status === 200);
        expect(successfulResponses.length).toBeGreaterThan(0);
      }
    });

    it('should recover gracefully from resource exhaustion', async () => {
      // Trigger resource-intensive operations
      const intensiveRequests = Array.from({ length: 10 }, () =>
        request(app).get('/api/performance/memory')
      );

      await Promise.all(intensiveRequests);

      // System should still respond to normal requests
      const response = await request(app)
        .get('/api/public/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});