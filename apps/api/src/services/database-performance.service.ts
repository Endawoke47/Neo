/**
 * Database Performance Monitor
 * Monitors SQLite database performance and optimization status
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface DatabaseStats {
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    sizeKB: number;
  }>;
  indexStats: Array<{
    tableName: string;
    indexName: string;
    isUnique: boolean;
  }>;
  performanceMetrics: {
    connectionTime: number;
    queryTime: number;
    databaseSizeMB: number;
  };
}

/**
 * Database Performance Monitor
 */
export class DatabasePerformanceMonitor {
  /**
   * Get comprehensive database statistics
   */
  static async getDatabaseStats(): Promise<DatabaseStats> {
    const startTime = Date.now();
    
    try {
      // Get table statistics
      const tableStats = await this.getTableStats();
      
      // Get index information
      const indexStats = await this.getIndexStats();
      
      // Get performance metrics
      const connectionTime = Date.now() - startTime;
      const queryStartTime = Date.now();
      
      // Test query performance
      await prisma.user.findFirst();
      const queryTime = Date.now() - queryStartTime;
      
      // Get database file size
      const databaseSizeMB = await this.getDatabaseSize();
      
      return {
        tableStats,
        indexStats,
        performanceMetrics: {
          connectionTime,
          queryTime,
          databaseSizeMB,
        },
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Get table row counts and sizes
   */
  private static async getTableStats() {
    const tables = ['users', 'clients', 'matters', 'contracts', 'documents', 'sessions'];
    const stats = [];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        const count = Array.isArray(result) && result[0] ? (result[0] as any).count : 0;
        
        stats.push({
          tableName: table,
          rowCount: count,
          sizeKB: 0, // SQLite doesn't provide easy table size info
        });
      } catch (error) {
        console.warn(`Could not get stats for table ${table}:`, error);
        stats.push({
          tableName: table,
          rowCount: 0,
          sizeKB: 0,
        });
      }
    }

    return stats;
  }

  /**
   * Get index information
   */
  private static async getIndexStats() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          tbl_name as tableName,
          name as indexName,
          "unique" as isUnique
        FROM sqlite_master 
        WHERE type = 'index' 
        AND tbl_name IN ('users', 'clients', 'matters', 'contracts', 'documents', 'sessions')
        ORDER BY tbl_name, name
      `;

      return Array.isArray(result) ? result.map((row: any) => ({
        tableName: row.tableName,
        indexName: row.indexName,
        isUnique: Boolean(row.isUnique),
      })) : [];
    } catch (error) {
      console.warn('Could not get index stats:', error);
      return [];
    }
  }

  /**
   * Get database file size
   */
  private static async getDatabaseSize(): Promise<number> {
    try {
      const dbPath = path.join(process.cwd(), 'dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        return Math.round(stats.size / (1024 * 1024) * 100) / 100; // MB with 2 decimal places
      }
    } catch (error) {
      console.warn('Could not get database size:', error);
    }
    return 0;
  }

  /**
   * Run performance benchmark
   */
  static async runPerformanceBenchmark() {
    console.log('🔍 Starting Database Performance Benchmark...\n');

    const stats = await this.getDatabaseStats();

    // Display results
    console.log('📊 TABLE STATISTICS:');
    console.log('----------------------------------------');
    stats.tableStats.forEach(table => {
      console.log(`${table.tableName.padEnd(20)} | ${table.rowCount.toString().padStart(8)} rows`);
    });

    console.log('\n🔗 INDEX STATISTICS:');
    console.log('----------------------------------------');
    const indexesByTable = stats.indexStats.reduce((acc, index) => {
      if (!acc[index.tableName]) acc[index.tableName] = [];
      acc[index.tableName].push(index);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(indexesByTable).forEach(([tableName, indexes]) => {
      console.log(`${tableName}:`);
      indexes.forEach(index => {
        const uniqueLabel = index.isUnique ? '(UNIQUE)' : '';
        console.log(`  - ${index.indexName} ${uniqueLabel}`);
      });
    });

    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log('----------------------------------------');
    console.log(`Connection Time:     ${stats.performanceMetrics.connectionTime}ms`);
    console.log(`Query Time:          ${stats.performanceMetrics.queryTime}ms`);
    console.log(`Database Size:       ${stats.performanceMetrics.databaseSizeMB}MB`);

    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    console.log('----------------------------------------');
    
    if (stats.performanceMetrics.connectionTime > 100) {
      console.log('⚠️  Connection time is high - consider connection pooling');
    } else {
      console.log('✅ Connection time is good');
    }

    if (stats.performanceMetrics.queryTime > 50) {
      console.log('⚠️  Query time is high - check indexes and query optimization');
    } else {
      console.log('✅ Query performance is good');
    }

    if (stats.performanceMetrics.databaseSizeMB > 100) {
      console.log('⚠️  Database size is large - consider archiving old data');
    } else {
      console.log('✅ Database size is manageable');
    }

    const totalIndexes = stats.indexStats.length;
    if (totalIndexes < 10) {
      console.log('⚠️  Few indexes detected - consider adding more for performance');
    } else {
      console.log(`✅ Good index coverage (${totalIndexes} indexes)`);
    }

    return stats;
  }

  /**
   * Analyze slow queries (for future implementation)
   */
  static async analyzeSlowQueries() {
    // SQLite doesn't have built-in slow query log
    // This would be implemented with custom query timing
    console.log('📈 Query analysis would require custom instrumentation in SQLite');
  }

  /**
   * Get database health status
   */
  static async getHealthStatus() {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - startTime;
      
      // Check if tables exist
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as tableCount 
        FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
      `;
      
      const tableCount = Array.isArray(result) && result[0] ? (result[0] as any).tableCount : 0;
      
      return {
        status: 'healthy',
        connectionTime,
        tableCount,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

export default DatabasePerformanceMonitor;
