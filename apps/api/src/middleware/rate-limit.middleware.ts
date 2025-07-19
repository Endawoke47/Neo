/**
 * Production Rate Limiting Middleware
 * Advanced rate limiting with Redis support and smart throttling
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';
import { logger } from '../config/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  increment(key: string): Promise<{ count: number; resetTime: number }>;
  reset(key: string): Promise<void>;
}

// In-memory store (fallback when Redis is not available)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + env.RATE_LIMIT_WINDOW_MS;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Redis store (when Redis is available)
class RedisStore implements RateLimitStore {
  private redis: any;

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const now = Date.now();
    const resetTime = now + windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results[0][1];

    return { count, resetTime };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// Rate limit middleware factory
export function createRateLimit(options: RateLimitOptions) {
  const store = new MemoryStore(); // TODO: Use Redis when available
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!env.ENABLE_RATE_LIMITING) {
      next();
      return;
    }

    try {
      const key = options.keyGenerator ? options.keyGenerator(req) : getDefaultKey(req);
      const { count, resetTime } = await store.increment(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      
      if (count > options.maxRequests) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          key,
          count,
          limit: options.maxRequests,
          userAgent: req.headers['user-agent']
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: options.message || 'Too many requests, please try again later',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error', { error });
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

// Default key generator
function getDefaultKey(req: Request): string {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.connection.remoteAddress;
  return userId ? `user:${userId}` : `ip:${ip}`;
}

// Predefined rate limiters
export const generalRateLimit = createRateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later'
});

export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many attempts, please try again later'
});

export const aiRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  message: 'AI API rate limit exceeded, please try again later',
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `ai:user:${userId}` : `ai:ip:${req.ip}`;
  }
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req: Request) => `auth:${req.ip}:${req.body?.email || 'unknown'}`
});

// Smart rate limiting based on user role
export function createSmartRateLimit(req: Request): ReturnType<typeof createRateLimit> {
  const user = (req as any).user;
  
  if (!user) {
    return strictRateLimit;
  }

  // Higher limits for admin users
  if (user.role === 'ADMIN') {
    return createRateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS * 5,
      message: 'Admin rate limit exceeded'
    });
  }

  // Standard limits for authenticated users
  return createRateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS * 2,
    message: 'User rate limit exceeded'
  });
}