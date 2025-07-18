// Security Middleware
// Comprehensive security measures for the legal practice management system

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AuthenticatedRequest } from './auth.middleware';
import { logger, securityLogger } from '../config/logger';
import { env } from '../config/environment';

// Enhanced rate limiting configurations with logging
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Log rate limit violations for security monitoring
      securityLogger.suspiciousActivity('system', 'rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        limit: max,
        window: windowMs
      });
      
      res.status(429).json({
        success: false,
        error: message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General rate limiting - use environment configuration
export const generalLimiter = createRateLimit(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests from this IP, please try again later'
);

// Auth rate limiting (stricter)
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later'
);

// API rate limiting
export const apiLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  60, // 60 requests per minute
  'API rate limit exceeded'
);

// AI analysis rate limiting (resource intensive)
export const aiLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  10, // 10 AI requests per minute
  'AI analysis rate limit exceeded'
);

// File upload rate limiting
export const uploadLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 uploads per window
  'File upload rate limit exceeded'
);

// Enhanced file upload security middleware
import multer from 'multer';
import path from 'path';
import { enhancedFileValidation, InputValidator } from '../config/secrets';

export const secureFileUpload = multer({
  ...enhancedFileValidation,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const sanitizedName = InputValidator.sanitizeFilename(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(sanitizedName);
      const name = path.basename(sanitizedName, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  })
});

// Password reset rate limiting
export const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts per hour
  'Too many password reset attempts, please try again later'
);

// Helmet security configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://counselflow.com',
      'https://app.counselflow.com'
    ];

    // Security Fix: Only allow requests without origin in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin) {
      return callback(new Error('Origin required'), false);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Enhanced input sanitization middleware with threat detection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Detect potential threats before sanitization
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /select.*from/i,
    /union.*select/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /<script/i,
    /javascript:/i,
    /\.\.\/.*etc\/passwd/i,
    /cmd\.exe/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      securityLogger.suspiciousActivity('system', 'malicious_pattern_detected', {
        ip: clientIp,
        pattern: pattern.source,
        path: req.path,
        method: req.method
      });
      
      // Log for investigation but continue - pattern might be legitimate
      logger.warn('Potentially malicious pattern detected', {
        ip: clientIp,
        pattern: pattern.source,
        path: req.path
      });
    }
  }
  
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// SQL injection prevention
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Remove potential SQL injection patterns
    return obj
      .replace(/('|(\\+)?('|\\;))/g, '')
      .replace(/(--|#|\/\*|\*\/)/g, '')
      .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
      .trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = escapeHtml(req.body);
  }
  next();
};

const escapeHtml = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return obj
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(obj)) {
    return obj.map(item => escapeHtml(item));
  }

  if (typeof obj === 'object') {
    const escaped: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        escaped[key] = escapeHtml(obj[key]);
      }
    }
    return escaped;
  }

  return obj;
};

// Role-based access control middleware
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Resource ownership validation
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Admin and Partner roles can access any resource
    if (['ADMIN', 'PARTNER'].includes(req.user.role)) {
      return next();
    }

    // For other roles, implement ownership check
    // This is a placeholder - actual implementation would check database
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Add your ownership validation logic here
    // Example: check if the resource belongs to the user or their assigned matters/clients

    next();
  };
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  // Validate API key format and existence
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          error: `Request too large. Maximum size allowed: ${maxSize}`
        });
      }
    }
    
    next();
  };
};

const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return value * units[unit];
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'IP address not allowed'
      });
    }
    
    next();
  };
};

// Enhanced request timing middleware with security monitoring
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Alert on unusually slow requests (potential DoS)
    if (duration > 10000) { // 10 seconds
      securityLogger.suspiciousActivity('system', 'slow_request_detected', {
        ip: clientIp,
        path: req.path,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Track security-relevant requests
    if (req.path.includes('/auth') || req.path.includes('/admin') || res.statusCode >= 400) {
      securityLogger.dataAccess(
        (req as any).user?.id || 'anonymous',
        req.path,
        req.method
      );
    }
  });
  
  next();
};

// Security headers middleware
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || Math.random().toString(36));
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          success: false,
          error: 'Unsupported content type'
        });
      }
    }
    
    next();
  };
};

// Enhanced Request ID middleware with correlation tracking
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Add to logger context for correlation
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

// Suspicious activity monitoring
const activityTracker = new Map<string, { count: number; lastActivity: number }>();

export const monitorSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const key = `${clientIp}:${req.path}`;
  
  const activity = activityTracker.get(key);
  
  if (!activity || now - activity.lastActivity > 60000) { // 1 minute window
    activityTracker.set(key, { count: 1, lastActivity: now });
  } else {
    activity.count++;
    activity.lastActivity = now;
    
    // Alert on rapid repeated requests to same endpoint
    if (activity.count > 20) {
      securityLogger.suspiciousActivity('system', 'rapid_requests', {
        ip: clientIp,
        path: req.path,
        count: activity.count,
        timeWindow: '1minute'
      });
    }
  }
  
  next();
};

// Clean up activity tracker periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 300000; // 5 minutes
  
  for (const [key, activity] of activityTracker.entries()) {
    if (now - activity.lastActivity > maxAge) {
      activityTracker.delete(key);
    }
  }
}, 60000); // Clean up every minute