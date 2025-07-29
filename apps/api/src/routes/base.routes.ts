import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../services/cache-optimized.service';
import { logger } from '../config/logger';

export interface RouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  auth?: boolean;
  cache?: { ttl: number; prefix: string };
  validation?: any[];
  rateLimit?: any;
}

export class BaseRoutes {
  protected router: Router;
  protected basePath: string;

  constructor(basePath: string) {
    this.router = Router();
    this.basePath = basePath;
  }

  protected addRoute(config: RouteConfig): void {
    const middlewares: any[] = [];

    // Add rate limiting if specified
    if (config.rateLimit) {
      middlewares.push(config.rateLimit);
    }

    // Add authentication if required
    if (config.auth !== false) {
      middlewares.push(authenticate);
    }

    // Add validation if specified
    if (config.validation) {
      middlewares.push(...config.validation);
      middlewares.push(this.handleValidationErrors);
    }

    // Add caching if specified
    if (config.cache && config.method === 'get') {
      middlewares.push(cacheMiddleware(config.cache.ttl, config.cache.prefix));
    }

    // Add the main handler with error handling
    middlewares.push(this.asyncHandler(config.handler));

    // Register the route
    this.router[config.method](config.path, ...middlewares);
  }

  protected handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', {
        path: req.path,
        method: req.method,
        errors: errors.array(),
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };

  protected asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  protected sendSuccess(res: Response, data: any, message?: string, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected sendError(res: Response, error: string, statusCode = 400, details?: any) {
    logger.error('API Error', {
      error,
      statusCode,
      details,
      stack: details?.stack
    });

    res.status(statusCode).json({
      success: false,
      error,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString()
    });
  }

  protected sendPaginated(res: Response, data: any[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    
    res.set({
      'X-Total-Count': total.toString(),
      'X-Page-Count': totalPages.toString(),
      'X-Current-Page': page.toString(),
      'X-Per-Page': limit.toString()
    });

    res.json({
      success: true,
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  // Common validation rules
  protected static validationRules = {
    id: param('id').isString().notEmpty().trim(),
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    name: body('name').isString().trim().isLength({ min: 1, max: 100 }),
    pagination: [
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('sort').optional().isString().trim(),
      query('order').optional().isIn(['asc', 'desc'])
    ],
    search: query('search').optional().isString().trim().isLength({ max: 100 })
  };

  getRouter(): Router {
    return this.router;
  }
}

// Utility function to create standardized API responses
export const createApiResponse = {
  success: (data: any, message?: string) => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }),

  error: (error: string, details?: any) => ({
    success: false,
    error,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  }),

  paginated: (data: any[], total: number, page: number, limit: number) => {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
};