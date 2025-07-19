/**
 * Authentication Middleware
 * JWT token validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

// Error classes
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

// Types
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// Helper function to generate JWT token
export function generateToken(user: any): { accessToken: string; refreshToken: string } {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

// Helper function to verify token
export function verifyToken(token: string, secret: string): JWTPayload {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    } else {
      throw new UnauthorizedError('Token verification failed');
    }
  }
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Main authentication middleware
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No valid authorization header found');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the JWT token
  const payload = verifyToken(token, env.JWT_SECRET);

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      isEmailVerified: true
    }
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('User account is not active');
  }

  // Attach user to request
  req.user = user;
  next();
});

// Role-based authorization middleware
export function authorize(...roles: string[]) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next();
    }

    throw new ForbiddenError('Insufficient permissions');
  });
}

// Permission-based authorization (simplified for basic schema)
export function requirePermissions(...permissions: string[]) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Simple role-based permissions for the simplified schema
    const rolePermissions = {
      'ADMIN': ['*'], // Admin has all permissions
      'USER': ['read:own', 'write:own'],
      'GUEST': ['read:own']
    };

    const userPermissions = rolePermissions[req.user.role as keyof typeof rolePermissions] || [];
    
    // Check if user has admin rights (all permissions)
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasAllPermissions) {
      logger.warn('Access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermissions: permissions,
        userPermissions: userPermissions,
        ip: req.ip
      });
      
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  });
}

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No authentication provided, continue without user
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    logger.debug('Optional authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  next();
});

// Rate limiting by user (for authenticated endpoints)
export function rateLimitByUser(maxRequests: number = 100, windowMs: number = 60000) {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip rate limiting if no user
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      throw new AuthError('Rate limit exceeded', 429);
    }

    userLimit.count++;
    next();
  });
}

// Security logging helper
export const securityLogger = {
  suspiciousActivity: (userId: string, activity: string, metadata: any = {}) => {
    logger.warn('Suspicious activity detected', {
      userId,
      activity,
      metadata,
      timestamp: new Date().toISOString()
    });
  },

  failedLogin: (email: string, ip: string, reason: string) => {
    logger.warn('Failed login attempt', {
      email,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  successfulLogin: (userId: string, ip: string) => {
    logger.info('Successful login', {
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  authenticate,
  authorize,
  requirePermissions,
  optionalAuth,
  rateLimitByUser,
  generateToken,
  verifyToken,
  asyncHandler,
  securityLogger
};