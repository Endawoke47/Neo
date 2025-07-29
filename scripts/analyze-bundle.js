#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size and performance impact...\n');

// Function to run command and capture output
function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return '';
  }
}

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to analyze Next.js build output
function analyzeBuild() {
  console.log('📦 Building application for analysis...');
  
  // Build the app
  const buildOutput = runCommand('cd apps/web && npm run build');
  
  if (!buildOutput) {
    console.error('❌ Build failed');
    return;
  }

  console.log('✅ Build completed successfully\n');
  
  // Parse build output for bundle sizes
  const lines = buildOutput.split('\n');
  const bundleInfo = [];
  let inBundleSection = false;
  
  lines.forEach(line => {
    if (line.includes('Page') && line.includes('Size')) {
      inBundleSection = true;
      return;
    }
    
    if (inBundleSection && line.trim() && !line.includes('──')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        bundleInfo.push({
          route: parts[0],
          size: parts[1],
          firstLoad: parts[2]
        });
      }
    }
    
    if (line.includes('○ Static') || line.includes('● Server-side')) {
      inBundleSection = false;
    }
  });

  // Display bundle analysis
  console.log('📊 Bundle Size Analysis:');
  console.log('─'.repeat(60));
  console.log('Route                    Size        First Load JS');
  console.log('─'.repeat(60));
  
  bundleInfo.forEach(info => {
    console.log(`${info.route.padEnd(24)} ${info.size.padStart(8)} ${info.firstLoad.padStart(12)}`);
  });
  
  console.log('─'.repeat(60));
  
  return bundleInfo;
}

// Function to analyze dependencies
function analyzeDependencies() {
  console.log('\n📋 Analyzing dependencies...');
  
  const packageJsonPath = path.join('apps/web/package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Get bundle size for each dependency (simplified analysis)
  const largeDependencies = [];
  
  Object.keys(deps).forEach(dep => {
    const nodeModulesPath = path.join('apps/web/node_modules', dep);
    if (fs.existsSync(nodeModulesPath)) {
      try {
        const stats = fs.statSync(nodeModulesPath);
        if (stats.isDirectory()) {
          // Get approximate size (this is a rough estimate)
          const size = getDirectorySize(nodeModulesPath);
          if (size > 1024 * 1024) { // Only show deps > 1MB
            largeDependencies.push({ name: dep, size, version: deps[dep] });
          }
        }
      } catch (error) {
        // Ignore errors for symlinks, etc.
      }
    }
  });
  
  // Sort by size
  largeDependencies.sort((a, b) => b.size - a.size);
  
  console.log('\n🏋️  Large Dependencies (>1MB):');
  console.log('─'.repeat(60));
  console.log('Package                  Version         Size');
  console.log('─'.repeat(60));
  
  largeDependencies.slice(0, 15).forEach(dep => {
    console.log(`${dep.name.padEnd(24)} ${dep.version.padEnd(14)} ${formatBytes(dep.size)}`);
  });
  
  return largeDependencies;
}

// Function to get directory size (recursive)
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      try {
        const stats = fs.lstatSync(itemPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += getDirectorySize(itemPath);
        }
      } catch (error) {
        // Ignore errors for broken symlinks, etc.
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible directories
  }
  
  return totalSize;
}

// Function to provide optimization recommendations
function provideRecommendations(bundleInfo, largeDependencies) {
  console.log('\n💡 Optimization Recommendations:');
  console.log('─'.repeat(60));
  
  // Bundle size recommendations
  const largeBundles = bundleInfo.filter(info => {
    const sizeStr = info.firstLoad.replace(/[^\d.]/g, '');
    const size = parseFloat(sizeStr);
    return size > 250; // > 250KB
  });
  
  if (largeBundles.length > 0) {
    console.log('\n🎯 Bundle Size Optimizations:');
    largeBundles.forEach(bundle => {
      console.log(`  • ${bundle.route}: Consider code splitting or lazy loading`);
    });
  }
  
  // Dependency recommendations
  console.log('\n🔧 Dependency Optimizations:');
  
  const dependencyRecommendations = {
    '@tensorflow/tfjs': 'Replace with lighter alternative like ONNX.js or server-side processing',
    'aws-sdk': 'Upgrade to AWS SDK v3 with modular imports (60-80% size reduction)',
    'chart.js': 'Consider using recharts (already in deps) or native Canvas API',
    'moment': 'Replace with date-fns or dayjs for better tree shaking',
    'lodash': 'Use lodash-es or individual lodash functions',
    'rxjs': 'Ensure proper tree shaking with specific imports',
    'core-js': 'Update browserslist to reduce polyfill size'
  };
  
  largeDependencies.forEach(dep => {
    const recommendation = dependencyRecommendations[dep.name];
    if (recommendation) {
      console.log(`  • ${dep.name} (${formatBytes(dep.size)}): ${recommendation}`);
    } else if (dep.size > 5 * 1024 * 1024) { // > 5MB
      console.log(`  • ${dep.name} (${formatBytes(dep.size)}): Consider if this large dependency is necessary`);
    }
  });
  
  console.log('\n🚀 General Recommendations:');
  console.log('  • Enable gzip/brotli compression on your server');
  console.log('  • Implement proper caching headers');
  console.log('  • Use dynamic imports for route-based code splitting');
  console.log('  • Optimize images with next/image and WebP format');
  console.log('  • Remove unused CSS with PurgeCSS');
  console.log('  • Use React.memo for expensive components');
  console.log('  • Implement service worker for caching');
}

// Main execution
async function main() {
  try {
    const bundleInfo = analyzeBuild();
    const largeDependencies = analyzeDependencies();
    
    if (bundleInfo.length > 0 || largeDependencies.length > 0) {
      provideRecommendations(bundleInfo, largeDependencies);
    }
    
    console.log('\n✨ Analysis complete!');
    console.log('💡 Run "npm run analyze" to open the bundle analyzer in your browser');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeBuild, analyzeDependencies, provideRecommendations };