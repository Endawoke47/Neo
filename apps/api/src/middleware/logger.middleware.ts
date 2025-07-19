/**
 * Request Logging Middleware
 * Production-ready request/response logging with security considerations
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/environment';

// Request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to headers for tracing
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: sanitizeUrl(req.url),
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    timestamp: new Date().toISOString(),
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: sanitizeUrl(req.url),
      ip: getClientIP(req),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
      timestamp: new Date().toISOString(),
    });

    // Call original end method and return
    const result = originalEnd.call(this, chunk, encoding, cb);
    
    // Log slow requests as warnings
    if (duration > 3000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: sanitizeUrl(req.url),
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    // Log error responses
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'error' : 'warn';
      logger[level]('Request error', {
        requestId,
        method: req.method,
        url: sanitizeUrl(req.url),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
      });
    }

    return result;
  };

  next();
}

// Security-focused request logger for sensitive endpoints
export function secureRequestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log only essential information for sensitive endpoints
  logger.info('Secure request', {
    requestId,
    method: req.method,
    path: sanitizeSensitivePath(req.path),
    ip: getHashedIP(req),
    timestamp: new Date().toISOString(),
  });

  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const duration = Date.now() - startTime;
    
    logger.info('Secure request completed', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}

// API audit logger for compliance
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Log API access for audit trail
  logger.info('API access audit', {
    requestId,
    method: req.method,
    endpoint: req.path,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
    userRole: (req as any).user?.role,
    timestamp: new Date().toISOString(),
    action: determineAction(req.method, req.path),
  });

  next();
}

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(req: Request): string {
  return req.ip || 
         req.connection.remoteAddress || 
         (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         'unknown';
}

function getHashedIP(req: Request): string {
  const ip = getClientIP(req);
  // Simple hash for privacy compliance
  return Buffer.from(ip).toString('base64').substr(0, 8);
}

function sanitizeUrl(url: string): string {
  // Remove sensitive parameters from URL
  const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key'];
  let sanitized = url;
  
  sensitiveParams.forEach(param => {
    const regex = new RegExp(`([?&]${param}=)[^&]*`, 'gi');
    sanitized = sanitized.replace(regex, `$1[REDACTED]`);
  });
  
  return sanitized;
}

function sanitizeSensitivePath(path: string): string {
  // Replace sensitive path segments with placeholders
  return path
    .replace(/\/users\/\d+/g, '/users/[ID]')
    .replace(/\/clients\/\d+/g, '/clients/[ID]')
    .replace(/\/matters\/\d+/g, '/matters/[ID]')
    .replace(/\/contracts\/\d+/g, '/contracts/[ID]');
}

function determineAction(method: string, path: string): string {
  const pathSegments = path.split('/').filter(Boolean);
  const resource = pathSegments[pathSegments.length - 1];
  
  switch (method.toUpperCase()) {
    case 'GET':
      return path.includes('/') && !isNaN(Number(resource)) ? 'READ_SINGLE' : 'READ_LIST';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
}

export default requestLogger;