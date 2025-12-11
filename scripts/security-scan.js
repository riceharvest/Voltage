#!/usr/bin/env node

/**
 * Security Scanning Script
 * 
 * This script runs comprehensive security scans on the codebase
 * and provides formatted output for easy review.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityScanner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      eslint: null,
      npmAudit: null,
      snyk: null,
      summary: {
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  runCommand(command, description) {
    this.log(`Running: ${description}`);
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'pipe'] 
      });
      this.log(`✅ ${description} completed successfully`);
      return output;
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      return error.stdout || error.stderr || '';
    }
  }

  async runESLintSecurityScan() {
    this.log('Starting ESLint security scan...');
    try {
      const output = this.runCommand('npm run lint', 'ESLint security scan');
      this.results.eslint = {
        success: false,
        output: output,
        timestamp: new Date().toISOString()
      };
      
      // Parse ESLint output for security issues
      const lines = output.split('\n');
      let errorCount = 0;
      let warningCount = 0;
      
      lines.forEach(line => {
        if (line.includes('error') && line.includes('problems')) {
          const match = line.match(/(\d+)\s+errors?/);
          if (match) errorCount = parseInt(match[1]);
        }
        if (line.includes('warnings') && line.includes('problems')) {
          const match = line.match(/(\d+)\s+warnings?/);
          if (match) warningCount = parseInt(match[1]);
        }
      });
      
      this.results.summary.totalIssues += errorCount + warningCount;
      this.results.summary.critical += errorCount; // Assuming errors are critical
      this.results.summary.medium += warningCount; // Assuming warnings are medium
      
      return { errorCount, warningCount, output };
    } catch (error) {
      this.log('ESLint scan completed with issues (expected for initial scan)', 'warn');
      this.results.eslint = {
        success: false,
        output: error.stdout || 'Scan completed with security issues found',
        timestamp: new Date().toISOString()
      };
      return null;
    }
  }

  async runNpmAudit() {
    this.log('Running npm audit for dependency vulnerabilities...');
    try {
      const output = this.runCommand('npm audit --json', 'NPM audit scan');
      const auditData = JSON.parse(output);
      
      let highCount = 0;
      let moderateCount = 0;
      
      if (auditData.vulnerabilities) {
        Object.values(auditData.vulnerabilities).forEach(vuln => {
          if (vuln.severity === 'high') highCount++;
          if (vuln.severity === 'moderate') moderateCount++;
        });
      }
      
      this.results.npmAudit = {
        success: true,
        data: auditData,
        timestamp: new Date().toISOString()
      };
      
      this.results.summary.high += highCount;
      this.results.summary.medium += moderateCount;
      
      return auditData;
    } catch (error) {
      this.log('NPM audit failed or found vulnerabilities', 'warn');
      this.results.npmAudit = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return null;
    }
  }

  async runSnykScan() {
    this.log('Running Snyk security scan...');
    try {
      const output = this.runCommand('npx snyk test --json', 'Snyk security scan');
      const snykData = JSON.parse(output);
      
      this.results.snyk = {
        success: true,
        data: snykData,
        timestamp: new Date().toISOString()
      };
      
      // Parse Snyk results
      if (snykData.vulnerabilities) {
        snykData.vulnerabilities.forEach(vuln => {
          switch (vuln.severity) {
            case 'critical':
              this.results.summary.critical++;
              break;
            case 'high':
              this.results.summary.high++;
              break;
            case 'medium':
              this.results.summary.medium++;
              break;
            case 'low':
              this.results.summary.low++;
              break;
          }
        });
      }
      
      return snykData;
    } catch (error) {
      this.log('Snyk scan failed (may need authentication)', 'warn');
      this.results.snyk = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return null;
    }
  }

  generateReport() {
    const reportPath = path.join(process.cwd(), 'security-scan-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n=== SECURITY SCAN SUMMARY ===');
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Total Issues: ${this.results.summary.totalIssues}`);
    console.log(`Critical: ${this.results.summary.critical}`);
    console.log(`High: ${this.results.summary.high}`);
    console.log(`Medium: ${this.results.summary.medium}`);
    console.log(`Low: ${this.results.summary.low}`);
    console.log(`\nDetailed results saved to: ${reportPath}`);
    
    // Security score calculation
    const maxScore = 100;
    const criticalPenalty = this.results.summary.critical * 10;
    const highPenalty = this.results.summary.high * 5;
    const mediumPenalty = this.results.summary.medium * 2;
    const lowPenalty = this.results.summary.low * 1;
    
    const securityScore = Math.max(0, maxScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty);
    
    console.log(`\nSecurity Score: ${securityScore}/100`);
    
    if (securityScore >= 90) {
      console.log('🟢 Excellent security posture');
    } else if (securityScore >= 70) {
      console.log('🟡 Good security posture with room for improvement');
    } else if (securityScore >= 50) {
      console.log('🟠 Fair security posture, needs attention');
    } else {
      console.log('🔴 Poor security posture, immediate action required');
    }
    
    return {
      score: securityScore,
      reportPath,
      summary: this.results.summary
    };
  }

  async runFullScan() {
    this.log('Starting comprehensive security scan...');
    
    await this.runESLintSecurityScan();
    await this.runNpmAudit();
    await this.runSnykScan();
    
    const report = this.generateReport();
    
    // Exit with appropriate code
    if (this.results.summary.critical > 0) {
      process.exit(2); // Critical issues found
    } else if (this.results.summary.high > 5) {
      process.exit(1); // Too many high issues
    } else {
      process.exit(0); // Clean or acceptable
    }
  }
}

// Run the scanner if called directly
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.runFullScan().catch(error => {
    console.error('Security scan failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityScanner;