#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests across the Neo application with detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(message, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

// Test execution function
function runTest(command, description, cwd = process.cwd()) {
  logInfo(`Running: ${description}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      cwd, 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000, // 5 minutes timeout
    }).toString();
    
    const duration = Date.now() - startTime;
    logSuccess(`${description} completed in ${duration}ms`);
    
    return { success: true, output, duration };
  } catch (error) {
    const duration = Date.now() - Date.now();
    logError(`${description} failed`);
    console.log(error.stdout?.toString() || '');
    console.error(error.stderr?.toString() || '');
    
    return { success: false, error: error.message, duration };
  }
}

// Main test execution
async function runAllTests() {
  logHeader('🚀 CounselFlow Neo - Comprehensive Test Suite');
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0,
    details: []
  };

  const startTime = Date.now();

  // 1. TypeScript Compilation Tests
  logHeader('📝 TypeScript Compilation Tests');
  
  const apiTscResult = runTest(
    'npx tsc --noEmit',
    'API TypeScript Compilation',
    './apps/api'
  );
  testResults.details.push({ name: 'API TypeScript', ...apiTscResult });
  
  const webTscResult = runTest(
    'npx tsc --noEmit',
    'Web TypeScript Compilation',
    './apps/web'
  );
  testResults.details.push({ name: 'Web TypeScript', ...webTscResult });

  // 2. Linting Tests
  logHeader('🔍 Code Quality & Linting Tests');
  
  const apiLintResult = runTest(
    'npm run lint',
    'API ESLint Check',
    './apps/api'
  );
  testResults.details.push({ name: 'API Lint', ...apiLintResult });

  const webLintResult = runTest(
    'npm run lint',
    'Web ESLint Check',
    './apps/web'
  );
  testResults.details.push({ name: 'Web Lint', ...webLintResult });

  // 3. Unit Tests
  logHeader('🧪 Unit Tests');
  
  const apiUnitResult = runTest(
    'npm test -- --testPathPattern="test/.*\\.test\\.(ts|js)$" --coverage',
    'API Unit Tests',
    './apps/api'
  );
  testResults.details.push({ name: 'API Unit Tests', ...apiUnitResult });

  const webUnitResult = runTest(
    'npm test -- --testPathPattern="__tests__/.*\\.test\\.(tsx|ts)$" --coverage --watchAll=false',
    'Web Unit Tests',
    './apps/web'
  );
  testResults.details.push({ name: 'Web Unit Tests', ...webUnitResult });

  // 4. Integration Tests
  logHeader('🔗 Integration Tests');
  
  const integrationResult = runTest(
    'npm test -- --testPathPattern="integration\\.test\\.(ts|js)$"',
    'API Integration Tests',
    './apps/api'
  );
  testResults.details.push({ name: 'Integration Tests', ...integrationResult });

  // 5. Security Tests
  logHeader('🔒 Security Tests');
  
  const securityAuditResult = runTest(
    'npm audit --audit-level moderate',
    'Security Audit',
    '.'
  );
  testResults.details.push({ name: 'Security Audit', ...securityAuditResult });

  // 6. Build Tests
  logHeader('🏗️ Build Tests');
  
  const apiBuildResult = runTest(
    'npm run build',
    'API Build Test',
    './apps/api'
  );
  testResults.details.push({ name: 'API Build', ...apiBuildResult });

  const webBuildResult = runTest(
    'npm run build',
    'Web Build Test',
    './apps/web'
  );
  testResults.details.push({ name: 'Web Build', ...webBuildResult });

  // Calculate results
  testResults.total = testResults.details.length;
  testResults.passed = testResults.details.filter(t => t.success).length;
  testResults.failed = testResults.total - testResults.passed;
  testResults.duration = Date.now() - startTime;

  // Generate detailed report
  logHeader('📊 Test Results Summary');
  
  log(`Total Tests: ${testResults.total}`, colors.blue);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? colors.red : colors.green);
  log(`Total Duration: ${testResults.duration}ms`, colors.blue);
  log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`, colors.blue);

  // Detailed breakdown
  logHeader('📋 Detailed Test Results');
  
  testResults.details.forEach(test => {
    const status = test.success ? '✅' : '❌';
    const duration = test.duration ? `(${test.duration}ms)` : '';
    log(`${status} ${test.name} ${duration}`);
  });

  // Failed tests details
  const failedTests = testResults.details.filter(t => !t.success);
  if (failedTests.length > 0) {
    logHeader('❌ Failed Tests Details');
    failedTests.forEach(test => {
      logError(`${test.name}: ${test.error}`);
    });
  }

  // Coverage information
  logHeader('📈 Coverage Information');
  logInfo('Coverage reports generated in:');
  logInfo('  - ./apps/api/coverage/');
  logInfo('  - ./apps/web/coverage/');

  // Quality gates
  logHeader('🎯 Quality Gates');
  
  const passRate = (testResults.passed / testResults.total) * 100;
  
  if (passRate >= 90) {
    logSuccess('🌟 EXCELLENT: All quality gates passed!');
  } else if (passRate >= 80) {
    logWarning('🔶 GOOD: Most quality gates passed, some improvements needed');
  } else if (passRate >= 70) {
    logWarning('🔸 FAIR: Several issues need attention');
  } else {
    logError('🔻 POOR: Critical issues need immediate attention');
  }

  // Generate JSON report
  const reportPath = './test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  logInfo(`Detailed JSON report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Error handling
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});