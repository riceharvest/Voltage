/**
 * Advanced API Security Implementation
 * 
 * Provides OAuth 2.0, JWT token management, API key rotation,
 * request signing, encryption, and comprehensive security scanning.
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Security Configuration
export interface SecurityConfig {
  jwt: JWTConfig;
  oauth: OAuthConfig;
  apiKeys: APIKeyConfig;
  encryption: EncryptionConfig;
  rateLimiting: RateLimitConfig;
  cors: CORSConfig;
  requestSigning: RequestSigningConfig;
}

// JWT Configuration
export interface JWTConfig {
  secret: string;
  algorithm: string;
  expiresIn: string;
  issuer: string;
  audience: string;
  refreshTokenExpiresIn: string;
}

// OAuth 2.0 Configuration
export interface OAuthConfig {
  authorizationCodeExpiresIn: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  scopes: string[];
  providers: OAuthProvider[];
}

// API Key Configuration
export interface APIKeyConfig {
  algorithm: string;
  keyLength: number;
  rotationInterval: number;
  maxKeysPerUser: number;
  allowedPermissions: string[];
}

// Encryption Configuration
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

// Request Signing Configuration
export interface RequestSigningConfig {
  algorithm: string;
  includeHeaders: string[];
  excludeHeaders: string[];
}

// Security Token Manager
export class SecurityTokenManager {
  private config: SecurityConfig;
  private keyStore: Map<string, SecurityKey> = new Map();
  private tokenBlacklist: Set<string> = new Set();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeKeyStore();
  }

  // JWT Token Management
  generateJWT(payload: any, options?: jwt.SignOptions): string {
    const defaultOptions: jwt.SignOptions = {
      algorithm: this.config.jwt.algorithm as jwt.Algorithm,
      expiresIn: this.config.jwt.expiresIn,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    };

    return jwt.sign(payload, this.config.jwt.secret, { ...defaultOptions, ...options });
  }

  verifyJWT(token: string): jwt.JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        algorithms: [this.config.jwt.algorithm as jwt.Algorithm],
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as jwt.JwtPayload;

      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token is blacklisted');
      }

      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  revokeJWT(token: string): void {
    this.tokenBlacklist.add(token);
  }

  generateRefreshToken(userId: string): string {
    const payload = {
      type: 'refresh',
      userId,
      issuedAt: Date.now()
    };

    return this.generateJWT(payload, { expiresIn: this.config.jwt.refreshTokenExpiresIn });
  }

  // OAuth 2.0 Implementation
  generateAuthorizationCode(clientId: string, userId: string, scope: string[]): string {
    const code = crypto.randomBytes(32).toString('hex');
    
    const authorizationCode = {
      code,
      clientId,
      userId,
      scope: scope.join(' '),
      issuedAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };

    // Store in memory (use Redis/database in production)
    this.keyStore.set(`auth_code:${code}`, authorizationCode);
    
    return code;
  }

  async exchangeAuthorizationCode(code: string, clientId: string, clientSecret: string): Promise<OAuthTokens | null> {
    const authCode = this.keyStore.get(`auth_code:${code}`);
    
    if (!authCode || 
        authCode.clientId !== clientId || 
        authCode.expiresAt < Date.now()) {
      return null;
    }

    // Remove the used authorization code
    this.keyStore.delete(`auth_code:${code}`);

    // Generate access and refresh tokens
    const accessToken = this.generateJWT({
      type: 'access',
      userId: authCode.userId,
      clientId: authCode.clientId,
      scope: authCode.scope
    }, { expiresIn: this.config.oauth.accessTokenExpiresIn });

    const refreshToken = this.generateJWT({
      type: 'refresh',
      userId: authCode.userId,
      clientId: authCode.clientId
    }, { expiresIn: this.config.oauth.refreshTokenExpiresIn });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: authCode.scope
    };
  }

  // API Key Management
  generateAPIKey(userId: string, permissions: string[]): string {
    const keyId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(this.config.apiKeys.keyLength).toString('hex');
    const fullKey = `vsk_${keyId}_${secret}`;

    const apiKey: SecurityKey = {
      id: keyId,
      userId,
      key: fullKey,
      permissions,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      active: true,
      rotationDue: Date.now() + this.config.apiKeys.rotationInterval
    };

    this.keyStore.set(keyId, apiKey);
    return fullKey;
  }

  verifyAPIKey(apiKey: string): SecurityKey | null {
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'vsk') {
      return null;
    }

    const keyId = parts[1];
    const storedKey = this.keyStore.get(keyId);

    if (!storedKey || !storedKey.active || storedKey.key !== apiKey) {
      return null;
    }

    // Check if key rotation is due
    if (storedKey.rotationDue < Date.now()) {
      storedKey.active = false;
      this.keyStore.set(keyId, storedKey);
      return null;
    }

    // Update last used timestamp
    storedKey.lastUsed = Date.now();
    this.keyStore.set(keyId, storedKey);

    return storedKey;
  }

  rotateAPIKey(keyId: string): string | null {
    const oldKey = this.keyStore.get(keyId);
    if (!oldKey || !oldKey.active) {
      return null;
    }

    // Deactivate old key
    oldKey.active = false;
    this.keyStore.set(keyId, oldKey);

    // Generate new key with same permissions
    return this.generateAPIKey(oldKey.userId, oldKey.permissions);
  }

  revokeAPIKey(keyId: string): boolean {
    const key = this.keyStore.get(keyId);
    if (!key) return false;

    key.active = false;
    this.keyStore.set(keyId, key);
    return true;
  }

  // Request Signing and Verification
  generateRequestSignature(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string,
    timestamp: number,
    nonce: string
  ): string {
    const signingString = [
      method.toUpperCase(),
      url,
      headers['content-type'] || '',
      headers['x-api-key'] || '',
      timestamp.toString(),
      nonce,
      body || ''
    ].join('\n');

    const hmac = crypto.createHmac(
      this.config.requestSigning.algorithm,
      this.config.jwt.secret
    );
    hmac.update(signingString);
    return hmac.digest('hex');
  }

  verifyRequestSignature(
    request: NextRequest,
    body: string
  ): boolean {
    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');
    const nonce = request.headers.get('x-nonce');

    if (!signature || !timestamp || !nonce) {
      return false;
    }

    // Check timestamp freshness (5 minutes)
    const requestTime = parseInt(timestamp);
    const now = Date.now();
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return false;
    }

    // Check nonce replay (simplified - use Redis in production)
    const nonceKey = `nonce:${nonce}`;
    if (this.keyStore.has(nonceKey)) {
      return false; // Replay attack
    }
    this.keyStore.set(nonceKey, { id: nonceKey, createdAt: now } as SecurityKey);

    const expectedSignature = this.generateRequestSignature(
      request.method,
      request.url,
      Object.fromEntries(request.headers.entries()),
      body,
      requestTime,
      nonce
    );

    return signature === expectedSignature;
  }

  // Encryption/Decryption
  encrypt(data: string, key?: string): string {
    const encryptionKey = key || this.config.jwt.secret;
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    
    const cipher = crypto.createCipher(this.config.encryption.algorithm, encryptionKey);
    cipher.setAAD(Buffer.from('voltage-soda', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  decrypt(encryptedData: string, key?: string): string | null {
    try {
      const encryptionKey = key || this.config.jwt.secret;
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const iv = buffer.subarray(0, this.config.encryption.ivLength);
      const authTag = buffer.subarray(
        this.config.encryption.ivLength, 
        this.config.encryption.ivLength + this.config.encryption.tagLength
      );
      const encrypted = buffer.subarray(this.config.encryption.ivLength + this.config.encryption.tagLength);
      
      const decipher = crypto.createDecipher(this.config.encryption.algorithm, encryptionKey);
      decipher.setAAD(Buffer.from('voltage-soda', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  private initializeKeyStore(): void {
    // Initialize with default keys or load from database
    console.log('Security key store initialized');
  }
}

// Security Middleware
export class SecurityMiddleware {
  private tokenManager: SecurityTokenManager;
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.tokenManager = new SecurityTokenManager(config);
  }

  async authenticateRequest(req: NextRequest): Promise<AuthenticationResult> {
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');
    const signature = req.headers.get('x-signature');

    // Try API Key authentication first
    if (apiKey) {
      const keyData = this.tokenManager.verifyAPIKey(apiKey);
      if (keyData) {
        return {
          success: true,
          method: 'api-key',
          user: {
            id: keyData.userId,
            permissions: keyData.permissions,
            keyId: keyData.id
          }
        };
      }
    }

    // Try JWT authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = this.tokenManager.verifyJWT(token);
      if (payload) {
        return {
          success: true,
          method: 'jwt',
          user: {
            id: payload.userId || payload.sub,
            permissions: payload.permissions || [],
            tokenId: payload.jti
          }
        };
      }
    }

    // Try request signing authentication
    if (signature) {
      const body = await req.text();
      if (this.tokenManager.verifyRequestSignature(req, body)) {
        const apiKey = req.headers.get('x-api-key');
        if (apiKey) {
          const keyData = this.tokenManager.verifyAPIKey(apiKey);
          if (keyData) {
            return {
              success: true,
              method: 'signed-request',
              user: {
                id: keyData.userId,
                permissions: keyData.permissions,
                keyId: keyData.id
              }
            };
          }
        }
      }
    }

    return {
      success: false,
      error: 'Authentication failed'
    };
  }

  async authorizeRequest(auth: AuthenticationResult, requiredPermissions: string[]): Promise<AuthorizationResult> {
    if (!auth.success) {
      return {
        authorized: false,
        error: 'Authentication required'
      };
    }

    const userPermissions = auth.user?.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    return {
      authorized: hasAllPermissions,
      permissions: userPermissions,
      required: requiredPermissions
    };
  }

  generateSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:;",
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  detectSecurityThreats(req: NextRequest): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';

    // Detect SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /('|(\\x27)|(\\xBF)|(\\x22)|(\\x23))/i,
      /(union|script|javascript|vbscript|onload|onerror)/i
    ];

    if (sqlPatterns.some(pattern => pattern.test(req.url))) {
      threats.push({
        type: 'sql-injection',
        severity: 'high',
        description: 'Potential SQL injection attempt detected',
        evidence: req.url
      });
    }

    // Detect XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    if (xssPatterns.some(pattern => pattern.test(req.url))) {
      threats.push({
        type: 'xss',
        severity: 'high',
        description: 'Potential XSS attempt detected',
        evidence: req.url
      });
    }

    // Detect suspicious user agents
    if (this.isSuspiciousUserAgent(userAgent)) {
      threats.push({
        type: 'suspicious-agent',
        severity: 'medium',
        description: 'Suspicious user agent detected',
        evidence: userAgent
      });
    }

    // Detect CSRF attempts
    if (req.method === 'POST' && !origin && !referer) {
      threats.push({
        type: 'missing-origin',
        severity: 'medium',
        description: 'POST request missing origin/referer header',
        evidence: 'Missing security headers'
      });
    }

    return threats;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /sqlmap|nmap|nikto/i,
      /curl|wget|python/i,
      /Anonymous|anonymous/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}

// Security Scanner
export class SecurityScanner {
  private vulnerabilityDatabase: Vulnerability[] = [];

  constructor() {
    this.initializeVulnerabilityDatabase();
  }

  async scanEndpoint(url: string, method: string = 'GET'): Promise<SecurityScanResult> {
    const vulnerabilities: VulnerabilityFinding[] = [];
    const startTime = Date.now();

    try {
      // Test for common vulnerabilities
      const tests = [
        () => this.testSQLInjection(url, method),
        () => this.testXSS(url, method),
        () => this.testCSRF(url, method),
        () => this.testPathTraversal(url, method),
        () => this.testCommandInjection(url, method),
        () => this.testDirectoryListing(url),
        () => this.testSecurityHeaders(url),
        () => this.testAuthenticationBypass(url, method)
      ];

      for (const test of tests) {
        try {
          const result = await test();
          if (result) {
            vulnerabilities.push(result);
          }
        } catch (error) {
          console.error('Security test failed:', error);
        }
      }

      const scanTime = Date.now() - startTime;
      
      return {
        url,
        method,
        scanTime,
        vulnerabilities,
        riskScore: this.calculateRiskScore(vulnerabilities),
        recommendations: this.generateRecommendations(vulnerabilities),
        timestamp: Date.now()
      };

    } catch (error) {
      throw new Error(`Security scan failed: ${error}`);
    }
  }

  private async testSQLInjection(url: string, method: string): Promise<VulnerabilityFinding | null> {
    const payload = "' OR '1'='1";
    const testUrl = `${url}?test=${encodeURIComponent(payload)}`;

    try {
      const response = await fetch(testUrl, { method });
      
      if (response.status === 500 || 
          response.headers.get('content-type')?.includes('text/html')) {
        return {
          type: 'SQL Injection',
          severity: 'critical',
          description: 'Possible SQL injection vulnerability detected',
          evidence: `Response status: ${response.status}`,
          recommendation: 'Use parameterized queries and input validation'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testXSS(url: string, method: string): Promise<VulnerabilityFinding | null> {
    const payload = '<script>alert("XSS")</script>';
    const testUrl = `${url}?test=${encodeURIComponent(payload)}`;

    try {
      const response = await fetch(testUrl, { method });
      const content = await response.text();
      
      if (content.includes(payload) || 
          content.includes('alert("XSS")')) {
        return {
          type: 'Cross-Site Scripting (XSS)',
          severity: 'high',
          description: 'Possible XSS vulnerability detected',
          evidence: 'User input reflected in response without encoding',
          recommendation: 'Implement proper input encoding and Content Security Policy'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testCSRF(url: string, method: string): Promise<VulnerabilityFinding | null> {
    if (method !== 'POST') return null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'csrf' })
      });

      // Check if CSRF token is required
      if (response.status === 200) {
        return {
          type: 'CSRF',
          severity: 'medium',
          description: 'POST request without CSRF protection',
          evidence: 'Request processed without CSRF token validation',
          recommendation: 'Implement CSRF token validation for state-changing operations'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testPathTraversal(url: string, method: string): Promise<VulnerabilityFinding | null> {
    const payloads = ['../../../etc/passwd', '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts'];
    
    for (const payload of payloads) {
      const testUrl = `${url}?file=${encodeURIComponent(payload)}`;
      
      try {
        const response = await fetch(testUrl, { method });
        const content = await response.text();
        
        if (content.includes('root:') || content.includes('127.0.0.1')) {
          return {
            type: 'Path Traversal',
            severity: 'high',
            description: 'Possible path traversal vulnerability detected',
            evidence: 'System file contents returned in response',
            recommendation: 'Validate and sanitize file path inputs'
          };
        }
      } catch (error) {
        // Ignore network errors
      }
    }

    return null;
  }

  private async testCommandInjection(url: string, method: string): Promise<VulnerabilityFinding | null> {
    const payload = '; cat /etc/passwd';
    const testUrl = `${url}?cmd=${encodeURIComponent(payload)}`;

    try {
      const response = await fetch(testUrl, { method });
      const content = await response.text();
      
      if (content.includes('root:') || content.includes('daemon:')) {
        return {
          type: 'Command Injection',
          severity: 'critical',
          description: 'Possible command injection vulnerability detected',
          evidence: 'System command output in response',
          recommendation: 'Avoid executing shell commands with user input'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testDirectoryListing(url: string): Promise<VulnerabilityFinding | null> {
    try {
      const response = await fetch(url);
      const content = await response.text();
      
      if (response.status === 200 && 
          (content.includes('Index of') || content.includes('Directory listing'))) {
        return {
          type: 'Directory Listing',
          severity: 'medium',
          description: 'Directory listing is enabled',
          evidence: 'Directory index page displayed',
          recommendation: 'Disable directory listing on web server'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testSecurityHeaders(url: string): Promise<VulnerabilityFinding | null> {
    try {
      const response = await fetch(url);
      const missingHeaders: string[] = [];
      
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      for (const header of requiredHeaders) {
        if (!response.headers.get(header)) {
          missingHeaders.push(header);
        }
      }

      if (missingHeaders.length > 0) {
        return {
          type: 'Missing Security Headers',
          severity: 'low',
          description: 'Missing security headers detected',
          evidence: `Missing headers: ${missingHeaders.join(', ')}`,
          recommendation: 'Implement recommended security headers'
        };
      }
    } catch (error) {
      // Ignore network errors
    }

    return null;
  }

  private async testAuthenticationBypass(url: string, method: string): Promise<VulnerabilityFinding | null> {
    // Test common admin endpoints
    const adminPaths = ['/admin', '/api/admin', '/dashboard', '/management'];
    
    for (const path of adminPaths) {
      try {
        const testUrl = url.replace(/\/[^/]*$/, path);
        const response = await fetch(testUrl, { method });
        
        if (response.status === 200 && 
            !response.headers.get('www-authenticate')) {
          return {
            type: 'Authentication Bypass',
            severity: 'high',
            description: 'Possible authentication bypass detected',
            evidence: `Admin endpoint accessible without authentication: ${testUrl}`,
            recommendation: 'Implement proper authentication and authorization checks'
          };
        }
      } catch (error) {
        // Ignore network errors
      }
    }

    return null;
  }

  private calculateRiskScore(vulnerabilities: VulnerabilityFinding[]): number {
    let score = 0;
    
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': score += 40; break;
        case 'high': score += 20; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    }
    
    return Math.min(100, score);
  }

  private generateRecommendations(vulnerabilities: VulnerabilityFinding[]): string[] {
    const recommendations = new Set<string>();
    
    for (const vuln of vulnerabilities) {
      recommendations.add(vuln.recommendation);
    }
    
    return Array.from(recommendations);
  }

  private initializeVulnerabilityDatabase(): void {
    // Initialize vulnerability database with known CVE entries
    this.vulnerabilityDatabase = [
      {
        id: 'CVE-2023-1234',
        name: 'SQL Injection',
        severity: 'critical',
        description: 'SQL injection vulnerability in endpoint processing',
        affectedVersions: ['1.0.0', '1.1.0'],
        fixedVersion: '1.2.0'
      }
    ];
  }
}

// Type Definitions
export interface SecurityKey {
  id: string;
  userId: string;
  key: string;
  permissions: string[];
  createdAt: number;
  lastUsed: number;
  active: boolean;
  rotationDue: number;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface AuthenticationResult {
  success: boolean;
  method?: string;
  user?: {
    id: string;
    permissions: string[];
    keyId?: string;
    tokenId?: string;
  };
  error?: string;
}

export interface AuthorizationResult {
  authorized: boolean;
  permissions?: string[];
  required?: string[];
  error?: string;
}

export interface SecurityThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
}

export interface SecurityScanResult {
  url: string;
  method: string;
  scanTime: number;
  vulnerabilities: VulnerabilityFinding[];
  riskScore: number;
  recommendations: string[];
  timestamp: number;
}

export interface VulnerabilityFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: string;
  description: string;
  affectedVersions: string[];
  fixedVersion: string;
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// Default Security Configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'voltage-soda-api',
    audience: 'voltage-soda-clients',
    refreshTokenExpiresIn: '7d'
  },
  oauth: {
    authorizationCodeExpiresIn: '5m',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    scopes: ['read', 'write', 'admin'],
    providers: []
  },
  apiKeys: {
    algorithm: 'sha256',
    keyLength: 32,
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxKeysPerUser: 5,
    allowedPermissions: ['read', 'write', 'admin', 'billing']
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 12,
    tagLength: 16
  },
  rateLimiting: {
    windowMs: 60000,
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  cors: {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200
  },
  requestSigning: {
    algorithm: 'sha256',
    includeHeaders: ['content-type', 'x-api-key'],
    excludeHeaders: ['x-signature', 'x-timestamp', 'x-nonce']
  }
};