#!/usr/bin/env node

/**
 * Security Report Generator
 * 
 * Generates comprehensive security reports from multiple scanning tools
 * and provides actionable insights for development teams.
 */

const fs = require('fs');
const path = require('path');

class SecurityReportGenerator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        securityScore: 0,
        overallStatus: 'unknown'
      },
      scanners: {},
      recommendations: [],
      trends: {}
    };
  }

  async generateReport() {
    console.log('📊 Generating comprehensive security report...');
    
    // Load scan results from various sources
    await this.loadSecurityScanResults();
    await this.loadESLintResults();
    await this.loadNpmAuditResults();
    await this.loadDependencyScanResults();
    
    // Calculate overall metrics
    this.calculateOverallMetrics();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Save report
    this.saveReport();
    
    // Display summary
    this.displaySummary();
    
    return this.report;
  }

  async loadSecurityScanResults() {
    try {
      const scanResultsPath = path.join(process.cwd(), 'security-scan-results.json');
      if (fs.existsSync(scanResultsPath)) {
        const data = JSON.parse(fs.readFileSync(scanResultsPath, 'utf8'));
        this.report.scanners['custom-scanner'] = data;
        
        if (data.summary) {
          Object.keys(data.summary).forEach(key => {
            if (typeof data.summary[key] === 'number') {
              this.report.summary[key] = (this.report.summary[key] || 0) + data.summary[key];
            }
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not load custom security scan results:', error.message);
    }
  }

  async loadESLintResults() {
    try {
      const lintResultsPath = path.join(process.cwd(), 'security-lint-results.json');
      if (fs.existsSync(lintResultsPath)) {
        const data = JSON.parse(fs.readFileSync(lintResultsPath, 'utf8'));
        this.report.scanners['eslint-security'] = {
          totalFiles: data.length,
          totalErrors: data.reduce((sum, file) => sum + (file.errorCount || 0), 0),
          totalWarnings: data.reduce((sum, file) => sum + (file.warningCount || 0), 0),
          files: data
        };
        
        const totalErrors = data.reduce((sum, file) => sum + (file.errorCount || 0), 0);
        const totalWarnings = data.reduce((sum, file) => sum + (file.warningCount || 0), 0);
        
        this.report.summary.critical += totalErrors; // Errors are considered critical
        this.report.summary.medium += Math.floor(totalWarnings / 2); // Warnings split between medium and low
        this.report.summary.low += Math.ceil(totalWarnings / 2);
      }
    } catch (error) {
      console.log('⚠️ Could not load ESLint results:', error.message);
    }
  }

  async loadNpmAuditResults() {
    try {
      const auditOutput = require('child_process').execSync('npm audit --json', { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'pipe'] 
      });
      const auditData = JSON.parse(auditOutput);
      
      this.report.scanners['npm-audit'] = auditData;
      
      if (auditData.vulnerabilities) {
        Object.values(auditData.vulnerabilities).forEach(vuln => {
          switch (vuln.severity) {
            case 'critical':
              this.report.summary.critical++;
              break;
            case 'high':
              this.report.summary.high++;
              break;
            case 'moderate':
              this.report.summary.medium++;
              break;
            case 'low':
              this.report.summary.low++;
              break;
          }
        });
      }
    } catch (error) {
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          this.report.scanners['npm-audit'] = auditData;
        } catch (e) {
          console.log('⚠️ Could not parse npm audit results');
        }
      }
    }
  }

  async loadDependencyScanResults() {
    try {
      const auditCIPath = path.join(process.cwd(), 'audit-ci.json');
      if (fs.existsSync(auditCIPath)) {
        const data = JSON.parse(fs.readFileSync(auditCIPath, 'utf8'));
        this.report.scanners['audit-ci'] = data;
      }
    } catch (error) {
      console.log('⚠️ Could not load audit-ci results:', error.message);
    }
  }

  calculateOverallMetrics() {
    this.report.summary.totalIssues = 
      this.report.summary.critical + 
      this.report.summary.high + 
      this.report.summary.medium + 
      this.report.summary.low;

    // Calculate security score (0-100)
    const maxScore = 100;
    const criticalPenalty = this.report.summary.critical * 15;
    const highPenalty = this.report.summary.high * 8;
    const mediumPenalty = this.report.summary.medium * 3;
    const lowPenalty = this.report.summary.low * 1;
    
    this.report.summary.securityScore = Math.max(0, 
      maxScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty
    );

    // Determine overall status
    if (this.report.summary.critical > 0) {
      this.report.summary.overallStatus = 'critical';
    } else if (this.report.summary.high > 5) {
      this.report.summary.overallStatus = 'failing';
    } else if (this.report.summary.medium > 20) {
      this.report.summary.overallStatus = 'warning';
    } else if (this.report.summary.securityScore >= 80) {
      this.report.summary.overallStatus = 'good';
    } else {
      this.report.summary.overallStatus = 'fair';
    }
  }

  generateRecommendations() {
    const recs = [];

    if (this.report.summary.critical > 0) {
      recs.push({
        priority: 'critical',
        title: 'Fix Critical Security Issues Immediately',
        description: `${this.report.summary.critical} critical security issues require immediate attention`,
        actions: [
          'Review all security/detect-* errors',
          'Fix eval() and dynamic code execution risks',
          'Address unsafe regex patterns',
          'Resolve child process security issues'
        ]
      });
    }

    if (this.report.summary.high > 5) {
      recs.push({
        priority: 'high',
        title: 'Address High Severity Issues',
        description: `${this.report.summary.high} high severity issues should be resolved soon`,
        actions: [
          'Implement input validation',
          'Fix object injection vulnerabilities',
          'Address timing attack risks',
          'Review environment variable usage'
        ]
      });
    }

    if (this.report.summary.medium > 10) {
      recs.push({
        priority: 'medium',
        title: 'Improve Code Quality Security',
        description: `${this.report.summary.medium} medium issues can be addressed in regular development`,
        actions: [
          'Remove or secure console statements',
          'Fix TypeScript type safety issues',
          'Implement proper error handling',
          'Review file system operations'
        ]
      });
    }

    if (this.report.summary.securityScore < 70) {
      recs.push({
        priority: 'general',
        title: 'Improve Overall Security Posture',
        description: `Current security score is ${this.report.summary.securityScore}/100`,
        actions: [
          'Establish security code review process',
          'Implement security training for team',
          'Set up automated security scanning',
          'Create security incident response plan'
        ]
      });
    }

    this.report.recommendations = recs;
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate markdown report
    const mdReport = this.generateMarkdownReport();
    const mdPath = path.join(process.cwd(), 'security-report.md');
    fs.writeFileSync(mdPath, mdReport);
    
    console.log(`📋 Reports saved to:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${mdPath}`);
  }

  generateMarkdownReport() {
    const { summary, recommendations } = this.report;
    
    return `# Security Scan Report

**Generated**: ${this.report.timestamp}
**Overall Status**: ${this.getStatusEmoji(summary.overallStatus)} ${summary.overallStatus.toUpperCase()}

## Summary

| Metric | Count |
|--------|-------|
| 🔴 Critical | ${summary.critical} |
| 🟠 High | ${summary.high} |
| 🟡 Medium | ${summary.medium} |
| 🔵 Low | ${summary.low} |
| **Total Issues** | **${summary.totalIssues}** |
| **Security Score** | **${summary.securityScore}/100** |

## Security Status

${this.getSecurityStatusText(summary)}

## Recommendations

${recommendations.map((rec, index) => `
### ${index + 1}. ${rec.title}

**Priority**: ${rec.priority.toUpperCase()}
**Description**: ${rec.description}

**Actions**:
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

## Scanner Details

${Object.entries(this.report.scanners).map(([name, data]) => `
### ${name}

${typeof data === 'object' ? `\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`` : data}
`).join('\n')}

## Next Steps

1. **Immediate**: Address all critical and high severity issues
2. **Short-term**: Implement recommended fixes for medium issues
3. **Long-term**: Establish security best practices and regular scanning
4. **Monitoring**: Set up continuous security monitoring

---
*Report generated by Energy Drink App Security Scanner v1.0*
`;
  }

  getStatusEmoji(status) {
    const emojis = {
      critical: '🚨',
      failing: '❌',
      warning: '⚠️',
      fair: '🟡',
      good: '✅'
    };
    return emojis[status] || '❓';
  }

  getSecurityStatusText(summary) {
    if (summary.overallStatus === 'critical') {
      return '🚨 **CRITICAL**: Immediate action required. Security issues must be fixed before deployment.';
    } else if (summary.overallStatus === 'failing') {
      return '❌ **FAILING**: Too many high severity issues. Address security concerns before proceeding.';
    } else if (summary.overallStatus === 'warning') {
      return '⚠️ **WARNING**: Several security issues found. Review and address during development cycle.';
    } else if (summary.overallStatus === 'fair') {
      return '🟡 **FAIR**: Minor security improvements needed. Address in next sprint.';
    } else {
      return '✅ **GOOD**: Acceptable security posture. Continue monitoring.';
    }
  }

  displaySummary() {
    console.log('\n=== SECURITY REPORT SUMMARY ===');
    console.log(`Status: ${this.getStatusEmoji(this.report.summary.overallStatus)} ${this.report.summary.overallStatus.toUpperCase()}`);
    console.log(`Security Score: ${this.report.summary.securityScore}/100`);
    console.log(`Total Issues: ${this.report.summary.totalIssues}`);
    console.log(`Critical: ${this.report.summary.critical} | High: ${this.report.summary.high} | Medium: ${this.report.summary.medium} | Low: ${this.report.summary.low}`);
    
    if (this.report.recommendations.length > 0) {
      console.log('\n📋 Top Recommendations:');
      this.report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.title} (${rec.priority})`);
      });
    }
  }
}

// Run the report generator
if (require.main === module) {
  const generator = new SecurityReportGenerator();
  generator.generateReport().catch(error => {
    console.error('Security report generation failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityReportGenerator;