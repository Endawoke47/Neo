/**
 * Database Performance Test Script
 * Tests the optimized SQLite database performance
 */

import { DatabasePerformanceMonitor } from './src/services/database-performance.service.js';

async function main() {
  console.log('🚀 CounselFlow Neo - Database Performance Test\n');
  
  try {
    // Test database health
    console.log('🔍 Checking database health...');
    const health = await DatabasePerformanceMonitor.getHealthStatus();
    console.log('Health Status:', health);
    console.log('');

    // Run comprehensive benchmark
    await DatabasePerformanceMonitor.runPerformanceBenchmark();
    
    console.log('\n✅ Database performance test completed successfully!');
  } catch (error) {
    console.error('❌ Database performance test failed:', error);
    process.exit(1);
  }
}

main();
