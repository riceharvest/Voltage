#!/usr/bin/env node

/**
 * Rollback Script for Energy Drink App
 *
 * This script provides automated rollback capabilities for deployments.
 * It can rollback to previous deployments or specific deployment versions.
 */

const { execSync } = require('child_process');
const fs = require('fs');

class RollbackManager {
  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.orgId = process.env.VERCEL_ORG_ID;
    this.projectId = process.env.VERCEL_PROJECT_ID;
    this.productionDomain = process.env.PRODUCTION_DOMAIN || 'energy-drink-app.com';

    if (!this.vercelToken || !this.orgId || !this.projectId) {
      throw new Error('Missing required Vercel environment variables: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID');
    }
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  execCommand(command) {
    this.log(`Executing: ${command}`);
    return execSync(command, { stdio: 'inherit', encoding: 'utf8' });
  }

  // Get current production deployment URL
  async getCurrentProductionUrl() {
    try {
      const result = execSync(
        `npx vercel alias ls --token ${this.vercelToken}`,
        { encoding: 'utf8' }
      );

      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes(this.productionDomain)) {
          const parts = line.trim().split(/\s+/);
          return parts[0]; // The deployment URL
        }
      }
    } catch (error) {
      this.log(`Failed to get current production URL: ${error.message}`);
    }
    return null;
  }

  // Get deployment history
  async getDeploymentHistory() {
    try {
      const result = execSync(
        `npx vercel ls --token ${this.vercelToken} --yes`,
        { encoding: 'utf8' }
      );

      return result
        .split('\n')
        .filter(line => line.includes('READY'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            url: parts[0],
            status: parts[1],
            timestamp: parts[2] || '',
            isProduction: parts[0].includes(this.productionDomain)
          };
        })
        .sort((a, b) => {
          // Sort by timestamp if available, otherwise by URL (which includes timestamp)
          const aTime = a.timestamp || a.url;
          const bTime = b.timestamp || b.url;
          return bTime.localeCompare(aTime);
        });
    } catch (error) {
      this.log(`Failed to get deployment history: ${error.message}`);
      return [];
    }
  }

  // Switch to specific deployment
  async switchToDeployment(deploymentUrl) {
    this.log(`Switching production traffic to ${deploymentUrl}...`);

    // Remove current production alias
    try {
      this.execCommand(
        `npx vercel alias rm ${this.productionDomain} --token ${this.vercelToken} --yes`
      );
    } catch (error) {
      this.log('No existing production alias to remove');
    }

    // Assign production domain to target deployment
    this.execCommand(
      `npx vercel alias set ${deploymentUrl} ${this.productionDomain} --token ${this.vercelToken}`
    );

    this.log(`Production traffic switched to ${deploymentUrl}`);
  }

  // Run health checks on deployment
  async healthCheck(deploymentUrl) {
    this.log(`Running health checks on ${deploymentUrl}...`);

    // Wait for deployment to be ready
    await this.waitForDeployment(deploymentUrl);

    // Run smoke tests
    try {
      this.execCommand('npm run test:e2e:smoke');
      this.log('Smoke tests passed');
    } catch (error) {
      throw new Error(`Smoke tests failed for ${deploymentUrl}: ${error.message}`);
    }

    // Run performance tests
    try {
      this.execCommand('npm run lighthouse:smoke');
      this.log('Performance tests passed');
    } catch (error) {
      throw new Error(`Performance tests failed for ${deploymentUrl}: ${error.message}`);
    }
  }

  // Wait for deployment to be ready
  async waitForDeployment(deploymentUrl) {
    this.log(`Waiting for deployment ${deploymentUrl} to be ready...`);

    const maxRetries = 30;
    const retryDelay = 10000; // 10 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = execSync(
          `npx vercel ls --token ${this.vercelToken} --yes`,
          { encoding: 'utf8' }
        );

        if (result.includes(deploymentUrl) && result.includes('READY')) {
          this.log(`Deployment ${deploymentUrl} is ready`);
          return;
        }
      } catch (error) {
        // Continue waiting
      }

      this.log(`Waiting... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error(`Deployment ${deploymentUrl} did not become ready within ${maxRetries * retryDelay / 1000} seconds`);
  }

  // Record rollback for audit trail
  async recordRollback(fromDeployment, toDeployment, reason = 'manual_rollback') {
    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      from: fromDeployment,
      to: toDeployment,
      reason,
      type: 'rollback'
    };

    try {
      const logFile = 'rollback-history.json';
      let history = [];

      if (fs.existsSync(logFile)) {
        history = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }

      history.push(rollbackRecord);
      fs.writeFileSync(logFile, JSON.stringify(history, null, 2));

      this.log(`Rollback recorded: ${fromDeployment} -> ${toDeployment} (${reason})`);
    } catch (error) {
      this.log(`Failed to record rollback: ${error.message}`);
    }
  }

  // Rollback to previous deployment
  async rollbackToPrevious(reason = 'manual_rollback') {
    this.log('Initiating rollback to previous deployment...');

    try {
      // Get current production deployment
      const currentProdUrl = await this.getCurrentProductionUrl();
      if (!currentProdUrl) {
        throw new Error('Cannot determine current production deployment');
      }

      // Get deployment history
      const deployments = await this.getDeploymentHistory();
      const previousDeployment = deployments.find(d => !d.isProduction);

      if (!previousDeployment) {
        throw new Error('No previous deployment found for rollback');
      }

      this.log(`Rolling back from ${currentProdUrl} to ${previousDeployment.url}`);

      // Switch traffic to previous deployment
      await this.switchToDeployment(previousDeployment.url);

      // Run health checks
      await this.healthCheck(previousDeployment.url);

      // Record rollback
      await this.recordRollback(currentProdUrl, previousDeployment.url, reason);

      // Optionally clean up the failed deployment
      if (process.env.CLEANUP_FAILED_DEPLOYMENT === 'true') {
        try {
          this.execCommand(`npx vercel rm ${currentProdUrl} --token ${this.vercelToken} --yes`);
          this.log(`Cleaned up failed deployment: ${currentProdUrl}`);
        } catch (cleanupError) {
          this.log(`Failed to cleanup failed deployment: ${cleanupError.message}`);
        }
      }

      this.log('Rollback to previous deployment completed successfully');
      return true;

    } catch (error) {
      this.log(`Rollback failed: ${error.message}`);
      throw error;
    }
  }

  // Rollback to specific deployment
  async rollbackToSpecific(targetDeployment, reason = 'manual_rollback') {
    this.log(`Initiating rollback to specific deployment: ${targetDeployment}`);

    try {
      // Get current production deployment
      const currentProdUrl = await this.getCurrentProductionUrl();
      if (!currentProdUrl) {
        throw new Error('Cannot determine current production deployment');
      }

      if (currentProdUrl === targetDeployment) {
        throw new Error('Target deployment is already in production');
      }

      // Verify target deployment exists
      const deployments = await this.getDeploymentHistory();
      const targetExists = deployments.some(d => d.url === targetDeployment);

      if (!targetExists) {
        throw new Error(`Target deployment ${targetDeployment} not found`);
      }

      // Switch traffic to target deployment
      await this.switchToDeployment(targetDeployment);

      // Run health checks
      await this.healthCheck(targetDeployment);

      // Record rollback
      await this.recordRollback(currentProdUrl, targetDeployment, reason);

      this.log(`Rollback to ${targetDeployment} completed successfully`);
      return true;

    } catch (error) {
      this.log(`Rollback failed: ${error.message}`);
      throw error;
    }
  }

  // Show deployment history
  async showHistory() {
    const deployments = await this.getDeploymentHistory();
    const currentProd = await this.getCurrentProductionUrl();

    console.log('\n=== DEPLOYMENT HISTORY ===');
    deployments.forEach((deployment, index) => {
      const marker = deployment.url === currentProd ? ' <-- PRODUCTION' : '';
      console.log(`${index + 1}. ${deployment.url} (${deployment.status}) ${marker}`);
    });
    console.log('========================\n');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const rollbackManager = new RollbackManager();

  try {
    switch (command) {
      case 'previous':
        await rollbackManager.rollbackToPrevious(args[1] || 'manual_rollback');
        break;

      case 'specific':
        const targetDeployment = args[1];
        if (!targetDeployment) {
          console.error('Please provide a target deployment URL');
          process.exit(1);
        }
        await rollbackManager.rollbackToSpecific(targetDeployment, args[2] || 'manual_rollback');
        break;

      case 'history':
        await rollbackManager.showHistory();
        break;

      default:
        console.log('Usage:');
        console.log('  node rollback.js previous [reason]     - Rollback to previous deployment');
        console.log('  node rollback.js specific <url> [reason] - Rollback to specific deployment');
        console.log('  node rollback.js history               - Show deployment history');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RollbackManager;