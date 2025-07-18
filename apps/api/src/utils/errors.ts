/**
 * Enterprise Error Handling System
 * Standardized error types, handling, and correlation tracking
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

// Base error class with correlation tracking
export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;
  
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly details?: any;

  constructor(
    message: string, 
    correlationId?: string,
    details?: any
  ) {
    super(message);
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      details: this.details,
      stack: this.stack
    };
  }
}

// Operational errors (expected errors that should be handled gracefully)
export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class AuthenticationError extends BaseError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTHENTICATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Authentication required', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class AuthorizationError extends BaseError {
  readonly statusCode = 403;
  readonly errorCode = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Insufficient permissions', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Resource not found', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Resource conflict', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class RateLimitError extends BaseError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Rate limit exceeded', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

// Business logic errors
export class BusinessLogicError extends BaseError {
  readonly statusCode = 422;
  readonly errorCode = 'BUSINESS_LOGIC_ERROR';
  readonly isOperational = true;

  constructor(message: string, correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class AIServiceError extends BaseError {
  readonly statusCode = 503;
  readonly errorCode = 'AI_SERVICE_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'AI service unavailable', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

// System errors (unexpected errors)
export class DatabaseError extends BaseError {
  readonly statusCode = 500;
  readonly errorCode = 'DATABASE_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Database operation failed', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class ExternalServiceError extends BaseError {
  readonly statusCode = 502;
  readonly errorCode = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'External service error', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

export class InternalServerError extends BaseError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', correlationId?: string, details?: any) {
    super(message, correlationId, details);
  }
}

// Error factory for creating appropriate error types
export class ErrorFactory {
  static createFromZodError(zodError: ZodError, correlationId?: string): ValidationError {
    const details = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.code === 'invalid_type' ? err.received : undefined
    }));

    return new ValidationError(
      'Validation failed',
      correlationId,
      { validationErrors: details }
    );
  }

  static createFromPrismaError(prismaError: any, correlationId?: string): BaseError {
    switch (prismaError.code) {
      case 'P2002':
        return new ConflictError(
          'Unique constraint violation',
          correlationId,
          { fields: prismaError.meta?.target }
        );
      case 'P2025':
        return new NotFoundError(
          'Record not found',
          correlationId,
          { operation: prismaError.meta?.cause }
        );
      case 'P2003':
        return new ValidationError(
          'Foreign key constraint violation',
          correlationId,
          { field: prismaError.meta?.field_name }
        );
      default:
        return new DatabaseError(
          prismaError.message || 'Database operation failed',
          correlationId,
          { code: prismaError.code }
        );
    }
  }

  static createFromAxiosError(axiosError: any, correlationId?: string): BaseError {
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message || axiosError.message;

    if (status >= 400 && status < 500) {
      return new ExternalServiceError(
        `External service client error: ${message}`,
        correlationId,
        { status, url: axiosError.config?.url }
      );
    }

    return new ExternalServiceError(
      `External service error: ${message}`,
      correlationId,
      { status, url: axiosError.config?.url }
    );
  }
}

// Error context for correlation tracking
export interface ErrorContext {
  correlationId: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

// Global error handler middleware
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.headers['x-request-id'] as string || 'unknown';
  const userId = (req as any).user?.id;

  let error: BaseError;

  // Convert known error types
  if (err instanceof BaseError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = ErrorFactory.createFromZodError(err, correlationId);
  } else if (err.name === 'PrismaClientKnownRequestError') {
    error = ErrorFactory.createFromPrismaError(err, correlationId);
  } else if (err.name === 'AxiosError') {
    error = ErrorFactory.createFromAxiosError(err, correlationId);
  } else {
    // Unknown error
    error = new InternalServerError(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      correlationId,
      process.env.NODE_ENV === 'development' ? { originalStack: err.stack } : undefined
    );
  }

  // Log error with context
  const logData = {
    error: error.toJSON(),
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      userId
    }
  };

  if (error.isOperational) {
    logger.warn('Operational error occurred', logData);
  } else {
    logger.error('System error occurred', logData);
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        details: error.details,
        stack: error.stack
      })
    }
  };

  res.status(error.statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error logging service for structured error tracking
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: Array<{
    timestamp: Date;
    error: string;
    correlationId: string;
    userId?: string;
  }> = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: BaseError, context: ErrorContext): void {
    const errorKey = `${error.errorCode}:${error.message}`;
    
    // Update error counts
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Add to recent errors (keep last 100)
    this.recentErrors.unshift({
      timestamp: new Date(),
      error: errorKey,
      correlationId: context.correlationId,
      userId: context.userId
    });
    
    if (this.recentErrors.length > 100) {
      this.recentErrors = this.recentErrors.slice(0, 100);
    }

    // Alert on high error rates
    this.checkErrorThresholds(errorKey);
  }

  private checkErrorThresholds(errorKey: string): void {
    const count = this.errorCounts.get(errorKey) || 0;
    const recentCount = this.recentErrors
      .filter(e => e.error === errorKey && 
               Date.now() - e.timestamp.getTime() < 5 * 60 * 1000) // Last 5 minutes
      .length;

    if (recentCount >= 10) {
      logger.error('High error rate detected', {
        errorKey,
        recentCount,
        totalCount: count,
        timeWindow: '5 minutes'
      });
    }
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: typeof this.recentErrors;
  } {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      errorsByType: Object.fromEntries(this.errorCounts),
      recentErrors: this.recentErrors.slice(0, 10) // Last 10 errors
    };
  }

  clearStats(): void {
    this.errorCounts.clear();
    this.recentErrors = [];
  }
}

export const errorTracker = ErrorTracker.getInstance();