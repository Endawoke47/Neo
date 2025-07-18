/**
 * Test Setup Configuration
 * Simplified testing environment setup
 */

import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-testing-only-minimum-32-chars';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-key-for-testing-only-minimum-32-chars';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['BCRYPT_SALT_ROUNDS'] = '10';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/counselflow_test';
process.env['APP_URL'] = 'http://localhost:3000';
process.env['ENABLE_REGISTRATION'] = 'true';

// Enhanced test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Disable console logs during tests (unless debugging)
  if (!process.env['DEBUG_TESTS']) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(async () => {
  // Restore console methods
  if (!process.env['DEBUG_TESTS']) {
    (console.log as jest.Mock).mockRestore?.();
    (console.info as jest.Mock).mockRestore?.();
    (console.warn as jest.Mock).mockRestore?.();
  }
});

beforeEach(() => {
  // Reset any mocks or state before each test
  jest.clearAllMocks();
});

// Custom Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidUUID(): R;
      toHavePerformanceWithin(maxMs: number): R;
    }
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => pass 
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      message: () => pass
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toHavePerformanceWithin(received: number, maxMs: number) {
    const pass = received <= maxMs;
    
    return {
      message: () => pass
        ? `expected performance ${received}ms not to be within ${maxMs}ms`
        : `expected performance ${received}ms to be within ${maxMs}ms`,
      pass,
    };
  }
});

// Test utilities
export const PERFORMANCE_THRESHOLDS = {
  DATABASE_QUERY: 50, // ms
  API_RESPONSE: 200, // ms
  AI_REQUEST: 5000, // ms
};

export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  role: 'ADMIN',
  permissions: ['all.access'],
  department: 'LEGAL',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));