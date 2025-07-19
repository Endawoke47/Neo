/**
 * Health Check and Monitoring Routes
 * Production-ready health checks and system monitoring
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { env } from '../config/environment';

const router = Router();

// Basic health check
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  res.json({
    success: true,
    data: healthData
  });
}));

// Deep health check with dependencies
router.get('/deep', asyncHandler(async (req: Request, res: Response) => {
  const checks = {
    api: { status: 'healthy', message: 'API server is running' },
    memory: { status: 'unknown', message: 'Checking memory usage...' }
  };

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = {
    status: memUsagePercent > 90 ? 'unhealthy' : memUsagePercent > 70 ? 'warning' : 'healthy',
    message: `Memory usage: ${memUsagePercent.toFixed(2)}%`,
    usage: memUsage
  };

  // Overall health status
  const hasUnhealthy = Object.values(checks).some((check: any) => check.status === 'unhealthy');
  const hasWarning = Object.values(checks).some((check: any) => check.status === 'warning');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasWarning ? 'warning' : 'healthy';

  const result = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime: process.uptime(),
    version: '1.0.0'
  };

  // Log health check results
  logger.info('Deep health check completed', {
    status: overallStatus,
    checks: Object.keys(checks).reduce((acc, key) => {
      acc[key] = (checks as any)[key].status;
      return acc;
    }, {} as any)
  });

  res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    success: overallStatus !== 'unhealthy',
    data: result
  });
}));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // Check if the application is ready to serve traffic
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    services: {
      api: true,
      config: !!env,
      logger: !!logger
    }
  };

  const isReady = Object.values(ready.services).every(Boolean);

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    data: ready
  });
}));

// Liveness probe (for Kubernetes)
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Simple liveness check
  res.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime()
    }
  });
}));

// System metrics
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime()
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: {
      nodeEnv: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
      port: env.PORT
    },
    features: {
      ai: {
        openai: !!env.OPENAI_API_KEY,
        anthropic: !!env.ANTHROPIC_API_KEY,
        google: !!env.GOOGLE_AI_API_KEY
      },
      email: !!env.SMTP_HOST,
      redis: !!env.REDIS_URL,
      metrics: env.METRICS_ENABLED
    }
  };

  res.json({
    success: true,
    data: metrics
  });
}));

// Configuration info (sanitized)
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const config = {
    environment: env.NODE_ENV,
    version: '1.0.0',
    features: {
      ai: {
        providers: {
          openai: !!env.OPENAI_API_KEY,
          anthropic: !!env.ANTHROPIC_API_KEY,
          google: !!env.GOOGLE_AI_API_KEY
        }
      },
      email: !!env.SMTP_HOST,
      redis: !!env.REDIS_URL,
      monitoring: {
        healthCheck: env.HEALTH_CHECK_ENABLED,
        metrics: env.METRICS_ENABLED,
        requestLogging: env.ENABLE_REQUEST_LOGGING
      },
      security: {
        rateLimiting: env.ENABLE_RATE_LIMITING,
        corsOrigin: !!env.CORS_ORIGIN
      }
    },
    limits: {
      fileSize: env.MAX_FILE_SIZE,
      rateLimit: {
        window: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS
      }
    }
  };

  res.json({
    success: true,
    data: config
  });
}));

export default router;