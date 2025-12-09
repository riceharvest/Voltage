# Operational Runbooks

This document contains step-by-step procedures for common operational tasks in the Energy Drink Calculator application.

## Deployment Runbook

### Standard Deployment Procedure

**Purpose:** Deploy new code changes to production environment.

**Prerequisites:**
- Code changes merged to `main` branch
- All CI/CD checks passed
- Pre-deployment checklist completed

**Steps:**

1. **Pre-deployment Verification**
   ```bash
   # Run tests locally
   npm run test

   # Check linting
   npm run lint

   # Build verification
   npm run build
   ```

2. **Automated Deployment**
   ```bash
   # Deployment is automatic via GitHub Actions on merge to main
   # Monitor deployment in Vercel dashboard
   ```

3. **Post-deployment Verification**
   - Check Vercel deployment status
   - Verify application loads correctly
   - Run smoke tests: `npm run test:e2e:smoke`
   - Monitor error rates in Sentry

**Rollback Procedure:** See rollback runbook below.

### Blue-Green Deployment

**Purpose:** Deploy with zero downtime using blue-green strategy.

**Steps:**
```bash
# Use blue-green deployment script
node scripts/blue-green-deploy.js

# Monitor traffic shift
# Verify health checks pass
# Complete traffic migration
```

## Backup and Restore Runbook

### Data Backup Procedure

**Purpose:** Create backups of application data.

**Frequency:** Daily automated, manual as needed.

**Steps:**
```bash
# Create data backup
node scripts/backup-data.js

# Verify backup integrity
node scripts/validate-data.js --backup <backup-dir>
```

### Data Restore Procedure

**Purpose:** Restore application data from backup.

**Steps:**
```bash
# Identify backup to restore
ls backups/

# Restore data
node scripts/restore-data.js <backup-directory>

# Validate restored data
node scripts/validate-data.js
```

## Monitoring Runbook

### Health Check Procedure

**Purpose:** Verify application health and performance.

**Frequency:** Continuous via automated checks.

**Steps:**
1. Check application endpoints:
   - GET /api/health
   - GET / (homepage)

2. Verify key metrics:
   - Response times < 2s
   - Error rate < 1%
   - Uptime > 99.9%

3. Monitor external dependencies:
   - Vercel platform status
   - Sentry connectivity

### Performance Monitoring

**Steps:**
1. Check Core Web Vitals in Vercel Analytics
2. Review error trends in Sentry
3. Monitor function execution times
4. Analyze user feedback metrics

## Incident Response Runbook

### Critical Incident Procedure

**Purpose:** Respond to production incidents.

**Steps:**

1. **Detection**
   - Monitor alerts from Sentry/Vercel
   - Check user reports

2. **Assessment**
   - Determine impact and severity
   - Identify affected components

3. **Response**
   - Implement immediate mitigation
   - Communicate with stakeholders
   - Begin investigation

4. **Recovery**
   - Apply fix or rollback
   - Verify system stability
   - Monitor for 24 hours

5. **Post-mortem**
   - Document incident
   - Identify improvements
   - Update runbooks

### Emergency Contacts

- **Technical Lead:** [Contact Info]
- **DevOps/SRE:** [Contact Info]
- **Security Team:** [Contact Info]

## Maintenance Runbook

### Cache Invalidation

**Purpose:** Clear application caches when needed.

**Steps:**
```bash
# Invalidate cache
node scripts/invalidate-cache.js

# Or via API
curl -X POST /api/admin/invalidate-cache
```

### Database Maintenance

**Purpose:** Perform routine database maintenance.

**Steps:**
```bash
# Run maintenance scripts
node scripts/db-maintenance.js

# Update data sources
node scripts/sync-suppliers.js
```

### Security Updates

**Purpose:** Apply security patches and updates.

**Steps:**
1. Monitor security advisories
2. Test updates in staging
3. Apply updates during maintenance window
4. Verify security posture

## Troubleshooting Runbook

### Common Issues

#### High Error Rates
**Symptoms:** Increased 4xx/5xx responses
**Steps:**
1. Check Sentry for error details
2. Review recent deployments
3. Check resource utilization
4. Scale if needed

#### Slow Performance
**Symptoms:** High response times
**Steps:**
1. Check Vercel function metrics
2. Review cache hit rates
3. Optimize queries
4. Consider scaling

#### Data Inconsistencies
**Symptoms:** Incorrect data display
**Steps:**
1. Validate data integrity
2. Check cache consistency
3. Restore from backup if needed

## Escalation Procedures

### When to Escalate

- **Severity 1 (Critical):** System down, data loss
- **Severity 2 (High):** Major functionality broken
- **Severity 3 (Medium):** Minor issues, performance degradation
- **Severity 4 (Low):** Cosmetic issues, minor bugs

### Escalation Contacts

- **Level 1:** On-call engineer
- **Level 2:** Technical lead
- **Level 3:** Engineering manager
- **Level 4:** CTO