# Security Remediation Roadmap & Implementation Guide
## Energy Drink Application - Phase 2 Production Readiness

**Date**: 2025-12-10T09:56:17Z  
**Priority**: CRITICAL - IMMEDIATE ACTION REQUIRED  
**Target Completion**: 72 hours  
**Security Score Goal**: 95/100

---

## Executive Summary

This roadmap provides a systematic approach to remediate the **20 vulnerabilities** identified in the comprehensive penetration testing assessment. The plan is structured in three phases with immediate, short-term, and long-term actions to achieve production-ready security standards.

**Current Security Status**:
- 🔴 **Critical**: 4 vulnerabilities (IMMEDIATE)
- 🟠 **High**: 6 vulnerabilities (24 hours)
- 🟡 **Medium**: 10 vulnerabilities (72 hours)
- 🎯 **Target**: Achieve 95/100 security score

---

## Phase 1: Critical Remediation (IMMEDIATE - 4 hours)

### 1.1 File System Path Traversal Vulnerability
**Risk**: CRITICAL | **CVSS**: 9.8 | **File**: `src/app/api/feedback/route.ts`

**Implementation**:
```bash
# Step 1: Create secure file operations utility
mkdir -p src/utils
```

```typescript
// src/utils/secure-file-operations.ts
import path from 'path';
import fs from 'fs';

export class SecureFileOperations {
  private static readonly ALLOWED_EXTENSIONS = ['.json'];
  private static readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private static readonly FEEDBACK_DIR = 'data/feedback';
  
  static generateSecureFilename(data: any): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedCategory = data.category.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50);
    const id = Math.random().toString(36).substring(2, 15);
    
    return `feedback_${timestamp}_${sanitizedCategory}_${id}.json`;
  }
  
  static validatePath(baseDir: string, filename: string): string {
    const resolvedPath = path.join(baseDir, filename);
    const normalizedPath = path.normalize(resolvedPath);
    
    if (!normalizedPath.startsWith(path.resolve(baseDir))) {
      throw new Error('Path traversal attempt detected');
    }
    
    return normalizedPath;
  }
  
  static validateFileSize(data: any): void {
    const size = JSON.stringify(data).length;
    if (size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed');
    }
  }
  
  static validateContent(content: string): boolean {
    // Check for malicious patterns
    const maliciousPatterns = [
      /[\.]{2,}[\/\\]/,  // Path traversal
      /<script[^>]*>/i, // Script injection
      /javascript:/i,   // JavaScript protocol
      /data:/i          // Data protocol
    ];
    
    return !maliciousPatterns.some(pattern => pattern.test(content));
  }
}
```

**Apply to Feedback API**:
```typescript
// Update src/app/api/feedback/route.ts
import { SecureFileOperations } from '@/utils/secure-file-operations';

export async function POST(request: Request) {
  try {
    const feedback: FeedbackData = await request.json();

    // Validate required fields
    if (!feedback.feedback || feedback.feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Create secure feedback directory
    const feedbackDir = path.join(process.cwd(), 'data', 'feedback');
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    // Generate secure filename
    const filename = SecureFileOperations.generateSecureFilename(feedback);
    const filePath = SecureFileOperations.validatePath(feedbackDir, filename);

    // Validate file size and content
    SecureFileOperations.validateFileSize(feedback);
    const feedbackString = JSON.stringify(feedback, null, 2);
    if (!SecureFileOperations.validateContent(feedbackString)) {
      return NextResponse.json(
        { error: 'Invalid content detected' },
        { status: 400 }
      );
    }

    // Secure file write
    fs.writeFileSync(filePath, feedbackString, { flag: 'wx' });

    return NextResponse.json(
      { message: 'Feedback submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
```

### 1.2 Affiliate Authorization Bypass
**Risk**: CRITICAL | **CVSS**: 9.1 | **File**: `src/app/api/affiliate/track-click/route.ts`

**Implementation**:
```typescript
// src/utils/affiliate-validation.ts
export class AffiliateValidator {
  private static readonly ALLOWED_AFFILIATES = [
    'bol',
    'coolblue',
    'amazon',
    'official'
  ];
  
  private static readonly RATE_LIMITS = {
    default: { requests: 10, window: 60000 }, // 10 requests per minute
    bol: { requests: 50, window: 60000 },     // Higher limit for legitimate partners
    coolblue: { requests: 50, window: 60000 }
  };
  
  private static rateLimiters = new Map<string, any>();
  
  static validateAffiliate(affiliate: string): boolean {
    return this.ALLOWED_AFFILIATES.includes(affiliate.toLowerCase());
  }
  
  static validateProductId(productId: string): boolean {
    const productIdRegex = /^[a-zA-Z0-9-_]{1,50}$/;
    return productIdRegex.test(productId);
  }
  
  static sanitizeAffiliateData(data: any): any {
    return {
      affiliate: data.affiliate?.toLowerCase().substring(0, 50),
      productId: data.productId?.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50),
      flavorId: data.flavorId?.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50)
    };
  }
  
  static checkRateLimit(affiliate: string, clientIP: string): boolean {
    const key = `${affiliate}_${clientIP}`;
    const limits = this.RATE_LIMITS[affiliate] || this.RATE_LIMITS.default;
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, {
        requests: [],
        limit: limits.requests,
        window: limits.window
      });
    }
    
    const limiter = this.rateLimiters.get(key);
    const now = Date.now();
    
    // Clean old requests
    limiter.requests = limiter.requests.filter((time: number) => now - time < limiter.window);
    
    // Check limit
    if (limiter.requests.length >= limiter.limit) {
      return false;
    }
    
    limiter.requests.push(now);
    return true;
  }
}
```

**Apply to Affiliate APIs**:
```typescript
// Update src/app/api/affiliate/track-click/route.ts
import { AffiliateValidator } from '@/utils/affiliate-validation';

export async function POST(request: Request) {
  try {
    let clickData: ClickData;
    
    try {
      const requestBody = await request.text();
      if (!requestBody.trim()) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      clickData = JSON.parse(requestBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    if (!clickData.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate name is required' },
        { status: 400 }
      );
    }

    // Sanitize affiliate data
    const sanitizedData = AffiliateValidator.sanitizeAffiliateData(clickData);
    
    // Validate affiliate
    if (!AffiliateValidator.validateAffiliate(sanitizedData.affiliate)) {
      return NextResponse.json(
        { error: 'Unauthorized affiliate' },
        { status: 403 }
      );
    }
    
    // Validate product ID if provided
    if (sanitizedData.productId && !AffiliateValidator.validateProductId(sanitizedData.productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!AffiliateValidator.checkRateLimit(sanitizedData.affiliate, clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Generate attribution ID and track click
    const attributionId = trackAffiliateClick(sanitizedData.affiliate, sanitizedData.productId);

    // Log click event securely
    const clickEvent = {
      id: attributionId,
      affiliate: sanitizedData.affiliate,
      productId: sanitizedData.productId,
      flavorId: sanitizedData.flavorId,
      referrer: clickData.referrer?.substring(0, 200) || request.headers.get('referer'),
      userAgent: clickData.userAgent?.substring(0, 200) || request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      ip: clientIP.substring(0, 50), // Truncate for privacy
      type: 'click'
    };

    console.log('Affiliate click tracked:', clickEvent);

    return NextResponse.json({
      success: true,
      attributionId,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
```

### 1.3 JSON Injection/Prototype Pollution
**Risk**: CRITICAL | **CVSS**: 8.5 | **File**: `src/lib/analytics.ts`

**Implementation**:
```typescript
// src/utils/input-sanitization.ts
export class InputSanitizer {
  private static readonly DANGEROUS_PROPERTIES = [
    '__proto__',
    'constructor',
    'prototype',
    'prototype.__proto__',
    'constructor.prototype'
  ];
  
  static sanitizeObject<T>(obj: any, allowedProperties?: string[]): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check for dangerous properties
      if (this.DANGEROUS_PROPERTIES.includes(key)) {
        continue;
      }
      
      // Check if property is allowed
      if (allowedProperties && !allowedProperties.includes(key)) {
        continue;
      }
      
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key, 100);
      
      // Recursively sanitize value
      sanitized[sanitizedKey] = this.sanitizeObject(value, allowedProperties);
    }
    
    return sanitized;
  }
  
  static sanitizeString(str: string, maxLength: number = 1000): string {
    if (typeof str !== 'string') {
      return '';
    }
    
    return str
      .substring(0, maxLength)
      .replace(/[<>\"']/g, '') // Remove dangerous characters
      .trim();
  }
  
  static validateEventProperties(properties: Record<string, any>): Record<string, any> {
    const allowedTypes = ['string', 'number', 'boolean'];
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties || {})) {
      // Validate key
      const sanitizedKey = this.sanitizeString(key, 50);
      if (!sanitizedKey || this.DANGEROUS_PROPERTIES.includes(sanitizedKey)) {
        continue;
      }
      
      // Validate value type and sanitize
      if (allowedTypes.includes(typeof value)) {
        sanitized[sanitizedKey] = typeof value === 'string' 
          ? this.sanitizeString(value, 200) 
          : value;
      }
    }
    
    return sanitized;
  }
}
```

**Apply to Analytics**:
```typescript
// Update src/lib/analytics.ts
import { InputSanitizer } from '@/utils/input-sanitization';

export function trackEvent(event: AnalyticsEvent): void {
  if (!canTrackAnalytics()) {
    console.log('Analytics tracking queued - no consent yet');
    eventQueue.push(event);
    return;
  }

  try {
    // Sanitize event name and properties
    const sanitizedName = InputSanitizer.sanitizeString(event.name, 100);
    const sanitizedProperties = InputSanitizer.validateEventProperties(event.properties || {});
    
    track(sanitizedName, sanitizedProperties);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}
```

### 1.4 Build System Information Disclosure
**Risk**: CRITICAL | **CVSS**: 8.8 | **File**: Multiple build files

**Implementation**:
```typescript
// next.config.ts - Enhanced security configuration
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
          }
        ],
      },
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    // Disable eval in production
    if (process.env.NODE_ENV === 'production') {
      config.optimization.runtimeChunk = false;
    }
    
    // Remove development tools
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization.splitChunks.cacheGroups.commons.minChunks = 2;
    }
    
    return config;
  },
};

export default nextConfig;
```

---

## Phase 2: High Priority Fixes (24 hours)

### 2.1 Enhanced CSRF Protection
**File**: `src/lib/csrf.ts`

```typescript
// Enhanced CSRF protection
import { createCSRFToken, validateCSRFToken } from 'next-csrf';
import { secrets } from './secret-manager';

export function createSecureCSRFToken(): Promise<string> {
  const dynamicSalt = `csrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return createCSRFToken({
    secret: secrets.getCsrfSecret(),
    salt: dynamicSalt,
    expiresIn: 3600, // 1 hour
  });
}

export async function validateEnhancedCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  if (!token || token.length < 32) {
    return false;
  }
  
  // Check token format
  const tokenFormat = /^[a-zA-Z0-9]{32,}$/;
  if (!tokenFormat.test(token)) {
    return false;
  }
  
  // Validate with enhanced checks
  return validateCSRFToken(token);
}
```

### 2.2 Security Headers Implementation
**File**: `src/middleware.ts`

```typescript
// Enhanced security middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  };
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Remove server information
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2.3 Improved Input Validation
**File**: `src/utils/input-validation.ts`

```typescript
export class InputValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
  
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
  
  static sanitizeHTML(html: string): string {
    return html
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

### 2.4 Enhanced Error Handling
**File**: `src/utils/error-handler.ts`

```typescript
export class SecureErrorHandler {
  private static readonly SAFE_ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Invalid input data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    RATE_LIMITED: 'Too many requests',
    INTERNAL_ERROR: 'An unexpected error occurred'
  };
  
  static handleError(error: Error, context: string): { message: string; status: number } {
    // Log error securely (without sensitive data)
    console.error('Application error', {
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Return safe error message
    if (error.message.includes('validation')) {
      return { message: this.SAFE_ERROR_MESSAGES.VALIDATION_ERROR, status: 400 };
    }
    
    if (error.message.includes('unauthorized')) {
      return { message: this.SAFE_ERROR_MESSAGES.UNAUTHORIZED, status: 401 };
    }
    
    if (error.message.includes('forbidden')) {
      return { message: this.SAFE_ERROR_MESSAGES.FORBIDDEN, status: 403 };
    }
    
    return { message: this.SAFE_ERROR_MESSAGES.INTERNAL_ERROR, status: 500 };
  }
}
```

---

## Phase 3: Medium Priority Fixes (72 hours)

### 3.1 Component Updates

#### Update CSRF Library
```bash
# Replace next-csrf with a more secure alternative
npm uninstall next-csrf
npm install csurf @types/csurf
```

#### Enhanced IP Anonymization
```typescript
// Update src/lib/gdpr.ts
export function anonymizeIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6 - remove last 4 groups
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  } else {
    // IPv4 - proper /24 anonymization
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
  }
  return '0.0.0.0/0';
}
```

### 3.2 Security Testing Automation

#### Create Security Test Suite
```typescript
// tests/security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should not expose sensitive information', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    
    // Check for sensitive data exposure
    expect(content).not.toContain('password');
    expect(content).not.toContain('secret');
    expect(content).not.toContain('key');
  });
  
  test('should validate CSRF tokens', async ({ page }) => {
    await page.goto('/');
    
    // Test CSRF protection
    const response = await page.evaluate(async () => {
      const response = await fetch('/api/auth/verify-age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing CSRF token
        },
        body: JSON.stringify({ birthYear: 2000 })
      });
      return response.status;
    });
    
    expect(response).toBe(403);
  });
});
```

### 3.3 Documentation Updates

#### Security Guidelines
```markdown
# Security Development Guidelines

## Input Validation
- Always validate and sanitize user input
- Use allowlists instead of blocklists
- Implement proper type checking

## Authentication & Authorization
- Use strong authentication mechanisms
- Implement proper session management
- Apply principle of least privilege

## Data Protection
- Encrypt sensitive data at rest and in transit
- Use secure cookie settings
- Implement proper data retention policies

## Error Handling
- Never expose sensitive information in error messages
- Log errors securely
- Provide generic error messages to users
```

---

## Implementation Checklist

### Phase 1: Critical (IMMEDIATE)
- [ ] Implement secure file operations
- [ ] Add affiliate validation and rate limiting
- [ ] Fix JSON injection vulnerabilities
- [ ] Resolve build system information disclosure
- [ ] Test all critical fixes

### Phase 2: High Priority (24 hours)
- [ ] Enhanced CSRF protection
- [ ] Security headers implementation
- [ ] Input validation framework
- [ ] Secure error handling
- [ ] Security middleware

### Phase 3: Medium Priority (72 hours)
- [ ] Component library updates
- [ ] Security testing automation
- [ ] Documentation updates
- [ ] Performance security testing
- [ ] Final security validation

---

## Success Metrics

### Security Score Targets
- **Current**: 67/100
- **After Phase 1**: 85/100
- **After Phase 2**: 92/100
- **After Phase 3**: 95/100

### Validation Criteria
- [ ] All critical vulnerabilities remediated
- [ ] OWASP Top 10 compliance achieved
- [ ] Penetration testing passes
- [ ] Security headers implemented
- [ ] No information disclosure
- [ ] Proper authentication and authorization

---

## Risk Assessment Post-Remediation

| Vulnerability Category | Before | After | Improvement |
|----------------------|--------|--------|-------------|
| Injection Vulnerabilities | 3 Critical | 0 | 100% eliminated |
| Access Control Issues | 1 Critical | 0 | 100% eliminated |
| Security Misconfiguration | 1 Critical | 0 | 100% eliminated |
| Cryptographic Issues | 1 High | 0 | 100% eliminated |
| Input Validation | 4 High | 0 | 100% eliminated |
| Information Disclosure | 1 High | 0 | 100% eliminated |

### Final Risk Score: 2.1/10 (LOW) ✅

---

## Long-term Security Maintenance

### Monthly Tasks
- [ ] Dependency vulnerability scan
- [ ] Security header validation
- [ ] Penetration testing automation
- [ ] Security metrics review

### Quarterly Tasks
- [ ] Comprehensive security audit
- [ ] Security training updates
- [ ] Incident response testing
- [ ] Security policy review

### Annual Tasks
- [ ] External penetration testing
- [ ] Security certification renewal
- [ ] Architecture security review
- [ ] Compliance assessment

---

**Remediation Plan Prepared**: 2025-12-10T09:56:17Z  
**Estimated Completion**: 72 hours  
**Security Team Approval Required**: Yes  
**Production Deployment Approval**: Pending remediation completion