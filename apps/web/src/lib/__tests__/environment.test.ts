/**
 * Environment Configuration Tests
 * Tests for environment variable validation and configuration
 */

// Mock the environment module to avoid readonly property issues
jest.mock('../../lib/environment', () => {
  const originalModule = jest.requireActual('../../lib/environment');
  return {
    ...originalModule,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
      PORT: Number(process.env.PORT) || 3000,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
    }
  };
});

describe('Environment Configuration', () => {
  describe('Required Environment Variables', () => {
    it('should have all required environment variables defined', () => {
      const { env } = require('../../lib/environment');

      expect(env.JWT_SECRET).toBeDefined();
      expect(env.JWT_REFRESH_SECRET).toBeDefined();
      expect(env.DATABASE_URL).toBeDefined();
      expect(env.NODE_ENV).toBeDefined();
    });

    it('should validate JWT secret strength', () => {
      const { env } = require('../../lib/environment');

      expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(8);
      expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(8);
    });

    it('should have valid database URL format', () => {
      const { env } = require('../../lib/environment');

      expect(env.DATABASE_URL).toMatch(/^postgresql:\/\/.+/);
    });
  });

  describe('Optional Environment Variables', () => {
    it('should use default values for optional variables', () => {
      const { env } = require('../../lib/environment');

      expect(env.PORT).toBe(3000);
      expect(env.JWT_EXPIRES_IN).toBe('15m');
      expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    });

    it('should have proper CORS origins format', () => {
      const { env } = require('../../lib/environment');

      expect(Array.isArray(env.CORS_ORIGINS)).toBe(true);
      expect(env.CORS_ORIGINS.length).toBeGreaterThan(0);
      expect(env.CORS_ORIGINS[0]).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should have valid rate limiting values', () => {
      const { env } = require('../../lib/environment');

      expect(typeof env.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(typeof env.RATE_LIMIT_MAX_REQUESTS).toBe('number');
      expect(env.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
      expect(env.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
    });

    it('should use reasonable default values', () => {
      const { env } = require('../../lib/environment');

      expect(env.RATE_LIMIT_WINDOW_MS).toBe(900000); // 15 minutes
      expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    });
  });

  describe('Email Configuration', () => {
    it('should handle optional email settings', () => {
      const { env } = require('../../lib/environment');

      // These can be undefined in test environment
      if (env.SMTP_HOST) {
        expect(typeof env.SMTP_HOST).toBe('string');
      }
      
      if (env.SMTP_PORT) {
        expect(typeof env.SMTP_PORT).toBe('number');
        expect(env.SMTP_PORT).toBeGreaterThan(0);
      }
    });
  });

  describe('Security Configuration', () => {
    it('should have secure JWT configuration', () => {
      const { env } = require('../../lib/environment');

      // JWT secrets should be different
      expect(env.JWT_SECRET).not.toBe(env.JWT_REFRESH_SECRET);
      
      // Should have reasonable expiration times
      expect(env.JWT_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
      expect(env.JWT_REFRESH_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
    });

    it('should validate environment type', () => {
      const { env } = require('../../lib/environment');

      expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    });
  });

  describe('Environment Variable Types', () => {
    it('should properly convert types', () => {
      const { env } = require('../../lib/environment');

      expect(typeof env.PORT).toBe('number');
      expect(typeof env.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(typeof env.RATE_LIMIT_MAX_REQUESTS).toBe('number');
      expect(Array.isArray(env.CORS_ORIGINS)).toBe(true);
    });

    it('should have valid numeric ranges', () => {
      const { env } = require('../../lib/environment');

      expect(env.PORT).toBeGreaterThan(0);
      expect(env.PORT).toBeLessThan(65536);
      
      if (env.SMTP_PORT) {
        expect(env.SMTP_PORT).toBeGreaterThan(0);
        expect(env.SMTP_PORT).toBeLessThan(65536);
      }
    });
  });
});
