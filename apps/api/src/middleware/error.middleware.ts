// Enhanced Error Handling Middleware with Security Features
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import { Request, Response, NextFunction } from 'express';
import { logger, securityLogger } from '../config/logger';
import { ZodError } from 'zod';
import { env } from '../config/environment';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
  userId?: string;
  clientIp?: string;
}

// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

// Security-related error tracking
const securityIncidents = new Map<string, { count: number; lastIncident: number }>();

const trackSecurityIncident = (ip: string, errorType: string) => {
  const now = Date.now();
  const key = `${ip}:${errorType}`;
  const incident = securityIncidents.get(key);
  
  if (!incident || now - incident.lastIncident > 3600000) { // 1 hour window
    securityIncidents.set(key, { count: 1, lastIncident: now });
  } else {
    incident.count++;
    incident.lastIncident = now;
    
    // Alert on suspicious patterns
    if (incident.count >= 10) {
      securityLogger.suspiciousActivity('system', 'repeated_error_pattern', {
        ip,
        errorType,
        count: incident.count,
        timeWindow: '1hour'
      });
    }
  }
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';

  // Enhanced error logging with more context
  const errorContext = {
    error: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: clientIp,
    userAgent,
    userId,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    referrer: req.get('Referrer') || 'unknown',
    origin: req.get('Origin') || 'unknown',
    body: statusCode >= 500 ? undefined : req.body, // Don't log body for 5xx errors
    query: req.query,
    params: req.params
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server error:', errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client error:', errorContext);
  }

  // Track security incidents
  if (statusCode === 401 || statusCode === 403) {
    trackSecurityIncident(clientIp, 'AUTH_ERROR');
    securityLogger.authFailure(
      req.body?.email || 'unknown',
      clientIp,
      err.message
    );
  }

  if (statusCode === 429) {
    trackSecurityIncident(clientIp, 'RATE_LIMIT');
  }

  // Handle specific error types
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })),
      code: ErrorType.VALIDATION_ERROR
    });
  }

  // Prisma database errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
      code: ErrorType.DATABASE_ERROR
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
      message: 'The requested resource does not exist',
      code: ErrorType.NOT_FOUND_ERROR
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: `File size exceeds the limit of ${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}MB`,
      code: ErrorType.FILE_UPLOAD_ERROR
    });
  }

  // Don't leak error details in production
  const response: any = {
    success: false,
    message: env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Internal Server Error' 
      : message,
    code: err.code || (statusCode >= 500 ? ErrorType.INTERNAL_SERVER_ERROR : ErrorType.BUSINESS_LOGIC_ERROR),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  };

  // Add debug info in development
  if (env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Track potential scanning attempts
  trackSecurityIncident(clientIp, 'NOT_FOUND');
  
  logger.warn('Route not found:', {
    url: req.url,
    method: req.method,
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referrer'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    code: ErrorType.NOT_FOUND_ERROR,
    timestamp: new Date().toISOString()
  });
};

export const createError = (
  message: string, 
  statusCode: number = 500, 
  code?: string,
  details?: any
): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  error.details = details;
  return error;
};

// Specific error creators for common scenarios
export const createValidationError = (message: string, details?: any): CustomError => {
  return createError(message, 400, ErrorType.VALIDATION_ERROR, details);
};

export const createAuthError = (message: string = 'Authentication required'): CustomError => {
  return createError(message, 401, ErrorType.AUTHENTICATION_ERROR);
};

export const createForbiddenError = (message: string = 'Access denied'): CustomError => {
  return createError(message, 403, ErrorType.AUTHORIZATION_ERROR);
};

export const createNotFoundError = (resource: string = 'Resource'): CustomError => {
  return createError(`${resource} not found`, 404, ErrorType.NOT_FOUND_ERROR);
};

export const createRateLimitError = (message: string = 'Rate limit exceeded'): CustomError => {
  return createError(message, 429, ErrorType.RATE_LIMIT_ERROR);
};

export const createDatabaseError = (message: string, details?: any): CustomError => {
  return createError(message, 500, ErrorType.DATABASE_ERROR, details);
};

export const createExternalApiError = (message: string, details?: any): CustomError => {
  return createError(message, 502, ErrorType.EXTERNAL_API_ERROR, details);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled error handlers
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });
};

// Clean up security incidents periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour
  
  for (const [key, incident] of securityIncidents.entries()) {
    if (now - incident.lastIncident > maxAge) {
      securityIncidents.delete(key);
    }
  }
}, 600000); // Clean up every 10 minutes
