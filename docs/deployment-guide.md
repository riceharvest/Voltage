# Production Deployment Guide

## Overview

This guide provides comprehensive procedures for deploying the Energy Drink Calculator application to production environments using Vercel, with support for multiple deployment strategies, environment management, and operational excellence.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Strategies](#deployment-strategies)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Environment Variables](#environment-variables)
8. [Database Configuration](#database-configuration)
9. [Security Configuration](#security-configuration)
10. [Performance Optimization](#performance-optimization)

## Prerequisites

### Required Accounts and Services

- **Vercel Account**: Production hosting platform
- **GitHub Repository**: Source code management
- **Sentry Account**: Error monitoring and performance tracking
- **Domain**: Custom domain configuration
- **SSL Certificate**: Automatically managed by Vercel
- **Database Service**: (If using external database)

### Development Environment

```bash
# Required tools
node >= 18.0.0
npm >= 8.0.0
git >= 2.30.0
vercel-cli >= 28.0.0

# Install Vercel CLI
npm i -g vercel

# Authenticate with Vercel
vercel login
```

### Access Permissions

- **Vercel**: Project admin access
- **GitHub**: Repository write access
- **Sentry**: Organization admin
- **Domain**: DNS management access
- **Database**: Admin credentials (if applicable)

## Environment Setup

### Environment Tiers

| Environment | Purpose | URL Pattern | Deployment Source |
|-------------|---------|-------------|-------------------|
| Development | Local development | localhost:3000 | Local builds |
| Staging | Pre-production testing | staging.energydrink.app | `staging` branch |
| Production | Live application | app.energydrink.app | `main` branch |

### Vercel Project Configuration

#### 1. Create Vercel Project

```bash
# Initialize Vercel project
vercel

# Configure project settings
vercel project add energy-drink-calculator

# Link to existing project
vercel link
```

#### 2. Project Settings Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["fra1", "cdg1", "lhr1", "ams1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

#### 3. Domain Configuration

```bash
# Add custom domain
vercel domains add energydrink.app

# Configure DNS records
# A record: @ -> 76.76.19.61
# CNAME: www -> cname.vercel-dns.com

# Configure environment-specific domains
vercel domains add staging.energydrink.app
vercel domains add app.energydrink.app
```

### Environment Variables Management

#### Development Environment Variables

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
SENTRY_DSN=your-development-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=dev-analytics-id
```

#### Staging Environment Variables

```bash
# Configure in Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_APP_ENV staging
vercel env add NEXT_PUBLIC_API_URL staging
vercel env add SENTRY_DSN staging
vercel env add NEXT_PUBLIC_ANALYTICS_ID staging
```

#### Production Environment Variables

```bash
# Configure in Vercel dashboard or CLI
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_ENV production
vercel env add NEXT_PUBLIC_API_URL production
vercel env add SENTRY_DSN production
vercel env add NEXT_PUBLIC_ANALYTICS_ID production
vercel env add SESSION_SECRET production-session-secret
vercel env add DATABASE_URL production-database-url
```

### Required Environment Variables

#### Application Configuration

```bash
# Core application settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_BASE_URL=https://app.energydrink.app
NEXT_PUBLIC_API_URL=https://api.energydrink.app/api

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AB_TESTING=true
NEXT_PUBLIC_ENABLE_AFFILIATE_TRACKING=true

# Performance and caching
NEXT_PUBLIC_CACHE_VERSION=v1
REDIS_URL=redis://cache-provider-url
```

#### Monitoring and Analytics

```bash
# Error monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=energy-drink-app
SENTRY_AUTH_TOKEN=your-auth-token

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
GOOGLE_ANALYTICS_ID=ga-tracking-id

# Performance monitoring
WEB_VITALS_API_ENDPOINT=https://analytics.provider.com
```

#### Security and Authentication

```bash
# CSRF and security
CSRF_SECRET=your-csrf-secret
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# Age verification
AGE_VERIFICATION_SECRET=your-age-verification-secret

# GDPR compliance
GDPR_ENCRYPTION_KEY=your-gdpr-encryption-key
```

## Deployment Strategies

### 1. Standard Deployment (Recommended)

**Best for**: Regular deployments with minimal risk

```bash
# 1. Ensure all checks pass
npm run lint
npm run test
npm run security:audit

# 2. Build and verify
npm run build
npm run analyze

# 3. Deploy to production
git checkout main
git pull origin main
git merge feature-branch
git push origin main

# Deployment happens automatically via GitHub Actions
```

### 2. Blue-Green Deployment

**Best for**: Zero-downtime deployments

```bash
# Use blue-green deployment script
node scripts/blue-green-deploy.js

# This will:
# 1. Create new deployment (green)
# 2. Run health checks
# 3. Switch traffic if healthy
# 4. Keep previous version (blue) as rollback
```

### 3. Canary Deployment

**Best for**: Gradual rollout with monitoring

```bash
# Configure canary deployment
vercel deploy --prod --meta canary=true --meta trafficPercentage=10

# Monitor metrics
# Increase traffic percentage gradually
vercel deploy --prod --meta canary=true --meta trafficPercentage=50
vercel deploy --prod --meta canary=true --meta trafficPercentage=100
```

### 4. Feature Flag Deployment

**Best for**: Safe feature rollouts

```javascript
// Deploy with feature flags disabled
const deployment = await vercel.deploy({
  env: {
    FEATURE_NEW_CALCULATOR: 'false',
    FEATURE_ENHANCED_ANALYTICS: 'false'
  }
});

// Enable features gradually via API
await fetch('/api/feature-flags', {
  method: 'POST',
  body: JSON.stringify({
    name: 'new_calculator',
    enabled: true,
    rolloutPercentage: 25
  })
});
```

## Production Deployment

### Pre-Deployment Checklist

#### Code Quality Checks

```bash
# 1. Run comprehensive tests
npm run test:coverage
npm run test:e2e

# 2. Security scanning
npm run security:full
npm run security:audit

# 3. Code quality
npm run lint
npm run type-check

# 4. Performance validation
npm run analyze
npm run lighthouse
```

#### Infrastructure Checks

```bash
# 1. Environment variables validation
node scripts/validate-environment.js

# 2. Database connectivity test
node scripts/test-database.js

# 3. External API availability
node scripts/test-external-apis.js

# 4. CDN and caching configuration
node scripts/validate-cdn-config.js
```

### Automated Deployment Process

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:coverage
        
      - name: Security audit
        run: npm run security:full
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Post-deployment verification
        run: node scripts/post-deployment-check.js
```

#### Manual Deployment Commands

```bash
# 1. Prepare for deployment
git checkout main
git pull origin main

# 2. Run pre-deployment checks
npm run preflight-checks

# 3. Deploy using Vercel CLI
vercel --prod

# 4. Configure deployment
vercel --prod --confirm
```

### Deployment Verification

#### Health Check Automation

```bash
#!/bin/bash
# scripts/post-deployment-check.sh

DEPLOYMENT_URL=$1
TIMEOUT=300
INTERVAL=30

echo "Starting post-deployment verification for $DEPLOYMENT_URL"

# Wait for deployment to be ready
sleep $INTERVAL

# Check application health
check_endpoint() {
  local url=$1
  local expected_status=200
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$response" = "$expected_status" ]; then
    echo "✅ $url - OK"
    return 0
  else
    echo "❌ $url - Failed (HTTP $response)"
    return 1
  fi
}

# Verify key endpoints
check_endpoint "$DEPLOYMENT_URL"
check_endpoint "$DEPLOYMENT_URL/api/health"
check_endpoint "$DEPLOYMENT_URL/api/flavors"

# Run smoke tests
npm run test:smoke -- --baseUrl="$DEPLOYMENT_URL"

echo "Post-deployment verification completed"
```

#### Manual Verification Checklist

- [ ] **Homepage loads successfully** (`GET /`)
- [ ] **API health check passes** (`GET /api/health`)
- [ ] **Core functionality works** (flavor calculator, ingredient search)
- [ ] **Error monitoring active** (Sentry receiving events)
- [ ] **Performance metrics** (Core Web Vitals within thresholds)
- [ ] **Security headers present** (CSP, HSTS, etc.)
- [ ] **SSL certificate valid** (HTTPS working)
- [ ] **Database connectivity** (if applicable)

## Post-Deployment Verification

### Automated Monitoring

#### Real-time Monitoring Setup

```javascript
// Post-deployment monitoring script
const postDeploymentChecks = {
  async run() {
    const checks = [
      this.healthCheck(),
      this.performanceCheck(),
      this.errorRateCheck(),
      this.functionalityCheck()
    ];
    
    const results = await Promise.allSettled(checks);
    return this.generateReport(results);
  },
  
  async healthCheck() {
    const response = await fetch('/api/health');
    return {
      name: 'Health Check',
      status: response.ok ? 'pass' : 'fail',
      details: response.status
    };
  },
  
  async performanceCheck() {
    // Check Core Web Vitals
    const vitals = await this.getWebVitals();
    return {
      name: 'Performance Check',
      status: vitals.passed ? 'pass' : 'fail',
      details: vitals
    };
  }
};
```

#### Sentry Integration Verification

```bash
# Verify error monitoring is working
curl -X POST https://sentry.io/api/0/projects/your-org/your-project/store/ \
  -H 'Content-Type: application/json' \
  -d '{
    "event_id": "test-event-123",
    "message": "Test error from deployment verification",
    "level": "info"
  }'

# Check Sentry dashboard for test event
```

### Business Logic Verification

#### Core Functionality Tests

```javascript
// Automated functionality verification
const functionalityTests = {
  async runAll() {
    const tests = [
      this.testFlavorCalculation(),
      this.testIngredientSearch(),
      this.testAffiliateTracking(),
      this.testGDPRCompliance(),
      this.testAgeVerification()
    ];
    
    return Promise.allSettled(tests);
  },
  
  async testFlavorCalculation() {
    const response = await fetch('/api/flavors');
    const flavors = await response.json();
    
    return {
      name: 'Flavor Data Loading',
      status: flavors.data?.length > 0 ? 'pass' : 'fail',
      details: `${flavors.data?.length} flavors loaded`
    };
  }
};
```

## Rollback Procedures

### Automatic Rollback Triggers

#### Error Rate Monitoring

```javascript
// Rollback if error rate exceeds threshold
const errorRateThreshold = 0.05; // 5%
const timeWindow = 300000; // 5 minutes

const shouldRollback = async () => {
  const errorRate = await getErrorRate(timeWindow);
  return errorRate > errorRateThreshold;
};

if (await shouldRollback()) {
  await triggerRollback('High error rate detected');
}
```

#### Performance Degradation

```javascript
// Rollback if performance degrades
const performanceThreshold = {
  FCP: 2000,    // First Contentful Paint
  LCP: 4000,    // Largest Contentful Paint
  CLS: 0.1,     // Cumulative Layout Shift
  FID: 100      // First Input Delay
};

const checkPerformance = async () => {
  const metrics = await getPerformanceMetrics();
  const violations = Object.entries(performanceThreshold)
    .filter(([metric, threshold]) => metrics[metric] > threshold);
  
  return violations.length > 0;
};
```

### Manual Rollback Process

#### Vercel Rollback

```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous deployment
vercel rollback
```

#### Database Rollback

```bash
# If using database migrations
npm run migrate:down

# Restore from backup if needed
node scripts/restore-data.js [backup-timestamp]
```

#### Complete Rollback Script

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

DEPLOYMENT_URL=$1
ROLLBACK_TARGET=$2

echo "Starting emergency rollback from $DEPLOYMENT_URL to $ROLLBACK_TARGET"

# 1. Rollback Vercel deployment
vercel rollback "$ROLLBACK_TARGET"

# 2. Notify team
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Emergency rollback initiated\",
    \"attachments\": [{
      \"color\": \"danger\",
      \"fields\": [{
        \"title\": \"From\",
        \"value\": \"$DEPLOYMENT_URL\",
        \"short\": true
      }, {
        \"title\": \"To\",
        \"value\": \"$ROLLBACK_TARGET\",
        \"short\": true
      }]
    }]
  }"

# 3. Verify rollback
sleep 30
./scripts/post-deployment-check.sh "$ROLLBACK_TARGET"

echo "Rollback completed"
```

## Environment Variables

### Variable Categories

#### Public Variables (Client-Side)

```bash
# Accessible in browser
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.energydrink.app
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
```

#### Private Variables (Server-Side Only)

```bash
# Server-side only
SENTRY_DSN=your-server-sentry-dsn
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
SESSION_SECRET=your-session-secret
```

#### Build-Time Variables

```bash
# Available during build
NODE_ENV=production
ANALYZE=false
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Environment Variable Management

#### Vercel CLI Management

```bash
# List all environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME [environment]

# Remove environment variable
vercel env rm VARIABLE_NAME [environment]

# Pull environment variables locally
vercel env pull .env.local
```

#### Secret Rotation

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

echo "Starting secret rotation process"

# 1. Generate new secrets
NEW_SESSION_SECRET=$(openssl rand -base64 32)
NEW_CSRF_SECRET=$(openssl rand -base64 32)

# 2. Update in secret manager
aws secretsmanager update-secret \
  --secret-id "energy-drink/session-secret" \
  --secret-string "$NEW_SESSION_SECRET"

# 3. Update Vercel environment variables
vercel env add SESSION_SECRET production
echo "$NEW_SESSION_SECRET" | vercel env add SESSION_SECRET production -

# 4. Verify new secrets work
npm run test:secrets

echo "Secret rotation completed"
```

## Database Configuration

### Database Setup (If Applicable)

#### Connection Configuration

```javascript
// lib/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

#### Database Migration

```bash
# Run migrations
npm run migrate:up

# Create migration
npm run migrate:create [migration-name]

# Check migration status
npm run migrate:status
```

### Data Backup and Recovery

#### Automated Backups

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to secure storage
aws s3 cp "$BACKUP_FILE.gz" "s3://energy-drink-backups/database/"

# Clean old local backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

## Security Configuration

### SSL/TLS Setup

#### Automatic SSL (Vercel Managed)

```bash
# SSL is automatically managed by Vercel
# Verify SSL configuration
curl -I https://app.energydrink.app

# Check SSL certificate
openssl s_client -connect app.energydrink.app:443 -servername app.energydrink.app
```

#### Security Headers

```javascript
// next.config.ts - Already configured with comprehensive security headers
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  }
];
```

### WAF Configuration

#### Vercel WAF Rules

```json
{
  "rules": [
    {
      "action": "block",
      "ruleId": 1001,
      "expression": "ip.geoip.country == 'XX' && http.request.uri.path contains '/admin'"
    },
    {
      "action": "challenge",
      "ruleId": 1002,
      "expression": "rate(5m) > 100"
    }
  ]
}
```

## Performance Optimization

### Build Optimization

#### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze

# Check bundle against performance budget
npm run check:bundle-size

# Optimize bundle
npm run optimize:bundle
```

#### Image Optimization

```javascript
// Already configured in next.config.ts
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 86400,
  domains: ['images.unsplash.com']
}
```

### Caching Strategy

#### Edge Caching Configuration

```javascript
// Already configured in vercel.json and next.config.ts
const cacheHeaders = {
  // Static assets
  '/_next/static/(.*)': 'public, max-age=31536000, immutable',
  
  // Images
  '/:path*.(png|jpg|jpeg|gif|svg|webp|avif|ico)': 'public, max-age=86400',
  
  // API responses
  '/api/flavors': 'public, max-age=3600',
  '/api/ingredients': 'public, max-age=3600'
};
```

## Deployment Monitoring

### Real-time Dashboards

#### Vercel Analytics

- **Function Performance**: Response times, cold starts
- **Edge Performance**: Global CDN metrics
- **User Experience**: Core Web Vitals, user interactions

#### Sentry Monitoring

- **Error Rates**: Real-time error tracking
- **Performance**: Transaction tracing, bottleneck identification
- **Release Health**: Deployment health, user impact

### Deployment Metrics

#### Key Performance Indicators

```javascript
// Monitor these metrics post-deployment
const deploymentMetrics = {
  errorRate: '< 1%',
  responseTime: '< 2s',
  uptime: '> 99.9%',
  coreWebVitals: {
    FCP: '< 2s',
    LCP: '< 2.5s',
    CLS: '< 0.1',
    FID: '< 100ms'
  }
};
```

#### Automated Alerts

```javascript
// Setup alerts for deployment issues
const alertConfig = {
  errorRate: { threshold: 0.05, window: '5m' },
  responseTime: { threshold: 5000, window: '1m' },
  uptime: { threshold: 0.999, window: '1h' }
};
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Check build logs
vercel logs [deployment-url] --follow

# Common fixes
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Runtime Errors

```bash
# Check function logs
vercel logs [deployment-url] --function=api

# Debug with Sentry
# Check Sentry dashboard for error details
```

#### Performance Issues

```bash
# Check performance metrics
vercel inspect [deployment-url]

# Analyze bundle
npm run analyze

# Check caching headers
curl -I [deployment-url]
```

### Emergency Procedures

#### System Down

1. **Immediate Response**:
   ```bash
   # Rollback to last known good deployment
   vercel rollback
   ```

2. **Investigate**:
   ```bash
   # Check logs and metrics
   vercel logs --follow
   ```

3. **Communicate**:
   ```bash
   # Update status page
   curl -X POST "$STATUSPAGE_WEBHOOK" \
     -d '{"incident": "System down", "status": "investigating"}'
   ```

#### Performance Degradation

1. **Identify bottleneck**:
   - Check Vercel function metrics
   - Review Sentry performance data
   - Analyze Core Web Vitals

2. **Mitigation**:
   - Scale resources if needed
   - Enable caching optimizations
   - Rollback problematic changes

This comprehensive deployment guide ensures reliable, secure, and performant production deployments with proper monitoring, rollback procedures, and operational excellence.