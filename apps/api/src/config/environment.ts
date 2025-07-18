/**
 * Environment Configuration and Validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

// Environment validation schema
const environmentSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),
  
  // Database (required)
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // JWT Secrets (required in production)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_AUDIENCE: z.string().default('counselflow-api'),
  JWT_ISSUER: z.string().default('counselflow'),
  
  // Redis (optional but recommended for production)
  REDIS_URL: z.string().url().optional(),
  
  // AI Services (optional)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  
  // Email configuration (required for production)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // File storage
  UPLOAD_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('pdf,doc,docx,txt,rtf'),
  
  // Security
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Monitoring
  HEALTH_CHECK_ENABLED: z.string().transform(Boolean).default('true'),
  METRICS_ENABLED: z.string().transform(Boolean).default('true'),
  
  // Logging
  LOG_LEVEL: z.string().default('info'),
  LOG_RETENTION_DAYS: z.string().transform(Number).default('30'),
  ENABLE_REQUEST_LOGGING: z.string().transform(Boolean).default('true'),
  
  // Application URLs
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  // File upload settings
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt,rtf'),
  
  // Authentication settings
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default('1h'),
  
  // Encryption
  SECRETS_ENCRYPTION_KEY: z.string().min(32).optional(),
});

// Environment validation result type
export type Environment = z.infer<typeof environmentSchema>;

// Validate environment variables
export function validateEnvironment(): Environment {
  try {
    const env = environmentSchema.parse(process.env);
    
    // Additional production validations
    if (env.NODE_ENV === 'production') {
      validateProductionRequirements(env);
    }
    
    console.log('Environment validation successful', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      hasRedis: !!env.REDIS_URL,
      hasOpenAI: !!env.OPENAI_API_KEY,
      hasAnthropic: !!env.ANTHROPIC_API_KEY,
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Environment validation failed', { errors });
      
      throw new Error(
        'Environment validation failed:\n' + 
        errors.map(e => `  - ${e}`).join('\n')
      );
    }
    
    throw error;
  }
}

function validateProductionRequirements(env: Environment): void {
  const requiredInProduction = [
    { key: 'REDIS_URL', value: env.REDIS_URL },
    { key: 'SMTP_HOST', value: env.SMTP_HOST },
    { key: 'SMTP_USER', value: env.SMTP_USER },
    { key: 'SMTP_PASSWORD', value: env.SMTP_PASSWORD },
    { key: 'CORS_ORIGIN', value: env.CORS_ORIGIN },
  ];
  
  const missing = requiredInProduction
    .filter(req => !req.value)
    .map(req => req.key);
  
  if (missing.length > 0) {
    throw new Error(
      `Production environment missing required variables: ${missing.join(', ')}`
    );
  }
  
  // Validate JWT secrets strength in production
  if (env.JWT_SECRET.length < 64) {
    console.warn('JWT_SECRET should be at least 64 characters in production');
  }
  
  if (env.JWT_REFRESH_SECRET.length < 64) {
    console.warn('JWT_REFRESH_SECRET should be at least 64 characters in production');
  }
  
  // Validate secure origins
  if (env.CORS_ORIGIN && !env.CORS_ORIGIN.startsWith('https://')) {
    console.warn('CORS_ORIGIN should use HTTPS in production');
  }
}

// Export validated environment
export const env = validateEnvironment();

// Environment utilities
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Feature flags based on environment
export const features = {
  ai: {
    openai: !!env.OPENAI_API_KEY,
    anthropic: !!env.ANTHROPIC_API_KEY,
    google: !!env.GOOGLE_AI_API_KEY,
  },
  email: !!env.SMTP_HOST,
  redis: !!env.REDIS_URL,
  metrics: env.METRICS_ENABLED,
  healthCheck: env.HEALTH_CHECK_ENABLED,
};

export default env;