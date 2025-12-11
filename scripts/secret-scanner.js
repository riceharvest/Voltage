#!/usr/bin/env node

/**
 * Comprehensive Secret Scanner for CI/CD Pipeline
 * Detects hardcoded secrets, API keys, tokens, and sensitive data patterns
 * Refined version with reduced false positives
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Refined secret patterns with reduced false positives
const SECRET_PATTERNS = [
  // Critical: Real API keys and tokens (high confidence patterns)
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'Stripe Secret Key', severity: 'critical', excludePatterns: [] },
  { pattern: /pk_[a-zA-Z0-9]{20,}/g, name: 'Stripe Publishable Key', severity: 'high', excludePatterns: [] },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token', severity: 'critical', excludePatterns: [] },
  { pattern: /github_pat_[a-zA-Z0-9_]{82}/g, name: 'GitHub App Token', severity: 'critical', excludePatterns: [] },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth Token', severity: 'critical', excludePatterns: [] },
  
  // Critical: Database connection strings with credentials
  { pattern: /mongodb(\+srv)?:\/\/[^:\s\/]+:[^@\s\/]+@[^:\s\/]+[:\/][^\s"'`]+/g, name: 'MongoDB Connection String', severity: 'critical', excludePatterns: [] },
  { pattern: /postgresql:\/\/[^:\s\/]+:[^@\s\/]+@[^:\s\/]+[:\/][^\s"'`]+/g, name: 'PostgreSQL Connection String', severity: 'critical', excludePatterns: [] },
  { pattern: /mysql:\/\/[^:\s\/]+:[^@\s\/]+@[^:\s\/]+[:\/][^\s"'`]+/g, name: 'MySQL Connection String', severity: 'critical', excludePatterns: [] },
  { pattern: /redis:\/\/[^:\s\/]+:[^@\s\/]+@[^:\s\/]+[:\/][^\s"'`]+/g, name: 'Redis Connection String', severity: 'high', excludePatterns: [] },
  
  // Critical: Cloud provider keys
  { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key ID', severity: 'critical', excludePatterns: [] },
  { pattern: /["'][A-Za-z0-9\/+=]{40}["']/g, name: 'AWS Secret Access Key', severity: 'critical', excludePatterns: [] },
  { pattern: /AIza[0-9A-Za-z\-_]{35}/g, name: 'Google API Key', severity: 'high', excludePatterns: [] },
  { pattern: /ya29\.[0-9A-Za-z\-_]+/g, name: 'Google OAuth Token', severity: 'high', excludePatterns: [] },
  
  // High: Authentication secrets with context
  { pattern: /JWT_SECRET["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{32,}["']/gi, name: 'JWT Secret', severity: 'high', excludePatterns: [] },
  { pattern: /NEXTAUTH_SECRET["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{32,}["']/gi, name: 'NextAuth Secret', severity: 'high', excludePatterns: [] },
  { pattern: /CSRF_SECRET["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/gi, name: 'CSRF Secret', severity: 'high', excludePatterns: [] },
  
  // High: Private keys
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, name: 'Private Key', severity: 'critical', excludePatterns: [] },
  
  // High: Explicit API key patterns with strong context
  { pattern: /api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/gi, name: 'API Key', severity: 'high', excludePatterns: [] },
  { pattern: /secret[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/gi, name: 'Secret Key', severity: 'high', excludePatterns: [] },
  { pattern: /access[_-]?token["']?\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/gi, name: 'Access Token', severity: 'high', excludePatterns: [] },
  
  // High: Passwords with context (avoiding short passwords)
  { pattern: /password["']?\s*[:=]\s*["'][^"'\n]{12,}["']/gi, name: 'Password', severity: 'high', excludePatterns: [] },
  { pattern: /passwd["']?\s*[:=]\s*["'][^"'\n]{12,}["']/gi, name: 'Password', severity: 'high', excludePatterns: [] },
  
  // Medium: Database credentials without URLs
  { pattern: /(db[_-]?user|database[_-]?user)["']?\s*[:=]\s*["'][^"'\n]+["']/gi, name: 'Database Username', severity: 'medium', excludePatterns: [] },
  { pattern: /(db[_-]?pass|database[_-]?pass)["']?\s*[:=]\s*["'][^"'\n]{8,}["']/gi, name: 'Database Password', severity: 'medium', excludePatterns: [] },
];

// Files and patterns to exclude from scanning
const EXCLUDE_PATTERNS = [
  // Directories to skip
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /coverage/,
  /\.nyc_output/,
  /logs/,
  /\.secret/,
  
  // Environment files (should contain secrets, but we validate them separately)
  /\.env\.local$/,
  /\.env\.development$/,
  /\.env\.staging$/,
  /\.env\.production$/,
  /\.env\./,
  
  // Lock files (may contain hashed passwords)
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  
  // Generated files
  /secrets\.json$/,
  /\.config\.(js|ts)$/,
];

// Files that commonly contain legitimate data that might trigger false positives
const FALSE_POSITIVE_PATTERNS = [
  // Base64 encoded images
  /data:image\//,
  // Product IDs in URLs
  /\/\d{10,}/,
  // File names with hyphens (common in product names)
  /^[a-z]+-[a-z]+-[a-z]+/,
  // Environment variable names
  /^[A-Z_]+$/,
  // JSON property names
  /"[^"]+"\s*:/,
];

// High priority files that should be scanned more carefully
const HIGH_PRIORITY_FILES = [
  /\.env$/,
  /\.env\./,
  /config\.(js|ts|json)$/,
  /secrets\.(js|ts|json)$/,
  /credentials\.(js|ts|json)$/,
  /\.aws\/credentials$/,
  /\.azure\/credentials$/,
  /\.ssh\/id_.*$/,
];

class SecretScanner {
  constructor() {
    this.findings = [];
    this.scannedFiles = 0;
    this.skippedFiles = 0;
    this.falsePositives = 0;
  }

  shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
  }

  isFalsePositive(match, line, filePath) {
    // Check if this looks like legitimate data rather than a secret
    return FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(match) || pattern.test(line));
  }

  isHighPriorityFile(filePath) {
    return HIGH_PRIORITY_FILES.some(pattern => pattern.test(filePath));
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        this.findings.push(...this.scanLine(line, filePath, lineNumber + 1));
      });
      
      this.scannedFiles++;
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }

  scanLine(line, filePath, lineNumber) {
    const findings = [];
    
    SECRET_PATTERNS.forEach(({ pattern, name, severity, excludePatterns = [] }) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if matches exclusion patterns
          if (excludePatterns.some(excludePattern => excludePattern.test(match))) {
            return;
          }
          
          // Skip if this looks like a false positive
          if (this.isFalsePositive(match, line, filePath)) {
            this.falsePositives++;
            return;
          }
          
          // Sanitize the match for reporting
          const sanitizedMatch = this.sanitizeMatch(match);
          
          findings.push({
            type: 'secret',
            severity,
            name,
            match: sanitizedMatch,
            file: filePath,
            line: lineNumber,
            snippet: this.getCodeSnippet(line),
            confidence: this.calculateConfidence(match, severity, line)
          });
        });
      }
    });
    
    return findings;
  }

  sanitizeMatch(match) {
    if (match.length <= 8) {
      return '*'.repeat(match.length);
    }
    return match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4);
  }

  getCodeSnippet(line) {
    const maxLength = 100;
    if (line.length <= maxLength) {
      return line.trim();
    }
    return line.substring(0, maxLength) + '...';
  }

  calculateConfidence(match, severity, line) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for longer matches
    if (match.length > 20) confidence += 0.2;
    if (match.length > 40) confidence += 0.2;
    
    // Higher confidence for critical severity
    if (severity === 'critical') confidence += 0.3;
    else if (severity === 'high') confidence += 0.2;
    else if (severity === 'medium') confidence += 0.1;
    
    // Check for strong context indicators
    const contextPatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /auth/i,
      /credential/i,
      /private/i,
      /key/i
    ];
    
    const contextMatches = contextPatterns.filter(pattern => pattern.test(line)).length;
    confidence += (contextMatches * 0.1);
    
    // Lower confidence for common data patterns
    if (/^[a-z]+-[a-z]+/.test(match)) confidence -= 0.2;
    if (/^\d+$/.test(match)) confidence -= 0.3;
    if (match.includes('http')) confidence -= 0.3;
    
    return Math.max(0.1, Math.min(confidence, 1.0));
  }

  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!this.shouldExcludeFile(fullPath)) {
          this.scanDirectory(fullPath);
        } else {
          this.skippedFiles++;
        }
      } else if (stat.isFile()) {
        if (!this.shouldExcludeFile(fullPath)) {
          this.scanFile(fullPath);
        } else {
          this.skippedFiles++;
        }
      }
    });
  }

  generateReport() {
    const critical = this.findings.filter(f => f.severity === 'critical');
    const high = this.findings.filter(f => f.severity === 'high');
    const medium = this.findings.filter(f => f.severity === 'medium');
    const low = this.findings.filter(f => f.severity === 'low');
    
    const report = {
      summary: {
        totalFindings: this.findings.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
        scannedFiles: this.scannedFiles,
        skippedFiles: this.skippedFiles,
        falsePositives: this.falsePositives,
        timestamp: new Date().toISOString()
      },
      findings: this.findings,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.findings.length > 0) {
      recommendations.push('🚨 IMMEDIATE ACTION REQUIRED: Secrets detected in codebase');
      recommendations.push('1. Remove all hardcoded secrets immediately');
      recommendations.push('2. Use environment variables for all sensitive configuration');
      recommendations.push('3. Implement the new secret manager system');
      recommendations.push('4. Rotate any exposed credentials');
      recommendations.push('5. Review git history for secret exposure');
    } else {
      recommendations.push('✅ No hardcoded secrets detected! Great job on secure coding practices.');
    }
    
    if (this.findings.filter(f => f.severity === 'critical').length > 0) {
      recommendations.push('6. 🔴 CRITICAL: Rotate exposed API keys and database passwords immediately');
    }
    
    if (this.findings.filter(f => f.name === 'Private Key').length > 0) {
      recommendations.push('7. 🔐 CRITICAL: Private keys must never be committed to version control');
    }
    
    recommendations.push('8. Set up pre-commit hooks to prevent future secret exposure');
    recommendations.push('9. Implement secret scanning in CI/CD pipeline');
    recommendations.push('10. Train team on secure secret management practices');
    
    if (this.falsePositives > 0) {
      recommendations.push(`11. Note: ${this.falsePositives} potential false positives were filtered out`);
    }
    
    return recommendations;
  }

  saveReport(report, outputPath = 'secret-scan-results.json') {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Secret scan report saved to: ${outputPath}`);
  }

  printSummary(report) {
    console.log('\n🔍 SECRET SCAN RESULTS');
    console.log('========================');
    console.log(`📊 Total Findings: ${report.summary.totalFindings}`);
    console.log(`🔴 Critical: ${report.summary.critical}`);
    console.log(`🟠 High: ${report.summary.high}`);
    console.log(`🟡 Medium: ${report.summary.medium}`);
    console.log(`🔵 Low: ${report.summary.low}`);
    console.log(`📁 Scanned Files: ${report.summary.scannedFiles}`);
    console.log(`⏭️  Skipped Files: ${report.summary.skippedFiles}`);
    console.log(`🚫 False Positives Filtered: ${report.summary.falsePositives}`);
    console.log('');
    
    if (report.summary.totalFindings > 0) {
      console.log('🚨 FINDINGS:');
      const topFindings = report.findings
        .filter(f => f.severity === 'critical' || f.severity === 'high')
        .slice(0, 10);
      
      topFindings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.name} (${finding.severity}) in ${finding.file}:${finding.line}`);
        console.log(`   Match: ${finding.match} (${Math.round(finding.confidence * 100)}% confidence)`);
        console.log(`   Code: ${finding.snippet}`);
      });
    } else {
      console.log('✅ No hardcoded secrets detected! Great job on secure coding practices.');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const scanDir = args[0] || '.';
  const outputFile = args[1] || 'secret-scan-results.json';
  
  console.log('🔍 Starting refined secret scan...');
  console.log(`📂 Scanning directory: ${scanDir}`);
  
  const scanner = new SecretScanner();
  
  try {
    scanner.scanDirectory(scanDir);
    const report = scanner.generateReport();
    
    scanner.saveReport(report, outputFile);
    scanner.printSummary(report);
    
    // Exit with error code if critical or high severity findings
    const hasCriticalOrHigh = report.findings.some(f => f.severity === 'critical' || f.severity === 'high');
    if (hasCriticalOrHigh) {
      console.log('\n❌ Secret scan FAILED - Critical or high severity secrets detected');
      process.exit(1);
    } else {
      console.log('\n✅ Secret scan PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Secret scan failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { SecretScanner, SECRET_PATTERNS };

// Run CLI if called directly
if (require.main === module) {
  main();
}