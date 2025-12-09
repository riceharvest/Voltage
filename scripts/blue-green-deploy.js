#!/usr/bin/env node

/**
 * Blue-Green Deployment Script for Vercel
 *
 * This script implements a blue-green deployment strategy using Vercel deployment aliases.
 * It deploys to a green environment, runs tests, and then switches traffic to the new deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');

class BlueGreenDeployer {
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

  // Deploy to a new green environment
  async deployGreen() {
    this.log('Starting green deployment...');

    // Generate unique deployment name
    const timestamp = Date.now();
    const greenAlias = `green-${timestamp}`;

    // Deploy with alias
    this.execCommand(
      `npx vercel --token ${this.vercelToken} --prod=false --alias ${greenAlias}`
    );

    this.log(`Green deployment created with alias: ${greenAlias}`);
    return greenAlias;
  }

  // Run health checks on green environment
  async healthCheck(alias) {
    this.log(`Running health checks on ${alias}...`);

    // Wait for deployment to be ready
    await this.waitForDeployment(alias);

    // Run smoke tests
    try {
      this.execCommand('npm run test:e2e:smoke');
      this.log('Smoke tests passed');
    } catch (error) {
      throw new Error(`Smoke tests failed for ${alias}: ${error.message}`);
    }

    // Run performance tests
    try {
      this.execCommand('npm run lighthouse:smoke');
      this.log('Performance tests passed');
    } catch (error) {
      throw new Error(`Performance tests failed for ${alias}: ${error.message}`);
    }
  }

  // Wait for deployment to be ready
  async waitForDeployment(alias) {
    this.log(`Waiting for deployment ${alias} to be ready...`);

    const maxRetries = 30;
    const retryDelay = 10000; // 10 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = execSync(
          `npx vercel ls --token ${this.vercelToken} --yes`,
          { encoding: 'utf8' }
        );

        if (result.includes(alias) && result.includes('READY')) {
          this.log(`Deployment ${alias} is ready`);
          return;
        }
      } catch (error) {
        // Continue waiting
      }

      this.log(`Waiting... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error(`Deployment ${alias} did not become ready within ${maxRetries * retryDelay / 1000} seconds`);
  }

  // Switch production traffic to green environment
  async switchToGreen(greenAlias) {
    this.log(`Switching production traffic to ${greenAlias}...`);

    // Remove current production alias from old deployment
    try {
      this.execCommand(
        `npx vercel alias rm ${this.productionDomain} --token ${this.vercelToken} --yes`
      );
    } catch (error) {
      this.log('No existing production alias to remove');
    }

    // Assign production domain to green deployment
    this.execCommand(
      `npx vercel alias set ${greenAlias} ${this.productionDomain} --token ${this.vercelToken}`
    );

    this.log(`Production traffic switched to ${greenAlias}`);
  }

  // Cleanup old deployments
  async cleanup(keepDeployments = 5) {
    this.log('Cleaning up old deployments...');

    try {
      const result = execSync(
        `npx vercel ls --token ${this.vercelToken} --yes`,
        { encoding: 'utf8' }
      );

      const deployments = result
        .split('\n')
        .filter(line => line.includes('READY'))
        .slice(keepDeployments); // Keep only the most recent ones

      for (const deployment of deployments) {
        const url = deployment.split(' ')[0];
        if (url && !url.includes(this.productionDomain)) {
          try {
            this.execCommand(`npx vercel rm ${url} --token ${this.vercelToken} --yes`);
            this.log(`Removed old deployment: ${url}`);
          } catch (error) {
            this.log(`Failed to remove ${url}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`);
    }
  }

  // Rollback to previous deployment
  async rollback() {
    this.log('Initiating rollback...');

    // This would need to be implemented based on deployment history
    // For now, we'll assume manual intervention is needed
    throw new Error('Automatic rollback not implemented. Please manually switch back to previous deployment.');
  }

  // Main deployment process
  async deploy() {
    try {
      this.log('Starting blue-green deployment process...');

      // Step 1: Deploy to green environment
      const greenAlias = await this.deployGreen();

      // Step 2: Run health checks
      await this.healthCheck(greenAlias);

      // Step 3: Switch traffic to green
      await this.switchToGreen(greenAlias);

      // Step 4: Cleanup old deployments
      await this.cleanup();

      this.log('Blue-green deployment completed successfully!');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`);

      // Attempt rollback on failure
      try {
        await this.rollback();
      } catch (rollbackError) {
        this.log(`Rollback also failed: ${rollbackError.message}`);
      }

      throw error;
    }
  }
}

// CLI interface
async function main() {
  const deployer = new BlueGreenDeployer();

  try {
    await deployer.deploy();
    process.exit(0);
  } catch (error) {
    console.error('Blue-green deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BlueGreenDeployer;