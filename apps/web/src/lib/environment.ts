/**
 * Environment Configuration Utilities
 * Provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  APP_NAME: string;
  APP_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Database
  DATABASE_URL: string;

  // Redis
  REDIS_URL?: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;

  // Security
  BCRYPT_SALT_ROUNDS: number;
  PASSWORD_MIN_LENGTH: number;
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_TIME: number;

  // API
  API_BASE_URL: string;
  API_RATE_LIMIT: number;

  // Feature Flags
  ENABLE_REGISTRATION: boolean;
  ENABLE_PASSWORD_RESET: boolean;
  ENABLE_TWO_FACTOR: boolean;
  ENABLE_AI_FEATURES: boolean;

  // External Services
  OPENAI_API_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;

  // Monitoring
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  ENABLE_REQUEST_LOGGING: boolean;
}

/**
 * Get environment variable with type safety and validation
 */
function getEnvVar<T>(
  key: string,
  defaultValue?: T,
  transformer?: (value: string) => T
): T {
  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  if (transformer) {
    try {
      return transformer(value);
    } catch (error) {
      const message = `Invalid value for environment variable ${key}: ${value}`;
      console.error(message, error);
      throw new Error(message);
    }
  }

  return value as unknown as T;
}

/**
 * Parse boolean environment variable
 */
function getBooleanEnv(key: string, defaultValue = false): boolean {
  return getEnvVar(key, defaultValue, (value) => {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
    throw new Error(`Expected boolean value for ${key}, got: ${value}`);
  });
}

/**
 * Parse integer environment variable
 */
function getIntEnv(key: string, defaultValue?: number): number {
  return getEnvVar(key, defaultValue, (value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Expected integer value for ${key}, got: ${value}`);
    }
    return parsed;
  });
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): void {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    );
  }

  // Validate JWT secrets are not default values
  if (process.env['JWT_SECRET'] === 'your-super-secure-jwt-secret-key-change-this-in-production') {
    throw new Error('JWT_SECRET is using default value. Please set a secure secret key.');
  }

  if (process.env['JWT_REFRESH_SECRET'] === 'your-super-secure-refresh-secret-key-change-this-in-production') {
    throw new Error('JWT_REFRESH_SECRET is using default value. Please set a secure secret key.');
  }
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  try {
    // Validate required variables first
    if (process.env['NODE_ENV'] !== 'test') {
      validateRequiredEnvVars();
    }

    return {
    // Application
    NODE_ENV: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    APP_NAME: getEnvVar('APP_NAME', 'CounselFlow'),
    APP_URL: getEnvVar('APP_URL', 'http://localhost:3000'),

    // JWT
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '24h'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),

    // Database
    DATABASE_URL: getEnvVar('DATABASE_URL'),

    // Redis
    REDIS_URL: getEnvVar('REDIS_URL'),

    // Email
    SMTP_HOST: getEnvVar('SMTP_HOST'),
    SMTP_PORT: getIntEnv('SMTP_PORT', 587),
    SMTP_USER: getEnvVar('SMTP_USER'),
    SMTP_PASS: getEnvVar('SMTP_PASS'),
    EMAIL_FROM: getEnvVar('EMAIL_FROM', 'CounselFlow <noreply@counselflow.com>'),

    // Security
    BCRYPT_SALT_ROUNDS: getIntEnv('BCRYPT_SALT_ROUNDS', 12),
    PASSWORD_MIN_LENGTH: getIntEnv('PASSWORD_MIN_LENGTH', 8),
    MAX_LOGIN_ATTEMPTS: getIntEnv('MAX_LOGIN_ATTEMPTS', 5),
    LOCKOUT_TIME: getIntEnv('LOCKOUT_TIME', 15),

    // API
    API_BASE_URL: getEnvVar('API_BASE_URL', 'http://localhost:3001'),
    API_RATE_LIMIT: getIntEnv('API_RATE_LIMIT', 100),

    // Feature Flags
    ENABLE_REGISTRATION: getBooleanEnv('ENABLE_REGISTRATION', true),
    ENABLE_PASSWORD_RESET: getBooleanEnv('ENABLE_PASSWORD_RESET', true),
    ENABLE_TWO_FACTOR: getBooleanEnv('ENABLE_TWO_FACTOR', false),
    ENABLE_AI_FEATURES: getBooleanEnv('ENABLE_AI_FEATURES', true),

    // External Services
    OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
    AWS_ACCESS_KEY_ID: getEnvVar('AWS_ACCESS_KEY_ID'),
    AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY'),
    AWS_REGION: getEnvVar('AWS_REGION', 'us-east-1'),
    AWS_S3_BUCKET: getEnvVar('AWS_S3_BUCKET'),

    // Monitoring
    LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug',
    ENABLE_REQUEST_LOGGING: getBooleanEnv('ENABLE_REQUEST_LOGGING', true),
  };
  } catch (error) {
    console.error('Failed to load environment configuration:', error);
    throw error;
  }
}

// Export the configuration instance
export const env = loadEnvironmentConfig();

// Export types
export type { EnvironmentConfig };
