#!/usr/bin/env node

/**
 * Cache Invalidation Script
 * Invalidates specific caches or all caches
 */

const { execSync } = require('child_process');
const path = require('path');

// Import the cache module (this assumes the project is built)
function invalidateCache(type = 'all') {
  console.log(`Invalidating ${type} cache...`);

  try {
    // For now, we'll use a simple approach by calling a Node.js script
    // In production, this would connect directly to Redis
    const script = `
      const { cache } = require('${path.join(__dirname, '..', 'dist', 'lib', 'cache.js')}');
      (async () => {
        if ('${type}' === 'data' || '${type}' === 'all') {
          await cache.invalidateDataCache();
        }
        if ('${type}' === 'api' || '${type}' === 'all') {
          await cache.invalidateApiCache();
        }
        if ('${type}' === 'all') {
          await cache.invalidateAll();
        }
        console.log('${type} cache invalidated successfully');
        process.exit(0);
      })();
    `;

    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to invalidate ${type} cache:`, error.message);
    process.exit(1);
  }
}

// CLI interface
const args = process.argv.slice(2);
const type = args[0] || 'all';

if (!['data', 'api', 'all'].includes(type)) {
  console.error('Usage: node invalidate-cache.js [data|api|all]');
  process.exit(1);
}

invalidateCache(type);