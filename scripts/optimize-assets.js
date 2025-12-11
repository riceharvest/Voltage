#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Static Asset Optimization Script
 * Optimizes images, fonts, and other static assets for production
 */

const ASSETS_DIR = path.join(__dirname, '../public');
const OPTIMIZED_DIR = path.join(ASSETS_DIR, 'optimized');

class AssetOptimizer {
  constructor() {
    this.stats = {
      imagesOptimized: 0,
      fontsProcessed: 0,
      totalSavings: 0,
      errors: []
    };
  }

  async optimize() {
    console.log('🚀 Starting static asset optimization...');

    try {
      // Create optimized directory
      this.createOptimizedDirectory();

      // Optimize images
      await this.optimizeImages();

      // Process fonts
      await this.processFonts();

      // Generate asset manifest
      await this.generateAssetManifest();

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Asset optimization failed:', error);
      process.exit(1);
    }
  }

  createOptimizedDirectory() {
    if (!fs.existsSync(OPTIMIZED_DIR)) {
      fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
    }
    console.log('✅ Created optimized assets directory');
  }

  async optimizeImages() {
    console.log('🖼️  Optimizing images...');

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const images = this.findFiles(ASSETS_DIR, imageExtensions);

    for (const imagePath of images) {
      try {
        const optimizedPath = this.getOptimizedPath(imagePath);
        const stats = fs.statSync(imagePath);
        
        // Copy and optimize image
        await this.optimizeImage(imagePath, optimizedPath);
        
        const optimizedStats = fs.statSync(optimizedPath);
        const savings = stats.size - optimizedStats.size;
        
        this.stats.imagesOptimized++;
        this.stats.totalSavings += Math.max(0, savings);
        
        console.log(`   📸 Optimized: ${path.basename(imagePath)} (${this.formatBytes(savings)} saved)`);
      } catch (error) {
        this.stats.errors.push(`Image optimization failed: ${imagePath} - ${error.message}`);
        console.warn(`   ⚠️  Failed to optimize: ${path.basename(imagePath)}`);
      }
    }
  }

  async optimizeImage(sourcePath, targetPath) {
    // For SVG files, just copy them
    if (sourcePath.toLowerCase().endsWith('.svg')) {
      fs.copyFileSync(sourcePath, targetPath);
      return;
    }

    // For other formats, use imagemin if available, otherwise just copy
    try {
      // Try to use imagemin if installed
      const imagemin = require('imagemin');
      const imageminWebp = require('imagemin-webp');
      const imageminMozjpeg = require('imagemin-mozjpeg');
      const imageminPngquant = require('imagemin-pngquant');

      const plugins = [
        imageminWebp({ quality: 85 }),
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.65, 0.8] })
      ];

      await imagemin([sourcePath], {
        destination: path.dirname(targetPath),
        plugins: plugins
      });

      // Rename to original extension
      const newPath = targetPath.replace('.webp', path.extname(sourcePath));
      if (newPath !== targetPath && fs.existsSync(newPath)) {
        fs.unlinkSync(targetPath);
        fs.renameSync(newPath, targetPath);
      }

    } catch (error) {
      // If imagemin is not available, just copy the file
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  async processFonts() {
    console.log('🔤 Processing fonts...');

    const fontExtensions = ['.woff', '.woff2', '.ttf', '.eot'];
    const fonts = this.findFiles(ASSETS_DIR, fontExtensions);

    for (const fontPath of fonts) {
      try {
        const optimizedPath = this.getOptimizedPath(fontPath);
        
        // Copy font files (basic optimization)
        if (fontPath.toLowerCase().endsWith('.woff2')) {
          // WOFF2 is already optimized, just copy
          fs.copyFileSync(fontPath, optimizedPath);
        } else {
          // For other formats, convert to WOFF2 if possible
          fs.copyFileSync(fontPath, optimizedPath);
        }

        this.stats.fontsProcessed++;
        console.log(`   🔤 Processed: ${path.basename(fontPath)}`);

      } catch (error) {
        this.stats.errors.push(`Font processing failed: ${fontPath} - ${error.message}`);
        console.warn(`   ⚠️  Failed to process: ${path.basename(fontPath)}`);
      }
    }
  }

  async generateAssetManifest() {
    console.log('📋 Generating asset manifest...');

    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      assets: {
        images: this.getAssetList(ASSETS_DIR, ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']),
        fonts: this.getAssetList(ASSETS_DIR, ['.woff', '.woff2', '.ttf', '.eot']),
        icons: this.getAssetList(ASSETS_DIR, ['.svg'])
      },
      optimization: {
        totalImages: this.stats.imagesOptimized,
        totalFonts: this.stats.fontsProcessed,
        totalSavings: this.stats.totalSavings,
        averageCompression: this.calculateAverageCompression()
      }
    };

    const manifestPath = path.join(OPTIMIZED_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Asset manifest generated');
  }

  getAssetList(directory, extensions) {
    const assets = [];
    const files = this.findFiles(directory, extensions);
    
    files.forEach(file => {
      const stats = fs.statSync(file);
      assets.push({
        name: path.basename(file),
        path: path.relative(ASSETS_DIR, file),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        hash: this.generateSimpleHash(file)
      });
    });
    
    return assets;
  }

  findFiles(directory, extensions) {
    const files = [];
    
    const searchDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'optimized') {
          searchDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    searchDir(directory);
    return files;
  }

  getOptimizedPath(originalPath) {
    const relativePath = path.relative(ASSETS_DIR, originalPath);
    return path.join(OPTIMIZED_DIR, relativePath);
  }

  generateSimpleHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  calculateAverageCompression() {
    if (this.stats.imagesOptimized === 0) return 0;
    return (this.stats.totalSavings / this.stats.imagesOptimized).toFixed(2);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printSummary() {
    console.log('\n📊 Asset Optimization Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🖼️  Images optimized: ${this.stats.imagesOptimized}`);
    console.log(`🔤 Fonts processed: ${this.stats.fontsProcessed}`);
    console.log(`💾 Total savings: ${this.formatBytes(this.stats.totalSavings)}`);
    console.log(`📈 Average compression: ${this.calculateAverageCompression()} bytes per image`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    console.log(`\n✅ Optimization complete! Optimized assets saved to: ${OPTIMIZED_DIR}`);
  }
}

// Run optimization
if (require.main === module) {
  const optimizer = new AssetOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = AssetOptimizer;