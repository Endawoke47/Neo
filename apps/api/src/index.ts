// API Server Entry Point
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables FIRST
dotenv.config();

import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { auditLogger } from './middleware/audit.middleware';
import { swaggerSpec } from './config/swagger';

// Import middleware
import { 
  securityHeaders, 
  corsOptions, 
  generalLimiter, 
  sanitizeInput, 
  additionalSecurityHeaders,
  addRequestId
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

const app = express();
const PORT = process.env.PORT || 3005;

// Security middleware with enhanced configuration
app.use(addRequestId);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(sanitizeInput);
app.use(additionalSecurityHeaders);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging and audit middleware
app.use(requestLogger);
app.use(auditLogger());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI JSON specification endpoint
app.get('/api-docs.json', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

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

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 CounselFlow API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
