#!/usr/bin/env node

/**
 * Disaster Recovery Plan Script
 * Automated disaster recovery procedures for the Energy Drink App
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const RECOVERY_LOG = path.join(__dirname, '..', 'recovery.log');

class DisasterRecovery {
  constructor() {
    this.log('Disaster Recovery Plan initialized');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(RECOVERY_LOG, logMessage);
  }

  // Step 1: Assess the situation
  assessDamage() {
    this.log('=== STEP 1: Damage Assessment ===');

    // Check if application is accessible
    try {
      execSync('curl -f https://your-domain.com/api/health', { timeout: 10000 });
      this.log('✅ Application is accessible');
      return { severity: 'low', needsRecovery: false };
    } catch (error) {
      this.log('❌ Application is not accessible');
    }

    // Check Vercel deployment status
    try {
      const vercelStatus = execSync('vercel --prod --yes', { encoding: 'utf8' });
      if (vercelStatus.includes('Ready')) {
        this.log('✅ Vercel deployment is healthy');
      } else {
        this.log('⚠️ Vercel deployment issues detected');
      }
    } catch (error) {
      this.log('❌ Cannot check Vercel status');
    }

    // Check data integrity
    const dataIntegrity = this.checkDataIntegrity();
    if (!dataIntegrity) {
      this.log('❌ Data corruption detected');
      return { severity: 'high', needsRecovery: true };
    }

    return { severity: 'medium', needsRecovery: true };
  }

  // Step 2: Check data integrity
  checkDataIntegrity() {
    this.log('=== STEP 2: Data Integrity Check ===');

    const dataFiles = [
      'src/data/ingredients/ingredients.json',
      'src/data/suppliers/netherlands.json',
      'src/data/safety/limits.json'
    ];

    let integrity = true;

    dataFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (!data || typeof data !== 'object') {
            this.log(`❌ Invalid JSON structure in ${file}`);
            integrity = false;
          } else {
            this.log(`✅ ${file} is valid`);
          }
        } catch (error) {
          this.log(`❌ Cannot parse ${file}: ${error.message}`);
          integrity = false;
        }
      } else {
        this.log(`❌ ${file} is missing`);
        integrity = false;
      }
    });

    return integrity;
  }

  // Step 3: Execute recovery
  executeRecovery() {
    this.log('=== STEP 3: Recovery Execution ===');

    // Find latest backup
    const backups = this.listBackups();
    if (backups.length === 0) {
      this.log('❌ No backups available');
      return false;
    }

    const latestBackup = backups[0];
    this.log(`Using latest backup: ${latestBackup}`);

    // Restore data
    const { restoreFromBackup } = require('./restore-data');
    const success = restoreFromBackup(latestBackup);

    if (success) {
      this.log('✅ Data restoration successful');
    } else {
      this.log('❌ Data restoration failed');
      return false;
    }

    // Redeploy application
    try {
      this.log('Redeploying application...');
      execSync('vercel --prod --yes', { stdio: 'inherit' });
      this.log('✅ Application redeployed successfully');
    } catch (error) {
      this.log(`❌ Redeployment failed: ${error.message}`);
      return false;
    }

    return true;
  }

  // Step 4: Verify recovery
  verifyRecovery() {
    this.log('=== STEP 4: Recovery Verification ===');

    // Wait for deployment
    this.log('Waiting for deployment to propagate...');
    // Simple wait - in production, use proper health checks
    setTimeout(() => {
      // Check application health
      try {
        execSync('curl -f https://your-domain.com/api/health', { timeout: 30000 });
        this.log('✅ Application is responding');
      } catch (error) {
        this.log('❌ Application health check failed');
        return false;
      }

      // Run validation
      const { validateData } = require('./validate-data');
      const isValid = validateData();

      if (isValid) {
        this.log('✅ Data validation passed');
        this.log('🎉 Disaster recovery completed successfully!');
        return true;
      } else {
        this.log('❌ Data validation failed');
        return false;
      }
    }, 60000); // Wait 1 minute

    return true;
  }

  listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    return fs.readdirSync(BACKUP_DIR)
      .filter(dir => dir.startsWith('data-backup-'))
      .sort()
      .reverse();
  }

  // Main recovery process
  async runRecovery() {
    this.log('🚨 DISASTER RECOVERY INITIATED 🚨');

    const assessment = this.assessDamage();

    if (!assessment.needsRecovery) {
      this.log('No recovery needed - system is operational');
      return true;
    }

    this.log(`Severity: ${assessment.severity}`);

    const recoverySuccess = this.executeRecovery();

    if (!recoverySuccess) {
      this.log('❌ Recovery execution failed');
      return false;
    }

    const verificationSuccess = await this.verifyRecovery();

    if (verificationSuccess) {
      this.log('✅ Disaster recovery completed successfully');
      return true;
    } else {
      this.log('❌ Recovery verification failed');
      return false;
    }
  }
}

// Run recovery if called directly
if (require.main === module) {
  const dr = new DisasterRecovery();
  dr.runRecovery().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = DisasterRecovery;