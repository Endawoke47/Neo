#!/usr/bin/env node

/**
 * Neo Cleanup Script
 * Removes dead code, unused dependencies, and optimizes the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Files and directories to remove
const filesToRemove = [
  // Over-engineered AI services
  'apps/api/src/services/ai-gateway.service.ts',
  'apps/api/src/services/ai-gateway.clean.ts',
  'apps/api/src/routes/ai.routes.ts',
  'apps/api/src/routes/ai.routes.fixed.ts',
  
  // Overly complex route files (keep simplified versions)
  'apps/api/src/routes/contract-intelligence-simple.routes.ts',
  'apps/api/src/routes/contract-intelligence.routes.ts',
  'apps/api/src/routes/workflow-automation.routes.ts',
  'apps/api/src/routes/legal-intelligence.routes.ts',
  'apps/api/src/routes/document-automation.routes.ts',
  
  // Over-engineered types (replaced with simpler versions)
  'apps/api/src/types/ai.types.ts',
  'apps/api/src/types/contract-intelligence.types.ts',
  'apps/api/src/types/document-automation.types.ts',
  'apps/api/src/types/legal-intelligence.types.ts',
  'apps/api/src/types/legal-research.types.ts',
  'apps/api/src/types/workflow-automation.types.ts',
  
  // Complex service files with mock implementations
  'apps/api/src/services/ai-analysis.service.ts',
  'apps/api/src/services/ai-legal-assistant.service.ts',
  'apps/api/src/services/contract-intelligence.service.ts',
  'apps/api/src/services/document-automation.service.ts',
  'apps/api/src/services/document-automation-v2.service.ts',
  'apps/api/src/services/legal-intelligence.service.ts',
  'apps/api/src/services/legal-research.service.ts',
  'apps/api/src/services/workflow-automation.service.ts',
  
  // Over-engineered provider system
  'apps/api/src/services/providers/',
  
  // Test files for removed components
  'apps/api/tests/contract-intelligence.service.test.ts',
  'apps/api/tests/document-automation.test.ts',
  'apps/api/tests/legal-intelligence.test.ts',
  'apps/api/tests/legal-intelligence-routes.test.ts',
  'apps/api/tests/workflow-automation.test.ts',
  'apps/api/tests/workflow-automation-simple.test.ts',
  
  // Over-engineered command system
  'apps/api/src/commands/',
  'apps/api/src/core/command-bus.ts',
  'apps/api/src/core/command-registry.ts',
  'apps/api/src/core/policy.service.ts',
  
  // Complex circuit breaker (replaced with simpler version)
  'apps/api/src/utils/circuit-breaker.ts',
  
  // Frontend components with placeholder implementations
  'apps/web/src/components/workflow/WorkflowDesigner.tsx',
  'apps/web/src/components/workflow/WorkflowDesigner.clean.tsx',
  
  // Redundant test files
  'apps/api/src/test/circuit-breaker.test.ts',
  'apps/api/src/test/command-bus.test.ts',
  'apps/api/src/test/policy-service.test.ts',
];

// Directories to check for removal
const directoriesToCheck = [
  'apps/api/src/commands',
  'apps/api/src/services/providers',
  'apps/web/src/components/workflow',
];

// Main cleanup function
async function cleanup() {
  log('\n🧹 Starting Neo Codebase Cleanup\n', colors.cyan);

  let filesRemoved = 0;
  let directoriesRemoved = 0;

  // Remove specified files
  logInfo('Removing over-engineered and duplicate files...');
  
  for (const file of filesToRemove) {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        logSuccess(`Removed: ${file}`);
        filesRemoved++;
      } catch (error) {
        logWarning(`Failed to remove ${file}: ${error.message}`);
      }
    }
  }

  // Remove empty directories
  logInfo('\nRemoving empty directories...');
  
  for (const dir of directoriesToCheck) {
    const fullPath = path.join(process.cwd(), dir);
    
    if (fs.existsSync(fullPath)) {
      try {
        const files = fs.readdirSync(fullPath);
        if (files.length === 0) {
          fs.rmdirSync(fullPath);
          logSuccess(`Removed empty directory: ${dir}`);
          directoriesRemoved++;
        }
      } catch (error) {
        logWarning(`Failed to remove directory ${dir}: ${error.message}`);
      }
    }
  }

  // Clean up node_modules (remove and reinstall)
  logInfo('\nCleaning up dependencies...');
  
  try {
    // Remove node_modules in API
    if (fs.existsSync('./apps/api/node_modules')) {
      execSync('rm -rf ./apps/api/node_modules', { stdio: 'inherit' });
      logSuccess('Removed API node_modules');
    }
    
    // Remove node_modules in Web
    if (fs.existsSync('./apps/web/node_modules')) {
      execSync('rm -rf ./apps/web/node_modules', { stdio: 'inherit' });
      logSuccess('Removed Web node_modules');
    }
    
    // Remove root node_modules
    if (fs.existsSync('./node_modules')) {
      execSync('rm -rf ./node_modules', { stdio: 'inherit' });
      logSuccess('Removed root node_modules');
    }
    
    // Reinstall dependencies
    logInfo('Reinstalling dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencies reinstalled');
    
  } catch (error) {
    logWarning(`Failed to clean dependencies: ${error.message}`);
  }

  // Clean up build artifacts
  logInfo('\nCleaning build artifacts...');
  
  const buildArtifacts = [
    'apps/api/dist',
    'apps/web/.next',
    'apps/web/out',
    'apps/api/coverage',
    'apps/web/coverage',
    '.turbo',
  ];

  for (const artifact of buildArtifacts) {
    const fullPath = path.join(process.cwd(), artifact);
    
    if (fs.existsSync(fullPath)) {
      try {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
        logSuccess(`Cleaned: ${artifact}`);
      } catch (error) {
        logWarning(`Failed to clean ${artifact}: ${error.message}`);
      }
    }
  }

  // Clean up cache files
  logInfo('\nCleaning cache files...');
  
  const cacheFiles = [
    'apps/api/.eslintcache',
    'apps/web/.eslintcache',
    'apps/api/tsconfig.tsbuildinfo',
    'apps/web/tsconfig.tsbuildinfo',
    '.jest-cache',
  ];

  for (const cache of cacheFiles) {
    const fullPath = path.join(process.cwd(), cache);
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        logSuccess(`Cleaned cache: ${cache}`);
      } catch (error) {
        logWarning(`Failed to clean cache ${cache}: ${error.message}`);
      }
    }
  }

  // Update imports in remaining files
  logInfo('\nUpdating imports in remaining files...');
  
  try {
    // This would require a more sophisticated approach in a real scenario
    // For now, we'll just log that manual review is needed
    logWarning('Manual review needed: Update imports to use simplified services');
    logInfo('  - Replace ai-gateway.service imports with ai-service');
    logInfo('  - Remove references to deleted provider files');
    logInfo('  - Update test imports to match new structure');
    
  } catch (error) {
    logWarning(`Import update failed: ${error.message}`);
  }

  // Summary
  log('\n📊 Cleanup Summary:', colors.cyan);
  logSuccess(`Files removed: ${filesRemoved}`);
  logSuccess(`Directories removed: ${directoriesRemoved}`);
  logInfo('Dependencies cleaned and reinstalled');
  logInfo('Build artifacts cleaned');
  logInfo('Cache files cleaned');
  
  log('\n✨ Cleanup completed successfully!', colors.green);
  log('Next steps:', colors.blue);
  log('  1. Run: npm run typecheck (to verify no broken imports)', colors.blue);
  log('  2. Run: npm test (to ensure tests still pass)', colors.blue);
  log('  3. Run: npm run build (to verify build works)', colors.blue);
  log('  4. Review and update any remaining import statements', colors.blue);
}

// Run cleanup
cleanup().catch(error => {
  log(`\n❌ Cleanup failed: ${error.message}`, colors.red);
  process.exit(1);
});