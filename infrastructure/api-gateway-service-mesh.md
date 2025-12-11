# API Gateway and Service Mesh Implementation for Global Scale

## Executive Summary

This document outlines the comprehensive API gateway and service mesh architecture designed to provide secure, reliable, and intelligent traffic management for the Voltage Soda Platform's global operations with enterprise-grade service communication, security, and observability.

## Service Mesh Architecture Overview

### Istio Service Mesh Configuration

#### Global Istio Deployment
```yaml
# Istio operator configuration for global deployment
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: voltage-soda-control-plane
  namespace: istio-system
spec:
  values:
    global:
      meshID: voltage-soda-global-mesh
      multiCluster:
        clusterName: "voltage-soda-us-east"
      network: "voltage-soda-network"
      
      # Telemetry and observability
      telemetry:
        enabled: true
        v2:
          enabled: true
          prometheus:
            enabled: true
            configOverride: |
              metric_relabeling_configs:
              - source_labels: [__name__]
                regex: "istio_.*"
                target_label: "__tmp_istio_metric"
      
      # Security configuration
      trustDomain: "voltage-soda.global"
      sds:
        enabled: true
      pilot:
        env:
          EXTERNAL_ISTIOD: false
      
      # Mesh configuration
      meshConfig:
        defaultConfig:
          proxyStatsMatcher:
            inclusionRegexps:
            - ".*circuit_breakers.*"
            - ".*upstream_rq_retry.*"
            - ".*upstream_rq_pending.*"
            - ".*outlier_detection.*"
            exclusionRegexps:
            - ".*config_dump.*"
            - ".*cluster_manager.*"
            - ".*listener_manager.*"
            - ".*server.*"
            - ".*agent.*"
          
          # Tracing configuration
          tracing:
            sampling: 100.0
            max_path_tag_length: 256
            
          # Hold application until proxy starts
          holdApplicationUntilProxyStarts: true
          
          # Proxy resource limits
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 2000m
              memory: 1024Mi
        
        # Access logging
        accessLogFile: /dev/stdout
        accessLogFormat: |
          [%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%" %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%" "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%"
          
        # Default proxy configuration
        defaultConfig:
          # Circuit breaker configuration
          connectionPool:
            tcp:
              maxConnections: 100
            http:
              http1MaxPendingRequests: 50
              http2MaxRequests: 100
              maxRequestsPerConnection: 2
              maxRetries: 3
          
          # Outlier detection
          outlierDetection:
            consecutiveErrors: 3
            interval: 30s
            baseEjectionTime: 30s
            maxEjectionPercent: 50
            minHealthPercent: 50
          
          # Load balancing
          lbPolicy: LEAST_CONN
          
          # Auto mtls
          autoMtls:
            enabled: true
  
  # Mesh components
  components:
    pilot:
      k8s:
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1024Mi
        hpaSpec:
          maxReplicas: 5
          metrics:
          - type: Resource
            resource:
              name: cpu
              targetAverageUtilization: 80
          - type: Resource
            resource:
              name: memory
              targetAverageUtilization: 80
        
        env:
          # Mesh configuration
          PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION: true
          PILOT_ENABLE_CROSS_CLUSTER_WORKLOAD_ENTRY: true
          PILOT_SKIP_VALIDATE_CLUSTER_SECRET: true
          
          # Telemetry
          PILOT_ENABLE_STATUS: true
          PILOT_ENABLE_DISTRIBUTION_TRACKING: true
          PILOT_ENABLE_SERVICEENTRY_SELECT_PODS: true
          
          # Security
          PILOT_ENABLE_CA_SERVER: true
          PILOT_ENABLE_XDS_CACHE: true
          PILOT_ENABLE_LEGACY_AUTO_TLS: false
    
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi
        hpaSpec:
          maxReplicas: 5
          metrics:
          - type: Resource
            resource:
              name: cpu
              targetAverageUtilization: 80
        
        service:
          type: LoadBalancer
          ports:
          - port: 15021
            targetPort: 15021
            name: status-port
          - port: 80
            targetPort: 8080
            name: http2
          - port: 443
            targetPort: 8443
            name: https
          - port: 31400
            targetPort: 31400
            name: tcp
          
          externalTrafficPolicy: Local
        
        # Security context
        securityContext:
          runAsNonRoot: false
          runAsUser: 0
          capabilities:
            drop:
            - ALL
            add:
            - NET_ADMIN
            - NET_RAW
          allowPrivilegeEscalation: true
    
    egressGateways:
    - name: istio-egressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi
        hpaSpec:
          maxReplicas: 5
          metrics:
          - type: Resource
            resource:
              name: cpu
              targetAverageUtilization: 80
  
  # Addon components
  addons:
    prometheus:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 512Mi
    
    grafana:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
    
    jaeger:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
    
    kiali:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

#### Multi-Cluster Mesh Configuration
```yaml
# Remote cluster configuration for multi-cluster mesh
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: voltage-soda-remote-cluster
  namespace: istio-system
spec:
  values:
    global:
      meshID: voltage-soda-global-mesh
      multiCluster:
        clusterName: "voltage-soda-eu-west"
      network: "voltage-soda-network"
      remotePilotAddress: "voltage-soda-pilot.istio-system.svc.cluster.local"
      
      # Remote Istiod configuration
      remotePilotAddress: "istiod.istio-system.svc.cluster.local"
      pilotCertProvider: istiod
      
      # Security
      trustDomain: "voltage-soda.global"
      
      # Telemetry
      telemetry:
        enabled: true
        v2:
          enabled: true
          prometheus:
            enabled: true
  
  components:
    pilot:
      enabled: false  # Disabled in remote cluster
    
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        service:
          type: LoadBalancer
          ports:
          - port: 15021
            targetPort: 15021
            name: status-port
          - port: 80
            targetPort: 8080
            name: http2
          - port: 443
            targetPort: 8443
            name: https
```

### Kong API Gateway Configuration

#### Kong Enterprise Configuration
```yaml
# Kong API Gateway deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voltage-soda-kong
  namespace: voltage-soda-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: voltage-soda-kong
  template:
    metadata:
      labels:
        app: voltage-soda-kong
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8100"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: kong-proxy
        image: kong:3.4-alpine
        ports:
        - containerPort: 8000
          name: proxy
          protocol: TCP
        - containerPort: 8443
          name: proxy-ssl
          protocol: TCP
        - containerPort: 8001
          name: admin
          protocol: TCP
        - containerPort: 8444
          name: admin-ssl
          protocol: TCP
        - containerPort: 8100
          name: metrics
          protocol: TCP
        env:
        - name: KONG_DATABASE
          value: "off"
        - name: KONG_DECLARATIVE_CONFIG
          value: "/kong/declarative/kong.yml"
        - name: KONG_PROXY_ACCESS_LOG
          value: "/dev/stdout"
        - name: KONG_ADMIN_ACCESS_LOG
          value: "/dev/stdout"
        - name: KONG_PROXY_ERROR_LOG
          value: "/dev/stderr"
        - name: KONG_ADMIN_ERROR_LOG
          value: "/dev/stderr"
        - name: KONG_LOG_LEVEL
          value: "notice"
        - name: KONG_PLUGINS
          value: "bundled,prometheus,zipkin,http-log,oauth2,jwt,acl,rate-limiting,response-transformer,request-transformer"
        - name: KONG_NGINX_HTTP_INCLUDE
          value: "/kong/nginx/include/nginx.conf"
        - name: KONG_NGINX_PROXY_INCLUDE
          value: "/kong/nginx/include/nginx-proxy.conf"
        - name: KONG_NGINX_ADMIN_INCLUDE
          value: "/kong/nginx/include/nginx-admin.conf"
        - name: KONG_ADMIN_LISTEN
          value: "0.0.0.0:8001, 0.0.0.0:8444 ssl"
        - name: KONG_ADMIN_GUI_LISTEN
          value: "0.0.0.0:8002, 0.0.0.0:8445 ssl"
        - name: KONG_ADMIN_LISTENER
          value: "0.0.0.0:8001, 0.0.0.0:8444 ssl"
        - name: KONG_PROXY_LISTEN
          value: "0.0.0.0:8000, 0.0.0.0:8443 ssl http2"
        - name: KONG_STATUS_LISTEN
          value: "0.0.0.0:8100"
        - name: KONG_CLUSTER_LISTEN
          value: "0.0.0.0:8005"
        - name: KONG_CLUSTER_TELEMETRY_LISTEN
          value: "0.0.0.0:8006"
        volumeMounts:
        - name: kong-config-volume
          mountPath: /kong/declarative
          readOnly: true
        - name: kong-nginx-volume
          mountPath: /kong/nginx/include
          readOnly: true
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /status
            port: 8100
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /status
            port: 8100
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: kong-config-volume
        configMap:
          name: voltage-soda-kong-config
      - name: kong-nginx-volume
        configMap:
          name: voltage-soda-kong-nginx
```

#### Kong Configuration as Code
```yaml
# Kong declarative configuration
_format_version: "3.0"

_transform: true

services:
  # Frontend Service
  - name: voltage-soda-frontend-service
    url: http://voltage-soda-frontend.voltage-soda.svc.cluster.local:3000
    plugins:
    - name: cors
      config:
        origins:
        - "https://voltage-soda.com"
        - "https://www.voltage-soda.com"
        - "https://*.voltage-soda.com"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Authorization
        - Content-Type
        - X-Requested-With
        exposed_headers:
        - X-Auth-Token
        credentials: true
        max_age: 3600
    - name: request-transformer
      config:
        add:
          headers:
          - "X-Forwarded-For"
          - "X-Real-IP"
          - "X-Forwarded-Proto"
        remove:
          headers:
          - "Server"
          - "X-Kong-Proxy-Latency"
    - name: response-transformer
      config:
        add:
          headers:
          - "X-Powered-By:Voltage-Soda"
          - "Cache-Control:public, max-age=3600"
        remove:
          headers:
          - "Server"
          - "X-Kong-Proxy-Latency"
    
  # Backend API Service
  - name: voltage-soda-backend-service
    url: http://voltage-soda-backend.voltage-soda.svc.cluster.local:8080
    plugins:
    - name: rate-limiting
      config:
        minute: 1000
        hour: 10000
        policy: "redis"
        redis_host: "voltage-soda-redis-primary.cache.amazonaws.com"
        redis_port: 6379
        redis_password: "${KONG_REDIS_PASSWORD}"
        hide_client_headers: false
    - name: jwt
      config:
        key_claim_name: iss
        claims_to_verify:
        - exp
        - nbf
        maximum_expiration: 3600
    - name: acl
      config:
        whitelist:
        - admin
        - user
        blacklist:
        - blocked
        hide_groups_header: true
    - name: request-size-limiting
      config:
        allowed_payload_size: 10
        reject_status_code: 413
    - name: http-log
      config:
        http_endpoint: "http://voltage-soda-logstash:8080/v1/logs"
        method: "POST"
        content_type: "application/json"
        timeout: 5000
        keepalive: 60000
        retry_count: 3

  # Flavors API Service
  - name: voltage-soda-flavors-service
    url: http://voltage-soda-flavors.voltage-soda.svc.cluster.local:8081
    plugins:
    - name: rate-limiting
      config:
        minute: 2000
        hour: 50000
        policy: "redis"
        redis_host: "voltage-soda-redis-primary.cache.amazonaws.com"
        redis_port: 6379
        redis_password: "${KONG_REDIS_PASSWORD}"
    - name: request-transformer
      config:
        rename:
          headers:
          - "X-API-Version:API-Version"
    - name: response-transformer
      config:
        add:
          headers:
          - "X-API-Version:v1"

routes:
  # Frontend Routes
  - name: voltage-soda-frontend-routes
    service: voltage-soda-frontend-service
    paths:
    - "/"
    - "/flavors"
    - "/calculator"
    - "/guide"
    - "/recipes"
    - "/safety"
    strip_path: false
    preserve_host: true
    methods:
    - GET
    - POST
    - OPTIONS
    
  # API Routes
  - name: voltage-soda-api-routes
    service: voltage-soda-backend-service
    paths:
    - "/api/v1"
    strip_path: true
    preserve_host: false
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
    
  # Flavors API Routes
  - name: voltage-soda-flavors-routes
    service: voltage-soda-flavors-service
    paths:
    - "/api/flavors"
    strip_path: false
    preserve_host: false
    methods:
    - GET
    - POST
    - PUT
    - DELETE

consumers:
  # Service Account for internal services
  - username: voltage-soda-service-account
    custom_id: "service-account"
    jwt_secrets:
    - key: voltage-soda-service-key
      algorithm: HS256
      secret: "${SERVICE_ACCOUNT_JWT_SECRET}"
      rsa_public_key: |
        -----BEGIN PUBLIC KEY-----
        -----END PUBLIC KEY-----
  
  # API Client for external integrations
  - username: voltage-soda-api-client
    custom_id: "api-client"
    jwt_secrets:
    - key: voltage-soda-client-key
      algorithm: HS256
      secret: "${API_CLIENT_JWT_SECRET}"
  
  # Admin user for internal admin panel
  - username: voltage-soda-admin
    custom_id: "admin"
    jwt_secrets:
    - key: voltage-soda-admin-key
      algorithm: HS256
      secret: "${ADMIN_JWT_SECRET}"
    - algorithm: HS256
      secret: "${ADMIN_JWT_SECRET}"
    acls:
    - group: admin
    - group: super-admin

plugins:
  # Global plugins
  - name: prometheus
    config:
      per_consumer: true
      status_code_metrics: true
      latency_metrics: true
      bandwidth_metrics: true
      upstream_health_metrics: true
      redis_metrics: false
    
  # Global logging
  - name: zipkin
    config:
      http_endpoint: "http://voltage-soda-jaeger-collector:14268/api/traces"
      sample_rate: 1.0
      tag_header: true
      header_tag: "http.request.headers.x-request-id"
      static_tags:
      - service: voltage-soda-api-gateway
      - environment: production
      - version: v1.0.0
    
  # Global security headers
  - name: response-transformer
    config:
      add:
        headers:
        - "X-Frame-Options:SAMEORIGIN"
        - "X-Content-Type-Options:nosniff"
        - "X-XSS-Protection:1; mode=block"
        - "Referrer-Policy:strict-origin-when-cross-origin"
        - "Permissions-Policy:camera=(), microphone=(), geolocation=()"
        - "Strict-Transport-Security:max-age=31536000; includeSubDomains; preload"
```

### Traffic Management and Load Balancing

#### Istio VirtualService Configuration
```yaml
# VirtualService for intelligent traffic routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: voltage-soda-global-routing
  namespace: voltage-soda
spec:
  hosts:
  - voltage-soda.com
  - www.voltage-soda.com
  - api.voltage-soda.com
  gateways:
  - voltage-soda-gateway
  - voltage-soda-gateway-https
  
  # HTTP traffic routing
  http:
  # Frontend routing
  - match:
    - uri:
        prefix: "/"
    - uri:
        prefix: "/flavors"
    - uri:
        prefix: "/calculator"
    - uri:
        prefix: "/guide"
    - uri:
        prefix: "/recipes"
    - uri:
        prefix: "/safety"
    route:
    - destination:
        host: voltage-soda-frontend
        port:
          number: 3000
    timeout: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,reset,connect-failure,refused-stream
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    corsPolicy:
      allowOrigins:
      - exact: "https://voltage-soda.com"
      - exact: "https://www.voltage-soda.com"
      allowMethods:
      - GET
      - POST
      - OPTIONS
      allowHeaders:
      - Authorization
      - Content-Type
      - X-Requested-With
      allowCredentials: true
      maxAge: 3600s
  
  # API routing with canary deployment
  - match:
    - uri:
        prefix: "/api/v1"
    route:
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
        subset: stable
      weight: 90
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
        subset: canary
      weight: 10
    timeout: 10s
    retries:
      attempts: 3
      perTryTimeout: 3s
      retryOn: 5xx,reset,connect-failure,refused-stream
    fault:
      delay:
        percentage:
          value: 0.05
        fixedDelay: 2s
  
  # Flavors API with circuit breaker
  - match:
    - uri:
        prefix: "/api/flavors"
    route:
    - destination:
        host: voltage-soda-flavors
        port:
          number: 8081
    timeout: 8s
    retries:
      attempts: 5
      perTryTimeout: 2s
      retryOn: connect-failure,refused-stream,unavailable,cancelled,503
    trafficPolicy:
      connectionPool:
        tcp:
          maxConnections: 100
        http:
          http1MaxPendingRequests: 50
          maxRequestsPerConnection: 10
      outlierDetection:
        consecutiveErrors: 3
        interval: 30s
        baseEjectionTime: 30s
        maxEjectionPercent: 50
        minHealthPercent: 50
  
  # Health check endpoint
  - match:
    - uri:
        exact: "/health"
    route:
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
    timeout: 2s
    retries:
      attempts: 1
      perTryTimeout: 1s

---
# DestinationRule for load balancing and circuit breaker configuration
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: voltage-soda-destination-rules
  namespace: voltage-soda
spec:
  host: voltage-soda-backend
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
        maxRetries: 3
        consecutiveGatewayFailure: 3
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
    consistentHash:
      httpHeaderName: "x-user-id"
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary

---
# Gateway configuration for ingress
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: voltage-soda-gateway
  namespace: voltage-soda
spec:
  selector:
    istio: ingressgateway
  servers:
  # HTTP to HTTPS redirect
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - voltage-soda.com
    - www.voltage-soda.com
    - api.voltage-soda.com
    tls:
      httpsRedirect: true

---
# HTTPS Gateway
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: voltage-soda-gateway-https
  namespace: voltage-soda
spec:
  selector:
    istio: ingressgateway
  servers:
  # HTTPS with TLS termination
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: voltage-soda-tls
    hosts:
    - voltage-soda.com
    - www.voltage-soda.com
    - api.voltage-soda.com
  - port:
      number: 9443
      name: grpc
      protocol: GRPC
    tls:
      mode: ISTIO_MUTUAL
    hosts:
    - voltage-soda-backend.voltage-soda.svc.cluster.local
```

### Security and Authentication

#### Istio Security Configuration
```yaml
# PeerAuthentication for mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: voltage-soda-mtls
  namespace: voltage-soda
spec:
  mtls:
    mode: STRICT

---
# RequestAuthentication for JWT validation
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: voltage-soda-jwt-auth
  namespace: voltage-soda
spec:
  jwtRules:
  - issuer: "https://auth.voltage-soda.com"
    jwksUri: "https://auth.voltage-soda.com/.well-known/jwks.json"
    audiences:
    - "voltage-soda-api"
    - "voltage-soda-frontend"
    forwardOriginalToken: true
    outputPayloadToHeader: "x-jwt-payload"
    fromHeaders:
    - name: "Authorization"
      prefix: "Bearer "
    - name: "x-jwt-token"
    fromParams:
    - "access_token"
    - "id_token"
    fromCookies:
    - "auth_token"

---
# AuthorizationPolicy for fine-grained access control
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: voltage-soda-authz
  namespace: voltage-soda
spec:
  selector:
    matchLabels:
      app: voltage-soda-backend
  rules:
  # Allow authenticated users for API access
  - from:
    - source:
        principals: ["cluster.local/ns/voltage-soda/sa/frontend-sa"]
    - source:
        requestPrincipals: ["https://auth.voltage-soda.com/*"]
    to:
    - operation:
        methods: ["GET", "POST", "PUT"]
        paths: ["/api/v1/*"]
    when:
    - key: request.headers[content-type]
      values: ["application/json", "application/x-www-form-urlencoded"]
    - key: request.headers[x-forwarded-for]
      notValues: ["10.0.0.0/8", "192.168.0.0/16", "172.16.0.0/12"]
  
  # Admin endpoints - restricted access
  - from:
    - source:
        requestPrincipals: ["https://auth.voltage-soda.com/admin/*"]
    to:
    - operation:
        methods: ["GET", "POST", "PUT", "DELETE"]
        paths: ["/api/v1/admin/*"]
    when:
    - key: request.headers[x-admin-token]
      values: ["valid-admin-token"]
  
  # Public endpoints - no authentication required
  - to:
    - operation:
        methods: ["GET"]
        paths: ["/api/v1/health", "/api/v1/status", "/api/v1/metrics"]
  
  # Service-to-service communication
  - from:
    - source:
        principals: ["cluster.local/ns/voltage-soda/sa/voltage-soda-flavors"]
        - source:
        principals: ["cluster.local/ns/voltage-soda/sa/voltage-soda-calculator"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/v1/*"]
    when:
    - key: connection.tls.version
      values: ["TLSv1.2", "TLSv1.3"]

---
# ServiceRole for RBAC
apiVersion: rbac.istio.io/v1beta1
kind: ServiceRole
metadata:
  name: voltage-soda-user-role
  namespace: voltage-soda
spec:
  rules:
  - services: ["voltage-soda-backend.voltage-soda.svc.cluster.local"]
    methods: ["GET", "POST"]
    paths: ["/api/v1/flavors/*", "/api/v1/calculator/*"]
    constraints:
    - key: "request.headers[x-user-role"
      values: ["user", "premium-user"]

---
# ServiceRoleBinding for role assignment
apiVersion: rbac.istio.io/v1beta1
kind: ServiceRoleBinding
metadata:
  name: voltage-soda-user-binding
  namespace: voltage-soda
spec:
  subjects:
  - user: "https://auth.voltage-soda.com/user/*"
  roleRef:
    kind: ServiceRole
    name: voltage-soda-user-role
```

### Observability and Monitoring

#### Istio Telemetry Configuration
```yaml
# Telemetry for metrics collection
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: voltage-soda-telemetry
  namespace: voltage-soda
spec:
  metrics:
  - providers:
    - name: prometheus
    overrides:
    - match:
        metric: ALL_METRICS
      tagOverrides:
        destination_service_name:
          value: "{{.destination_service_name | default \"unknown\"}}"
        destination_service_namespace:
          value: "{{.destination_service_namespace | default \"unknown\"}}"
        source_app:
          value: "{{.source_app | default \"unknown\"}}"
        source_version:
          value: "{{.source_version | default \"unknown\"}}"
    - match:
        metric: REQUEST_COUNT
      tagOverrides:
        request_operation:
          value: "{{.operation_id | default \"unknown\"}}"
        user_agent:
          value: "{{.request_headers.user_agent | default \"unknown\"}}"
        client_ip:
          value: "{{.request_headers.x_forwarded_for | default \"unknown\"}}"
  
  # Access logging
  accessLogging:
  - providers:
    - name: otel
    format:
      labels:
        destination_service_name: "{{.destination_service_name}}"
        destination_service_namespace: "{{.destination_service_namespace}}"
        request_operation: "{{.operation_id}}"
        user_id: "{{.request_authenticated_principal | regexReplaceAll \"[^/]+/\" \"\"}}"
        client_ip: "{{.request_headers.x_forwarded_for | default .source_ip}}"
  
  # Tracing
  tracing:
  - providers:
    - name: jaeger
    customTags:
      http.method:
        header:
          name: ":method"
      http.url:
        header:
          name: ":path"
      http.status_code:
        header:
          name: ":status"
      user.id:
        header:
          name: "x-user-id"
      client.ip:
        header:
          name: "x-forwarded-for"
      service.name:
        header:
          name: ":authority"
    maxPathTagLength: 256
```

### Traffic Engineering and Resilience

#### Advanced Traffic Splitting
```yaml
# Advanced traffic routing with weighted splits
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: voltage-soda-advanced-routing
  namespace: voltage-soda
spec:
  hosts:
  - api.voltage-soda.com
  gateways:
  - voltage-soda-gateway-https
  
  http:
  # Canary deployment with progressive rollout
  - match:
    - uri:
        prefix: "/api/v1/flavors"
      headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: voltage-soda-flavors
        port:
          number: 8081
        subset: canary
      weight: 100
    timeout: 10s
  
  # Geographic-based routing
  - match:
    - uri:
        prefix: "/api/v1"
      headers:
        x-geo-region:
          exact: "eu"
    route:
    - destination:
        host: voltage-soda-backend-eu
        port:
          number: 8080
    timeout: 8s
  
  - match:
    - uri:
        prefix: "/api/v1"
      headers:
        x-geo-region:
          exact: "apac"
    route:
    - destination:
        host: voltage-soda-backend-apac
        port:
          number: 8080
    timeout: 8s
  
  # Default routing with A/B testing
  - match:
    - uri:
        prefix: "/api/v1"
    route:
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
        subset: stable
      weight: 95
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
        subset: variant-b
      weight: 5
    timeout: 10s
  
  # Circuit breaker configuration for resilience
  - match:
    - uri:
        prefix: "/api/v1/critical"
    route:
    - destination:
        host: voltage-soda-backend
        port:
          number: 8080
    timeout: 5s
    retries:
      attempts: 5
      perTryTimeout: 1s
      retryOn: connect-failure,refused-stream,unavailable,cancelled,503
      retryPolicy:
        retryOn: 5xx,reset,connect-failure,refused-stream
        numRetries: 5
        perTryTimeout: 1s
        baseInterval: 0.025s
        maxInterval: 1s
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
      abort:
        percentage:
          value: 0.05
        httpStatus: 503
```

#### Retry and Timeout Policies
```yaml
# DestinationRule with advanced retry and timeout policies
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: voltage-soda-advanced-traffic-policy
  namespace: voltage-soda
spec:
  host: voltage-soda-backend
  trafficPolicy:
    # Load balancing policies
    loadBalancer:
      simple: LEAST_CONN
      consistentHash:
        httpHeaderName: "x-user-id"
        minimumRingSize: 100
    
    # Connection pooling
    connectionPool:
      tcp:
        maxConnections: 100
        connectTimeout: 30s
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3
        consecutiveGatewayFailure: 3
        interval: 30s
        baseEjectionTime: 30s
        maxEjectionPercent: 50
        minHealthPercent: 50
        splitExternalLocalOriginErrors: true
    
    # Circuit breaker settings
    circuitBreaker:
      consecutiveGatewayErrors: 3
      consecutiveServerErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
      ConsecutiveErrors: 5
      SplitExternalLocalOriginErrors: true
    
    # Outlier detection
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
      enforcingConsecutive5xxErrors: 100
      enforcingConsecutiveGatewayErrors: 100
      enforcingSuccessRate: 50
      successRateMinimumHosts: 3
      successRateRequestVolume: 100
      successRateStasFactor: 1.9
      consecutiveGatewayErrors: 3
      enforcingConsecutiveGatewayErrors: 100
    
    # TLS settings
    tls:
      mode: ISTIO_MUTUAL
      sni: voltage-soda-backend.voltage-soda.svc.cluster.local
    
    # Port-level settings
    portLevelSettings:
    - port:
        number: 8080
      loadBalancer:
        simple: ROUND_ROBIN
      connectionPool:
        tcp:
          maxConnections: 50
        http:
          http1MaxPendingRequests: 25
          maxRequestsPerConnection: 5
      circuitBreaker:
        consecutiveErrors: 2
        interval: 10s
        baseEjectionTime: 10s
```

### Service Mesh Security

#### Security Policies
```yaml
# NetworkPolicy for micro-segmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: voltage-soda-mesh-security
  namespace: voltage-soda
spec:
  podSelector:
    matchLabels:
      app: voltage-soda-backend
  policyTypes:
  - Ingress
  - Egress
  
  ingress:
  # Allow ingress gateway
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    ports:
    - protocol: TCP
      port: 8080
  
  # Allow service mesh
  - from:
    - podSelector:
        matchLabels:
          app: voltage-soda-frontend
    - podSelector:
        matchLabels:
          app: voltage-soda-flavors
    - podSelector:
        matchLabels:
          app: voltage-soda-calculator
    ports:
    - protocol: TCP
      port: 8080
  
  # Allow istio-proxy
  - from:
    - podSelector:
        matchLabels:
          app: voltage-soda-backend
    ports:
    - protocol: TCP
      port: 15090
  
  egress:
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  
  # Allow istio-system
  - to:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    ports:
    - protocol: TCP
      port: 15012
    - protocol: TCP
      port: 15017
  
  # Allow database
  - to:
    - podSelector:
        matchLabels:
          app: voltage-soda-database
    ports:
    - protocol: TCP
      port: 5432
  
  # Allow cache
  - to:
    - podSelector:
        matchLabels:
          app: voltage-soda-redis
    ports:
    - protocol: TCP
      port: 6379
```

## Implementation Timeline

### Phase 1 (Weeks 1-2): Service Mesh Foundation
- [ ] Deploy Istio control plane (multi-cluster)
- [ ] Configure sidecar injection
- [ ] Implement basic traffic routing
- [ ] Set up mTLS and security policies

### Phase 2 (Weeks 3-4): API Gateway Integration
- [ ] Deploy Kong API Gateway
- [ ] Configure Kong plugins and policies
- [ ] Implement JWT authentication
- [ ] Set up rate limiting and security

### Phase 3 (Weeks 5-6): Advanced Traffic Management
- [ ] Implement canary deployments
- [ ] Configure circuit breakers
- [ ] Set up observability and monitoring
- [ ] Implement traffic splitting strategies

### Phase 4 (Weeks 7-8): Security and Optimization
- [ ] Advanced security policies
- [ ] Performance optimization
- [ ] Documentation and training
- [ ] Production readiness validation

## Success Metrics

### Performance Metrics
- **Request Latency**: <100ms P95 for API requests
- **Throughput**: 10,000 requests/second per gateway
- **Availability**: 99.99% gateway uptime
- **Circuit Breaker Response**: <10ms activation time

### Security Metrics
- **Authentication Success Rate**: >99.9%
- **Authorization Accuracy**: 100% correct access control
- **TLS Termination**: 100% encrypted traffic
- **Rate Limiting Effectiveness**: <0.1% policy violations

### Operational Metrics
- **Service Discovery**: <1s service resolution
- **Load Balancing Efficiency**: <5% variance in distribution
- **Fault Tolerance**: <1s failover time
- **Monitoring Coverage**: 100% service visibility

This comprehensive API gateway and service mesh implementation provides enterprise-grade traffic management, security, and observability for global scale operations.