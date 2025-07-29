import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export class DatabaseOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    logger.info('Starting database performance analysis...');

    try {
      // Get database size and table statistics (PostgreSQL specific)
      const tableStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      ` as any[];

      // Get index usage statistics
      const indexStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC;
      ` as any[];

      // Get slow queries (if available)
      const slowQueries = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          stddev_time
        FROM pg_stat_statements 
        ORDER BY mean_time DESC 
        LIMIT 10;
      ` as any[];

      return {
        tableStats,
        indexStats,
        slowQueries
      };
    } catch (error) {
      logger.error('Database analysis failed:', error);
      throw error;
    }
  }

  // Check for missing indexes
  async checkMissingIndexes() {
    logger.info('Checking for missing indexes...');

    const suggestions: string[] = [];

    try {
      // Check for queries that might benefit from indexes
      const unindexedQueries = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND n_distinct > 100
        AND correlation < 0.1
        ORDER BY n_distinct DESC;
      ` as any[];

      unindexedQueries.forEach((query: any) => {
        suggestions.push(
          `Consider adding index on ${query.tablename}.${query.attname} (${query.n_distinct} distinct values)`
        );
      });

      return suggestions;
    } catch (error) {
      logger.error('Missing index check failed:', error);
      return [];
    }
  }

  // Optimize database for common queries
  async optimizeCommonQueries() {
    logger.info('Running query optimizations...');

    const optimizations = [];

    try {
      // Update table statistics
      await this.prisma.$executeRaw`ANALYZE;`;
      optimizations.push('Updated table statistics');

      // Vacuum and reindex (should be done during maintenance windows)
      if (process.env.NODE_ENV !== 'production') {
        await this.prisma.$executeRaw`VACUUM ANALYZE;`;
        optimizations.push('Vacuumed and analyzed tables');
      }

      return optimizations;
    } catch (error) {
      logger.error('Query optimization failed:', error);
      throw error;
    }
  }

  // Connection pool optimization
  getOptimalConnectionSettings() {
    const cpuCount = require('os').cpus().length;
    
    return {
      // Connection pool settings
      connectionLimit: Math.max(5, Math.min(cpuCount * 2, 20)),
      maxUses: 7500,
      maxIdleTime: 600000, // 10 minutes
      maxLifetime: 1800000, // 30 minutes
      
      // Query settings
      statementTimeout: 30000, // 30 seconds
      queryTimeout: 30000,
      connectionTimeout: 5000,
      
      // PostgreSQL specific settings
      pgSettings: {
        'shared_preload_libraries': 'pg_stat_statements',
        'max_connections': Math.min(100, cpuCount * 4),
        'shared_buffers': '256MB',
        'effective_cache_size': '1GB',
        'maintenance_work_mem': '64MB',
        'checkpoint_completion_target': '0.7',
        'wal_buffers': '16MB',
        'default_statistics_target': '100',
        'random_page_cost': '1.1',
        'effective_io_concurrency': '200'
      }
    };
  }

  // Health check for database
  async healthCheck() {
    const health = {
      connected: false,
      responseTime: 0,
      activeConnections: 0,
      totalConnections: 0,
      cacheHitRatio: 0,
      indexUsage: 0,
      issues: [] as string[]
    };

    try {
      const startTime = Date.now();
      
      // Basic connectivity check
      await this.prisma.$queryRaw`SELECT 1`;
      health.connected = true;
      health.responseTime = Date.now() - startTime;

      // Get connection stats
      const connectionStats = await this.prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE state = 'active';
      ` as any[];

      if (connectionStats.length > 0) {
        health.activeConnections = connectionStats[0].active_connections;
        health.totalConnections = connectionStats[0].max_connections;
      }

      // Cache hit ratio
      const cacheStats = await this.prisma.$queryRaw`
        SELECT 
          sum(heap_blks_hit) as hits,
          sum(heap_blks_hit + heap_blks_read) as total
        FROM pg_statio_user_tables;
      ` as any[];

      if (cacheStats.length > 0 && cacheStats[0].total > 0) {
        health.cacheHitRatio = (cacheStats[0].hits / cacheStats[0].total) * 100;
      }

      // Index usage
      const indexUsageStats = await this.prisma.$queryRaw`
        SELECT 
          sum(idx_scan) as index_scans,
          sum(seq_scan) as sequential_scans
        FROM pg_stat_user_tables;
      ` as any[];

      if (indexUsageStats.length > 0) {
        const totalScans = indexUsageStats[0].index_scans + indexUsageStats[0].sequential_scans;
        if (totalScans > 0) {
          health.indexUsage = (indexUsageStats[0].index_scans / totalScans) * 100;
        }
      }

      // Check for issues
      if (health.responseTime > 1000) {
        health.issues.push('High database response time');
      }
      
      if (health.activeConnections / health.totalConnections > 0.8) {
        health.issues.push('High connection usage');
      }
      
      if (health.cacheHitRatio < 95) {
        health.issues.push('Low cache hit ratio');
      }
      
      if (health.indexUsage < 90) {
        health.issues.push('Low index usage - consider adding indexes');
      }

    } catch (error) {
      logger.error('Database health check failed:', error);
      health.issues.push(`Health check failed: ${error.message}`);
    }

    return health;
  }

  // Performance monitoring
  async startPerformanceMonitoring(intervalMs = 60000) {
    logger.info('Starting database performance monitoring...');

    const monitor = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        
        logger.info('Database Performance Metrics', {
          responseTime: health.responseTime,
          activeConnections: health.activeConnections,
          cacheHitRatio: health.cacheHitRatio.toFixed(2),
          indexUsage: health.indexUsage.toFixed(2),
          issues: health.issues.length
        });

        if (health.issues.length > 0) {
          logger.warn('Database Performance Issues', { issues: health.issues });
        }
      } catch (error) {
        logger.error('Performance monitoring error:', error);
      }
    }, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(monitor);
      logger.info('Database performance monitoring stopped');
    };
  }
}

// Export utility functions for use in routes/services
export const createDatabaseOptimizer = (prisma: PrismaClient) => {
  return new DatabaseOptimizer(prisma);
};

// Query builder utilities for optimized queries
export class QueryBuilder {
  static buildOptimizedUserQuery(filters: any = {}) {
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.firm) where.firm = filters.firm;

    return {
      where,
      orderBy: { createdAt: 'desc' as const },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        firm: true,
        createdAt: true,
        // Exclude sensitive fields by default
      }
    };
  }

  static buildOptimizedContractQuery(filters: any = {}) {
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.assignedLawyerId) where.assignedLawyerId = filters.assignedLawyerId;

    return {
      where,
      orderBy: { createdAt: 'desc' as const },
      include: {
        client: {
          select: { id: true, name: true }
        },
        assignedLawyer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    };
  }
}

export default DatabaseOptimizer;