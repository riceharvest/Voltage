# Enhanced CI/CD Pipeline with Quality Gates for Global Scale

## Executive Summary

This document outlines the comprehensive CI/CD pipeline enhancement designed to support global scale operations with enterprise-grade quality gates, automated testing, security scanning, and deployment automation across multiple regions and environments.

## CI/CD Pipeline Architecture Overview

### Multi-Stage Pipeline Strategy
```
Enhanced CI/CD Pipeline:
├── Source Control & Code Quality
│   ├── GitFlow branching strategy
│   ├── Code quality gates (SonarQube)
│   ├── Static code analysis (ESLint, TypeScript)
│   └── Pre-commit hooks and validation
│
├── Continuous Integration
│   ├── Multi-stage build pipeline
│   ├── Unit testing with coverage requirements
│   ├── Integration testing across services
│   └── Performance regression testing
│
├── Security & Compliance
│   ├── Container image scanning (Trivy, Clair)
│   ├── Dependency vulnerability scanning (Snyk)
│   ├── SAST/DAST security testing
│   └── Compliance as code validation
│
├── Quality Assurance
│   ├── Automated E2E testing (Playwright)
│   ├── Accessibility testing (axe-core)
│   ├── Load testing (Artillery, k6)
│   └── Visual regression testing
│
├── Deployment Automation
│   ├── Blue-green deployment strategy
│   ├── Canary releases with feature flags
│   ├── Automated rollback mechanisms
│   └── Multi-region deployment orchestration
│
└── Monitoring & Feedback
    ├── Real-time deployment monitoring
    ├── Automated health checks
    ├── Performance validation
    └── Feedback loops for continuous improvement
```

### Quality Gate Framework

#### Quality Gate Criteria
```yaml
Quality Gates:
  Code Quality:
    - Code coverage: >80%
    - Code complexity: <10 cyclomatic complexity
    - Technical debt ratio: <5%
    - Duplicated lines: <3%
    - Maintainability index: >70
  
  Security:
    - Zero critical vulnerabilities
    - Zero high-severity security issues
    - SAST scan: 100% passed
    - DAST scan: 0 critical findings
    - Dependency scan: No known vulnerabilities
  
  Performance:
    - Build time: <15 minutes
    - Bundle size increase: <5%
    - API response time: <200ms P95
    - Memory usage: No significant increase
  
  Accessibility:
    - WCAG 2.1 AA compliance: 100%
    - Automated accessibility tests: 100% passed
    - Manual testing: Complete for critical flows
  
  Functional:
    - Unit tests: 100% passed
    - Integration tests: 100% passed
    - E2E tests: 100% passed for critical paths
    - API contract tests: 100% passed
```

## GitHub Actions CI/CD Pipeline

### Primary Workflow Configuration

#### Main CI/CD Pipeline
```yaml
# .github/workflows/enhanced-cicd.yml
name: Enhanced CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'release/*']
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Daily dependency scan

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Code Quality and Analysis
  code-quality:
    runs-on: ubuntu-latest
    name: Code Quality Analysis
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Code quality checks
        run: |
          npm run lint
          npm run type-check
          npm run format:check
      
      - name: Run SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=voltage-soda-platform
            -Dsonar.organization=voltage-soda
            -Dsonar.sources=src
            -Dsonar.tests=src
            -Dsonar.inclusions=**/*.ts,**/*.tsx,**/*.js,**/*.jsx
            -Dsonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx
            -Dsonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Comment PR with quality metrics
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            let coverage;
            try {
              coverage = execSync('npm run coverage:json', { encoding: 'utf8' });
            } catch (error) {
              console.log('Coverage command failed');
              return;
            }
            
            const coverageData = JSON.parse(coverage);
            const coveragePercent = coverageData.total.lines.pct;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Code Quality Report
              
              📊 **Coverage:** ${coveragePercent}%
              
              🎯 **Quality Gates:**
              - ✅ Code Coverage: ${coveragePercent >= 80 ? 'PASSED' : 'FAILED'} (${coveragePercent >= 80 ? '≥80%' : '<80%'})
              - ✅ Linting: PASSED
              - ✅ Type Checking: PASSED
              
              ${coveragePercent < 80 ? '⚠️ **Coverage below 80% threshold**' : '✅ All quality gates passed!'}
              `
            });

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    name: Security Scanning
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript
      
      - name: Semgrep SAST scan
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/javascript
            p/typescript
            p/next-js
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

  # Testing Pipeline
  test-pipeline:
    runs-on: ubuntu-latest
    name: Comprehensive Testing
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage --watchAll=false
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run API contract tests
        run: npm run test:contracts
      
      - name: Generate test report
        uses: dorny/test-reporter@v1
        if: success() || failure()
        with:
          name: 'Unit Tests'
          path: 'coverage/junit.xml'
          reporter: java-junit
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            coverage/
            test-results/

  # Accessibility Testing
  accessibility-test:
    runs-on: ubuntu-latest
    name: Accessibility Testing
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start:test &
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run axe accessibility tests
        run: |
          npm run test:accessibility || true
      
      - name: Run pa11y accessibility tests
        run: |
          npx pa11y http://localhost:3000 --reporter cli || true
      
      - name: Upload accessibility report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: accessibility-report/

  # Performance Testing
  performance-test:
    runs-on: ubuntu-latest
    name: Performance Testing
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start:test &
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --upload.target=temporary-public-storage
      
      - name: Run k6 performance tests
        run: |
          npm install -g k6
          k6 run tests/performance/load-test.js
      
      - name: Run bundle analyzer
        run: |
          npm run analyze:bundle || true
      
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: |
            .lighthouseci/
            performance-report/

  # Build and Container
  build-and-container:
    runs-on: ubuntu-latest
    name: Build and Container
    needs: [code-quality, security-scan, test-pipeline, accessibility-test, performance-test]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILDKIT_INLINE_CACHE=1
            NODE_ENV=production
          provenance: true
          sbom: true
      
      - name: Scan Docker image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-image-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-image-results.sarif'

  # E2E Testing
  e2e-test:
    runs-on: ubuntu-latest
    name: End-to-End Testing
    needs: build-and-container
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start application
        run: |
          docker run -d -p 3000:3000 --name test-app ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          npx wait-on http://localhost:3000
      
      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
      
      - name: Upload screenshots and videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-failures-${{ matrix.browser }}
          path: |
            test-results/
            playwright-report/

  # Security Compliance Check
  compliance-check:
    runs-on: ubuntu-latest
    name: Compliance Verification
    needs: [security-scan, build-and-container]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Open Policy Agent (OPA) compliance check
        run: |
          npm install -g @open-policy-agent/opa
          opa eval -d compliance-policies.rego -d security-policies.rego 'data.compliance.allowed' || exit 1
      
      - name: Check GDPR compliance
        run: |
          node scripts/compliance/gdpr-check.js || exit 1
      
      - name: Verify security headers
        run: |
          node scripts/security/headers-check.js || exit 1
      
      - name: Check data retention policies
        run: |
          node scripts/compliance/data-retention-check.js || exit 1

  # Deployment to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    name: Deploy to Staging
    needs: [build-and-container, e2e-test, compliance-check]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --region us-east-1 --name voltage-soda-staging
      
      - name: Deploy to staging
        run: |
          helm upgrade --install voltage-soda-staging ./charts/voltage-soda \
            --namespace voltage-soda-staging \
            --create-namespace \
            --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
            --set image.tag=${{ github.sha }} \
            --set environment=staging \
            --set replicas=2 \
            --wait --timeout=10m
      
      - name: Wait for deployment
        run: |
          kubectl rollout status deployment/voltage-soda-staging \
            --namespace voltage-soda-staging --timeout=10m
      
      - name: Run smoke tests
        run: |
          node scripts/deployment/smoke-tests.js \
            --url=https://staging.voltage-soda.com \
            --environment=staging || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # Production Deployment
  deploy-production:
    runs-on: ubuntu-latest
    name: Deploy to Production
    needs: [deploy-staging]
    if: startsWith(github.ref, 'refs/heads/release/')
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --region us-east-1 --name voltage-soda-production
      
      - name: Execute blue-green deployment
        run: |
          # Deploy to blue environment
          helm upgrade --install voltage-soda-blue ./charts/voltage-soda \
            --namespace voltage-soda-production \
            --create-namespace \
            --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
            --set image.tag=${{ github.sha }} \
            --set environment=production \
            --set deployment.color=blue \
            --set replicas=5 \
            --wait --timeout=15m
          
          # Run health checks on blue environment
          node scripts/deployment/health-check.js \
            --namespace=voltage-soda-production \
            --service=voltage-soda-blue \
            --timeout=300 || exit 1
          
          # Switch traffic to blue environment
          kubectl patch service voltage-soda-service \
            -n voltage-soda-production \
            -p '{"spec":{"selector":{"color":"blue"}}}'
          
          # Scale down green environment
          kubectl scale deployment voltage-soda-green \
            -n voltage-soda-production --replicas=0
      
      - name: Verify production deployment
        run: |
          # Wait for traffic switch
          sleep 60
          
          # Run comprehensive health checks
          node scripts/deployment/production-health-check.js \
            --url=https://voltage-soda.com \
            --environment=production || exit 1
          
          # Monitor for 10 minutes
          node scripts/deployment/monitor-deployment.js \
            --duration=600 \
            --url=https://voltage-soda.com
      
      - name: Notify successful deployment
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        if: success()
      
      - name: Notify failed deployment
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        if: failure()

  # Automated Rollback
  rollback:
    runs-on: ubuntu-latest
    name: Automated Rollback
    if: failure() && (github.event_name == 'push' && github.ref == 'refs/heads/main')
    needs: [deploy-production]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --region us-east-1 --name voltage-soda-production
      
      - name: Execute rollback
        run: |
          # Get previous successful deployment
          PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD^)
          
          # Rollback to previous version
          helm upgrade --install voltage-soda-rollback ./charts/voltage-soda \
            --namespace voltage-soda-production \
            --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
            --set image.tag=$PREVIOUS_TAG \
            --set environment=production \
            --set deployment.color=rollback \
            --set replicas=5 \
            --wait --timeout=10m
          
          # Switch traffic to rollback environment
          kubectl patch service voltage-soda-service \
            -n voltage-soda-production \
            -p '{"spec":{"selector":{"color":"rollback"}}}'
      
      - name: Verify rollback
        run: |
          sleep 60
          node scripts/deployment/health-check.js \
            --namespace=voltage-soda-production \
            --service=voltage-soda-rollback || exit 1
      
      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          channel: '#deployments'
          custom_payload: |
            {
              "text": "🔄 Automated Rollback Executed",
              "attachments": [{
                "color": "warning",
                "fields": [
                  {
                    "title": "Rollback Version",
                    "value": "${{ github.sha }}",
                    "short": true
                  },
                  {
                    "title": "Rollback Reason",
                    "value": "Deployment health check failed",
                    "short": true
                  }
                ]
              }]
            }
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Quality Gate Implementation

#### SonarCloud Quality Gate Configuration
```xml
<!-- sonar-project.properties -->
sonar.projectKey=voltage-soda-platform
sonar.organization=voltage-soda
sonar.projectName=Voltage Soda Platform
sonar.projectVersion=1.0.0

sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

sonar.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/node_modules/**,**/.next/**,**/dist/**,**/build/**

sonar.typescript.lcov.reportPaths=coverage/lcov.info

sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/tests/**

sonar.qualitygate.wait=true

# Quality Gate Configuration
sonar.newCode.referenceBranch=main

# Duplication detection
sonar.cpd.exclusions=**/generated/**,**/node_modules/**

# Security hotspots
sonar.security.hotspots.minScore=0.7

# Code smells and bugs
sonar.issue.ignore.multicriteria=e1,e2,e3

# Ignore generated files
sonar.issue.ignore.multicriteria.e1.ruleKey=javascript:S1192
sonar.issue.ignore.multicriteria.e1.resourceKey=**/generated/**

# Ignore test files
sonar.issue.ignore.multicriteria.e2.ruleKey=javascript:S1192
sonar.issue.ignore.multicriteria.e2.resourceKey=**/*.test.ts

# Ignore constants
sonar.issue.ignore.multicriteria.e3.ruleKey=javascript:S1192
sonar.issue.ignore.multicriteria.e3.resourceKey=**/constants/**,
```

#### Custom Quality Gate Script
```bash
#!/bin/bash
# scripts/quality-gate.sh

set -e

echo "🔍 Starting Quality Gate Validation..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Quality gate thresholds
COVERAGE_THRESHOLD=80
COMPLEXITY_THRESHOLD=10
DUPLICATION_THRESHOLD=3
MAINTAINABILITY_THRESHOLD=70

# Results tracking
QUALITY_GATE_PASSED=true

# Function to check quality gate
check_quality_gate() {
    local gate_name="$1"
    local current_value="$2"
    local threshold="$3"
    local operator="${4:-le}" # le = less than or equal, ge = greater than or equal
    
    if [[ "$operator" == "le" ]]; then
        if (( $(echo "$current_value $threshold" | awk '{print ($1 <= $2)}') )); then
            echo -e "${GREEN}✅ $gate_name: $current_value (≤$threshold)${NC}"
        else
            echo -e "${RED}❌ $gate_name: $current_value (> $threshold)${NC}"
            QUALITY_GATE_PASSED=false
        fi
    elif [[ "$operator" == "ge" ]]; then
        if (( $(echo "$current_value $threshold" | awk '{print ($1 >= $2)}') )); then
            echo -e "${GREEN}✅ $gate_name: $current_value (≥$threshold)${NC}"
        else
            echo -e "${RED}❌ $gate_name: $current_value (< $threshold)${NC}"
            QUALITY_GATE_PASSED=false
        fi
    fi
}

# 1. Code Coverage Check
echo "📊 Checking code coverage..."
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(node -pe JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json')).total.lines.pct)
    check_quality_gate "Code Coverage" "$COVERAGE" "$COVERAGE_THRESHOLD" "ge"
else
    echo -e "${RED}❌ Coverage report not found${NC}"
    QUALITY_GATE_PASSED=false
fi

# 2. Code Complexity Check
echo "🧮 Checking code complexity..."
if command -v eslint &> /dev/null; then
    COMPLEXITY=$(npx eslint --format json . | jq -r '.[].complexity.cyclomatic' | awk '{sum+=$1} END {print sum/NR}')
    if [ ! -z "$COMPLEXITY" ]; then
        check_quality_gate "Code Complexity" "$COMPLEXITY" "$COMPLEXITY_THRESHOLD" "le"
    fi
fi

# 3. Code Duplication Check
echo "🔄 Checking code duplication..."
if command -v sonarqube-scanner &> /dev/null; then
    DUPLICATION=$(npx sonar-scanner -Dsonar.projectKey=voltage-soda-platform -Dsonar.login=$SONAR_TOKEN | grep "duplicated_lines_density" | awk '{print $NF}' | head -1)
    if [ ! -z "$DUPLICATION" ]; then
        check_quality_gate "Code Duplication" "$DUPLICATION" "$DUPLICATION_THRESHOLD" "le"
    fi
fi

# 4. Security Vulnerabilities Check
echo "🔒 Checking security vulnerabilities..."
if command -v snyk &> /dev/null; then
    SNYK_RESULTS=$(npx snyk test --severity-threshold=high --json || echo '{"vulnerabilities":[]}')
    HIGH_VULNS=$(echo "$SNYK_RESULTS" | jq '.vulnerabilities | map(select(.severity == "high" or .severity == "critical")) | length')
    if [ "$HIGH_VULNS" -eq "0" ]; then
        echo -e "${GREEN}✅ Security Vulnerabilities: $HIGH_VULNS (0 required)${NC}"
    else
        echo -e "${RED}❌ Security Vulnerabilities: $HIGH_VULNS (>0 not allowed)${NC}"
        QUALITY_GATE_PASSED=false
    fi
fi

# 5. Build Performance Check
echo "⚡ Checking build performance..."
BUILD_TIME=$(cat .build-time 2>/dev/null || echo "0")
if (( $(echo "$BUILD_TIME 900" | awk '{print ($1 <= $2)}') )); then
    echo -e "${GREEN}✅ Build Performance: ${BUILD_TIME}s (≤900s)${NC}"
else
    echo -e "${YELLOW}⚠️ Build Performance: ${BUILD_TIME}s (>900s - warning)${NC}"
fi

# 6. Accessibility Check
echo "♿ Checking accessibility..."
if [ -f "accessibility-report/pa11y-results.json" ]; then
    ACCESSIBILITY_ISSUES=$(cat accessibility-report/pa11y-results.json | jq '.issues | length')
    if [ "$ACCESSIBILITY_ISSUES" -eq "0" ]; then
        echo -e "${GREEN}✅ Accessibility: $ACCESSIBILITY_ISSUES issues (0 required)${NC}"
    else
        echo -e "${RED}❌ Accessibility: $ACCESSIBILITY_ISSUES issues (>0 not allowed)${NC}"
        QUALITY_GATE_PASSED=false
    fi
fi

# 7. Bundle Size Check
echo "📦 Checking bundle size..."
BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "0M")
echo -e "${GREEN}📦 Bundle Size: $BUNDLE_SIZE${NC}"

# 8. Test Results Check
echo "🧪 Checking test results..."
if [ -f "test-results/junit.xml" ]; then
    TEST_FAILURES=$(grep -o 'failures="[^"]*"' test-results/junit.xml | cut -d'"' -f2)
    TEST_ERRORS=$(grep -o 'errors="[^"]*"' test-results/junit.xml | cut -d'"' -f2)
    
    if [ "$TEST_FAILURES" -eq "0" ] && [ "$TEST_ERRORS" -eq "0" ]; then
        echo -e "${GREEN}✅ Test Results: All tests passed${NC}"
    else
        echo -e "${RED}❌ Test Results: $TEST_FAILURES failures, $TEST_ERRORS errors${NC}"
        QUALITY_GATE_PASSED=false
    fi
fi

# Final result
echo ""
echo "========================================"
if [ "$QUALITY_GATE_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All quality gates passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Quality gate validation failed!${NC}"
    echo -e "${YELLOW}Please review and address the failing quality gates before proceeding.${NC}"
    exit 1
fi
```

### Feature Flag Integration

#### LaunchDarkly Integration
```yaml
# Feature flag deployment workflow
name: Feature Flag Deployment

on:
  workflow_dispatch:
    inputs:
      feature_flag_key:
        description: 'Feature flag key to update'
        required: true
        type: string
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      rollout_percentage:
        description: 'Rollout percentage (0-100)'
        required: true
        type: number
        default: 0

jobs:
  deploy-feature-flag:
    runs-on: ubuntu-latest
    name: Deploy Feature Flag
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install LaunchDarkly CLI
        run: npm install -g ld-cli
      
      - name: Configure LaunchDarkly
        run: |
          ld configure --token ${{ secrets.LAUNCHDARKLY_ACCESS_TOKEN }}
          ld set-project voltage-soda-platform
      
      - name: Update feature flag
        run: |
          ld flag update ${{ github.event.inputs.feature_flag_key }} \
            --environment ${{ github.event.inputs.environment }} \
            --variation on \
            --rollout-percentage ${{ github.event.inputs.rollout_percentage }} \
            --on
      
      - name: Verify flag update
        run: |
          ld flag show ${{ github.event.inputs.feature_flag_key }} \
            --environment ${{ github.event.inputs.environment }}
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#feature-flags'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
```

#### Progressive Rollout Script
```bash
#!/bin/bash
# scripts/progressive-rollout.sh

FEATURE_FLAG="$1"
ENVIRONMENT="$2"
START_PERCENTAGE="${3:-1}"
END_PERCENTAGE="${4:-100}"
STEP_SIZE="${5:-5}"
INTERVAL_MINUTES="${6:-10}"

if [ -z "$FEATURE_FLAG" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <feature-flag> <environment> [start%] [end%] [step%] [interval-minutes]"
    exit 1
fi

echo "🚀 Starting progressive rollout for $FEATURE_FLAG in $ENVIRONMENT"
echo "From $START_PERCENTAGE% to $END_PERCENTAGE% in ${STEP_SIZE}% increments"

PERCENTAGE=$START_PERCENTAGE
while [ $PERCENTAGE -le $END_PERCENTAGE ]; do
    echo "📊 Setting rollout to $PERCENTAGE%..."
    
    # Update feature flag
    ld flag update "$FEATURE_FLAG" \
      --environment "$ENVIRONMENT" \
      --rollout-percentage $PERCENTAGE \
      --on
    
    echo "✅ Rollout set to $PERCENTAGE%"
    
    # Monitor metrics
    echo "🔍 Monitoring deployment metrics..."
    
    # Wait for metrics stabilization
    sleep $((INTERVAL_MINUTES * 60))
    
    # Check error rates, response times, etc.
    if [ $PERCENTAGE -ge 10 ]; then
        echo "🧪 Running health checks..."
        # Add health check logic here
        
        ERROR_RATE=$(get_error_rate)
        if (( $(echo "$ERROR_RATE 0.05" | awk '{print ($1 > $2)}') )); then
            echo "❌ High error rate detected ($ERROR_RATE). Stopping rollout."
            ld flag update "$FEATURE_FLAG" \
              --environment "$ENVIRONMENT" \
              --rollout-percentage $((PERCENTAGE - STEP_SIZE)) \
              --on
            exit 1
        fi
    fi
    
    PERCENTAGE=$((PERCENTAGE + STEP_SIZE))
done

echo "🎉 Progressive rollout completed successfully!"
```

### Automated Rollback Mechanisms

#### Health Check Integration
```typescript
// scripts/deployment/health-check.ts
import axios from 'axios';
import { load } from 'cheerio';

interface HealthCheckOptions {
  url: string;
  timeout?: number;
  retries?: number;
  expectedStatusCodes?: number[];
  checkPatterns?: string[];
  performanceThresholds?: {
    responseTime?: number;
    bundleSize?: number;
  };
}

class DeploymentHealthCheck {
  private options: HealthCheckOptions;

  constructor(options: HealthCheckOptions) {
    this.options = {
      timeout: 30000,
      retries: 3,
      expectedStatusCodes: [200],
      checkPatterns: [],
      performanceThresholds: {
        responseTime: 2000,
        bundleSize: 1024 * 1024 // 1MB
      },
      ...options
    };
  }

  async performHealthCheck(): Promise<boolean> {
    console.log(`🔍 Starting health check for ${this.options.url}`);

    try {
      // Basic connectivity check
      const startTime = Date.now();
      const response = await axios.get(this.options.url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': 'Voltage-Soda-HealthCheck/1.0'
        }
      });
      const responseTime = Date.now() - startTime;

      console.log(`📊 Response time: ${responseTime}ms`);
      
      // Check status code
      if (!this.options.expectedStatusCodes!.includes(response.status)) {
        console.error(`❌ Unexpected status code: ${response.status}`);
        return false;
      }

      // Check performance thresholds
      if (this.options.performanceThresholds!.responseTime! && 
          responseTime > this.options.performanceThresholds!.responseTime!) {
        console.error(`❌ Response time exceeded threshold: ${responseTime}ms > ${this.options.performanceThresholds!.responseTime}ms`);
        return false;
      }

      // Check content patterns
      if (this.options.checkPatterns!.length > 0) {
        const $ = load(response.data);
        for (const pattern of this.options.checkPatterns!) {
          if (!$.html().includes(pattern)) {
            console.error(`❌ Expected pattern not found: ${pattern}`);
            return false;
          }
        }
      }

      // Check bundle size (if applicable)
      const contentLength = response.headers['content-length'];
      if (contentLength && this.options.performanceThresholds!.bundleSize! &&
          parseInt(contentLength) > this.options.performanceThresholds!.bundleSize!) {
        console.error(`❌ Bundle size exceeded threshold: ${contentLength} bytes`);
        return false;
      }

      // Check API endpoints
      const apiHealthCheck = await this.checkApiEndpoints();
      if (!apiHealthCheck) {
        return false;
      }

      console.log('✅ All health checks passed');
      return true;

    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      return false;
    }
  }

  private async checkApiEndpoints(): Promise<boolean> {
    const apiEndpoints = [
      '/api/health',
      '/api/performance',
      '/api/flavors'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(`${this.options.url}${endpoint}`, {
          timeout: 10000
        });
        
        if (response.status !== 200) {
          console.error(`❌ API endpoint failed: ${endpoint} (${response.status})`);
          return false;
        }
      } catch (error) {
        console.error(`❌ API endpoint error: ${endpoint} - ${error.message}`);
        return false;
      }
    }

    console.log('✅ All API endpoints healthy');
    return true;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: HealthCheckOptions = {
    url: args[0] || process.env.DEPLOYMENT_URL || 'http://localhost:3000',
    timeout: parseInt(args[1]) || 30000,
    retries: parseInt(args[2]) || 3
  };

  const healthCheck = new DeploymentHealthCheck(options);
  healthCheck.performHealthCheck()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check error:', error);
      process.exit(1);
    });
}

export { DeploymentHealthCheck };
```

#### Rollback Automation
```bash
#!/bin/bash
# scripts/automated-rollback.sh

set -e

ROLLBACK_REASON="$1"
DEPLOYMENT_ENVIRONMENT="${2:-production}"
MAX_ROLLBACK_TIME="${3:-300}" # 5 minutes

echo "🚨 Initiating automated rollback..."
echo "Reason: $ROLLBACK_REASON"
echo "Environment: $DEPLOYMENT_ENVIRONMENT"
echo "Max rollback time: ${MAX_ROLLBACK_TIME}s"

# Get current deployment info
CURRENT_DEPLOYMENT=$(kubectl get deployment -n $DEPLOYMENT_ENVIRONMENT -o jsonpath='{.items[0].metadata.name}')
CURRENT_IMAGE=$(kubectl get deployment $CURRENT_DEPLOYMENT -n $DEPLOYMENT_ENVIRONMENT -o jsonpath='{.spec.template.spec.containers[0].image}')

echo "Current deployment: $CURRENT_DEPLOYMENT"
echo "Current image: $CURRENT_IMAGE"

# Get previous working deployment
PREVIOUS_IMAGE=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "previous-stable")

# Determine rollback strategy based on environment
case "$DEPLOYMENT_ENVIRONMENT" in
  "production")
    echo "🏥 Production rollback strategy"
    
    # Scale up blue environment if exists
    if kubectl get deployment voltage-soda-blue -n $DEPLOYMENT_ENVIRONMENT &> /dev/null; then
      echo "Using blue environment for rollback"
      kubectl scale deployment voltage-soda-blue -n $DEPLOYMENT_ENVIRONMENT --replicas=5
      
      # Update service selector
      kubectl patch service voltage-soda-service -n $DEPLOYMENT_ENVIRONMENT \
        -p '{"spec":{"selector":{"color":"blue"}}}'
      
    # If no blue/green, use previous image
    else
      echo "Using image rollback strategy"
      kubectl set image deployment/$CURRENT_DEPLOYMENT \
        app=$PREVIOUS_IMAGE -n $DEPLOYMENT_ENVIRONMENT
    fi
    ;;
    
  "staging")
    echo "🧪 Staging rollback strategy"
    kubectl rollout undo deployment/$CURRENT_DEPLOYMENT -n $DEPLOYMENT_ENVIRONMENT
    ;;
    
  *)
    echo "❓ Unknown environment: $DEPLOYMENT_ENVIRONMENT"
    exit 1
    ;;
esac

# Wait for rollback to complete
echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/$CURRENT_DEPLOYMENT -n $DEPLOYMENT_ENVIRONMENT --timeout=${MAX_ROLLBACK_TIME}s

# Verify rollback health
echo "🔍 Verifying rollback health..."
if timeout 60 node scripts/deployment/health-check.js --url=${DEPLOYMENT_URL:-https://$DEPLOYMENT_ENVIRONMENT.voltage-soda.com}; then
  echo "✅ Rollback completed successfully"
  
  # Notify stakeholders
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    --data '{
      "text": "🔄 Automated Rollback Completed",
      "attachments": [{
        "color": "good",
        "fields": [
          {"title": "Environment", "value": "'$DEPLOYMENT_ENVIRONMENT'", "short": true},
          {"title": "Reason", "value": "'$ROLLBACK_REASON'", "short": true},
          {"title": "Rollback Image", "value": "'$PREVIOUS_IMAGE'", "short": true}
        ]
      }]
    }'
  
  exit 0
else
  echo "❌ Rollback health check failed"
  
  # Emergency escalation
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    --data '{
      "text": "🚨 ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED",
      "attachments": [{
        "color": "danger",
        "fields": [
          {"title": "Environment", "value": "'$DEPLOYMENT_ENVIRONMENT'", "short": true},
          {"title": "Reason", "value": "'$ROLLBACK_REASON'", "short": true},
          {"title": "Status", "value": "HEALTH_CHECK_FAILED", "short": true}
        ]
      }]
    }'
  
  exit 1
fi
```

## Implementation Timeline

### Phase 1 (Weeks 1-2): Core CI/CD Foundation
- [ ] Set up enhanced GitHub Actions workflows
- [ ] Implement quality gate framework
- [ ] Configure SonarCloud integration
- [ ] Set up security scanning pipeline

### Phase 2 (Weeks 3-4): Testing Automation
- [ ] Implement comprehensive testing pipeline
- [ ] Set up E2E testing with Playwright
- [ ] Configure accessibility testing
- [ ] Implement performance testing automation

### Phase 3 (Weeks 5-6): Deployment Automation
- [ ] Implement blue-green deployment strategy
- [ ] Set up automated rollback mechanisms
- [ ] Configure feature flag integration
- [ ] Implement progressive rollout automation

### Phase 4 (Weeks 7-8): Production Optimization
- [ ] Performance optimization of pipeline
- [ ] Advanced monitoring and alerting
- [ ] Documentation and training
- [ ] Continuous improvement processes

## Success Metrics

### Pipeline Performance
- **Build Time**: <15 minutes for full pipeline
- **Quality Gate Pass Rate**: >95% first-time pass
- **Deployment Success Rate**: >99% automated deployments
- **Rollback Time**: <5 minutes for automated rollback

### Quality Metrics
- **Code Coverage**: >80% maintained
- **Security Vulnerabilities**: Zero critical/high issues
- **Performance Regression**: <5% degradation tolerance
- **Accessibility Compliance**: 100% WCAG 2.1 AA

### Operational Metrics
- **Deployment Frequency**: Daily deployments to production
- **Lead Time**: <4 hours from commit to production
- **MTTR**: <30 minutes for automated fixes
- **Change Failure Rate**: <5% of deployments

This enhanced CI/CD pipeline provides enterprise-grade automation, quality assurance, and deployment capabilities for global scale operations.