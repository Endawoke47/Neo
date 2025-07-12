/**
 * Test Setup Configuration
 * Sets up the testing environment for the API
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_SALT_ROUNDS = '10'; // Lower for faster tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/counselflow_test';
process.env.APP_URL = 'http://localhost:3000';
process.env.ENABLE_REGISTRATION = 'true';

// Global test timeout
jest.setTimeout(10000);

// Global test setup
beforeAll(async () => {
  // Any global setup for all tests
});

afterAll(async () => {
  // Any global cleanup for all tests
});

beforeEach(() => {
  // Reset any mocks or state before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});
