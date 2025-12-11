# Global Database Architecture with Multi-Region Replication

## Executive Summary

This document outlines the comprehensive global database architecture designed to support worldwide operations with enterprise-grade data consistency, availability, and performance across multiple regions and cloud providers.

## Database Strategy Overview

### Multi-Region Database Architecture

#### Primary Database Strategy
- **Multi-Region PostgreSQL Clusters**: 3 primary regions (US-East, EU-West, APAC-Singapore)
- **Cross-Region Replication**: Real-time asynchronous replication
- **Read Replica Distribution**: Local read replicas in each region
- **Connection Pooling**: PgBouncer with regional affinity routing

#### Database Topology
```
Global Database Architecture:
├── Primary Write Regions
│   ├── US-East-1 (Primary Americas)
│   ├── EU-West-1 (Primary EMEA)
│   └── AP-Southeast-1 (Primary APAC)
│
├── Secondary Regions
│   ├── US-West-2 (Backup Americas)
│   ├── EU-Central-1 (Backup EMEA)
│   ├── AP-Northeast-1 (Backup APAC)
│   └── CA-Central-1 (Edge Canada)
│
└── Read Replica Network
    ├── 1-3 replicas per region
    ├── Local read affinity
    ├── Cross-region failover
    └── Automatic promotion
```

## Regional Database Configuration

### Primary Region Setup

#### US-East-1 (Primary Americas)
```yaml
# Primary database cluster configuration
DatabaseCluster:
  Region: us-east-1
  Type: PostgreSQL 15.4
  InstanceClass: db.r6g.2xlarge (8 vCPU, 64GB RAM)
  Storage: 
    Type: gp3
    Size: 1TB
    IOPS: 3000
    Throughput: 125 MB/s
  
  MultiAZ: true
  AutomatedBackups: true
  BackupRetention: 30 days
  PreferredMaintenanceWindow: "sun:05:00-sun:06:00"
  PreferredBackupWindow: "03:00-04:00"
  
  PerformanceInsights: true
  MonitoringInterval: 60 seconds
  CloudWatchLogs: true
  
  Security:
    Encryption: AES-256 at rest
    SSL: TLS 1.2+ enforced
    VPC: Isolated private subnet
    SecurityGroups: Restricted access only
    
  ReadReplicas:
    - Region: us-west-2
      InstanceClass: db.r6g.xlarge
      ReplicaSource: us-east-1-primary
    - Region: ca-central-1
      InstanceClass: db.r6g.large
      ReplicaSource: us-east-1-primary
```

#### EU-West-1 (Primary EMEA)
```yaml
DatabaseCluster:
  Region: eu-west-1
  Type: PostgreSQL 15.4
  InstanceClass: db.r6g.2xlarge (8 vCPU, 64GB RAM)
  Storage:
    Type: gp3
    Size: 1TB
    IOPS: 3000
    Throughput: 125 MB/s
  
  MultiAZ: true
  AutomatedBackups: true
  BackupRetention: 30 days
  
  GDPRCompliance: true
  DataResidency: EU-only processing
  AuditLogging: Comprehensive
  PointInTimeRecovery: 30 days
  
  ReadReplicas:
    - Region: eu-central-1
      InstanceClass: db.r6g.xlarge
      ReplicaSource: eu-west-1-primary
    - Region: eu-west-3
      InstanceClass: db.r6g.large
      ReplicaSource: eu-west-1-primary
```

#### AP-Southeast-1 (Primary APAC)
```yaml
DatabaseCluster:
  Region: ap-southeast-1
  Type: PostgreSQL 15.4
  InstanceClass: db.r6g.2xlarge (8 vCPU, 64GB RAM)
  Storage:
    Type: gp3
    Size: 1TB
    IOPS: 3000
    Throughput: 125 MB/s
  
  MultiAZ: true
  AutomatedBackups: true
  BackupRetention: 30 days
  
  DataResidency: Regional compliance
  PerformanceOptimization: High throughput
  ConnectionPooling: Advanced
  
  ReadReplicas:
    - Region: ap-northeast-1
      InstanceClass: db.r6g.xlarge
      ReplicaSource: ap-southeast-1-primary
    - Region: ap-south-1
      InstanceClass: db.r6g.large
      ReplicaSource: ap-southeast-1-primary
```

## Data Consistency Models

### Consistency Level Configuration

#### Strong Consistency (Critical Data)
```sql
-- Financial transactions, inventory, user accounts
-- Real-time synchronous replication
-- Cross-region transaction commits

-- Enable synchronous replication for critical tables
ALTER TABLE financial_transactions SET (synchronous_commit = on);
ALTER TABLE inventory_levels SET (synchronous_commit = on);
ALTER TABLE user_accounts SET (synchronous_commit = on);

-- Configure synchronous_standby_names for primary regions
ALTER SYSTEM SET synchronous_standby_names = '2 (us-west-2_replica, ca-central-1_replica)';
```

#### Eventual Consistency (User Data)
```sql
-- User preferences, analytics, session data
-- Asynchronous replication with lag tolerance
-- Conflict resolution on merge

-- Configure for eventual consistency
ALTER TABLE user_preferences SET (synchronous_commit = local);
ALTER TABLE analytics_events SET (synchronous_commit = local);
ALTER TABLE user_sessions SET (synchronous_commit = local);

-- Set appropriate wal_level for replication
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;
```

#### Session Consistency (Shopping Carts)
```sql
-- Shopping carts, temporary data
-- Regional affinity with periodic sync
-- Local-first with background replication

-- Session-specific configuration
ALTER TABLE shopping_carts SET (synchronous_commit = local);
ALTER TABLE temporary_data SET (synchronous_commit = off);

-- Configure connection pooling for session affinity
-- PgBouncer transaction-level pooling
```

## Database Sharding Strategy

### Geographic Sharding

#### Regional Data Isolation
```sql
-- Create regional schemas for data isolation
CREATE SCHEMA IF NOT EXISTS americas;
CREATE SCHEMA IF NOT EXISTS emea;
CREATE SCHEMA IF NOT EXISTS apac;

-- Regional user data partitioning
CREATE TABLE americas.user_profiles (
    user_id UUID PRIMARY KEY,
    region TEXT NOT NULL DEFAULT 'americas',
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE emea.user_profiles (
    user_id UUID PRIMARY KEY,
    region TEXT NOT NULL DEFAULT 'emea',
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE apac.user_profiles (
    user_id UUID PRIMARY KEY,
    region TEXT NOT NULL DEFAULT 'apac',
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Functional Sharding

#### Feature-Based Database Separation
```yaml
# Database service separation
Databases:
  Core:
    - VoltageSodaCore (user management, authentication)
    - VoltageSodaRecipes (recipe data, ingredients)
    - VoltageSodaCommerce (orders, payments, inventory)
  
  Analytics:
    - VoltageSodaAnalytics (events, metrics, reporting)
    - VoltageSodaLogs (application logs, audit trails)
  
  Cache:
    - VoltageSodaCache (session data, temporary cache)
    - VoltageSodaQueue (job queues, background tasks)
```

### User ID Sharding

#### Horizontal Scaling by User Base
```sql
-- Shard user data by user ID hash
CREATE OR REPLACE FUNCTION get_user_shard(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Use consistent hashing for shard selection
    RETURN 'shard_' || (hashtext(user_id::text) % 16 + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create partitioned tables for user data
CREATE TABLE user_shard_1 (
    LIKE user_profiles INCLUDING ALL
) INHERITS (user_profiles);

CREATE TABLE user_shard_2 (
    LIKE user_profiles INCLUDING ALL
) INHERITS (user_profiles);

-- Add more shards as needed...
```

## Cross-Region Replication

### Streaming Replication Setup

#### Primary Configuration
```sql
-- Primary database replication settings
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 20;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET hot_standby = on;
ALTER SYSTEM SET max_standby_streaming_delay = 30s;
ALTER SYSTEM SET wal_receiver_status_interval = 1s;
ALTER SYSTEM SET hot_standby_feedback = off;

-- Network configuration
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
ALTER SYSTEM SET ssl_ca_file = 'ca.crt';

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '24GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
```

#### Replica Configuration
```sql
-- Replica database settings
ALTER SYSTEM SET hot_standby = on;
ALTER SYSTEM SET max_standby_streaming_delay = 30s;
ALTER SYSTEM SET wal_receiver_status_interval = 1s;
ALTER SYSTEM SET hot_standby_feedback = on;

-- Recovery configuration
ALTER SYSTEM SET recovery_target_timeline = 'latest';
ALTER SYSTEM SET recovery_min_apply_delay = 0;

-- Monitoring
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
```

### Conflict Resolution

#### Automatic Conflict Resolution
```sql
-- Create conflict resolution function
CREATE OR REPLACE FUNCTION resolve_user_update_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Last write wins with timestamp comparison
    IF NEW.updated_at > OLD.updated_at THEN
        RETURN NEW;
    ELSE
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply conflict resolution to user tables
CREATE TRIGGER user_profiles_conflict_resolution
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION resolve_user_update_conflict();

-- Similar triggers for other critical tables
CREATE TRIGGER inventory_levels_conflict_resolution
    BEFORE UPDATE ON inventory_levels
    FOR EACH ROW EXECUTE FUNCTION resolve_inventory_conflict();
```

## Database Monitoring and Performance

### Performance Monitoring

#### Key Metrics Tracking
```sql
-- Create performance monitoring views
CREATE VIEW database_performance AS
SELECT 
    datname as database_name,
    state,
    count(*) as connection_count,
    avg(now() - state_change) as avg_connection_duration,
    sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active_connections
FROM pg_stat_activity 
GROUP BY datname, state;

-- Slow query monitoring
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time
FROM pg_stat_statements 
ORDER BY total_time DESC
LIMIT 100;

-- Replication lag monitoring
CREATE VIEW replication_status AS
SELECT 
    application_name,
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;
```

#### Automated Performance Tuning
```sql
-- Auto-vacuum configuration
ALTER TABLE user_profiles SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE analytics_events SET (autovacuum_vacuum_scale_factor = 0.2);
ALTER TABLE financial_transactions SET (autovacuum_vacuum_scale_factor = 0.05);

-- Auto-analyze configuration
ALTER TABLE user_profiles SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE analytics_events SET (autovacuum_analyze_scale_factor = 0.1);

-- Index optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_region 
    ON user_profiles (region) WHERE region IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp 
    ON analytics_events (created_at) WHERE created_at > NOW() - INTERVAL '30 days';
```

### Database Maintenance

#### Automated Backup Strategy
```bash
#!/bin/bash
# Cross-region backup script

# Variables
PRIMARY_REGION="us-east-1"
BACKUP_REGIONS=("us-west-2" "eu-west-1" "ap-southeast-1")

# Create snapshot backup
aws rds create-db-snapshot \
    --db-instance-identifier voltage-soda-primary \
    --db-snapshot-identifier "voltage-soda-backup-$(date +%Y%m%d-%H%M%S)"

# Copy snapshots to other regions
for region in "${BACKUP_REGIONS[@]}"; do
    aws rds copy-db-snapshot \
        --source-db-snapshot-identifier "arn:aws:rds:$PRIMARY_REGION:123456789012:snapshot:voltage-soda-backup-$(date +%Y%m%d-%H%M%S)" \
        --target-db-snapshot-identifier "voltage-soda-backup-$(date +%Y%m%d-%H%M%S)-$region" \
        --source-region $PRIMARY_REGION \
        --region $region
done

# Automated point-in-time recovery testing
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier voltage-soda-test-restore \
    --db-snapshot-identifier voltage-soda-backup-$(date +%Y%m%d-%H%M%S) \
    --db-instance-class db.r6g.large \
    --region us-east-1
```

## Connection Management

### Connection Pooling Strategy

#### PgBouncer Configuration
```ini
# PgBouncer configuration for global database
[databases]
; Primary connections (write operations)
voltage_soda_primary = host=voltage-soda-primary.cluster.us-east-1.rds.amazonaws.com port=5432 dbname=voltage_soda

; Regional read replicas
voltage_soda_us_east_read = host=voltage-soda-us-east-replica.cluster.us-east-1.rds.amazonaws.com port=5432 dbname=voltage_soda
voltage_soda_us_west_read = host=voltage-soda-us-west-replica.cluster.us-west-2.rds.amazonaws.com port=5432 dbname=voltage_soda
voltage_soda_eu_west_read = host=voltage-soda-eu-west-replica.cluster.eu-west-1.rds.amazonaws.com port=5432 dbname=voltage_soda
voltage_soda_ap_southeast_read = host=voltage-soda-ap-southeast-replica.cluster.ap-southeast-1.rds.amazonaws.com port=5432 dbname=voltage_soda

[pgbouncer]
; Pool modes
pool_mode = transaction
server_reset_query = DISCARD ALL

; Connection limits
default_pool_size = 100
min_pool_size = 10
max_client_conn = 1000

; Timeouts
server_lifetime = 3600
server_idle_timeout = 600
client_idle_timeout = 600
query_timeout = 60

; Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

; DNS and routing
dns_max_ttl = 15
dns_nxdomain_ttl = 15
ignore_startup_parameters = extra_float_digits

; TLS configuration
ssl_mode = require
ssl_cert = /etc/ssl/certs/pgbouncer.crt
ssl_key = /etc/ssl/private/pgbouncer.key
ssl_ca_file = /etc/ssl/certs/ca.crt
```

### Regional Routing Logic

#### Application-Level Routing
```typescript
// Regional database connection manager
interface DatabaseConfig {
  region: string;
  primary: string;
  readReplicas: string[];
  consistency: 'strong' | 'eventual' | 'session';
}

const databaseConfigs: Record<string, DatabaseConfig> = {
  'americas': {
    region: 'us-east-1',
    primary: 'voltage_soda_primary',
    readReplicas: ['voltage_soda_us_east_read', 'voltage_soda_us_west_read'],
    consistency: 'strong'
  },
  'emea': {
    region: 'eu-west-1', 
    primary: 'voltage_soda_eu_west_read',
    readReplicas: ['voltage_soda_eu_west_read'],
    consistency: 'strong'
  },
  'apac': {
    region: 'ap-southeast-1',
    primary: 'voltage_soda_ap_southeast_read',
    readReplicas: ['voltage_soda_ap_southeast_read'],
    consistency: 'strong'
  }
};

class GlobalDatabaseManager {
  private getDatabaseForRegion(region: string, operation: 'read' | 'write'): string {
    const config = databaseConfigs[region];
    
    if (!config) {
      throw new Error(`Unknown region: ${region}`);
    }
    
    // Write operations go to primary
    if (operation === 'write') {
      return config.primary;
    }
    
    // Read operations use read replicas with round-robin
    const replicaIndex = Math.floor(Math.random() * config.readReplicas.length);
    return config.readReplicas[replicaIndex];
  }
  
  async executeQuery(region: string, operation: 'read' | 'write', query: string, params: any[]): Promise<any> {
    const database = this.getDatabaseForRegion(region, operation);
    
    try {
      // Execute query on appropriate database
      return await this.pool.query(query, params);
    } catch (error) {
      // Fallback to primary on read replica failure
      if (operation === 'read') {
        console.warn(`Read replica failed, falling back to primary: ${error.message}`);
        return await this.pool.query(`SELECT * FROM ${database}.${query}`, params);
      }
      throw error;
    }
  }
}
```

## Security and Compliance

### Database Security

#### Encryption Configuration
```sql
-- Enable encryption at rest
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
ALTER SYSTEM SET ssl_ca_file = 'ca.crt';
ALTER SYSTEM SET ssl_crl_file = 'crl.pem';

-- Column-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE user_pii_encrypted (
    user_id UUID PRIMARY KEY,
    encrypted_ssn BYTEA,
    encrypted_credit_card BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

#### Access Control
```sql
-- Create role-based access control
CREATE ROLE voltage_soda_app;
CREATE ROLE voltage_soda_readonly;
CREATE ROLE voltage_soda_admin;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO voltage_soda_app;
GRANT USAGE ON SCHEMA public TO voltage_soda_app;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO voltage_soda_app;

-- Read-only access for analytics
GRANT SELECT ON ALL TABLES IN SCHEMA public TO voltage_soda_readonly;
GRANT USAGE ON SCHEMA public TO voltage_soda_readonly;

-- Admin access for maintenance
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voltage_soda_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voltage_soda_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO voltage_soda_admin;
```

### Compliance Monitoring

#### GDPR Compliance
```sql
-- Data retention policy enforcement
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void AS $$
BEGIN
    -- Delete analytics data older than 2 years
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Delete session data older than 30 days
    DELETE FROM user_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 days';
    
    -- Anonymize user data older than 7 years
    UPDATE user_profiles 
    SET email = 'deleted-' || user_id || '@voltage-soda.com',
        profile_data = '{}'::jsonb
    WHERE created_at < NOW() - INTERVAL '7 years'
    AND email NOT LIKE 'deleted-%';
END;
$$ LANGUAGE plpgsql;

-- Schedule data retention cleanup
SELECT cron.schedule('data-retention-cleanup', '0 2 * * 0', $$SELECT enforce_data_retention();$$);
```

## Disaster Recovery

### Automated Failover

#### Primary-Secondary Failover
```yaml
# Automated failover configuration
FailoverConfiguration:
  Primary: us-east-1
  Secondary: us-west-2
  Tertiary: ca-central-1
  
  HealthCheck:
    Interval: 30s
    Timeout: 10s
    FailureThreshold: 3
    SuccessThreshold: 2
  
  FailoverTriggers:
    - Database unreachable
    - Replication lag > 30s
    - CPU utilization > 90%
    - Memory utilization > 95%
    - Disk utilization > 85%
  
  Recovery:
    AutoPromote: true
    PromotionTimeout: 300s
    ReconnectionRetries: 10
    ReconnectionDelay: 5s
```

#### Failover Testing
```bash
#!/bin/bash
# Database failover testing script

# Test primary database connectivity
primary_status=$(psql -h voltage-soda-primary.cluster.us-east-1.rds.amazonaws.com -c "SELECT 1;" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "Primary database: HEALTHY"
else
    echo "Primary database: FAILED - Initiating failover"
    
    # Promote read replica to primary
    aws rds promote-read-replica \
        --db-instance-identifier voltage-soda-us-west-replica \
        --region us-west-2
    
    # Update connection strings in application
    # Update DNS records
    # Notify operations team
    
    echo "Failover completed successfully"
fi

# Test replication lag
replication_lag=$(psql -h voltage-soda-primary.cluster.us-east-1.rds.amazonaws.com -t -c "SELECT EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp()) as lag;" 2>/dev/null | tr -d ' ')

if [ $(echo "$replication_lag > 30" | bc) -eq 1 ]; then
    echo "WARNING: Replication lag is ${replication_lag} seconds"
fi
```

## Performance Optimization

### Query Optimization

#### Automated Query Analysis
```sql
-- Enable pg_stat_statements for query analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Query performance monitoring
CREATE OR REPLACE FUNCTION analyze_slow_queries()
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
    FROM pg_stat_statements
    WHERE calls > 100
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Index usage monitoring
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC;
END;
$$ LANGUAGE plpgsql;
```

### Database Scaling

#### Vertical Scaling
```sql
-- Automated vertical scaling based on load
CREATE OR REPLACE FUNCTION check_scaling_requirements()
RETURNS TABLE (
    metric TEXT,
    current_value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'CPU_UTILIZATION'::TEXT,
        (SELECT avg(cpu_percent) FROM pg_stat_database WHERE datname = current_database()),
        80.0,
        CASE 
            WHEN (SELECT avg(cpu_percent) FROM pg_stat_database WHERE datname = current_database()) > 80 
            THEN 'Scale up instance class'
            ELSE 'Current instance class is adequate'
        END;
        
    -- Add more metrics as needed
END;
$$ LANGUAGE plpgsql;
```

## Implementation Timeline

### Phase 1 (Weeks 1-2): Foundation
- [ ] Set up primary database clusters (3 regions)
- [ ] Configure basic replication
- [ ] Implement connection pooling
- [ ] Set up monitoring

### Phase 2 (Weeks 3-4): Expansion
- [ ] Deploy read replicas (6 regions)
- [ ] Implement sharding strategy
- [ ] Configure conflict resolution
- [ ] Set up automated backups

### Phase 3 (Weeks 5-6): Optimization
- [ ] Performance tuning and optimization
- [ ] Automated scaling configuration
- [ ] Security hardening
- [ ] Compliance implementation

### Phase 4 (Weeks 7-8): Production Readiness
- [ ] Comprehensive testing
- [ ] Disaster recovery testing
- [ ] Load testing
- [ ] Documentation and runbooks

## Success Metrics

### Performance Targets
- **Query latency**: <100ms for 95th percentile
- **Connection time**: <50ms for connection establishment
- **Replication lag**: <5 seconds for strong consistency
- **Backup success rate**: 100% automated backups

### Availability Targets
- **Database uptime**: 99.95% availability
- **Failover time**: <60 seconds automated failover
- **Data durability**: 99.999999999% (11 9's)
- **RPO**: <5 minutes for all data
- **RTO**: <15 minutes for critical services

### Security Metrics
- **Encryption coverage**: 100% of data encrypted at rest and in transit
- **Access control**: Zero unauthorized access attempts
- **Compliance**: 100% GDPR and SOC 2 compliance
- **Audit coverage**: 100% of database operations logged

This global database architecture provides enterprise-grade data management with optimal performance, security, and availability for worldwide operations.