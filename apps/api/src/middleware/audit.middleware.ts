// Audit Trail Middleware
// Track all user actions for legal compliance and security monitoring

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth.middleware';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ipAddress: string;
  userAgent?: string;
  requestBody?: any;
  responseStatus: number;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

// Actions that should be audited
const AUDITED_ACTIONS = {
  'POST': 'CREATE',
  'PUT': 'UPDATE',
  'PATCH': 'UPDATE',
  'DELETE': 'DELETE',
  'GET': 'READ' // Only for sensitive resources
};

// Resources that should always be audited
const AUDITED_RESOURCES = [
  '/api/v1/auth/',
  '/api/v1/users/',
  '/api/v1/clients/',
  '/api/v1/matters/',
  '/api/v1/contracts/',
  '/api/v1/documents/',
  '/api/v1/disputes/',
  '/api/v1/ai/'
];

// Sensitive resources that should audit even GET requests
const SENSITIVE_RESOURCES = [
  '/api/v1/users/',
  '/api/v1/clients/',
  '/api/v1/matters/',
  '/api/v1/contracts/',
  '/api/v1/documents/',
  '/api/v1/ai/'
];

export const auditLogger = () => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Check if this request should be audited
    if (!shouldAuditRequest(req)) {
      return next();
    }

    // Capture request details
    const originalSend = res.send;
    let responseBody: any;

    res.send = function(data: any) {
      responseBody = data;
      originalSend.call(this, data);
      return this;
    };

    // Continue with request processing
    res.on('finish', async () => {
      try {
        await createAuditLog({
          req,
          res,
          responseBody,
          duration: Date.now() - startTime
        });
      } catch (error) {
        console.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};

const shouldAuditRequest = (req: AuthenticatedRequest): boolean => {
  const { method, path } = req;

  // Always audit authentication requests
  if (path.startsWith('/api/v1/auth/')) {
    return true;
  }

  // Check if resource should be audited
  const isAuditedResource = AUDITED_RESOURCES.some(resource => 
    path.startsWith(resource)
  );

  if (!isAuditedResource) {
    return false;
  }

  // Check if action should be audited
  if (method !== 'GET') {
    return true; // All non-GET requests on audited resources
  }

  // For GET requests, only audit sensitive resources
  return SENSITIVE_RESOURCES.some(resource => path.startsWith(resource));
};

const createAuditLog = async ({
  req,
  res,
  responseBody,
  duration
}: {
  req: AuthenticatedRequest;
  res: Response;
  responseBody: any;
  duration: number;
}) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const action = AUDITED_ACTIONS[req.method as keyof typeof AUDITED_ACTIONS] || req.method;
    const resource = extractResourceName(req.path);
    const resourceId = extractResourceId(req.path, req.params);

    // Sanitize request body for logging
    const sanitizedBody = sanitizeForAudit(req.body);

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      userId,
      action,
      resource,
      resourceId,
      method: req.method,
      path: req.path,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      requestBody: sanitizedBody,
      responseStatus: res.statusCode,
      timestamp: new Date(),
      duration,
      metadata: {
        query: req.query,
        params: req.params,
        success: res.statusCode < 400,
        requestId: req.headers['x-request-id']
      }
    };

    // Store in database
    await prisma.auditLog.create({
      data: {
        userId: auditEntry.userId,
        action: auditEntry.action,
        resource: auditEntry.resource,
        resourceId: auditEntry.resourceId,
        method: auditEntry.method,
        path: auditEntry.path,
        ipAddress: auditEntry.ipAddress,
        userAgent: auditEntry.userAgent,
        requestBody: JSON.stringify(auditEntry.requestBody),
        responseStatus: auditEntry.responseStatus,
        duration: auditEntry.duration,
        metadata: JSON.stringify(auditEntry.metadata),
        timestamp: auditEntry.timestamp
      }
    });

    // Log critical actions
    if (isCriticalAction(auditEntry)) {
      console.log('🔍 CRITICAL ACTION LOGGED:', {
        user: userId,
        action: auditEntry.action,
        resource: auditEntry.resource,
        timestamp: auditEntry.timestamp
      });
    }

  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

const extractResourceName = (path: string): string => {
  const pathParts = path.split('/');
  // Extract resource name from path like /api/v1/clients/123
  if (pathParts.length >= 4) {
    return pathParts[3]; // 'clients'
  }
  return 'unknown';
};

const extractResourceId = (path: string, params: any): string | undefined => {
  // Try to get ID from route parameters
  if (params.id) {
    return params.id;
  }

  // Try to extract from path
  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  // Check if last part looks like an ID (UUID pattern)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(lastPart)) {
    return lastPart;
  }

  return undefined;
};

const sanitizeForAudit = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'newPassword',
    'currentPassword',
    'token',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
    'socialSecurityNumber'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

const isCriticalAction = (entry: AuditLogEntry): boolean => {
  const criticalActions = [
    'DELETE',
    'admin_action',
    'password_change',
    'permission_change',
    'data_export'
  ];

  const criticalResources = [
    'users',
    'clients',
    'matters',
    'contracts'
  ];

  return criticalActions.includes(entry.action) || 
         criticalResources.includes(entry.resource) ||
         entry.path.includes('admin') ||
         entry.responseStatus === 401 || 
         entry.responseStatus === 403;
};

// Get audit logs with filtering
export const getAuditLogs = async (filters: {
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) => {
  const {
    userId,
    resource,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  const where: any = {};

  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs: logs.map(log => ({
      ...log,
      requestBody: log.requestBody ? JSON.parse(log.requestBody) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// Security monitoring - detect suspicious patterns
export const detectSuspiciousActivity = async (userId: string, timeWindow: number = 300) => {
  const since = new Date(Date.now() - timeWindow * 1000);

  const recentLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      timestamp: { gte: since }
    },
    orderBy: { timestamp: 'desc' }
  });

  const suspiciousPatterns = {
    tooManyFailedLogins: recentLogs.filter(log => 
      log.path.includes('/auth/') && log.responseStatus === 401
    ).length > 5,

    rapidRequests: recentLogs.length > 100,

    multipleDeleteOperations: recentLogs.filter(log => 
      log.action === 'DELETE'
    ).length > 10,

    accessToMultipleResources: new Set(
      recentLogs.map(log => log.resource)
    ).size > 10,

    failedPermissions: recentLogs.filter(log => 
      log.responseStatus === 403
    ).length > 5
  };

  const isSuspicious = Object.values(suspiciousPatterns).some(Boolean);

  if (isSuspicious) {
    console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', {
      userId,
      patterns: suspiciousPatterns,
      logCount: recentLogs.length,
      timeWindow
    });

    // Could trigger additional security measures here
    // e.g., temporary account lock, admin notification, etc.
  }

  return {
    isSuspicious,
    patterns: suspiciousPatterns,
    logCount: recentLogs.length
  };
};