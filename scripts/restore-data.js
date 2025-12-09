#!/usr/bin/env node

/**
 * Data Recovery Script
 * Restores JSON data files from a backup
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups directory found');
    return [];
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(dir => dir.startsWith('data-backup-'))
    .sort()
    .reverse(); // Most recent first

  return backups;
}

function restoreFromBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!fs.existsSync(backupPath)) {
    console.error(`Backup '${backupName}' not found`);
    return false;
  }

  console.log(`Restoring from backup: ${backupName}`);

  // List of files to restore
  const dataFiles = [
    'ingredients.json',
    'netherlands.json',
    'classic.json',
    'plain.json',
    'zero.json',
    'limits.json'
  ];

  let successCount = 0;
  let errorCount = 0;

  // Restore main data files
  dataFiles.forEach(file => {
    const srcPath = path.join(backupPath, file);
    let destPath;

    if (file === 'ingredients.json') {
      destPath = path.join(DATA_DIR, 'ingredients', file);
    } else if (file === 'netherlands.json') {
      destPath = path.join(DATA_DIR, 'suppliers', file);
    } else if (['classic.json', 'plain.json', 'zero.json'].includes(file)) {
      destPath = path.join(DATA_DIR, 'bases', file);
    } else if (file === 'limits.json') {
      destPath = path.join(DATA_DIR, 'safety', file);
    }

    try {
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Restored: ${file}`);
        successCount++;
      } else {
        console.log(`⚠ Skipped (not in backup): ${file}`);
      }
    } catch (error) {
      console.error(`✗ Failed to restore ${file}:`, error.message);
      errorCount++;
    }
  });

  // Restore flavor files
  const flavorsBackupDir = path.join(backupPath, 'flavors');
  const flavorsDataDir = path.join(DATA_DIR, 'flavors');

  if (fs.existsSync(flavorsBackupDir)) {
    const flavorFiles = fs.readdirSync(flavorsBackupDir).filter(f => f.endsWith('.json'));
    flavorFiles.forEach(file => {
      const srcPath = path.join(flavorsBackupDir, file);
      const destPath = path.join(flavorsDataDir, file);
      try {
        fs.copyFileSync(srcPath, destPath);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to restore flavor ${file}:`, error.message);
        errorCount++;
      }
    });
  }

  console.log(`\nRestore completed: ${successCount} files restored, ${errorCount} errors`);
  return errorCount === 0;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Available backups:');
    const backups = listBackups();
    if (backups.length === 0) {
      console.log('No backups found');
      return;
    }

    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup}`);
    });

    console.log('\nUsage: node restore-data.js <backup-name>');
    console.log('Example: node restore-data.js data-backup-2024-01-01T12-00-00-000Z');
    return;
  }

  const backupName = args[0];
  const success = restoreFromBackup(backupName);

  if (success) {
    console.log('✅ Data restoration completed successfully');
  } else {
    console.log('❌ Data restoration completed with errors');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { listBackups, restoreFromBackup };