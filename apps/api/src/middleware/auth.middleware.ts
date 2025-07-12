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
  };
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw createError('Invalid token format', 401);
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
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
