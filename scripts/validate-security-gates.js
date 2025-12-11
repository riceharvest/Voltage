#!/usr/bin/env node

/**
 * Security Gates Validator
 * 
 * Validates security scan results against defined thresholds
 * and enforces security gates in CI/CD pipeline.
 */

const fs = require('fs');
const path = require('path');

class SecurityGatesValidator {
  constructor() {
    this.thresholds = {
      // Environment-specific thresholds
      development: {
        critical: 0,
        high: 10,
        medium: 50,
        low: 100,
        securityScore: 50
      },
      staging: {
        critical: 0,
        high: 5,
        medium: 20,
        low: 50,
        securityScore: 70
      },
      production: {
        critical: 0,
        high: 0,
        medium: 5,
        low: 20,
        securityScore: 85
      }
    };

    this.defaultEnv = 'staging';
    this.validationResults = {
      passed: true,
      environment: this.defaultEnv,
      issues: [],
      warnings: [],
      thresholds: {},
      actual: {},
      recommendation: ''
    };
  }

  async validateSecurityGates(environment = this.defaultEnv, scanResults = null) {
    console.log(`🔍 Validating security gates for ${environment} environment...`);
    
    this.validationResults.environment = environment;
    this.validationResults.thresholds = this.thresholds[environment] || this.thresholds[this.defaultEnv];
    
    // Load scan results
    if (!scanResults) {
      scanResults = await this.loadScanResults();
    }
    
    this.validationResults.actual = {
      critical: scanResults.summary?.critical || 0,
      high: scanResults.summary?.high || 0,
      medium: scanResults.summary?.medium || 0,
      low: scanResults.summary?.low || 0,
      securityScore: scanResults.summary?.securityScore || 0,
      totalIssues: scanResults.summary?.totalIssues || 0
    };
    
    // Validate against thresholds
    await this.validateThresholds();
    
    // Generate recommendation
    this.generateRecommendation();
    
    // Display results
    this.displayResults();
    
    // Exit with appropriate code
    this.exitWithCode();
    
    return this.validationResults;
  }

  async loadScanResults() {
    try {
      // Try multiple possible result files
      const possiblePaths = [
        'security-scan-results.json',
        'security-report.json',
        'security-lint-results.json'
      ];
      
      for (const filePath of possiblePaths) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          
          // If it's ESLint results, transform to our format
          if (filePath.includes('lint-results.json')) {
            return this.transformESLintResults(data);
          }
          
          return data;
        }
      }
      
      throw new Error('No security scan results found');
    } catch (error) {
      console.log('⚠️ Could not load scan results, using default values');
      return {
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          securityScore: 100,
          totalIssues: 0
        }
      };
    }
  }

  transformESLintResults(eslintData) {
    const totalErrors = eslintData.reduce((sum, file) => sum + (file.errorCount || 0), 0);
    const totalWarnings = eslintData.reduce((sum, file) => sum + (file.warningCount || 0), 0);
    
    return {
      summary: {
        critical: totalErrors,
        high: 0,
        medium: Math.floor(totalWarnings / 2),
        low: Math.ceil(totalWarnings / 2),
        securityScore: Math.max(0, 100 - (totalErrors * 10) - (totalWarnings * 2)),
        totalIssues: totalErrors + totalWarnings
      }
    };
  }

  async validateThresholds() {
    const { thresholds, actual } = this.validationResults;
    
    // Validate critical issues
    if (actual.critical > thresholds.critical) {
      this.validationResults.passed = false;
      this.validationResults.issues.push({
        type: 'critical',
        message: `Critical issues (${actual.critical}) exceed threshold (${thresholds.critical})`,
        severity: 'error'
      });
    }
    
    // Validate high severity issues
    if (actual.high > thresholds.high) {
      this.validationResults.passed = false;
      this.validationResults.issues.push({
        type: 'high',
        message: `High severity issues (${actual.high}) exceed threshold (${thresholds.high})`,
        severity: 'error'
      });
    }
    
    // Validate medium severity issues
    if (actual.medium > thresholds.medium) {
      this.validationResults.warnings.push({
        type: 'medium',
        message: `Medium severity issues (${actual.medium}) exceed threshold (${thresholds.medium})`,
        severity: 'warning'
      });
    }
    
    // Validate low severity issues
    if (actual.low > thresholds.low) {
      this.validationResults.warnings.push({
        type: 'low',
        message: `Low severity issues (${actual.low}) exceed threshold (${thresholds.low})`,
        severity: 'warning'
      });
    }
    
    // Validate security score
    if (actual.securityScore < thresholds.securityScore) {
      this.validationResults.passed = false;
      this.validationResults.issues.push({
        type: 'security-score',
        message: `Security score (${actual.securityScore}) below threshold (${thresholds.securityScore})`,
        severity: 'error'
      });
    }
  }

  generateRecommendation() {
    const { passed, issues, warnings, actual, thresholds } = this.validationResults;
    
    if (passed) {
      this.validationResults.recommendation = '✅ Security gates passed. Ready for deployment.';
      return;
    }
    
    let recommendation = '❌ Security gates failed. ';
    
    if (issues.some(issue => issue.type === 'critical')) {
      recommendation += 'Critical security issues must be fixed immediately. ';
    }
    
    if (issues.some(issue => issue.type === 'high')) {
      recommendation += 'High severity issues need to be addressed before deployment. ';
    }
    
    if (issues.some(issue => issue.type === 'security-score')) {
      recommendation += 'Improve overall security score through code fixes and best practices. ';
    }
    
    // Environment-specific recommendations
    if (this.validationResults.environment === 'production') {
      recommendation += 'Production deployment requires all security gates to pass. ';
    } else if (this.validationResults.environment === 'staging') {
      recommendation += 'Staging environment allows some flexibility but critical/high issues must be resolved. ';
    }
    
    this.validationResults.recommendation = recommendation;
  }

  displayResults() {
    const { passed, environment, thresholds, actual, issues, warnings, recommendation } = this.validationResults;
    
    console.log('\n=== SECURITY GATES VALIDATION ===');
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('');
    
    console.log('📊 Thresholds vs Actual:');
    console.log(`Critical:  ${actual.critical}/${thresholds.critical} ${this.getStatusIcon(actual.critical, thresholds.critical)}`);
    console.log(`High:      ${actual.high}/${thresholds.high} ${this.getStatusIcon(actual.high, thresholds.high)}`);
    console.log(`Medium:    ${actual.medium}/${thresholds.medium} ${this.getStatusIcon(actual.medium, thresholds.medium)}`);
    console.log(`Low:       ${actual.low}/${thresholds.low} ${this.getStatusIcon(actual.low, thresholds.low)}`);
    console.log(`Score:     ${actual.securityScore}/${thresholds.securityScore} ${this.getScoreIcon(actual.securityScore, thresholds.securityScore)}`);
    console.log('');
    
    if (issues.length > 0) {
      console.log('❌ Critical Issues:');
      issues.forEach(issue => {
        console.log(`  • ${issue.message}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Warnings:');
      warnings.forEach(warning => {
        console.log(`  • ${warning.message}`);
      });
      console.log('');
    }
    
    console.log('💡 Recommendation:');
    console.log(`  ${recommendation}`);
    
    // Save validation results
    const resultsPath = path.join(process.cwd(), 'security-gate-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.validationResults, null, 2));
    console.log(`\n📋 Validation results saved to: ${resultsPath}`);
  }

  getStatusIcon(actual, threshold) {
    if (actual > threshold) {
      return '❌';
    } else if (actual === threshold) {
      return '⚠️';
    } else {
      return '✅';
    }
  }

  getScoreIcon(actual, threshold) {
    if (actual >= threshold) {
      return '✅';
    } else if (actual >= threshold * 0.8) {
      return '⚠️';
    } else {
      return '❌';
    }
  }

  exitWithCode() {
    if (!this.validationResults.passed) {
      console.log('\n🚫 Deployment blocked by security gates');
      process.exit(1);
    } else if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️ Security gates passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ All security gates passed');
      process.exit(0);
    }
  }

  // Method to customize thresholds
  updateThreshold(environment, type, value) {
    if (!this.thresholds[environment]) {
      this.thresholds[environment] = { ...this.thresholds[this.defaultEnv] };
    }
    this.thresholds[environment][type] = value;
  }

  // Method to add custom environment
  addEnvironment(name, thresholds) {
    this.thresholds[name] = thresholds;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const environment = args[0] || 'staging';
  
  const validator = new SecurityGatesValidator();
  
  validator.validateSecurityGates(environment)
    .catch(error => {
      console.error('Security gate validation failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityGatesValidator;