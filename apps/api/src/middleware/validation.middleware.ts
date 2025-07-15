// Validation Middleware
// Comprehensive request validation using Zod schemas

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { logger } from '../config/logger';

// Helper function to recursively sanitize request objects
const sanitizeRequestObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number') {
    return isFinite(obj) ? obj : 0;
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeRequestObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeRequestObject(value);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Generic validation middleware factory with enhanced security
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check rate limiting for validation attempts
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      if (!checkValidationRateLimit(clientIp)) {
        return res.status(429).json({
          success: false,
          error: 'Too many validation attempts',
          message: 'Please slow down your requests'
        });
      }
      
      // Pre-sanitize request body before validation
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeRequestObject(req.body);
      }
      
      // Validate request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation failures for security monitoring
        logger.warn('Validation failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            code: err.code
          }))
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// Validate query parameters with sanitization
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pre-sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeRequestObject(req.query);
      }
      
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Query validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// Validate route parameters with sanitization
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pre-sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeRequestObject(req.params);
      }
      
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),

  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Start date must be before end date'),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1, 'Filename is required'),
    mimetype: z.string().min(1, 'File type is required'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB')
  })
};

// Specific validation schemas for different entities

// User validation schemas
export const userSchemas = {
  create: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character'
      ),
    role: z.enum(['ADMIN', 'PARTNER', 'ASSOCIATE', 'PARALEGAL', 'CLIENT']),
    firm: z.string().max(100).optional(),
    specialization: z.string().max(100).optional(),
    barNumber: z.string().max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional()
  }),

  update: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    firm: z.string().max(100).optional(),
    specialization: z.string().max(100).optional(),
    barNumber: z.string().max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character'
      )
  })
};

// Client validation schemas
export const clientSchemas = {
  create: z.object({
    name: z.string().min(1, 'Client name is required').max(200),
    email: z.string().email('Invalid email format'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    address: z.string().max(500).optional(),
    clientType: z.enum(['INDIVIDUAL', 'BUSINESS', 'ORGANIZATION']),
    industry: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    assignedLawyerId: z.string().uuid('Invalid lawyer ID').optional()
  }),

  update: z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    address: z.string().max(500).optional(),
    clientType: z.enum(['INDIVIDUAL', 'BUSINESS', 'ORGANIZATION']).optional(),
    industry: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    assignedLawyerId: z.string().uuid().optional()
  })
};

// Matter validation schemas
export const matterSchemas = {
  create: z.object({
    title: z.string().min(1, 'Matter title is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.string().min(1, 'Matter type is required').max(100),
    status: z.enum(['ACTIVE', 'PENDING', 'CLOSED', 'ON_HOLD']).default('ACTIVE'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    clientId: z.string().uuid('Invalid client ID'),
    assignedLawyerId: z.string().uuid('Invalid lawyer ID'),
    estimatedValue: z.number().positive('Estimated value must be positive').optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    statute_of_limitations: z.string().datetime().optional()
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.string().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'CLOSED', 'ON_HOLD']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedLawyerId: z.string().uuid().optional(),
    estimatedValue: z.number().positive().optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    statute_of_limitations: z.string().datetime().optional()
  })
};

// Contract validation schemas
export const contractSchemas = {
  create: z.object({
    title: z.string().min(1, 'Contract title is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.string().min(1, 'Contract type is required').max(100),
    status: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED']).default('DRAFT'),
    clientId: z.string().uuid('Invalid client ID'),
    assignedLawyerId: z.string().uuid('Invalid lawyer ID'),
    value: z.number().positive('Contract value must be positive').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    autoRenewal: z.boolean().default(false),
    renewalPeriod: z.string().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Start date must be before end date'),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.string().min(1).max(100).optional(),
    status: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
    assignedLawyerId: z.string().uuid().optional(),
    value: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    autoRenewal: z.boolean().optional(),
    renewalPeriod: z.string().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Start date must be before end date')
};

// Document validation schemas
export const documentSchemas = {
  create: z.object({
    title: z.string().min(1, 'Document title is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.string().min(1, 'Document type is required').max(100),
    category: z.string().max(100).optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    matterId: z.string().uuid('Invalid matter ID').optional(),
    contractId: z.string().uuid('Invalid contract ID').optional(),
    isConfidential: z.boolean().default(false),
    tags: z.array(z.string()).default([])
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.string().min(1).max(100).optional(),
    category: z.string().max(100).optional(),
    clientId: z.string().uuid().optional(),
    matterId: z.string().uuid().optional(),
    contractId: z.string().uuid().optional(),
    isConfidential: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })
};

// Dispute validation schemas
export const disputeSchemas = {
  create: z.object({
    title: z.string().min(1, 'Dispute title is required').max(200),
    description: z.string().max(2000).optional(),
    type: z.string().min(1, 'Dispute type is required').max(100),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'MEDIATION', 'ARBITRATION', 'LITIGATION', 'SETTLED', 'CLOSED']).default('OPEN'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    matterId: z.string().uuid('Invalid matter ID'),
    claimAmount: z.number().positive('Claim amount must be positive').optional(),
    currency: z.string().length(3).default('USD'),
    courtName: z.string().max(200).optional(),
    caseNumber: z.string().max(100).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    timeline: z.string().datetime().optional()
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    type: z.string().min(1).max(100).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'MEDIATION', 'ARBITRATION', 'LITIGATION', 'SETTLED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    claimAmount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    courtName: z.string().max(200).optional(),
    caseNumber: z.string().max(100).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    timeline: z.string().datetime().optional()
  })
};

// AI Analysis validation schemas
export const aiSchemas = {
  contractAnalysis: z.object({
    contractId: z.string().uuid('Invalid contract ID'),
    analysisType: z.enum(['RISK_ASSESSMENT', 'CLAUSE_EXTRACTION', 'COMPLIANCE_CHECK', 'KEY_TERMS']).default('RISK_ASSESSMENT'),
    jurisdiction: z.string().optional(),
    focusAreas: z.array(z.string()).default([])
  }),

  documentAnalysis: z.object({
    documentId: z.string().uuid('Invalid document ID'),
    analysisType: z.enum(['CONTENT_SUMMARY', 'KEY_POINTS', 'RISK_ANALYSIS', 'COMPLIANCE_CHECK']).default('CONTENT_SUMMARY'),
    extractionTargets: z.array(z.string()).default([])
  }),

  legalResearch: z.object({
    query: z.string().min(1, 'Query is required').max(500),
    jurisdiction: z.string().optional(),
    practiceArea: z.string().optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional(),
    sources: z.array(z.string()).default(['CASE_LAW', 'STATUTES', 'REGULATIONS'])
  }),

  matterPrediction: z.object({
    matterId: z.string().uuid('Invalid matter ID'),
    predictionType: z.enum(['OUTCOME', 'DURATION', 'COST', 'SETTLEMENT_RANGE']).default('OUTCOME'),
    factorsToConsider: z.array(z.string()).default([])
  }),

  complianceCheck: z.object({
    entityType: z.enum(['CONTRACT', 'MATTER', 'DOCUMENT']),
    entityId: z.string().uuid('Invalid entity ID'),
    regulations: z.array(z.string()).default([]),
    jurisdiction: z.string().optional()
  })
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// Enhanced sanitization helpers with SQL injection and XSS protection
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  
  // Remove dangerous characters for SQL injection and XSS
  return str
    .trim()
    .replace(/[<>"'&\x00\x08\x09\x1a\n\r"'\\%]/g, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 10000); // Prevent excessively long strings
};

export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Use DOMPurify to clean HTML content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form']
  });
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .substring(0, 254); // RFC 5321 email length limit
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  return phone
    .replace(/[^\d+()\s-]/g, '') // Allow only digits, +, (, ), space, -
    .trim()
    .substring(0, 20); // Reasonable phone number length
};

export const sanitizeFileName = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return '';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '') // Only allow safe filename characters
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255); // File system limit
};

export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>"'&%\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters and dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Reasonable search query length
};

export const sanitizeNumericInput = (input: string | number): number | null => {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''));
    return isFinite(parsed) ? parsed : null;
  }
  
  return null;
};

// Rate limiting for validation attempts
const validationAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const checkValidationRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 100; // Maximum validation attempts per window
  
  const attempts = validationAttempts.get(ip);
  
  if (!attempts || now - attempts.lastAttempt > windowMs) {
    validationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;
  
  for (const [ip, attempts] of validationAttempts.entries()) {
    if (now - attempts.lastAttempt > windowMs) {
      validationAttempts.delete(ip);
    }
  }
}, 300000); // Clean up every 5 minutes