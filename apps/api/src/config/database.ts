/**
 * Database Configuration and Connection Management
 * Prisma client setup with connection pooling and error handling
 */

import { PrismaClient } from '@prisma/client';
import { env } from './environment';
import { logger } from './logger';

// Global prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimized configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  }
});

// Prevent multiple instances in development
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
}

// Database statistics
export async function getDatabaseStats(): Promise<any> {
  try {
    const [userCount, clientCount, matterCount, contractCount, documentCount] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.matter.count(),
      prisma.contract.count(),
      prisma.document.count()
    ]);
    
    return {
      users: userCount,
      clients: clientCount,
      matters: matterCount,
      contracts: contractCount,
      documents: documentCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get database statistics', { error });
    throw error;
  }
}

// Initialize database connection and run migrations if needed
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    
    // Test connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Could not establish database connection');
    }
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', { error });
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  fn: (prisma: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn as any) as Promise<T>;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
