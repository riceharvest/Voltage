# Infrastructure as Code with Terraform - Global Scale Implementation

## Executive Summary

This document provides comprehensive Terraform configurations for deploying and managing the global cloud infrastructure for the Voltage Soda Platform, ensuring consistent, version-controlled, and automated infrastructure provisioning across all regions and cloud providers.

## Terraform Configuration Architecture

### Multi-Cloud Provider Strategy

#### Provider Configuration
```hcl
# Global Terraform configuration
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    bucket = "voltage-soda-terraform-state"
    key    = "global/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    
    # Enable state locking and consistency checking
    dynamodb_table = "voltage-soda-terraform-locks"
  }
}

# AWS Provider Configuration
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "voltage-soda"
      Owner         = "infrastructure-team"
      ManagedBy     = "terraform"
      CostCenter    = "engineering"
      Compliance    = "SOC2"
    }
  }
}

# Multi-region AWS providers
provider "aws" {
  alias  = "us-west"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "voltage-soda"
      Owner         = "infrastructure-team"
      ManagedBy     = "terraform"
    }
  }
}

provider "aws" {
  alias  = "eu-west"
  region = "eu-west-1"
  
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "voltage-soda"
      Owner         = "infrastructure-team"
      ManagedBy     = "terraform"
    }
  }
}

provider "aws" {
  alias  = "ap-southeast"
  region = "ap-southeast-1"
  
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "voltage-soda"
      Owner         = "infrastructure-team"
      ManagedBy     = "terraform"
    }
  }
}

# Google Cloud Provider
provider "google" {
  alias   = "primary"
  project = "voltage-soda-platform"
  region  = "us-central1"
  
  default_labels = {
    environment = "production"
    project     = "voltage-soda"
    managed_by  = "terraform"
  }
}

# Azure Provider
provider "azurerm" {
  alias   = "primary"
  features {}
  subscription_id = var.azure_subscription_id
  tenant_id       = var.azure_tenant_id
  
  default_tags {
    Environment = "production"
    Project     = "voltage-soda"
    ManagedBy   = "terraform"
  }
}
```

### Global VPC and Networking

#### Primary Region VPC Configuration (us-east-1)
```hcl
# VPC and networking for us-east-1
module "vpc_us_east_1" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.primary
  }
  
  name = "voltage-soda-us-east-1"
  cidr = "10.0.0.0/16"
  
  # Availability zones
  azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  # Public subnets for load balancers and NAT gateways
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  
  # Private subnets for application tiers
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  
  # Database subnets for RDS
  database_subnets = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
  
  # Enable VPC Flow Logs
  enable_flow_log = true
  
  # NAT Gateway configuration
  enable_nat_gateway = true
  single_nat_gateway = false
  
  # VPC Endpoints for AWS services
  enable_vpn_gateway = false
  enable_dhcp_options = false
  
  # DNS configuration
  enable_dns_hostnames = true
  enable_dns_support = true
  
  # Tags
  tags = {
    Name        = "voltage-soda-us-east-1"
    Environment = "production"
    Region      = "us-east-1"
  }
}

# Security Groups
module "security_groups_us_east_1" {
  source = "./modules/security-groups"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id = module.vpc_us_east_1.vpc_id
  
  # Application security group
  app_sg_name = "voltage-soda-app-sg"
  app_allowed_ports = [80, 443, 3000]
  app_allowed_cidrs = ["0.0.0.0/0"] # Adjust based on requirements
  
  # Database security group
  db_sg_name = "voltage-soda-db-sg"
  db_allowed_ports = [5432]
  db_allowed_cidrs = module.vpc_us_east_1.private_subnets_cidr_blocks
  
  # Load balancer security group
  alb_sg_name = "voltage-soda-alb-sg"
  alb_allowed_ports = [80, 443]
  alb_allowed_cidrs = ["0.0.0.0/0"]
  
  tags = {
    Name        = "voltage-soda-sg-us-east-1"
    Environment = "production"
  }
}
```

#### Secondary Region VPC Configuration
```hcl
# EU-West VPC (for GDPR compliance)
module "vpc_eu_west_1" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.eu-west
  }
  
  name = "voltage-soda-eu-west-1"
  cidr = "10.1.0.0/16"
  
  azs = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  
  public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  private_subnets = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
  database_subnets = ["10.1.20.0/24", "10.1.21.0/24", "10.1.22.0/24"]
  
  enable_flow_log = true
  enable_nat_gateway = true
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = {
    Name        = "voltage-soda-eu-west-1"
    Environment = "production"
    Region      = "eu-west-1"
    Compliance  = "GDPR"
  }
}
```

### Multi-Region RDS Database Configuration

#### Primary Database Cluster
```hcl
# Primary RDS cluster (us-east-1)
module "rds_primary" {
  source = "./modules/rds-cluster"
  
  providers = {
    aws = aws.primary
  }
  
  # Cluster configuration
  identifier = "voltage-soda-primary"
  engine     = "aurora-postgresql"
  engine_version = "15.4"
  
  # Instance configuration
  instance_class = "db.r6g.2xlarge"
  instances = {
    writer = {
      instance_class = "db.r6g.2xlarge"
    }
    reader1 = {
      instance_class = "db.r6g.xlarge"
    }
    reader2 = {
      instance_class = "db.r6g.xlarge"
    }
  }
  
  # Storage configuration
  allocated_storage = 1000
  max_allocated_storage = 10000
  storage_type = "gp3"
  storage_encrypted = true
  
  # Network configuration
  vpc_security_group_ids = [module.security_groups_us_east_1.db_security_group_id]
  db_subnet_group_name = module.rds_subnet_group_us_east_1.name
  
  # Backup and maintenance
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:05:00-sun:06:00"
  
  # Performance insights
  enable_performance_insights = true
  performance_insights_retention_period = 7
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Security
  master_username = var.rds_master_username
  master_password = var.rds_master_password
  skip_final_snapshot = false
  final_snapshot_identifier = "voltage-soda-primary-final-snapshot"
  
  tags = {
    Name        = "voltage-soda-primary"
    Environment = "production"
    Type        = "primary"
  }
}

# Read replica for us-west-2
module "rds_us_west_replica" {
  source = "./modules/rds-replica"
  
  providers = {
    aws = aws.us-west
  }
  
  identifier = "voltage-soda-us-west-replica"
  source_db_cluster_identifier = module.rds_primary.cluster_arn
  
  instance_class = "db.r6g.xlarge"
  
  vpc_security_group_ids = [module.security_groups_us_west.db_security_group_id]
  db_subnet_group_name = module.rds_subnet_group_us_west.name
  
  # Performance monitoring
  enable_performance_insights = true
  performance_insights_retention_period = 7
  
  tags = {
    Name        = "voltage-soda-us-west-replica"
    Environment = "production"
    Type        = "replica"
  }
}

# EU Primary for GDPR compliance
module "rds_eu_primary" {
  source = "./modules/rds-cluster"
  
  providers = {
    aws = aws.eu-west
  }
  
  identifier = "voltage-soda-eu-primary"
  engine     = "aurora-postgresql"
  engine_version = "15.4"
  
  instance_class = "db.r6g.2xlarge"
  instances = {
    writer = {
      instance_class = "db.r6g.2xlarge"
    }
    reader1 = {
      instance_class = "db.r6g.xlarge"
    }
  }
  
  allocated_storage = 1000
  max_allocated_storage = 10000
  storage_type = "gp3"
  storage_encrypted = true
  
  vpc_security_group_ids = [module.security_groups_eu_west.db_security_group_id]
  db_subnet_group_name = module.rds_subnet_group_eu_west.name
  
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:05:00-sun:06:00"
  
  # EU-specific compliance
  enable_performance_insights = true
  performance_insights_retention_period = 7
  
  master_username = var.rds_master_username
  master_password = var.rds_master_password
  
  tags = {
    Name        = "voltage-soda-eu-primary"
    Environment = "production"
    Type        = "eu-primary"
    Compliance  = "GDPR"
  }
}
```

### Elastic Kubernetes Service (EKS) Configuration

#### Multi-Region EKS Clusters
```hcl
# Primary EKS cluster (us-east-1)
module "eks_primary" {
  source = "./modules/eks"
  
  providers = {
    aws = aws.primary
  }
  
  cluster_name    = "voltage-soda-primary"
  cluster_version = "1.28"
  
  # VPC configuration
  vpc_id     = module.vpc_us_east_1.vpc_id
  subnet_ids = module.vpc_us_east_1.private_subnets
  
  # Node groups configuration
  node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 20
      min_capacity     = 3
      
      instance_types = ["m5.xlarge"]
      
      capacity_type = "SPOT"
      
      k8s_labels = {
        Environment = "production"
        Application = "voltage-soda"
        NodeGroup   = "general"
      }
      
      additional_tags = {
        Name = "voltage-soda-general-node-group"
      }
    }
    
    compute_intensive = {
      desired_capacity = 2
      max_capacity     = 15
      min_capacity     = 2
      
      instance_types = ["c5.2xlarge"]
      
      capacity_type = "ON_DEMAND"
      
      k8s_labels = {
        Environment = "production"
        Application = "voltage-soda"
        NodeGroup   = "compute"
        WorkloadType = "compute-intensive"
      }
    }
    
    memory_intensive = {
      desired_capacity = 2
      max_capacity     = 10
      min_capacity     = 2
      
      instance_types = ["r5.xlarge"]
      
      capacity_type = "ON_DEMAND"
      
      k8s_labels = {
        Environment = "production"
        Application = "voltage-soda"
        NodeGroup   = "memory"
        WorkloadType = "memory-intensive"
      }
    }
  }
  
  # Cluster authentication
  enable_irsa = true
  
  # Cluster logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  # Security
  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }]
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# EU EKS cluster for GDPR compliance
module "eks_eu_west" {
  source = "./modules/eks"
  
  providers = {
    aws = aws.eu-west
  }
  
  cluster_name    = "voltage-soda-eu-west"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc_eu_west_1.vpc_id
  subnet_ids = module.vpc_eu_west_1.private_subnets
  
  node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 15
      min_capacity     = 3
      
      instance_types = ["m5.xlarge"]
      capacity_type = "SPOT"
      
      k8s_labels = {
        Environment = "production"
        Application = "voltage-soda"
        Region      = "eu-west"
        Compliance  = "GDPR"
      }
    }
  }
  
  enable_irsa = true
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks_eu.arn
    resources        = ["secrets"]
  }]
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Compliance  = "GDPR"
  }
}
```

### Application Load Balancer Configuration

#### Global Load Balancer Setup
```hcl
# Application Load Balancer (us-east-1)
module "alb_primary" {
  source = "./modules/alb"
  
  providers = {
    aws = aws.primary
  }
  
  name = "voltage-soda-alb-primary"
  
  load_balancer_type = "application"
  internal = false
  
  # Security
  enable_cross_zone_load_balancing = true
  enable_deletion_protection = true
  
  # Subnets and security groups
  subnets = module.vpc_us_east_1.public_subnets
  security_groups = [module.security_groups_us_east_1.alb_security_group_id]
  
  # SSL/TLS certificate
  ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn = aws_acm_certificate.voltage_soda.arn
  
  # Health check
  health_check = {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  # Access logs
  access_logs = {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "voltage-soda-alb-primary"
    enabled = true
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "primary-alb"
  }
}

# Target group for application
resource "aws_lb_target_group" "app_targets" {
  name     = "voltage-soda-app-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc_us_east_1.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  # Sticky sessions for user sessions
  stickiness {
    enabled         = true
    cookie_duration = 86400
    type            = "lb_cookie"
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# Listener rules for routing
resource "aws_lb_listener" "https" {
  load_balancer_arn = module.alb_primary.lb_arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.voltage_soda.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_targets.arn
  }
}

# Global Accelerator for multi-region routing
resource "aws_globalaccelerator_accelerator" "voltage_soda" {
  name            = "voltage-soda-global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true
  
  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.global_accelerator_logs.bucket
    flow_logs_s3_prefix = "voltage-soda-flow-logs"
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# Listener for global accelerator
resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.voltage_soda.id
  client_affinity = "SOURCE_IP"
  protocol        = "TCP"
  
  port_ranges {
    from = 443
    to   = 443
  }
}

# Endpoint groups for different regions
resource "aws_globalaccelerator_endpoint_group" "us_east" {
  listener_arn = aws_globalaccelerator_listener.https.id
  region       = "us-east-1"
  
  health_check_path   = "/api/health"
  health_check_port   = 443
  health_check_protocol = "HTTPS"
  
  endpoint_configurations {
    endpoint_id = module.alb_primary.lb_arn
    weight      = 100
  }
}

resource "aws_globalaccelerator_endpoint_group" "eu_west" {
  listener_arn = aws_globalaccelerator_listener.https.id
  region       = "eu-west-1"
  
  health_check_path   = "/api/health"
  health_check_port   = 443
  health_check_protocol = "HTTPS"
  
  endpoint_configurations {
    endpoint_id = module.alb_eu_west.lb_arn
    weight      = 50
  }
}
```

### Redis/ElastiCache Configuration

#### Multi-Region Redis Clusters
```hcl
# Redis cluster for session management (us-east-1)
module "redis_primary" {
  source = "./modules/elasticache"
  
  providers = {
    aws = aws.primary
  }
  
  replication_group_id         = "voltage-soda-redis-primary"
  description                  = "Redis cluster for Voltage Soda Platform - Primary"
  
  node_type                   = "cache.r6g.xlarge"
  port                        = 6379
  parameter_group_name        = "default.redis7"
  num_cache_clusters          = 3
  
  # Subnet group
  subnet_group_name = module.redis_subnet_group_us_east_1.name
  
  # Security groups
  security_group_ids = [module.security_groups_us_east_1.redis_security_group_id]
  
  # Backup configuration
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  
  # Maintenance window
  maintenance_window = "sun:05:00-sun:06:00"
  
  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  # Logging
  log_delivery_configuration = [
    {
      destination      = aws_cloudwatch_log_group.redis_slow.name
      destination_type = "cloudwatch-logs"
      log_format       = "text"
      log_type         = "slow-log"
    }
  ]
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "redis-primary"
  }
}

# Redis replica for us-west-2
module "redis_us_west_replica" {
  source = "./modules/elasticache-replica"
  
  providers = {
    aws = aws.us-west
  }
  
  replication_group_id         = "voltage-soda-redis-us-west"
  description                  = "Redis cluster for Voltage Soda Platform - US West Replica"
  
  primary_group_id = module.redis_primary.replication_group_id
  node_type        = "cache.r6g.large"
  num_cache_clusters = 2
  
  subnet_group_name = module.redis_subnet_group_us_west.name
  security_group_ids = [module.security_groups_us_west.redis_security_group_id]
  
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "redis-replica"
  }
}
```

### S3 and Storage Configuration

#### Global S3 Buckets
```hcl
# S3 bucket for application assets
resource "aws_s3_bucket" "app_assets" {
  bucket = "voltage-soda-app-assets"
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "app-assets"
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront distribution for S3 assets
resource "aws_cloudfront_distribution" "app_assets_cdn" {
  origin {
    domain_name = aws_s3_bucket.app_assets.bucket_regional_domain_name
    origin_id   = "S3-app-assets"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.app_assets_cloudfront.origin_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Voltage Soda App Assets CDN"
  default_root_object = "index.html"
  
  # SSL certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.voltage_soda.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-app-assets"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  # Geo restriction
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "cdn"
  }
}
```

### Auto Scaling Configuration

#### Application Auto Scaling
```hcl
# ECS service auto scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 100
  min_capacity       = 3
  resource_id        = "service/voltage-soda-cluster/voltage-soda-service"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based scaling policy
resource "aws_appautoscaling_policy" "ecs_cpu_scaling" {
  name               = "voltage-soda-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value = 70.0
  }
}

# Request-based scaling policy
resource "aws_appautoscaling_policy" "ecs_request_scaling" {
  name               = "voltage-soda-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${module.alb_primary.lb_arn_suffix}/${aws_lb_target_group.app_targets.arn_suffix}"
    }
    
    target_value = 1000.0
  }
}
```

### Security and Compliance

#### KMS Key Configuration
```hcl
# KMS key for database encryption
resource "aws_kms_key" "database" {
  description             = "KMS key for Voltage Soda Database encryption"
  deletion_window_in_days = 30
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "database-encryption"
  }
}

resource "aws_kms_alias" "database" {
  name          = "alias/voltage-soda-database-key"
  target_key_id = aws_kms_key.database.key_id
}

# IAM roles for KMS
resource "aws_iam_role" "kms_key_user" {
  name = "voltage-soda-kms-key-user"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

resource "aws_iam_role_policy_attachment" "kms_key_user" {
  role       = aws_iam_role.kms_key_user.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

#### Security Scanning Integration
```hcl
# AWS Security Hub
resource "aws_securityhub_account" "this" {}

# GuardDuty detector
resource "aws_guardduty_detector" "this" {
  enable = true
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# Config rule for compliance
resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "rds-storage-encrypted-check"
  
  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }
  
  maximum_execution_frequency = "TwentyFour_Hours"
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}
```

### Monitoring and Alerting

#### CloudWatch Configuration
```hcl
# CloudWatch log groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/voltage-soda"
  retention_in_days = 30
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

resource "aws_cloudwatch_log_group" "load_balancer" {
  name              = "/aws/applicationloadbalancer/voltage-soda"
  retention_in_days = 30
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "voltage-soda-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBClusterIdentifier = module.rds_primary.cluster_id
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "voltage-soda-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = module.alb_primary.lb_arn_suffix
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "voltage-soda-alerts"
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

### Terraform Variables and Outputs

#### Variables Configuration
```hcl
# terraform.tfvars
# Global variables

# Database configuration
rds_master_username = "voltage_soda_admin"
rds_master_password = "your-secure-password-here"

# Redis configuration
redis_auth_token = "your-redis-auth-token"

# Azure configuration
azure_subscription_id = "your-azure-subscription-id"
azure_tenant_id = "your-azure-tenant-id"

# Alerting
alert_email = "ops@voltage-soda.com"

# Domain and certificates
domain_name = "voltage-soda.com"
certificate_email = "security@voltage-soda.com"
```

#### Outputs Configuration
```hcl
# outputs.tf
# Database outputs
output "rds_primary_endpoint" {
  description = "Primary RDS cluster endpoint"
  value       = module.rds_primary.cluster_endpoint
}

output "rds_reader_endpoints" {
  description = "RDS reader endpoints"
  value       = module.rds_primary.cluster_reader_endpoint
}

# Load balancer outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb_primary.lb_dns_name
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.app_assets_cdn.domain_name
}

# EKS outputs
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks_primary.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ids attached to cluster control plane"
  value       = module.eks_primary.cluster_security_group_id
}

# Redis outputs
output "redis_primary_endpoint" {
  description = "Primary Redis endpoint"
  value       = module.redis_primary.primary_endpoint_address
}

# Global accelerator output
output "global_accelerator_dns_name" {
  description = "Global Accelerator DNS name"
  value       = aws_globalaccelerator_accelerator.voltage_soda.dns_name
}
```

### Terraform State Management

#### Remote State Configuration
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "voltage-soda-terraform-state-prod"
    key    = "global/terraform.tfstate"
    region = "us-east-1"
    
    # State locking and consistency
    dynamodb_table = "voltage-soda-terraform-locks"
    
    # Server-side encryption
    encrypt = true
    
    # State versioning
    workspace_key_prefix = "environments"
  }
}
```

#### State Locking DynamoDB Table
```hcl
# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name           = "voltage-soda-terraform-locks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Environment = "production"
    Project     = "voltage-soda"
    Type        = "terraform-state"
  }
}
```

### Deployment Scripts

#### Terraform Deployment Script
```bash
#!/bin/bash
# deploy-infrastructure.sh

set -e

# Configuration
ENVIRONMENT="production"
REGIONS=("us-east-1" "us-west-2" "eu-west-1" "ap-southeast-1")
BACKEND_CONFIG="backend-${ENVIRONMENT}.tfvars"
VARIABLES_FILE="terraform.tfvars"

echo "🚀 Starting Voltage Soda Platform infrastructure deployment"

# Function to deploy to a region
deploy_region() {
    local region=$1
    echo "📍 Deploying to region: $region"
    
    # Initialize Terraform with backend configuration
    terraform init \
        -backend-config="regions/${region}/backend.tfvars" \
        -reconfigure
    
    # Validate Terraform configuration
    echo "✅ Validating Terraform configuration"
    terraform validate
    
    # Plan infrastructure changes
    echo "📋 Planning infrastructure changes"
    terraform plan \
        -var-file="${VARIABLES_FILE}" \
        -var-file="regions/${region}/variables.tfvars" \
        -out="terraform-${region}.plan"
    
    # Apply infrastructure changes
    echo "🏗️  Applying infrastructure changes"
    terraform apply "terraform-${region}.plan"
    
    echo "✅ Region $region deployment completed"
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    echo "🔍 Running pre-deployment checks"
    
    # Check AWS CLI configuration
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo "❌ AWS CLI not configured or invalid credentials"
        exit 1
    fi
    
    # Check Terraform installation
    if ! terraform version > /dev/null 2>&1; then
        echo "❌ Terraform not installed or not in PATH"
        exit 1
    fi
    
    # Check required files exist
    required_files=("main.tf" "variables.tf" "outputs.tf" "${VARIABLES_FILE}")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ Required file missing: $file"
            exit 1
        fi
    done
    
    echo "✅ Pre-deployment checks passed"
}

# Function to run post-deployment validation
post_deployment_validation() {
    local region=$1
    echo "🔍 Running post-deployment validation for $region"
    
    # Test RDS connectivity
    echo "Testing RDS connectivity..."
    terraform output -raw rds_primary_endpoint | xargs -I {} psql -h {} -U voltage_soda_admin -d voltage_soda -c "SELECT version();" || {
        echo "❌ RDS connectivity test failed"
        return 1
    }
    
    # Test load balancer
    echo "Testing load balancer..."
    terraform output -raw alb_dns_name | xargs -I {} curl -f -s -o /dev/null -w "%{http_code}" "http://{}" || {
        echo "❌ Load balancer test failed"
        return 1
    }
    
    echo "✅ Post-deployment validation passed for $region"
}

# Main deployment process
main() {
    echo "🎯 Environment: $ENVIRONMENT"
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Deploy to each region
    for region in "${REGIONS[@]}"; do
        deploy_region "$region"
        post_deployment_validation "$region"
    done
    
    # Global resources deployment
    echo "🌐 Deploying global resources"
    terraform init -backend-config="global/backend.tfvars"
    terraform plan -var-file="${VARIABLES_FILE}" -var-file="global/variables.tfvars" -out="terraform-global.plan"
    terraform apply "terraform-global.plan"
    
    echo "🎉 Infrastructure deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  - Regions deployed: ${#REGIONS[@]}"
    echo "  - Primary region: us-east-1"
    echo "  - Global resources: Deployed"
    echo ""
    echo "🔗 Important endpoints:"
    terraform output | grep -E "(alb_dns_name|global_accelerator_dns_name|cloudfront_distribution_domain_name)"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "plan")
        echo "📋 Running Terraform plan for all regions"
        for region in "${REGIONS[@]}"; do
            echo "Planning for region: $region"
            terraform init -backend-config="regions/${region}/backend.tfvars"
            terraform plan -var-file="${VARIABLES_FILE}" -var-file="regions/${region}/variables.tfvars"
        done
        ;;
    "destroy")
        echo "⚠️  This will destroy all infrastructure. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            for region in "${REGIONS[@]}"; do
                echo "Destroying infrastructure in region: $region"
                terraform init -backend-config="regions/${region}/backend.tfvars"
                terraform destroy -var-file="${VARIABLES_FILE}" -var-file="regions/${region}/variables.tfvars"
            done
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|plan|destroy}"
        exit 1
        ;;
esac
```

## Implementation Timeline

### Phase 1 (Weeks 1-2): Core Infrastructure
- [ ] Set up Terraform backend and state management
- [ ] Configure multi-region VPCs and networking
- [ ] Deploy primary RDS clusters
- [ ] Set up basic monitoring and alerting

### Phase 2 (Weeks 3-4): Application Infrastructure
- [ ] Deploy EKS clusters across regions
- [ ] Configure auto-scaling and load balancing
- [ ] Set up Redis clusters for caching
- [ ] Implement security groups and IAM roles

### Phase 3 (Weeks 5-6): Global Resources
- [ ] Configure Global Accelerator
- [ ] Set up CloudFront distributions
- [ ] Implement cross-region replication
- [ ] Configure disaster recovery

### Phase 4 (Weeks 7-8): Automation and Testing
- [ ] Complete deployment automation scripts
- [ ] Implement comprehensive testing
- [ ] Performance optimization
- [ ] Documentation and runbooks

## Success Metrics

### Infrastructure Metrics
- **Deployment success rate**: 100% automated successful deployments
- **Infrastructure provisioning time**: <30 minutes for full stack
- **Configuration drift**: Zero drift detected
- **State consistency**: 100% state file consistency

### Performance Metrics
- **Resource utilization**: 70-80% average utilization
- **Cost optimization**: 20% cost reduction through automation
- **Scaling response time**: <5 minutes for auto-scaling
- **Recovery time**: <15 minutes for infrastructure recovery

### Security Metrics
- **Compliance coverage**: 100% automated compliance checks
- **Security scanning**: 100% infrastructure coverage
- **Access control**: Zero unauthorized access incidents
- **Encryption coverage**: 100% data encrypted at rest and in transit

This Terraform infrastructure implementation provides enterprise-grade, automated, and scalable infrastructure management for global operations.