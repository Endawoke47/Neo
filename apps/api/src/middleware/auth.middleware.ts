/**
 * Authentication Middleware
 * JWT token validation and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { logger, securityLogger } from '../config/logger';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
  sessionId: string;
}

/**
 * Authentication middleware
 * Validates JWT token and sets user context
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
    
    // Validate token structure
    if (!decoded.userId || !decoded.email || !decoded.role || !decoded.sessionId) {
      throw new UnauthorizedError('Invalid token payload');
    }
    
    // Check if session is still active
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: { user: true }
    });
    
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      securityLogger.suspiciousActivity(
        decoded.userId,
        'Inactive or expired session used',
        { sessionId: decoded.sessionId, ip: req.ip }
      );
      throw new UnauthorizedError('Session is no longer active');
    }
    
    // Check if user is still active
    if (session.user.status !== 'ACTIVE') {
      securityLogger.suspiciousActivity(
        decoded.userId,
        'Inactive user attempted access',
        { status: session.user.status, ip: req.ip }
      );
      throw new UnauthorizedError('User account is not active');
    }
    
    // Update session last activity
    await prisma.session.update({
      where: { id: decoded.sessionId },
      data: { lastActivityAt: new Date() }
    });
    
    // Set user context
    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId
    };
    (req as AuthenticatedRequest).sessionId = decoded.sessionId;
    
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.error('Authentication middleware error', { error });
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

/**
 * Optional authentication middleware
 * Sets user context if token is provided, but doesn't require it
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      next();
      return;
    }
    
    // Try to authenticate, but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true }
      });
      
      if (session && session.isActive && session.expiresAt > new Date() && session.user.status === 'ACTIVE') {
        (req as AuthenticatedRequest).user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          sessionId: decoded.sessionId
        };
        (req as AuthenticatedRequest).sessionId = decoded.sessionId;
      }
    } catch (error) {
      // Silently ignore authentication errors for optional auth
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error', { error });
    next();
  }
}

/**
 * Role-based authorization middleware factory
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      if (!allowedRoles.includes(user.role)) {
        securityLogger.suspiciousActivity(
          user.id,
          'Unauthorized role access attempt',
          { userRole: user.role, requiredRoles: allowedRoles, ip: req.ip }
        );
        throw new ForbiddenError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Permission-based authorization middleware factory
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Get user permissions from database
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      });
      
      if (!userWithPermissions) {
        throw new UnauthorizedError('User not found');
      }
      
      const userPermissions = userWithPermissions.rolePermissions.map(rp => rp.permission.name);
      
      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => userPermissions.includes(permission));
      
      if (!hasAllPermissions) {
        securityLogger.suspiciousActivity(
          user.id,
          'Unauthorized permission access attempt',
          { userPermissions, requiredPermissions: permissions, ip: req.ip }
        );
        throw new ForbiddenError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources or has admin privileges
 */
export function requireOwnership(resourceIdParam = 'id', allowedRoles = ['ADMIN']) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Admin users can access any resource
      if (allowedRoles.includes(user.role)) {
        next();
        return;
      }
      
      const resourceId = req.params[resourceIdParam];
      const resourceUserId = req.params.userId || req.body.userId;
      
      // Check if user is accessing their own resource
      if (resourceUserId && resourceUserId !== user.id) {
        securityLogger.suspiciousActivity(
          user.id,
          'Unauthorized resource access attempt',
          { resourceUserId, accessedBy: user.id, ip: req.ip }
        );
        throw new ForbiddenError('Access denied to this resource');
      }
      
      // For other resource types, implement custom logic based on your needs
      // This is a basic implementation
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Email verification requirement middleware
 */
export async function requireEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isEmailVerified: true }
    });
    
    if (!userData?.isEmailVerified) {
      throw new ForbiddenError('Email verification required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Two-factor authentication requirement middleware
 */
export async function require2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isTwoFactorEnabled: true }
    });
    
    if (!userData?.isTwoFactorEnabled) {
      throw new ForbiddenError('Two-factor authentication required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * API key authentication middleware
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }
    
    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });
    
    if (!apiKeyRecord || !apiKeyRecord.isActive || apiKeyRecord.expiresAt < new Date()) {
      securityLogger.suspiciousActivity(
        'unknown',
        'Invalid API key used',
        { apiKey: apiKey.substring(0, 8) + '...', ip: req.ip }
      );
      throw new UnauthorizedError('Invalid or expired API key');
    }
    
    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });
    
    // Set user context from API key
    (req as AuthenticatedRequest).user = {
      id: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
      role: apiKeyRecord.user.role,
      sessionId: 'api-key-session'
    };
    
    securityLogger.dataAccess(
      apiKeyRecord.user.id,
      'api_key_access',
      'read',
      `API access via key: ${apiKeyRecord.name}`
    );
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Rate limiting bypass for authenticated users
 */
export function bypassRateLimitForRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (user && roles.includes(user.role)) {
      (req as any).skipRateLimit = true;
    }
    
    next();
  };
}