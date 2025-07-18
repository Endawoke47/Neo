// Authentication Middleware
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './error.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw createError('Invalid token format', 401);
    }

    // Critical Security Fix: Require JWT_SECRET environment variable
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createError('Server configuration error', 500);
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: process.env.JWT_AUDIENCE || 'counselflow-api',
      issuer: process.env.JWT_ISSUER || 'counselflow'
    }) as JwtPayload;
    
    // Validate token payload structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw createError('Invalid token payload', 401);
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired', 401));
    } else if (error instanceof jwt.NotBeforeError) {
      next(createError('Token not yet valid', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};
