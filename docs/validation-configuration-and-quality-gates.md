# Validation Configuration and Quality Gates

## Overview

This document provides the configuration files and quality gate settings for the comprehensive validation workflow architecture. These configurations define the thresholds, criteria, and automation settings used throughout the validation process.

## Quality Gates Configuration

### Coverage Thresholds

```json
{
  "coverage": {
    "global": {
      "statements": 85,
      "branches": 80,
      "functions": 85,
      "lines": 85
    },
    "critical": {
      "statements": 95,
      "branches": 90,
      "functions": 95,
      "lines": 95
    },
    "components": {
      "statements": 90,
      "branches": 85,
      "functions": 90,
      "lines": 90
    },
    "api": {
      "statements": 95,
      "branches": 90,
      "functions": 95,
      "lines": 95
    },
    "library": {
      "statements": 85,
      "branches": 80,
      "functions": 85,
      "lines": 85
    }
  }
}
```

### Performance Thresholds

```json
{
  "performance": {
    "pageLoadTime": {
      "target": 3000,
      "warning": 4000,
      "critical": 5000,
      "unit": "milliseconds"
    },
    "apiResponseTime": {
      "target": 200,
      "warning": 500,
      "critical": 1000,
      "unit": "milliseconds"
    },
    "bundleSize": {
      "target": 1024,
      "warning": 1536,
      "critical": 2048,
      "unit": "kilobytes"
    },
    "memoryUsage": {
      "target": 100,
      "warning": 150,
      "critical": 200,
      "unit": "megabytes"
    },
    "coreWebVitals": {
      "lcp": {
        "target": 2500,
        "warning": 3000,
        "critical": 4000
      },
      "fid": {
        "target": 100,
        "warning": 150,
        "critical": 300
      },
      "cls": {
        "target": 0.1,
        "warning": 0.15,
        "critical": 0.25
      }
    }
  }
}
```

### Security Thresholds

```json
{
  "security": {
    "vulnerabilities": {
      "critical": {
        "maxAllowed": 0,
        "action": "block"
      },
      "high": {
        "maxAllowed": 0,
        "action": "block"
      },
      "medium": {
        "maxAllowed": 5,
        "action": "warning"
      },
      "low": {
        "maxAllowed": 20,
        "action": "warning"
      }
    },
    "dependencies": {
      "outdated": {
        "maxAllowed": 10,
        "action": "warning"
      },
      "deprecated": {
        "maxAllowed": 0,
        "action": "block"
      }
    },
    "secrets": {
      "maxAllowed": 0,
      "action": "block",
      "patterns": [
        "password\\s*=\\s*['\"][^'\"]+['\"]",
        "api[_-]?key\\s*=\\s*['\"][^'\"]+['\"]",
        "secret\\s*=\\s*['\"][^'\"]+['\"]",
        "token\\s*=\\s*['\"][^'\"]+['\"]",
        "sk-[a-zA-Z0-9]{48}",
        "ghp_[a-zA-Z0-9]{36}"
      ]
    }
  }
}
```

### Browser Compatibility Matrix

```json
{
  "browsers": {
    "chrome": {
      "versions": ["last 2"],
      "minimum市场份额": 60,
      "testPriority": "high"
    },
    "firefox": {
      "versions": ["last 2"],
      "minimum市场份额": 5,
      "testPriority": "medium"
    },
    "safari": {
      "versions": ["last 2"],
      "minimum市场份额": 5,
      "testPriority": "medium"
    },
    "edge": {
      "versions": ["last 2"],
      "minimum市场份额": 5,
      "testPriority": "medium"
    },
    "mobile": {
      "chrome": {
        "versions": ["last 2"],
        "platforms": ["Android"]
      },
      "safari": {
        "versions": ["last 2"],
        "platforms": ["iOS"]
      }
    }
  }
}
```

### Accessibility Standards

```json
{
  "accessibility": {
    "wcagLevel": "AA",
    "maxViolations": {
      "critical": 0,
      "serious": 0,
      "moderate": 5,
      "minor": 10
    },
    "rules": {
      "color-contrast": "must-pass",
      "keyboard-navigation": "must-pass",
      "screen-reader": "must-pass",
      "focus-management": "must-pass",
      "alt-text": "must-pass",
      "form-labels": "must-pass",
      "heading-structure": "should-pass"
    },
    "testing": {
      "axe-core": true,
      "pa11y": true,
      "manual": true
    }
  }
}
```

## Validation Workflow Configuration

### Checkpoint Configuration

```json
{
  "checkpoints": {
    "static_analysis": {
      "enabled": true,
      "timeout": 300,
      "parallel": false,
      "required": true,
      "scripts": [
        "npm run lint",
        "npx tsc --noEmit",
        "npm run security:audit",
        "npm run security:snyk",
        "npm run security:validate"
      ]
    },
    "unit_tests": {
      "enabled": true,
      "timeout": 600,
      "parallel": true,
      "required": true,
      "scripts": [
        "npm run test:unit",
        "npm run test:components",
        "npm run test:coverage"
      ],
      "coverage_threshold": {
        "statements": 85,
        "branches": 80,
        "functions": 85,
        "lines": 85
      }
    },
    "integration_tests": {
      "enabled": true,
      "timeout": 900,
      "parallel": false,
      "required": true,
      "scripts": [
        "npm run test:integration",
        "npm run test:component-integration"
      ]
    },
    "api_validation": {
      "enabled": true,
      "timeout": 480,
      "parallel": false,
      "required": true,
      "scripts": [
        "npm run test:api",
        "npm run test:api:performance"
      ],
      "endpoints": [
        "/api/health",
        "/api/flavors",
        "/api/ingredients",
        "/api/suppliers",
        "/api/calculator"
      ],
      "performance_targets": {
        "response_time": 200,
        "throughput": 100,
        "error_rate": 0.01
      }
    },
    "data_integrity": {
      "enabled": true,
      "timeout": 300,
      "parallel": false,
      "required": true,
      "scripts": [
        "npm run validate-data",
        "npm run validate:schema",
        "npm run safety:validate"
      ]
    },
    "cross_browser": {
      "enabled": true,
      "timeout": 1200,
      "parallel": true,
      "required": false,
      "scripts": [
        "npm run test:browser:all",
        "npm run test:accessibility"
      ]
    },
    "performance_security": {
      "enabled": true,
      "timeout": 900,
      "parallel": true,
      "required": false,
      "scripts": [
        "npm run test:lighthouse",
        "npm run security:full"
      ]
    },
    "final_integration": {
      "enabled": true,
      "timeout": 1800,
      "parallel": false,
      "required": true,
      "scripts": [
        "npm run test:e2e:full",
        "npm run test:smoke",
        "npm run test:production"
      ]
    }
  }
}
```

### File Category Risk Assessment

```json
{
  "file_categories": {
    "config": {
      "risk_level": "Critical",
      "validation_depth": "100%",
      "rollback_complexity": "High",
      "affected_systems": ["all"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "api_validation",
        "final_integration"
      ]
    },
    "api": {
      "risk_level": "Critical",
      "validation_depth": "100%",
      "rollback_complexity": "Medium",
      "affected_systems": ["backend", "frontend"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "integration_tests",
        "api_validation",
        "final_integration"
      ]
    },
    "safety": {
      "risk_level": "Critical",
      "validation_depth": "100%",
      "rollback_complexity": "Low",
      "affected_systems": ["user_safety", "compliance"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "integration_tests",
        "data_integrity",
        "final_integration"
      ]
    },
    "data": {
      "risk_level": "High",
      "validation_depth": "95%",
      "rollback_complexity": "Low",
      "affected_systems": ["content", "functionality"],
      "required_checkpoints": [
        "static_analysis",
        "data_integrity",
        "final_integration"
      ]
    },
    "library": {
      "risk_level": "High",
      "validation_depth": "90%",
      "rollback_complexity": "Medium",
      "affected_systems": ["functionality", "performance"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "integration_tests",
        "performance_security",
        "final_integration"
      ]
    },
    "components": {
      "risk_level": "Medium",
      "validation_depth": "85%",
      "rollback_complexity": "Low",
      "affected_systems": ["ui", "ux"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "integration_tests",
        "cross_browser",
        "final_integration"
      ]
    },
    "analytics": {
      "risk_level": "Medium",
      "validation_depth": "80%",
      "rollback_complexity": "Low",
      "affected_systems": ["monitoring", "reporting"],
      "required_checkpoints": [
        "static_analysis",
        "unit_tests",
        "integration_tests",
        "final_integration"
      ]
    }
  }
}
```

## CI/CD Pipeline Configuration

### GitHub Actions Configuration

```yaml
# .github/workflows/validation.yml
name: Comprehensive Validation Workflow

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      validation_type:
        description: 'Type of validation to run'
        required: true
        default: 'full'
        type: choice
        options:
          - full
          - quick
          - critical
          - checkpoint

env:
  NODE_VERSION: '18'
  VALIDATION_TYPE: ${{ github.event.inputs.validation_type || 'full' }}

jobs:
  validate-changes:
    runs-on: ubuntu-latest
    outputs:
      validation-status: ${{ steps.validation.outputs.status }}
      validation-report: ${{ steps.validation.outputs.report }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run validation workflow
      id: validation
      run: |
        chmod +x scripts/validation-workflow.sh
        
        case ${{ env.VALIDATION_TYPE }} in
          "quick")
            ./scripts/validation-workflow.sh --quick
            ;;
          "critical")
            ./scripts/validation-workflow.sh --checkpoint static_analysis
            ./scripts/validation-workflow.sh --checkpoint unit_tests
            ./scripts/validation-workflow.sh --checkpoint api_validation
            ;;
          "checkpoint")
            CHECKPOINT=${{ github.event.inputs.checkpoint || 'static_analysis' }}
            ./scripts/validation-workflow.sh --checkpoint $CHECKPOINT
            ;;
          *)
            ./scripts/validation-workflow.sh
            ;;
        esac
        
        echo "status=$?" >> $GITHUB_OUTPUT
        echo "report=validation-report-$(date +%Y%m%d-%H%M%S).md" >> $GITHUB_OUTPUT
    
    - name: Upload validation reports
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: validation-reports-${{ github.run_number }}
        path: |
          test-results/
          validation/
        retention-days: 30
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = require('path');
          
          const reportsDir = 'test-results';
          const files = fs.readdirSync(reportsDir);
          const reportFile = files
            .filter(f => f.startsWith('validation_report_'))
            .sort()
            .pop();
          
          if (reportFile) {
            const reportContent = fs.readFileSync(path.join(reportsDir, reportFile), 'utf8');
            
            const status = ${{ job.status }} === 'success' ? '✅' : '❌';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🔍 Validation Results ${status}\n\n${reportContent}\n\n**Validation Type:** ${{ env.VALIDATION_TYPE }}\n**Timestamp:** ${new Date().toISOString()}`
            });
          }

  security-scan:
    runs-on: ubuntu-latest
    needs: validate-changes
    if: always() && needs.validate-changes.outputs.validation-status == '0'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security scan
      run: npm run security:scan
    
    - name: Upload security report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: security-report-${{ github.run_number }}
        path: test-results/security-scan-*.json

  performance-test:
    runs-on: ubuntu-latest
    needs: validate-changes
    if: always() && needs.validate-changes.outputs.validation-status == '0'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm run start &
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        configPath: './lighthouserc.json'
        uploadArtifacts: true
        temporaryPublicStorage: true
    
    - name: Upload performance report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: performance-report-${{ github.run_number }}
        path: .lighthouseci/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [validate-changes, security-scan, performance-test]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add your staging deployment logic here
    
    - name: Run smoke tests
      run: |
        echo "Running smoke tests on staging..."
        npm run test:smoke

  deploy-production:
    runs-on: ubuntu-latest
    needs: [validate-changes, security-scan, performance-test]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add your production deployment logic here
    
    - name: Run post-deployment validation
      run: |
        echo "Running post-deployment validation..."
        npm run test:e2e:production
```

### Pre-commit Hook Configuration

```yaml
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run quick validation before commit
echo "🔍 Running pre-commit validation..."

# Check if validation script exists
if [ -f "scripts/validation-workflow.sh" ]; then
    chmod +x scripts/validation-workflow.sh
    
    # Run quick validation (only critical checkpoints)
    if ! ./scripts/validation-workflow.sh --quick; then
        echo "❌ Pre-commit validation failed"
        echo "Please fix the issues before committing"
        exit 1
    fi
    
    echo "✅ Pre-commit validation passed"
else
    echo "⚠️  Validation script not found, running basic checks..."
    
    # Fallback to basic checks
    npm run lint || exit 1
    npx tsc --noEmit || exit 1
fi
```

### Quality Gate Scripts

```bash
#!/bin/bash
# scripts/ci/quality-gates.sh

set -euo pipefail

# Configuration
CONFIG_FILE="validation/quality-gates.json"
REPORTS_DIR="test-results"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    source <(jq -r 'to_entries | .[] | .key + "=" + (.value | tostring)' "$CONFIG_FILE")
else
    echo "❌ Quality gates configuration not found: $CONFIG_FILE"
    exit 1
fi

# Quality gate functions
check_coverage() {
    echo "🔍 Checking code coverage..."
    
    # Parse coverage report
    if [ -f "$REPORTS_DIR/coverage-summary.json" ]; then
        local actual_statements=$(jq -r '.total.statements.pct' "$REPORTS_DIR/coverage-summary.json")
        local actual_branches=$(jq -r '.total.branches.pct' "$REPORTS_DIR/coverage-summary.json")
        local actual_functions=$(jq -r '.total.functions.pct' "$REPORTS_DIR/coverage-summary.json")
        local actual_lines=$(jq -r '.total.lines.pct' "$REPORTS_DIR/coverage-summary.json")
        
        echo "Coverage Report:"
        echo "  Statements: ${actual_statements}% (target: ${coverage_statements}%)"
        echo "  Branches: ${actual_branches}% (target: ${coverage_branches}%)"
        echo "  Functions: ${actual_functions}% (target: ${coverage_functions}%)"
        echo "  Lines: ${actual_lines}% (target: ${coverage_lines}%)"
        
        # Check against thresholds
        local failed=false
        
        if (( $(echo "$actual_statements < $coverage_statements" | bc -l) )); then
            echo "❌ Statements coverage below threshold"
            failed=true
        fi
        
        if (( $(echo "$actual_branches < $coverage_branches" | bc -l) )); then
            echo "❌ Branches coverage below threshold"
            failed=true
        fi
        
        if (( $(echo "$actual_functions < $coverage_functions" | bc -l) )); then
            echo "❌ Functions coverage below threshold"
            failed=true
        fi
        
        if (( $(echo "$actual_lines < $coverage_lines" | bc -l) )); then
            echo "❌ Lines coverage below threshold"
            failed=true
        fi
        
        if $failed; then
            return 1
        else
            echo "✅ Coverage thresholds met"
            return 0
        fi
    else
        echo "❌ Coverage report not found"
        return 1
    fi
}

check_performance() {
    echo "🔍 Checking performance metrics..."
    
    # Parse performance report
    if [ -f "$REPORTS_DIR/performance-report.json" ]; then
        local page_load_time=$(jq -r '.pageLoadTime' "$REPORTS_DIR/performance-report.json")
        local api_response_time=$(jq -r '.apiResponseTime' "$REPORTS_DIR/performance-report.json")
        
        echo "Performance Report:"
        echo "  Page Load Time: ${page_load_time}ms (target: ${performance_pageLoadTime}ms)"
        echo "  API Response Time: ${api_response_time}ms (target: ${performance_apiResponseTime}ms)"
        
        local failed=false
        
        if (( $(echo "$page_load_time > $performance_pageLoadTime" | bc -l) )); then
            echo "❌ Page load time above threshold"
            failed=true
        fi
        
        if (( $(echo "$api_response_time > $performance_apiResponseTime" | bc -l) )); then
            echo "❌ API response time above threshold"
            failed=true
        fi
        
        if $failed; then
            return 1
        else
            echo "✅ Performance thresholds met"
            return 0
        fi
    else
        echo "❌ Performance report not found"
        return 1
    fi
}

check_security() {
    echo "🔍 Checking security vulnerabilities..."
    
    # Parse security report
    if [ -f "$REPORTS_DIR/security-scan-$(date +%Y%m%d)*.json" ]; then
        local security_report=$(ls "$REPORTS_DIR"/security-scan-$(date +%Y%m%d)*.json | head -1)
        local critical=$(jq -r '.scans[] | select(.name=="npm-audit") | .vulnerabilities.critical // 0' "$security_report")
        local high=$(jq -r '.scans[] | select(.name=="npm-audit") | .vulnerabilities.high // 0' "$security_report")
        local medium=$(jq -r '.scans[] | select(.name=="npm-audit") | .vulnerabilities.moderate // 0' "$security_report")
        local low=$(jq -r '.scans[] | select(.name=="npm-audit") | .vulnerabilities.low // 0' "$security_report")
        
        echo "Security Report:"
        echo "  Critical: $critical (max allowed: ${security_vulnerabilities_critical_maxAllowed})"
        echo "  High: $high (max allowed: ${security_vulnerabilities_high_maxAllowed})"
        echo "  Medium: $medium (max allowed: ${security_vulnerabilities_medium_maxAllowed})"
        echo "  Low: $low (max allowed: ${security_vulnerabilities_low_maxAllowed})"
        
        local failed=false
        
        if [ "$critical" -gt "${security_vulnerabilities_critical_maxAllowed}" ]; then
            echo "❌ Critical vulnerabilities above threshold"
            failed=true
        fi
        
        if [ "$high" -gt "${security_vulnerabilities_high_maxAllowed}" ]; then
            echo "❌ High vulnerabilities above threshold"
            failed=true
        fi
        
        if [ "$medium" -gt "${security_vulnerabilities_medium_maxAllowed}" ]; then
            echo "⚠️  Medium vulnerabilities above threshold (warning)"
        fi
        
        if [ "$low" -gt "${security_vulnerabilities_low_maxAllowed}" ]; then
            echo "⚠️  Low vulnerabilities above threshold (warning)"
        fi
        
        if $failed; then
            return 1
        else
            echo "✅ Security thresholds met"
            return 0
        fi
    else
        echo "❌ Security report not found"
        return 1
    fi
}

# Main execution
echo "🏁 Running quality gates..."

# Run all quality gates
gates_passed=0
total_gates=3

if check_coverage; then
    ((gates_passed++))
fi

if check_performance; then
    ((gates_passed++))
fi

if check_security; then
    ((gates_passed++))
fi

echo ""
echo "📊 Quality Gates Summary: $gates_passed/$total_gates passed"

if [ $gates_passed -eq $total_gates ]; then
    echo "✅ All quality gates passed"
    exit 0
else
    echo "❌ Quality gates failed"
    exit 1
fi
```

## Environment-Specific Configuration

### Development Environment

```json
{
  "environment": "development",
  "validation": {
    "parallel_checkpoints": true,
    "timeout_multiplier": 2.0,
    "failure_tolerance": "high",
    "required_checkpoints": [
      "static_analysis",
      "unit_tests"
    ],
    "optional_checkpoints": [
      "cross_browser",
      "performance_security"
    ]
  },
  "quality_gates": {
    "coverage": {
      "statements": 70,
      "branches": 65,
      "functions": 70,
      "lines": 70
    },
    "performance": {
      "pageLoadTime": 5000,
      "apiResponseTime": 500
    },
    "security": {
      "vulnerabilities": {
        "critical": 0,
        "high": 1,
        "medium": 10,
        "low": 50
      }
    }
  }
}
```

### Staging Environment

```json
{
  "environment": "staging",
  "validation": {
    "parallel_checkpoints": true,
    "timeout_multiplier": 1.5,
    "failure_tolerance": "medium",
    "required_checkpoints": [
      "static_analysis",
      "unit_tests",
      "integration_tests",
      "api_validation",
      "final_integration"
    ],
    "optional_checkpoints": [
      "cross_browser",
      "performance_security"
    ]
  },
  "quality_gates": {
    "coverage": {
      "statements": 85,
      "branches": 80,
      "functions": 85,
      "lines": 85
    },
    "performance": {
      "pageLoadTime": 3500,
      "apiResponseTime": 300
    },
    "security": {
      "vulnerabilities": {
        "critical": 0,
        "high": 0,
        "medium": 5,
        "low": 20
      }
    }
  }
}
```

### Production Environment

```json
{
  "environment": "production",
  "validation": {
    "parallel_checkpoints": false,
    "timeout_multiplier": 1.0,
    "failure_tolerance": "low",
    "required_checkpoints": [
      "static_analysis",
      "unit_tests",
      "integration_tests",
      "api_validation",
      "data_integrity",
      "cross_browser",
      "performance_security",
      "final_integration"
    ],
    "optional_checkpoints": []
  },
  "quality_gates": {
    "coverage": {
      "statements": 90,
      "branches": 85,
      "functions": 90,
      "lines": 90
    },
    "performance": {
      "pageLoadTime": 3000,
      "apiResponseTime": 200
    },
    "security": {
      "vulnerabilities": {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 5
      }
    }
  }
}
```

## Monitoring and Alerting Configuration

### Validation Metrics

```json
{
  "metrics": {
    "validation_time": {
      "target": 1800,
      "warning": 2400,
      "critical": 3600,
      "unit": "seconds"
    },
    "test_success_rate": {
      "target": 95,
      "warning": 90,
      "critical": 85,
      "unit": "percentage"
    },
    "false_positive_rate": {
      "target": 5,
      "warning": 10,
      "critical": 15,
      "unit": "percentage"
    },
    "rollback_success_rate": {
      "target": 100,
      "warning": 95,
      "critical": 90,
      "unit": "percentage"
    }
  },
  "alerts": {
    "validation_failure": {
      "threshold": 1,
      "action": "slack_notification",
      "severity": "high"
    },
    "performance_degradation": {
      "threshold": 20,
      "action": "email_notification",
      "severity": "medium"
    },
    "security_vulnerability": {
      "threshold": 1,
      "action": "immediate_notification",
      "severity": "critical"
    }
  }
}
```

This comprehensive configuration provides all the necessary settings for implementing the validation workflow architecture across different environments and deployment scenarios. The modular design allows for easy customization and extension based on specific project requirements.