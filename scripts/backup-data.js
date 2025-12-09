#!/usr/bin/env node

/**
 * Data Backup Script
 * Creates timestamped backups of all JSON data files
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function createBackup() {
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `data-backup-${timestamp}`);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  // Copy all JSON files
  const dataFiles = [
    'ingredients/ingredients.json',
    'suppliers/netherlands.json',
    'bases/classic.json',
    'bases/plain.json',
    'bases/zero.json',
    'safety/limits.json'
  ];

  let successCount = 0;
  let errorCount = 0;

  dataFiles.forEach(file => {
    const srcPath = path.join(DATA_DIR, file);
    const destPath = path.join(backupPath, path.basename(file));

    try {
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Backed up: ${file}`);
        successCount++;
      } else {
        console.log(`⚠ Skipped (not found): ${file}`);
      }
    } catch (error) {
      console.error(`✗ Failed to backup ${file}:`, error.message);
      errorCount++;
    }
  });

  // Also backup all flavor files
  const flavorsDir = path.join(DATA_DIR, 'flavors');
  if (fs.existsSync(flavorsDir)) {
    const flavorsBackupDir = path.join(backupPath, 'flavors');
    fs.mkdirSync(flavorsBackupDir, { recursive: true });

    const flavorFiles = fs.readdirSync(flavorsDir).filter(f => f.endsWith('.json'));
    flavorFiles.forEach(file => {
      const srcPath = path.join(flavorsDir, file);
      const destPath = path.join(flavorsBackupDir, file);
      try {
        fs.copyFileSync(srcPath, destPath);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to backup flavor ${file}:`, error.message);
        errorCount++;
      }
    });
  }

  console.log(`\nBackup completed: ${successCount} files backed up, ${errorCount} errors`);
  console.log(`Backup location: ${backupPath}`);

  return { successCount, errorCount, backupPath };
}

// Run backup if called directly
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };