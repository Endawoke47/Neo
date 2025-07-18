/**
 * Jest Configuration
 * Testing configuration for CounselFlow Neo API
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test patterns
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
    '<rootDir>/src/test/**/*.(test|spec).(ts|js)'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Core components require higher coverage
    './src/core/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/utils/circuit-breaker.ts': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Test configuration
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 30000, // Increased for integration tests
  verbose: true,
  
  // Performance and reliability
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  maxConcurrency: 10,
  
  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@commands/(.*)$': '<rootDir>/src/commands/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1'
  },
  
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Performance monitoring
  slowTestThreshold: 5000, // 5 seconds
  
  // Cache for faster subsequent runs
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};
