// Enhanced API Server Entry Point - A+++++ Architecture
// Command & Policy Pattern with Production-Grade Security
// User: Endawoke47
// Date: 2025-07-15 21:00:00 UTC

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// A+++++ Architecture Core
import { commandRegistry } from './core/command-registry';
import { policyService } from './core/policy.service';
import { dbService } from './config/database';

import swaggerUi from 'swagger-ui-express';
import { logger, securityLogger, perfLogger } from './config/logger';
import { env } from './config/environment';
import { 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers,
  asyncHandler 
} from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { auditLogger } from './middleware/audit.middleware';
import { swaggerSpec } from './config/swagger';

// Import enhanced security middleware
import { 
  securityHeaders, 
  corsOptions, 
  generalLimiter, 
  sanitizeInput, 
  additionalSecurityHeaders,
  addRequestId,
  requestTiming,
  monitorSuspiciousActivity,
  validateContentType
} from './middleware/security.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contractRoutes from './routes/contract.routes';
import matterRoutes from './routes/matter.routes';
import disputeRoutes from './routes/dispute.routes';
import documentRoutes from './routes/document.routes';
import clientRoutes from './routes/client.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';
import legalResearchRoutes from './routes/legal-research.routes';
import { contractIntelligenceRoutes } from './routes/contract-intelligence.routes';
import legalIntelligenceRoutes from './routes/legal-intelligence.routes';
import documentAutomationRoutes from './routes/document-automation.routes';

// Setup global error handlers
setupGlobalErrorHandlers();

const app = express();
const PORT = env.PORT;

// Trust proxy for accurate IP addresses behind load balancers
app.set('trust proxy', 1);

// Performance monitoring
const serverStart = perfLogger.time('server_initialization');

// Comprehensive security middleware stack
app.use(addRequestId);
app.use(requestTiming);
app.use(monitorSuspiciousActivity);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(validateContentType(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']));
app.use(sanitizeInput);
app.use(additionalSecurityHeaders);

// Compression middleware for production
if (env.ENABLE_COMPRESSION) {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024
  }));
}

// Body parsing middleware with environment-based limits
app.use(express.json({ 
  limit: `${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}mb`,
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: `${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}mb` 
}));

// Logging and audit middleware
app.use(requestLogger);
app.use(auditLogger());

// Swagger UI setup - only in development or if explicitly enabled
if (env.ENABLE_API_DOCS) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CounselFlow API Documentation'
  }));
}

// OpenAPI JSON specification endpoint
app.get('/api-docs.json', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Enhanced health check endpoint with A+++++ Architecture metrics
app.get('/health', asyncHandler(async (req, res) => {
  const healthTimer = perfLogger.time('health_check');
  
  try {
    // Basic health metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // A+++++ Architecture status
    const dbHealthy = await dbService.healthCheck();
    const commandsRegistered = commandRegistry.isRegistered();
    const policyStats = policyService.getStats();
    
    const healthData = {
      status: dbHealthy && commandsRegistered ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      architecture: {
        type: 'Command & Policy Pattern',
        database: dbHealthy,
        commandBus: commandsRegistered,
        policyService: policyStats.rulesCount > 0,
        registeredCommands: commandRegistry.getRegisteredCommands().length,
        policyRules: policyStats.rulesCount
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodejs: process.version
    };
    
    // Log health check for monitoring
    logger.info('Health check completed', {
      ip: req.ip,
      duration: healthTimer.end(),
      memory: healthData.memory,
      uptime: healthData.uptime,
      architecture: healthData.architecture
    });
    
    res.status(healthData.status === 'OK' ? 200 : 503).json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
}));

// Ready endpoint for Kubernetes readiness probes
app.get('/ready', asyncHandler(async (req, res) => {
  // Add database connectivity check here if needed
  res.status(200).json({
    status: 'READY',
    timestamp: new Date().toISOString()
  });
}));

// Metrics endpoint for monitoring (if enabled)
if (env.ENABLE_METRICS) {
  app.get('/metrics', asyncHandler(async (req, res) => {
    // Basic metrics - in production, consider using Prometheus client
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(metrics);
  }));
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/matters', matterRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ai', aiRoutes);

// AI-Powered Legal Services (Phase 2)
app.use('/api/v1/legal-research', legalResearchRoutes);
app.use('/api/v1/contract-intelligence', contractIntelligenceRoutes);
app.use('/api/v1/legal-intelligence', legalIntelligenceRoutes);
app.use('/api/v1/document-automation', documentAutomationRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize A+++++ Architecture and start server
async function initializeAndStart(): Promise<void> {
  try {
    logger.info('🏗️ Initializing A+++++ Architecture...');
    
    // 1. Connect to database
    await dbService.connect();
    
    // 2. Register all command handlers
    commandRegistry.registerAllHandlers();
    
    // 3. Initialize policy service (already done in constructor)
    const policyStats = policyService.getStats();
    logger.info('Policy service initialized', policyStats);
    
    logger.info('✅ A+++++ Architecture initialized successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      const duration = serverStart.end();
      
      logger.info('🚀 CounselFlow API Server Started with A+++++ Architecture', {
        port: PORT,
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        architecture: 'Command & Policy Pattern',
        startupTime: `${duration}ms`,
        commandsRegistered: commandRegistry.getRegisteredCommands().length,
        policyRules: policyStats.rulesCount,
        healthCheck: `http://localhost:${PORT}/health`,
        apiDocs: env.ENABLE_API_DOCS ? `http://localhost:${PORT}/api-docs` : 'disabled',
        metrics: env.ENABLE_METRICS ? `http://localhost:${PORT}/metrics` : 'disabled',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      });
      
      // Log security configuration status
      securityLogger.dataAccess('system', 'server_startup', 'startup');
    });
    
    return server;
  } catch (error) {
    logger.error('❌ Failed to initialize A+++++ Architecture', { error });
    process.exit(1);
  }
}

// Initialize and start
let server: any;
initializeAndStart().then((s) => {
  server = s;
  // Server timeout configuration
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
}).catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

// Enhanced graceful shutdown handling with A+++++ Architecture cleanup
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, initiating graceful shutdown`);
  
  const shutdownTimer = perfLogger.time('server_shutdown');
  
  try {
    // Close server first
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Cleanup A+++++ Architecture components
    await dbService.disconnect();
    commandRegistry.clearRegistrations();
    policyService.clearCache();
    
    logger.info('Graceful shutdown completed', {
      shutdownTime: shutdownTimer.end(),
      signal
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle PM2 graceful shutdown
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    gracefulShutdown('PM2_SHUTDOWN');
  }
});

// Log any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString()
  });
});

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // In production, you might want to restart the process
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Log memory warnings
process.on('warning', (warning) => {
  logger.warn('Node.js Warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Export app for testing
export default app;
export { server };
