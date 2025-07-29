import { createHash } from 'crypto';
import { logger } from '../config/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = (options.ttl || this.defaultTTL) * 1000; // Convert to milliseconds
    const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(prefixedKey, {
      data,
      timestamp: Date.now(),
      ttl
    });

    logger.debug('Cache set', { key: prefixedKey, ttl });
  }

  get<T>(key: string, prefix?: string): T | null {
    const prefixedKey = prefix ? `${prefix}:${key}` : key;
    const entry = this.cache.get(prefixedKey);

    if (!entry) {
      logger.debug('Cache miss', { key: prefixedKey });
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(prefixedKey);
      logger.debug('Cache expired', { key: prefixedKey });
      return null;
    }

    logger.debug('Cache hit', { key: prefixedKey });
    return entry.data;
  }

  delete(key: string, prefix?: string): boolean {
    const prefixedKey = prefix ? `${prefix}:${key}` : key;
    const deleted = this.cache.delete(prefixedKey);
    
    if (deleted) {
      logger.debug('Cache deleted', { key: prefixedKey });
    }
    
    return deleted;
  }

  clear(prefix?: string): void {
    if (prefix) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${prefix}:`)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      logger.debug('Cache cleared with prefix', { prefix, count: keysToDelete.length });
    } else {
      this.cache.clear();
      logger.debug('Cache cleared completely');
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let expired = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expired++;
      }
    }

    if (expired > 0) {
      logger.debug('Cache cleanup completed', { expired, remaining: this.cache.size });
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }
}

// Create singleton cache instance
export const optimizedCache = new InMemoryCache();

// Cache key generation helper
export const generateCacheKey = (data: any): string => {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('md5').update(serialized).digest('hex');
};

// Cache middleware for Express routes
export const cacheMiddleware = (ttl = 300, prefix = 'api') => {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey({
      url: req.originalUrl,
      query: req.query,
      headers: {
        authorization: req.headers.authorization ? '[REDACTED]' : undefined
      }
    });

    // Try to get from cache
    const cachedResponse = optimizedCache.get(cacheKey, prefix);
    if (cachedResponse) {
      res.set({
        'X-Cache': 'HIT',
        'Content-Type': 'application/json'
      });
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        optimizedCache.set(cacheKey, data, { ttl, prefix });
      }
      
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

// Decorator for caching service methods
export const cacheable = (ttl = 300, prefix = 'service') => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey({
        method: propertyName,
        args: args.map(arg => 
          typeof arg === 'object' && arg.password ? { ...arg, password: '[REDACTED]' } : arg
        )
      });

      // Try cache first
      const cachedResult = optimizedCache.get(cacheKey, prefix);
      if (cachedResult) {
        return cachedResult;
      }

      // Execute method and cache result
      try {
        const result = await method.apply(this, args);
        optimizedCache.set(cacheKey, result, { ttl, prefix });
        return result;
      } catch (error) {
        // Don't cache errors
        throw error;
      }
    };
  };
};

export default optimizedCache;