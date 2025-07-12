/**
 * Jest Environment Setup
 * Sets up test environment variables
 */

// Set test environment variables before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-purposes-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/counselflow_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.EMAIL_FROM = 'CounselFlow Test <test@counselflow.com>';
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.PORT = '3000';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.BCRYPT_SALT_ROUNDS = '12';
process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN = '1h';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.LOG_LEVEL = 'error';
process.env.ENABLE_REQUEST_LOGGING = 'false';
process.env.ENABLE_REGISTRATION = 'true';
process.env.ENABLE_PASSWORD_RESET = 'true';
process.env.ENABLE_TWO_FACTOR = 'false';
process.env.ENABLE_AI_FEATURES = 'true';
