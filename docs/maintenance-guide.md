# System Maintenance Guide

## Overview

This comprehensive maintenance guide covers all operational procedures, monitoring, scaling, and troubleshooting for the Energy Drink Calculator application in production environments.

## Table of Contents

1. [Maintenance Overview](#maintenance-overview)
2. [Regular Maintenance Procedures](#regular-maintenance-procedures)
3. [Performance Monitoring](#performance-monitoring)
4. [Security Maintenance](#security-maintenance)
5. [Data Management](#data-management)
6. [Scaling Procedures](#scaling-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Incident Response](#incident-response)
9. [Compliance and Auditing](#compliance-and-auditing)
10. [Operational Runbooks](#operational-runbooks)

## Maintenance Overview

### Maintenance Windows

| Environment | Maintenance Window | Frequency | Duration |
|-------------|-------------------|-----------|----------|
| Development | Any time | Continuous | N/A |
| Staging | Weekends, 22:00-06:00 UTC | Weekly | 2-4 hours |
| Production | Sunday 02:00-04:00 UTC | Monthly | 1-2 hours |
| Emergency | As needed | 24/7 | Variable |

### Maintenance Types

#### Planned Maintenance
- **Routine Updates**: Security patches, dependency updates
- **Performance Optimization**: Database tuning, cache optimization
- **Capacity Planning**: Resource scaling, infrastructure upgrades
- **Feature Deployment**: New functionality releases

#### Emergency Maintenance
- **Security Incidents**: Immediate security patches
- **Critical Bugs**: Production-breaking issues
- **Performance Issues**: System degradation
- **Hardware Failures**: Infrastructure problems

## Regular Maintenance Procedures

### Daily Maintenance Tasks

#### System Health Checks

```bash
#!/bin/bash
# scripts/daily-health-check.sh

# Check application status
curl -f https://app.energydrink.app/api/health || echo "API Health Check Failed"
curl -f https://app.energydrink.app || echo "Homepage Check Failed"

# Check error rates
ERROR_RATE=$(curl -s "https://api.sentry.io/api/0/projects/your-org/your-project/stats/?since=$(date -d '1 day ago' +%s)" | jq '.[0][1] | .values | add')
if [ "$ERROR_RATE" -gt 100 ]; then
    echo "High error rate detected: $ERROR_RATE errors in last 24h"
fi

# Check performance metrics
curl -s "https://api.vercel.com/v6/deployments?projectId=your-project" | jq '.[0].state'

# Monitor disk space (if applicable)
df -h | awk '$5 > 80 {print "Disk usage high: " $0}'

echo "Daily health check completed at $(date)"
```

#### Database Maintenance

```sql
-- Daily database maintenance queries

-- Check connection pool status
SELECT 
    count(*) as active_connections,
    state
FROM pg_stat_activity 
WHERE state = 'active';

-- Analyze table statistics for optimization
ANALYZE;

-- Check for long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Monitor cache hit ratio
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

### Weekly Maintenance Tasks

#### Performance Analysis

```bash
#!/bin/bash
# scripts/weekly-performance-analysis.sh

# Generate performance report
echo "Generating weekly performance report..."

# Analyze Core Web Vitals
curl -s "https://api.vercel.com/v1/analytics/visitors?projectId=your-project&start=$(date -d '7 days ago' +%Y-%m-%d)" > performance_data.json

# Check bundle size trends
npm run analyze > bundle_analysis.txt

# Monitor API response times
echo "API Response Times:" > api_performance.txt
for endpoint in "/api/flavors" "/api/ingredients" "/api/health"; do
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "https://app.energydrink.app$endpoint")
    echo "$endpoint: ${response_time}s" >> api_performance.txt
done

# Check error trends
echo "Error Analysis:" > error_analysis.txt
curl -s "https://api.sentry.io/api/0/projects/your-org/your-project/stats/?since=$(date -d '7 days ago' +%s)" | \
    jq '.[0][1] | to_entries | .[0:10] | .[] | "\(.key): \(.value)"' >> error_analysis.txt

echo "Weekly performance analysis completed"
```

#### Security Scans

```bash
#!/bin/bash
# scripts/weekly-security-scan.sh

# Run comprehensive security audit
npm run security:full

# Check for new vulnerabilities
npm audit --json > audit_results.json
vulnerabilities=$(jq '.metadata.vulnerabilities.total' audit_results.json)

if [ "$vulnerabilities" -gt 0 ]; then
    echo "Security vulnerabilities detected: $vulnerabilities"
    # Send alert to security team
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"Weekly security scan found $vulnerabilities vulnerabilities\"}"
fi

# Run dependency check
npx dependency-check --project "Energy Drink App" --scan . --format JSON

echo "Weekly security scan completed"
```

### Monthly Maintenance Tasks

#### System Updates

```bash
#!/bin/bash
# scripts/monthly-system-updates.sh

# Update Node.js dependencies
echo "Updating Node.js dependencies..."
npm update

# Check for security updates
npm audit --fix

# Update system packages (if applicable)
# apt update && apt upgrade -y

# Update Vercel CLI
npm install -g vercel@latest

# Clean up old deployments
vercel rm --yes --token="$VERCEL_TOKEN" $(vercel list --token="$VERCEL_TOKEN" | tail -n +11 | awk '{print $1}' | head -n -5)

echo "Monthly system updates completed"
```

#### Performance Optimization

```bash
#!/bin/bash
# scripts/monthly-performance-optimization.sh

# Analyze and optimize database
echo "Optimizing database performance..."
# Run database optimization queries
# Reindex if needed
# Update table statistics

# Clear and regenerate caches
echo "Regenerating application caches..."
npm run cache:clear
npm run cache:warm

# Optimize images
echo "Optimizing static assets..."
npm run optimize:assets

# Update CDN cache
echo "Invalidating CDN cache..."
curl -X POST "https://api.vercel.com/v1/integrations/clear-cache" \
    -H "Authorization: Bearer $VERCEL_TOKEN"

echo "Monthly performance optimization completed"
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

#### Application Performance

```javascript
// Performance monitoring configuration
const performanceThresholds = {
  // Core Web Vitals
  FCP: { warning: 2000, critical: 4000 },     // First Contentful Paint
  LCP: { warning: 2500, critical: 4000 },     // Largest Contentful Paint
  CLS: { warning: 0.1, critical: 0.25 },      // Cumulative Layout Shift
  FID: { warning: 100, critical: 300 },       // First Input Delay
  
  // API Performance
  apiResponseTime: { warning: 1000, critical: 3000 },
  apiErrorRate: { warning: 0.01, critical: 0.05 },
  
  // Infrastructure
  uptime: { warning: 0.995, critical: 0.99 },
  errorRate: { warning: 0.005, critical: 0.01 },
  
  // Business Metrics
  conversionRate: { warning: 0.02, critical: 0.01 },
  bounceRate: { warning: 0.6, critical: 0.8 }
};

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
  }
  
  trackMetric(name, value, threshold) {
    this.metrics.set(name, value);
    
    if (value > threshold.critical) {
      this.triggerAlert('critical', name, value, threshold);
    } else if (value > threshold.warning) {
      this.triggerAlert('warning', name, value, threshold);
    }
  }
  
  triggerAlert(severity, metric, value, threshold) {
    const alert = {
      severity,
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.push(alert);
    this.sendAlert(alert);
  }
}
```

#### Real-time Monitoring Dashboard

```javascript
// Real-time performance dashboard
class MonitoringDashboard {
  constructor() {
    this.widgets = {
      uptime: new UptimeWidget(),
      responseTime: new ResponseTimeWidget(),
      errorRate: new ErrorRateWidget(),
      coreWebVitals: new CoreWebVitalsWidget(),
      activeUsers: new ActiveUsersWidget(),
      revenue: new RevenueWidget()
    };
  }
  
  async updateMetrics() {
    const metrics = await Promise.all([
      this.getUptime(),
      this.getResponseTime(),
      this.getErrorRate(),
      this.getCoreWebVitals(),
      this.getActiveUsers(),
      this.getRevenue()
    ]);
    
    this.updateWidgets(metrics);
  }
  
  async getUptime() {
    const response = await fetch('/api/health');
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: response.headers.get('x-response-time'),
      timestamp: Date.now()
    };
  }
}
```

### Performance Alerting

#### Alert Configuration

```javascript
// Alert configuration and routing
const alertConfig = {
  channels: {
    email: {
      enabled: true,
      recipients: ['ops@energydrink.app', 'dev@energydrink.app']
    },
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts'
    },
    pagerduty: {
      enabled: true,
      integrationKey: process.env.PAGERDUTY_KEY,
      serviceId: 'energy-drink-app'
    }
  },
  
  rules: [
    {
      name: 'High Error Rate',
      condition: 'errorRate > 0.05',
      severity: 'critical',
      channels: ['email', 'slack', 'pagerduty']
    },
    {
      name: 'Slow Response Time',
      condition: 'apiResponseTime > 3000',
      severity: 'warning',
      channels: ['email', 'slack']
    },
    {
      name: 'Low Uptime',
      condition: 'uptime < 0.99',
      severity: 'critical',
      channels: ['email', 'slack', 'pagerduty']
    }
  ]
};
```

#### Automated Response to Performance Issues

```javascript
// Automated performance remediation
class PerformanceRemediation {
  async handlePerformanceIssue(issue) {
    switch (issue.type) {
      case 'high_error_rate':
        return this.scaleUpResources();
      case 'slow_response_time':
        return this.clearCache();
      case 'low_uptime':
        return this.restartServices();
      case 'memory_leak':
        return this.triggerGarbageCollection();
    }
  }
  
  async scaleUpResources() {
    // Scale Vercel functions if needed
    console.log('Scaling up resources...');
    // Implementation would depend on infrastructure setup
  }
  
  async clearCache() {
    // Clear application caches
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    });
    return response.json();
  }
  
  async restartServices() {
    // Restart affected services
    console.log('Restarting services...');
    // This would involve infrastructure-specific commands
  }
}
```

## Security Maintenance

### Regular Security Audits

#### Automated Security Scanning

```bash
#!/bin/bash
# scripts/security-audit.sh

# Run comprehensive security audit
echo "Running security audit..."

# 1. Dependency vulnerability scan
npm audit --audit-level moderate

# 2. Static code security analysis
npm run security:lint

# 3. Container security scan (if applicable)
# docker run --rm -v $(pwd):/app aquasec/trivy fs /app

# 4. SSL/TLS configuration check
curl -s -I https://app.energydrink.app | grep -E "(Strict-Transport|X-Content-Type|X-Frame)"

# 5. Security headers verification
curl -s https://app.energydrink.app | grep -E "(X-XSS|X-Content-Type)"

# 6. Rate limiting test
for i in {1..10}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://app.energydrink.app/api/health
done

echo "Security audit completed"
```

#### Penetration Testing

```bash
#!/bin/bash
# scripts/penetration-testing.sh

# Automated penetration testing
echo "Running penetration tests..."

# 1. OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://app.energydrink.app \
  -J zap-report.json

# 2. Nikto web vulnerability scanner
nikto -h https://app.energydrink.app -Format json -output nikto-report.json

# 3. SQL injection testing
# Use sqlmap for automated SQL injection testing
sqlmap -u "https://app.energydrink.app/api/flavors?id=test" \
  --batch --crawl=2 --risk=1

# 4. XSS testing
# Automated XSS testing tools
echo "XSS testing completed"

echo "Penetration testing completed"
```

### Security Updates

#### Dependency Updates

```bash
#!/bin/bash
# scripts/security-updates.sh

# Check for security updates
npm outdated

# Apply security patches
npm audit fix

# Update major versions safely
npm update

# Verify no breaking changes
npm run test

echo "Security updates completed"
```

#### Certificate Management

```bash
#!/bin/bash
# scripts/certificate-maintenance.sh

# Check SSL certificate expiration
CERT_EXPIRY=$(echo | openssl s_client -servername app.energydrink.app -connect app.energydrink.app:443 2>/dev/null | \
  openssl x509 -noout -dates | grep notAfter | cut -d= -f2)

EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))

echo "Certificate expires in $DAYS_UNTIL_EXPIRY days"

if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
    echo "WARNING: Certificate expires soon!"
    # Send alert
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"SSL certificate expires in $DAYS_UNTIL_EXPIRY days\"}"
fi
```

## Data Management

### Backup Procedures

#### Automated Backup System

```bash
#!/bin/bash
# scripts/automated-backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="energy-drink-backups"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# 1. Application data backup
echo "Backing up application data..."
cp -r src/data "$BACKUP_DIR/$DATE/"
cp package*.json "$BACKUP_DIR/$DATE/"
cp next.config.ts "$BACKUP_DIR/$DATE/"
cp vercel.json "$BACKUP_DIR/$DATE/"

# 2. Configuration backup
echo "Backing up configuration..."
vercel env ls > "$BACKUP_DIR/$DATE/environment-variables.txt"

# 3. Database backup (if applicable)
if [ ! -z "$DATABASE_URL" ]; then
    echo "Backing up database..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$DATE/database.sql"
fi

# 4. Create backup manifest
cat > "$BACKUP_DIR/$DATE/manifest.json" << EOF
{
    "timestamp": "$DATE",
    "version": "$(npm run --silent version)",
    "commit": "$(git rev-parse HEAD)",
    "branch": "$(git branch --show-current)",
    "files": [
        "src/data",
        "package.json",
        "package-lock.json",
        "next.config.ts",
        "vercel.json"
    ]
}
EOF

# 5. Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# 6. Upload to cloud storage
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" "s3://$S3_BUCKET/database/"

# 7. Clean old local backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

#### Backup Verification

```bash
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

# Extract and verify backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Verify manifest
if [ -f "$TEMP_DIR"/*/manifest.json ]; then
    echo "Backup manifest found and verified"
else
    echo "ERROR: Backup manifest not found"
    exit 1
fi

# Verify critical files
CRITICAL_FILES=("package.json" "next.config.ts" "src/data")
for file in "${CRITICAL_FILES[@]}"; do
    if find "$TEMP_DIR" -name "$file" -type f | grep -q .; then
        echo "✓ $file verified"
    else
        echo "✗ $file missing"
        exit 1
    fi
done

# Test data integrity
if find "$TEMP_DIR" -name "*.json" -type f | xargs -I {} sh -c 'jq empty {}' 2>/dev/null; then
    echo "✓ JSON data integrity verified"
else
    echo "✗ JSON data integrity failed"
    exit 1
fi

rm -rf "$TEMP_DIR"
echo "Backup verification completed successfully"
```

### Data Recovery Procedures

#### Disaster Recovery Plan

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

BACKUP_FILE=$1
RECOVERY_DIR="./recovery"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "Starting disaster recovery from $BACKUP_FILE"

# 1. Stop application
echo "Stopping application..."
pm2 stop energy-drink-app

# 2. Create safety backup
echo "Creating safety backup..."
cp -r . "$RECOVERY_DIR/$(date +%Y%m%d_%H%M%S)_safety"

# 3. Extract backup
echo "Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_CONTENT=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)

# 4. Verify backup integrity
if [ ! -f "$BACKUP_CONTENT/manifest.json" ]; then
    echo "ERROR: Invalid backup file"
    exit 1
fi

# 5. Restore application files
echo "Restoring application files..."
cp -r "$BACKUP_CONTENT"/* .

# 6. Restore database (if applicable)
if [ -f "$BACKUP_CONTENT/database.sql" ]; then
    echo "Restoring database..."
    dropdb --if-exists energy_drink_db
    createdb energy_drink_db
    psql "$DATABASE_URL" < "$BACKUP_CONTENT/database.sql"
fi

# 7. Restore environment variables
echo "Restoring environment variables..."
# This would restore from backup environment variables

# 8. Install dependencies
echo "Installing dependencies..."
npm ci

# 9. Run integrity checks
echo "Running integrity checks..."
npm run test:smoke

# 10. Start application
echo "Starting application..."
pm2 start energy-drink-app

# 11. Verify recovery
echo "Verifying recovery..."
sleep 30
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Application recovered successfully"
else
    echo "✗ Application recovery failed"
    exit 1
fi

rm -rf "$TEMP_DIR"
echo "Disaster recovery completed"
```

## Scaling Procedures

### Horizontal Scaling

#### Load Testing

```bash
#!/bin/bash
# scripts/load-testing.sh

# Install load testing tools
npm install -g artillery

# Create load test configuration
cat > load-test-config.yml << EOF
config:
  target: 'https://app.energydrink.app'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  defaults:
    headers:
      User-Agent: 'Artillery Load Test'

scenarios:
  - name: "Homepage and API"
    weight: 60
    flow:
      - get:
          url: "/"
      - think: 2
      - get:
          url: "/api/flavors"
      - think: 1
      - get:
          url: "/api/ingredients"

  - name: "Calculator flow"
    weight: 40
    flow:
      - get:
          url: "/calculator"
      - think: 3
      - get:
          url: "/api/flavors"
      - think: 2
      - get:
          url: "/api/ingredients?limit=10"
EOF

# Run load test
artillery run load-test-config.yml

# Generate report
artillery report load-test-config.yml
```

#### Auto-scaling Configuration

```javascript
// Auto-scaling configuration for Vercel
const scalingConfig = {
  // Function-specific scaling
  functions: {
    'api/flavors': {
      maxInstances: 1000,
      memory: 1024, // MB
      executionTimeout: 30
    },
    'api/ingredients': {
      maxInstances: 500,
      memory: 512,
      executionTimeout: 15
    }
  },
  
  // Global scaling policies
  scaling: {
    // Scale up when CPU > 70% for 2 minutes
    scaleUp: {
      cpuThreshold: 70,
      duration: 120,
      increment: 2
    },
    
    // Scale down when CPU < 30% for 5 minutes
    scaleDown: {
      cpuThreshold: 30,
      duration: 300,
      decrement: 1
    }
  },
  
  // Geographic distribution
  regions: {
    primary: ['fra1', 'cdg1', 'lhr1'],
    backup: ['ams1', 'sfo1', 'hnd1']
  }
};
```

### Database Scaling

#### Database Performance Optimization

```sql
-- Database scaling and optimization

-- 1. Index optimization
CREATE INDEX CONCURRENTLY idx_flavors_category ON flavors(category);
CREATE INDEX CONCURRENTLY idx_ingredients_safety ON ingredients(safety->>'euCompliant');

-- 2. Query optimization
EXPLAIN ANALYZE SELECT * FROM flavors WHERE category = 'cola';

-- 3. Partitioning for large tables (if needed)
CREATE TABLE flavors_2024 PARTITION OF flavors
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 4. Connection pooling optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- 5. Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Application Performance Issues

```bash
#!/bin/bash
# scripts/performance-troubleshooting.sh

echo "Troubleshooting performance issues..."

# 1. Check system resources
echo "System Resource Usage:"
top -bn1 | head -20
df -h
free -m

# 2. Check application logs
echo "Recent Application Logs:"
tail -n 50 /var/log/application.log

# 3. Check Vercel function logs
echo "Vercel Function Logs:"
vercel logs --follow

# 4. Check database performance
echo "Database Performance:"
psql "$DATABASE_URL" -c "
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"

# 5. Check network connectivity
echo "Network Connectivity:"
ping -c 3 api.energydrink.app
curl -w "@curl-format.txt" -o /dev/null -s https://app.energydrink.app

# 6. Check CDN performance
echo "CDN Performance:"
curl -w "DNS Lookup: %{time_namelookup}\nConnect: %{time_connect}\nSSL: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n" \
    -o /dev/null -s https://app.energydrink.app

echo "Performance troubleshooting completed"
```

#### Memory Issues

```bash
#!/bin/bash
# scripts/memory-troubleshooting.sh

echo "Investigating memory issues..."

# Check memory usage
echo "Memory Usage:"
free -h
ps aux --sort=-%mem | head -10

# Check for memory leaks
echo "Memory Leaks:"
pm2 logs energy-drink-app --lines 100 | grep -i "memory\|oom\|killed"

# Check Node.js heap usage
echo "Node.js Heap Usage:"
node -e "
const v8 = require('v8');
const totalHeapSize = v8.getHeapStatistics().total_heap_size;
const usedHeapSize = v8.getHeapStatistics().used_heap_size;
console.log('Total Heap Size:', Math.round(totalHeapSize / 1024 / 1024), 'MB');
console.log('Used Heap Size:', Math.round(usedHeapSize / 1024 / 1024), 'MB');
console.log('Heap Size Limit:', Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024), 'MB');
"

# Restart application if memory usage is high
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage detected: ${MEMORY_USAGE}%"
    echo "Restarting application..."
    pm2 restart energy-drink-app
fi

echo "Memory troubleshooting completed"
```

#### Database Connection Issues

```bash
#!/bin/bash
# scripts/database-troubleshooting.sh

echo "Troubleshooting database issues..."

# Check database connectivity
echo "Database Connectivity:"
pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"

# Check active connections
echo "Active Connections:"
psql "$DATABASE_URL" -c "
SELECT count(*) as active_connections,
       state,
       usename
FROM pg_stat_activity 
GROUP BY state, usename;
"

# Check long-running queries
echo "Long-running Queries:"
psql "$DATABASE_URL" -c "
SELECT pid,
       now() - pg_stat_activity.query_start AS duration,
       query,
       state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;
"

# Check database locks
echo "Database Locks:"
psql "$DATABASE_URL" -c "
SELECT 
    l.locktype,
    page,
    virtualtransaction,
    pid,
    mode,
    granted
FROM pg_stat_activity a
JOIN pg_locks l ON a.pid = l.pid
WHERE a.datname = current_database()
ORDER BY relation, page, virtualtransaction;
"

# Check disk space
echo "Database Disk Space:"
psql "$DATABASE_URL" -c "
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    pg_size_pretty(pg_total_relation_size('flavors')) as flavors_table_size,
    pg_size_pretty(pg_total_relation_size('ingredients')) as ingredients_table_size;
"

echo "Database troubleshooting completed"
```

### Emergency Response Procedures

#### Service Outage Response

```bash
#!/bin/bash
# scripts/emergency-response.sh

SEVERITY=$1
DESCRIPTION=$2

if [ -z "$SEVERITY" ] || [ -z "$DESCRIPTION" ]; then
    echo "Usage: $0 <severity> <description>"
    echo "Severity: critical|high|medium|low"
    exit 1
fi

echo "Emergency response initiated: $SEVERITY - $DESCRIPTION"

# 1. Create incident record
INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"
echo "Incident ID: $INCIDENT_ID"

# 2. Notify incident response team
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{
        \"channel\": \"#incidents\",
        \"username\": \"IncidentBot\",
        \"text\": \"🚨 $SEVERITY Incident: $DESCRIPTION\",
        \"attachments\": [{
            \"color\": \"danger\",
            \"fields\": [
                {\"title\": \"Incident ID\", \"value\": \"$INCIDENT_ID\", \"short\": true},
                {\"title\": \"Severity\", \"value\": \"$SEVERITY\", \"short\": true},
                {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
            ]
        }]
    }"

# 3. Immediate diagnostics
echo "Running immediate diagnostics..."

# Check application status
if curl -f -s https://app.energydrink.app/api/health > /dev/null; then
    echo "✓ Application is responding"
else
    echo "✗ Application is not responding"
    
    # Attempt immediate restart
    echo "Attempting application restart..."
    vercel rollback
    sleep 30
    
    # Check if restart resolved issue
    if curl -f -s https://app.energydrink.app/api/health > /dev/null; then
        echo "✓ Application restored"
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"✅ Application restored successfully\"}"
    else
        echo "✗ Application restart failed"
    fi
fi

# 4. Gather diagnostic information
echo "Gathering diagnostic information..."
{
    echo "=== SYSTEM STATUS ==="
    uptime
    free -h
    df -h
    echo "=== APPLICATION STATUS ==="
    vercel ls
    echo "=== RECENT ERRORS ==="
    # Get recent errors from Sentry
    curl -s "https://api.sentry.io/api/0/projects/your-org/your-project/events/?limit=10" | jq '.[].title'
} > "incident-$INCIDENT_ID-diagnostics.txt"

# 5. Update status page
curl -X POST "$STATUSPAGE_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
        \"incident\": {
            \"name\": \"$DESCRIPTION\",
            \"status\": \"investigating\",
            \"severity\": \"$SEVERITY\"
        }
    }"

echo "Emergency response procedures completed"
echo "Incident ID: $INCIDENT_ID"
echo "Diagnostic information saved to: incident-$INCIDENT_ID-diagnostics.txt"
```

## Incident Response

### Incident Classification

#### Severity Levels

| Severity | Response Time | Description | Examples |
|----------|---------------|-------------|----------|
| **Critical** | 15 minutes | Complete service outage | Site down, data loss |
| **High** | 1 hour | Major functionality broken | Calculator not working |
| **Medium** | 4 hours | Minor functionality issues | Slow performance |
| **Low** | 1 business day | Cosmetic issues | UI glitches |

### Incident Response Team

#### Roles and Responsibilities

```yaml
incident_response_team:
  incident_commander:
    role: "Overall incident coordination"
    responsibilities:
      - Declare incident severity
      - Coordinate response team
      - Make escalation decisions
      - Communicate with stakeholders
  
  technical_lead:
    role: "Technical investigation and resolution"
    responsibilities:
      - Investigate root cause
      - Implement fixes
      - Validate solutions
      - Provide technical updates
  
  communications:
    role: "Stakeholder communication"
    responsibilities:
      - Update status page
      - Notify customers
      - Update internal teams
      - Coordinate with vendors
  
  scribe:
    role: "Documentation and timeline"
    responsibilities:
      - Document timeline
      - Record actions taken
      - Track investigation steps
      - Prepare post-incident report
```

#### Escalation Procedures

```javascript
// Escalation decision tree
class IncidentEscalation {
  constructor() {
    this.escalationMatrix = {
      '15_minutes': 'incident_commander',
      '30_minutes': 'technical_lead',
      '1_hour': 'engineering_manager',
      '2_hours': 'cto',
      '4_hours': 'ceo'
    };
  }
  
  determineEscalationLevel(elapsedTime, severity) {
    const severityMultipliers = {
      'critical': 1,
      'high': 2,
      'medium': 4,
      'low': 8
    };
    
    const effectiveElapsed = elapsedTime * severityMultipliers[severity];
    
    for (const [threshold, role] of Object.entries(this.escalationMatrix)) {
      const thresholdMinutes = this.parseThreshold(threshold);
      if (effectiveElapsed >= thresholdMinutes) {
        return role;
      }
    }
    
    return null;
  }
  
  parseThreshold(threshold) {
    const match = threshold.match(/(\d+)_minutes/);
    return match ? parseInt(match[1]) : 0;
  }
}
```

### Post-Incident Procedures

#### Post-Incident Review

```bash
#!/bin/bash
# scripts/post-incident-review.sh

INCIDENT_ID=$1
INCIDENT_DATE=$2
SEVERITY=$3

if [ -z "$INCIDENT_ID" ] || [ -z "$INCIDENT_DATE" ] || [ -z "$SEVERITY" ]; then
    echo "Usage: $0 <incident-id> <incident-date> <severity>"
    exit 1
fi

# Create post-incident report
REPORT_FILE="post-incident-$INCIDENT_ID.md"

cat > "$REPORT_FILE" << EOF
# Post-Incident Review: $INCIDENT_ID

## Incident Summary
- **Incident ID**: $INCIDENT_ID
- **Date**: $INCIDENT_DATE
- **Severity**: $SEVERITY
- **Duration**: [To be filled]
- **Impact**: [To be filled]

## Timeline
| Time | Event | Action Taken |
|------|-------|--------------|
EOF

# Add timeline from incident logs
echo "Generating post-incident report: $REPORT_FILE"

# Gather metrics and lessons learned
echo "## Root Cause Analysis
[To be filled during review meeting]

## Lessons Learned
[To be filled during review meeting]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
EOF

echo "Post-incident review template created: $REPORT_FILE"
```

## Compliance and Auditing

### GDPR Compliance Maintenance

#### Data Retention Policies

```bash
#!/bin/bash
# scripts/gdpr-compliance-maintenance.sh

echo "Running GDPR compliance maintenance..."

# 1. Data retention audit
echo "Auditing data retention..."

# Check analytics data age
ANALYTICS_DATA_AGE=$(find ./analytics -name "*.json" -type f -exec stat -c %Y {} \; | sort -nr | head -1)
CURRENT_TIME=$(date +%s)
AGE_DAYS=$(( (CURRENT_TIME - ANALYTICS_DATA_AGE) / 86400 ))

if [ "$AGE_DAYS" -gt 365 ]; then
    echo "Analytics data older than 1 year found: $AGE_DAYS days"
    # Archive or delete old analytics data
fi

# 2. User consent verification
echo "Verifying user consent records..."
curl -s "https://api.sentry.io/api/0/projects/your-org/your-project/tags/" | \
    jq '.[] | select(.key == "gdpr_consent") | .total'

# 3. Data export request processing
echo "Processing pending data export requests..."
# Check for pending export requests
PENDING_EXPORTS=$(find ./exports -name "*.json" -type f -newer $(date -d '7 days ago' +%Y%m%d) 2>/dev/null | wc -l)
echo "Pending exports: $PENDING_EXPORTS"

# 4. Right to be forgotten processing
echo "Processing right to be forgotten requests..."
# Check for pending deletion requests
PENDING_DELETIONS=$(find ./deletions -name "*.json" -type f -newer $(date -d '30 days ago' +%Y%m%d) 2>/dev/null | wc -l)
echo "Pending deletions: $PENDING_DELETIONS"

# 5. Generate compliance report
echo "Generating compliance report..."
cat > gdpr-compliance-report-$(date +%Y%m%d).json << EOF
{
  "report_date": "$(date -I)",
  "data_retention": {
    "analytics_data_max_age_days": $AGE_DAYS,
    "compliant": $([ "$AGE_DAYS" -le 365 ] && echo "true" || echo "false")
  },
  "consent_tracking": {
    "total_consents": "TBD",
    "consent_rate": "TBD"
  },
  "data_subject_requests": {
    "pending_exports": $PENDING_EXPORTS,
    "pending_deletions": $PENDING_DELETIONS,
    "average_processing_time_days": "TBD"
  }
}
EOF

echo "GDPR compliance maintenance completed"
```

### Security Auditing

#### Monthly Security Audit

```bash
#!/bin/bash
# scripts/monthly-security-audit.sh

AUDIT_DATE=$(date +%Y%m%d)
AUDIT_DIR="./security-audits/$AUDIT_DATE"
REPORT_FILE="$AUDIT_DIR/security-audit-report.md"

mkdir -p "$AUDIT_DIR"

echo "Running monthly security audit for $AUDIT_DATE"

# 1. Vulnerability scan
echo "Running vulnerability scan..."
npm audit --json > "$AUDIT_DIR/npm-audit.json"
VULNERABILITIES=$(jq '.metadata.vulnerabilities.total' "$AUDIT_DIR/npm-audit.json")

# 2. SSL/TLS audit
echo "Performing SSL/TLS audit..."
testssl.sh --jsonfile-pretty "$AUDIT_DIR/ssl-audit.json" app.energydrink.app

# 3. Security headers audit
echo "Auditing security headers..."
curl -s -I https://app.energydrink.app | grep -E "(X-|Strict-Content)" > "$AUDIT_DIR/headers.txt"

# 4. Access control audit
echo "Auditing access controls..."
# Check Vercel team permissions
vercel teams ls > "$AUDIT_DIR/teams.txt"

# 5. Generate report
cat > "$REPORT_FILE" << EOF
# Monthly Security Audit Report

**Date**: $AUDIT_DATE
**Auditor**: Security Team
**Scope**: Full application security review

## Executive Summary

- **Vulnerabilities Found**: $VULNERABILITIES
- **SSL Rating**: [To be filled from SSL audit]
- **Security Headers**: [To be filled from headers audit]
- **Access Control**: [To be filled from access audit]

## Detailed Findings

### Dependency Vulnerabilities
$(jq -r '.vulnerabilities | to_entries[] | "- \(.key): \(.value.severity)"' "$AUDIT_DIR/npm-audit.json")

### SSL/TLS Configuration
$(cat "$AUDIT_DIR/ssl-audit.json" | jq -r '.scanDetails[] | "- \(.id): \(.finding)"')

### Security Headers
$(cat "$AUDIT_DIR/headers.txt")

### Recommendations
1. [To be filled based on findings]
2. [To be filled based on findings]
3. [To be filled based on findings]

---
*Report generated on $(date)*
EOF

echo "Security audit completed. Report: $REPORT_FILE"
```

## Operational Runbooks

### Daily Operations Checklist

```markdown
# Daily Operations Checklist

## System Health (Daily 09:00)
- [ ] Check application uptime
- [ ] Review error rates in Sentry
- [ ] Verify API response times
- [ ] Check database performance
- [ ] Monitor disk space
- [ ] Review security alerts

## Performance Monitoring (Daily 10:00)
- [ ] Review Core Web Vitals
- [ ] Check CDN performance
- [ ] Monitor conversion rates
- [ ] Analyze user behavior
- [ ] Review A/B test results

## Security Checks (Daily 11:00)
- [ ] Review security scan results
- [ ] Check for new vulnerabilities
- [ ] Verify SSL certificate status
- [ ] Monitor access logs
- [ ] Review firewall alerts

## Data Management (Daily 14:00)
- [ ] Verify backup completion
- [ ] Check data integrity
- [ ] Monitor storage usage
- [ ] Review GDPR compliance
- [ ] Process data retention

## Communication (Daily 16:00)
- [ ] Update team on status
- [ ] Review customer feedback
- [ ] Check support tickets
- [ ] Update incident status
- [ ] Prepare daily summary

---
**Completed by**: ________________
**Date**: ________________
**Notes**: ________________
```

### Weekly Operations Report

```bash
#!/bin/bash
# scripts/weekly-operations-report.sh

WEEK_ENDING=$(date +%Y-%m-%d)
REPORT_FILE="weekly-operations-$WEEK_ENDING.md"

cat > "$REPORT_FILE" << EOF
# Weekly Operations Report
**Week Ending**: $WEEK_ENDING
**Prepared by**: Operations Team

## System Performance Summary

### Uptime and Availability
- **Total Uptime**: [To be filled]
- **Planned Downtime**: [To be filled]
- **Unplanned Downtime**: [To be filled]
- **MTTR**: [To be filled]

### Performance Metrics
- **Average Response Time**: [To be filled]
- **Peak Response Time**: [To be filled]
- **Error Rate**: [To be filled]
- **User Satisfaction**: [To be filled]

## Security Summary
- **Vulnerabilities Found**: [To be filled]
- **Security Incidents**: [To be filled]
- **Compliance Score**: [To be filled]

## Operational Highlights
### Completed Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### In Progress
- [ ] Task A
- [ ] Task B

### Planned for Next Week
- [ ] Task X
- [ ] Task Y

## Action Items
| Item | Owner | Due Date | Status |
|------|-------|----------|--------|

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---
*Report generated on $(date)*
EOF

echo "Weekly operations report created: $REPORT_FILE"
```

This comprehensive maintenance guide provides detailed procedures for maintaining the Energy Drink Calculator application in production, ensuring optimal performance, security, and reliability through systematic monitoring, proactive maintenance, and efficient incident response.