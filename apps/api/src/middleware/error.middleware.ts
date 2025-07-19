/**
 * Production Error Handling Middleware
 * Comprehensive error handling with security and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { env } from '../config/environment';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Global error handler
export function errorHandler(error: ApiError, req: Request, res: Response, next: NextFunction): void {
  // Log the error with context
  logger.error('API Error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id
    }
  });

  // Determine status code
  let statusCode = error.statusCode || 500;
  let message = error.message;
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;

  // Handle specific error types
  if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
    details = undefined; // Don't expose JWT details
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
    details = undefined;
  } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'External service temporarily unavailable';
    details = undefined; // Don't expose internal service details
  }

  // Sanitize error response for production
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message: env.NODE_ENV === 'production' ? sanitizeErrorMessage(message) : message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || generateRequestId()
    }
  };

  // Only include details and stack in development
  if (env.NODE_ENV !== 'production') {
    if (details) {
      errorResponse.error.details = details;
    }
    if (error.stack) {
      errorResponse.error.stack = error.stack;
    }
  }

  // Rate limiting for error responses to prevent abuse
  if (statusCode >= 400 && statusCode < 500) {
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('Retry-After', '60');
  }

  res.status(statusCode).json(errorResponse);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString()
    }
  });
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';

  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

// Helper functions
function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /credential/gi,
    /database/gi,
    /connection/gi
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}