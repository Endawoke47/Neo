/**
 * CounselFlow Neo API Server
 * Production-ready enterprise legal management platform
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from './config/environment';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import { securityMiddleware } from './middleware/security.middleware';
import { requestLogger } from './middleware/logger.middleware';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

const app = express();

// Trust proxy for production deployments
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN || env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
if (env.ENABLE_RATE_LIMITING) {
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req: Request, res: Response, buf: Buffer) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (env.ENABLE_REQUEST_LOGGING) {
  app.use(requestLogger);
}

// Security middleware
app.use(securityMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'CounselFlow Neo API',
    version: '1.0.0',
    description: 'Enterprise Legal Management Platform',
    status: 'operational',
    environment: env.NODE_ENV,
    features: {
      ai: !!env.OPENAI_API_KEY || !!env.ANTHROPIC_API_KEY,
      email: !!env.SMTP_HOST,
      redis: !!env.REDIS_URL,
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const PORT = env.PORT;
const server = app.listen(PORT, () => {
  logger.info(`🚀 CounselFlow Neo API server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  logger.info(`🔒 Security features enabled`);
  logger.info(`📊 Monitoring enabled: ${env.METRICS_ENABLED}`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;