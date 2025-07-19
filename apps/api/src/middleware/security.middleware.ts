/**
 * Production Security Middleware
 * Comprehensive security headers and protection
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // HTTPS enforcement in production
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
}

// Request size limiter
export function requestSizeLimiter(req: Request, res: Response, next: NextFunction): void {
  const maxSize = env.MAX_FILE_SIZE || 10485760; // 10MB default
  
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length'], 10);
    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: 'Request entity too large',
        maxSize: `${maxSize} bytes`
      });
      return;
    }
  }
  
  next();
}

// API key validation for external integrations
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({
      success: false,
      message: 'API key required'
    });
    return;
  }
  
  // In production, validate against stored API keys
  // For now, basic validation
  if (apiKey.length < 32) {
    res.status(401).json({
      success: false,
      message: 'Invalid API key format'
    });
    return;
  }
  
  next();
}

// IP whitelist middleware for admin endpoints
export function ipWhitelist(allowedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (env.NODE_ENV !== 'production') {
      next();
      return;
    }
    
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
      return;
    }
    
    next();
  };
}

// Request timing middleware for monitoring
export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
}

// Combined security middleware
export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  securityHeaders(req, res, () => {
    requestSizeLimiter(req, res, () => {
      requestTiming(req, res, next);
    });
  });
}