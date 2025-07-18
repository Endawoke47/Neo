/**
 * Database Configuration Service
 * Advanced connection pooling and optimization for PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { env } from './environment';
import { logger } from './logger';

// Database connection configuration
const databaseConfig = {
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty' as const,
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
};

// Enhanced Prisma client with connection pooling
class DatabaseService {
  private static instance: PrismaClient;
  private static isConnected = false;

  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient(databaseConfig);
      DatabaseService.setupHooks();
    }
    return DatabaseService.instance;
  }

  private static setupHooks(): void {
    const prisma = DatabaseService.instance;

    // Connection event handlers
    prisma.$on('query', (e) => {
      if (env.NODE_ENV === 'development') {
        logger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target
        });
      }
      
      // Alert on slow queries
      if (e.duration > 1000) {
        logger.warn('Slow database query detected', {
          duration: `${e.duration}ms`,
          query: e.query.substring(0, 100) + '...',
          target: e.target
        });
      }
    });

    prisma.$on('info', (e) => {
      logger.info('Database Info', { message: e.message, target: e.target });
    });

    prisma.$on('warn', (e) => {
      logger.warn('Database Warning', { message: e.message, target: e.target });
    });

    prisma.$on('error', (e) => {
      logger.error('Database Error', { message: e.message, target: e.target });
    });
  }

  static async connect(): Promise<void> {
    if (DatabaseService.isConnected) return;

    try {
      await DatabaseService.getInstance().$connect();
      DatabaseService.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!DatabaseService.isConnected) return;

    try {
      await DatabaseService.getInstance().$disconnect();
      DatabaseService.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database', { error });
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await DatabaseService.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }

  static getConnectionStatus(): boolean {
    return DatabaseService.isConnected;
  }
}

// Export the singleton instance
export const prisma = DatabaseService.getInstance();

// Export utility functions
export const dbService = {
  connect: DatabaseService.connect,
  disconnect: DatabaseService.disconnect,
  healthCheck: DatabaseService.healthCheck,
  getConnectionStatus: DatabaseService.getConnectionStatus,
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await DatabaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await DatabaseService.disconnect();
  process.exit(0);
});

// Query optimization utilities
export class QueryOptimizer {
  /**
   * Batch multiple queries for better performance
   */
  static async batchQueries<T>(queries: Promise<T>[]): Promise<T[]> {
    try {
      return await Promise.all(queries);
    } catch (error) {
      logger.error('Batch query execution failed', { error });
      throw error;
    }
  }

  /**
   * Execute queries with pagination
   */
  static async paginatedQuery<T>(
    model: any,
    page: number = 1,
    limit: number = 20,
    where?: any,
    orderBy?: any
  ): Promise<{ data: T[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Execute transaction with retry logic
   */
  static async executeWithRetry<T>(
    operation: (tx: any) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(operation);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          logger.error('Transaction failed after max retries', {
            attempts: attempt,
            error: lastError.message
          });
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn('Transaction retry', { attempt, delay });
      }
    }

    throw lastError!;
  }
}

export default DatabaseService;