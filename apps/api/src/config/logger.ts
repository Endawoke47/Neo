/**
 * Enhanced Logger Configuration with Production-Grade Features
 * Includes log rotation, structured logging, and performance monitoring
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './environment';

// Custom log format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Development format for better readability
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Production file transports with rotation
if (env.NODE_ENV === 'production') {
  // Error logs with rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: `${env.LOG_RETENTION_DAYS}d`,
      format: productionFormat
    })
  );

  // Combined logs with rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: `${env.LOG_RETENTION_DAYS}d`,
      format: productionFormat
    })
  );

  // Audit logs for sensitive operations
  transports.push(
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: `${env.LOG_RETENTION_DAYS}d`,
      format: productionFormat
    })
  );
} else {
  // Development file transports (simpler, no rotation)
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat
    })
  );
  
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat
    })
  );
}

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    level: env.NODE_ENV === 'production' ? 'warn' : env.LOG_LEVEL
  })
);

// Create the logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'counselflow-api',
    environment: env.NODE_ENV,
    version: process.env['npm_package_version'] || '1.0.0'
  },
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
  exitOnError: false
});

// Performance monitoring helper
export const perfLogger = {
  time: (label: string) => {
    const start = process.hrtime.bigint();
    return {
      end: (metadata?: any) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        logger.info(`Performance: ${label}`, {
          duration: `${duration.toFixed(2)}ms`,
          ...metadata
        });
        return duration;
      }
    };
  }
};

// Enhanced security event logger with correlation tracking
export const securityLogger = {
  authFailure: (email: string, ip: string, reason: string, correlationId?: string) => {
    logger.warn('Authentication failure', {
      event: 'auth_failure',
      email: email.replace(/(.{2}).*(.{2})@/, '$1***$2@'), // Partially mask email
      ip,
      reason,
      correlationId,
      timestamp: new Date().toISOString()
    });
  },
  
  suspiciousActivity: (userId: string, activity: string, metadata?: any) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  dataAccess: (userId: string, resource: string, action: string, correlationId?: string) => {
    logger.info('Data access event', {
      event: 'data_access',
      userId,
      resource,
      action,
      correlationId,
      timestamp: new Date().toISOString()
    });
  },

  loginAttempt: (userId: string, success: boolean, details?: any) => {
    logger.info('Login attempt', {
      event: 'login_attempt',
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  privilegedAction: (userId: string, action: string, details?: any) => {
    logger.warn('Privileged action performed', {
      event: 'privileged_action',
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
};

// Business logic logger
export const businessLogger = {
  contractCreated: (contractId: string, userId: string, clientId: string) => {
    logger.info('Contract created', {
      event: 'contract_created',
      contractId,
      userId,
      clientId,
      timestamp: new Date().toISOString()
    });
  },
  
  matterStatusChange: (matterId: string, oldStatus: string, newStatus: string, userId: string) => {
    logger.info('Matter status changed', {
      event: 'matter_status_change',
      matterId,
      oldStatus,
      newStatus,
      userId,
      timestamp: new Date().toISOString()
    });
  },
  
  aiAnalysisCompleted: (analysisType: string, entityId: string, duration: number, userId: string) => {
    logger.info('AI analysis completed', {
      event: 'ai_analysis_completed',
      analysisType,
      entityId,
      duration: `${duration}ms`,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

export { logger };
