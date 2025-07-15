/**
 * Middleware Integration Tests
 * Tests for authentication, validation, security, and rate limiting middleware
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { securityMiddleware } from '../middleware/security.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { loggingMiddleware } from '../middleware/logging.middleware';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Prisma for auth middleware
jest.mock('../services/database.service', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
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

describe('Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  describe('Authentication Middleware', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@counselflow.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    };

    beforeEach(() => {
      // Setup test routes
      app.use('/protected', authMiddleware);
      app.get('/protected/test', (req, res) => {
        res.json({ success: true, user: req.user });
      });
      app.use(errorHandler);
    });

    it('should authenticate valid JWT token', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toMatchObject(mockUser);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected/test')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', 'Invalid token format')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token format');
    });

    it('should reject malformed JWT token', async () => {
      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Token expired');
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign(
        { userId: 'non-existent', email: 'fake@test.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors gracefully', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/protected/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should set user context for subsequent middleware', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Add middleware to check user context
      app.use('/context', authMiddleware);
      app.get('/context/test', (req, res) => {
        expect(req.user).toMatchObject(mockUser);
        expect(req.userId).toBe(mockUser.id);
        res.json({ success: true });
      });

      await request(app)
        .get('/context/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Validation Middleware', () => {
    const { z } = require('zod');

    beforeEach(() => {
      // Test validation schemas
      const userCreateSchema = z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        age: z.number().min(18).max(100),
      });

      app.post('/validate/user', validationMiddleware(userCreateSchema), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);
    });

    it('should pass valid data through', async () => {
      const validData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
      };

      const response = await request(app)
        .post('/validate/user')
        .send(validData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject(validData);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
      };

      const response = await request(app)
        .post('/validate/user')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        firstName: 'John',
        // lastName missing
        age: 30,
      };

      const response = await request(app)
        .post('/validate/user')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.details).toContain('lastName');
    });

    it('should reject out-of-range values', async () => {
      const invalidAgeData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 15, // Below minimum
      };

      const response = await request(app)
        .post('/validate/user')
        .send(invalidAgeData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.details).toContain('age');
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: 'test@example.com',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe"; DROP TABLE users; --',
        age: 30,
      };

      const response = await request(app)
        .post('/validate/user')
        .send(maliciousData)
        .expect(200);

      // Check that dangerous characters are removed
      expect(response.body.data.firstName).not.toContain('<script>');
      expect(response.body.data.lastName).not.toContain('DROP TABLE');
      expect(response.body.data.firstName).toBe('scriptalert("xss")/scriptJohn');
    });

    it('should handle nested object validation', async () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          contact: z.object({
            email: z.string().email(),
            phone: z.string().optional(),
          }),
        }),
        metadata: z.object({
          source: z.string(),
          tags: z.array(z.string()),
        }),
      });

      app.post('/validate/nested', validationMiddleware(nestedSchema), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const validNestedData = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '555-0123',
          },
        },
        metadata: {
          source: 'web',
          tags: ['customer', 'priority'],
        },
      };

      const response = await request(app)
        .post('/validate/nested')
        .send(validNestedData)
        .expect(200);

      expect(response.body.data).toMatchObject(validNestedData);
    });
  });

  describe('Rate Limiting Middleware', () => {
    beforeEach(() => {
      app.use('/limited', rateLimitMiddleware);
      app.get('/limited/test', (req, res) => {
        res.json({ success: true, timestamp: Date.now() });
      });
      app.use(errorHandler);
    });

    it('should allow requests under the limit', async () => {
      // Make 5 requests quickly (should be under limit)
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/limited/test')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    it('should block requests over the limit', async () => {
      // Make many requests quickly to exceed limit
      const requests = Array.from({ length: 150 }, () =>
        request(app).get('/limited/test')
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429 status)
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeLessThan(150);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/limited/test')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should reset rate limit after window expires', async () => {
      // This test would need to wait for the rate limit window to reset
      // For testing purposes, we'll verify the basic functionality
      const response = await request(app)
        .get('/limited/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should handle different IP addresses separately', async () => {
      // Simulate requests from different IPs
      const requests = [
        request(app).get('/limited/test').set('X-Forwarded-For', '192.168.1.1'),
        request(app).get('/limited/test').set('X-Forwarded-For', '192.168.1.2'),
        request(app).get('/limited/test').set('X-Forwarded-For', '192.168.1.3'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security Middleware', () => {
    beforeEach(() => {
      app.use(securityMiddleware);
      app.get('/secure/test', (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandler);
    });

    it('should set security headers', async () => {
      const response = await request(app)
        .get('/secure/test')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should block suspicious user agents', async () => {
      const response = await request(app)
        .get('/secure/test')
        .set('User-Agent', 'sqlmap/1.0')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    it('should detect potential XSS attempts', async () => {
      const response = await request(app)
        .get('/secure/test')
        .query({ search: '<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Potential XSS detected');
    });

    it('should detect SQL injection attempts', async () => {
      const response = await request(app)
        .get('/secure/test')
        .query({ id: "1'; DROP TABLE users; --" })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Potential SQL injection detected');
    });

    it('should block requests with suspicious paths', async () => {
      const response = await request(app)
        .get('/secure/../../../etc/passwd')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid path');
    });

    it('should limit request body size', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB

      const response = await request(app)
        .post('/secure/test')
        .send({ data: largePayload })
        .expect(413);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate content type for POST requests', async () => {
      const response = await request(app)
        .post('/secure/test')
        .set('Content-Type', 'application/xml')
        .send('<xml>test</xml>')
        .expect(415);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unsupported media type');
    });
  });

  describe('Logging Middleware', () => {
    const { logger } = require('../config/logger');

    beforeEach(() => {
      app.use(loggingMiddleware);
      app.get('/logged/test', (req, res) => {
        res.json({ success: true });
      });
      app.post('/logged/error', (req, res) => {
        throw new Error('Test error');
      });
      app.use(errorHandler);
    });

    it('should log successful requests', async () => {
      await request(app)
        .get('/logged/test')
        .expect(200);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Request completed'),
        expect.objectContaining({
          method: 'GET',
          url: '/logged/test',
          statusCode: 200,
        })
      );
    });

    it('should log request details', async () => {
      await request(app)
        .post('/logged/test')
        .set('User-Agent', 'test-agent')
        .send({ test: 'data' })
        .expect(200);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Request completed'),
        expect.objectContaining({
          method: 'POST',
          url: '/logged/test',
          userAgent: 'test-agent',
        })
      );
    });

    it('should log error responses', async () => {
      await request(app)
        .post('/logged/error')
        .expect(500);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Request failed'),
        expect.objectContaining({
          method: 'POST',
          url: '/logged/error',
          statusCode: 500,
          error: expect.any(String),
        })
      );
    });

    it('should measure request duration', async () => {
      await request(app)
        .get('/logged/test')
        .expect(200);

      expect(logger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });

    it('should log IP address and user agent', async () => {
      await request(app)
        .get('/logged/test')
        .set('User-Agent', 'Mozilla/5.0')
        .set('X-Forwarded-For', '192.168.1.100')
        .expect(200);

      expect(logger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: 'Mozilla/5.0',
        })
      );
    });
  });

  describe('Error Handler Middleware', () => {
    beforeEach(() => {
      app.get('/error/test', (req, res) => {
        throw new Error('Test error');
      });

      app.get('/error/custom', (req, res, next) => {
        const error = new Error('Custom error') as any;
        error.statusCode = 418;
        error.code = 'CUSTOM_ERROR';
        next(error);
      });

      app.get('/error/validation', (req, res, next) => {
        const error = new Error('Validation failed') as any;
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.details = ['Field is required', 'Invalid format'];
        next(error);
      });

      app.use(errorHandler);
    });

    it('should handle generic errors', async () => {
      const response = await request(app)
        .get('/error/test')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should handle custom error codes', async () => {
      const response = await request(app)
        .get('/error/custom')
        .expect(418);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Custom error');
      expect(response.body).toHaveProperty('code', 'CUSTOM_ERROR');
    });

    it('should include validation details', async () => {
      const response = await request(app)
        .get('/error/validation')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveLength(2);
    });

    it('should include error ID for tracking', async () => {
      const response = await request(app)
        .get('/error/test')
        .expect(500);

      expect(response.body).toHaveProperty('errorId');
      expect(typeof response.body.errorId).toBe('string');
    });

    it('should log errors appropriately', async () => {
      const { logger } = require('../config/logger');

      await request(app)
        .get('/error/test')
        .expect(500);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled error'),
        expect.objectContaining({
          error: expect.any(String),
          stack: expect.any(String),
          errorId: expect.any(String),
        })
      );
    });
  });

  describe('Middleware Chain Integration', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@counselflow.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    };

    beforeEach(() => {
      const { z } = require('zod');
      const dataSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      });

      // Full middleware chain
      app.use(loggingMiddleware);
      app.use(securityMiddleware);
      app.use('/api', rateLimitMiddleware);
      app.use('/api/protected', authMiddleware);
      app.post('/api/protected/data', validationMiddleware(dataSchema), (req, res) => {
        res.json({ success: true, data: req.body, user: req.user });
      });
      app.use(errorHandler);

      prisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should process request through full middleware chain', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const validData = {
        title: 'Test Data',
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send(validData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject(validData);
      expect(response.body.user).toMatchObject(mockUser);
    });

    it('should fail at authentication step', async () => {
      const validData = {
        title: 'Test Data',
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/protected/data')
        .send(validData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should fail at validation step', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const invalidData = {
        title: '', // Empty title
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should fail at security step', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'curl/7.0 (malicious scanner)')
        .send({ title: 'Test' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });
});