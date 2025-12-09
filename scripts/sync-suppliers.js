async function syncSuppliers() {
  console.log('Starting supplier data synchronization...\n');

  try {
    await validateSupplierUrls();
    console.log();
    updateSupplierProducts();
    console.log();
    cleanupOrphanedProducts();

    // Invalidate data cache after updates
    console.log();
    console.log('Invalidating data cache...');
    try {
      const { execSync } = require('child_process');
      execSync('node scripts/invalidate-cache.js data', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Cache invalidation failed, but sync completed:', error.message);
    }

    console.log('\n✅ Supplier synchronization completed successfully');
  } catch (error) {
    console.error('❌ Supplier synchronization failed:', error.message);
    process.exit(1);
  }
}