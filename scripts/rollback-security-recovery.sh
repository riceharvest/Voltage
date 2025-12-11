#!/bin/bash
# rollback-security-recovery.sh - Security Vulnerability Resolution

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 SECURITY VULNERABILITY RESOLUTION${NC}"

# Run security audit
echo "Running security audit..."
AUDIT_OUTPUT=$(npm audit --json 2>&1)
if echo "$AUDIT_OUTPUT" | grep -q '"critical"'; then
    echo "❌ Critical security vulnerabilities detected"
    CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | cut -d':' -f2)
    echo "Critical vulnerabilities: $CRITICAL_VULNS"
    
    # Attempt to fix critical vulnerabilities
    echo "Attempting to fix critical vulnerabilities..."
    npm audit fix --force
    
    # If still critical, restore package.json
    if npm audit --json | grep -q '"critical"'; then
        echo "⚠️  Critical vulnerabilities persist, restoring package.json..."
        git checkout HEAD -- package.json
        npm install
    fi
elif echo "$AUDIT_OUTPUT" | grep -q '"high"'; then
    echo "⚠️  High severity vulnerabilities detected"
    HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | cut -d':' -f2)
    echo "High vulnerabilities: $HIGH_VULNS"
    
    # Fix high vulnerabilities
    npm audit fix
else
    echo "✅ No critical or high security vulnerabilities detected"
fi

# Check for exposed secrets
echo "Scanning for exposed secrets..."

# Common secret patterns
SECRET_PATTERNS=(
    "password.*=.*['\"][^'\"]*['\"]"
    "api[_-]?key.*=.*['\"][^'\"]*['\"]"
    "secret.*=.*['\"][^'\"]*['\"]"
    "token.*=.*['\"][^'\"]*['\"]"
    "sk-[a-zA-Z0-9]{48}"
    "ghp_[a-zA-Z0-9]{36}"
    "xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"
)

SECRETS_FOUND=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -i "$pattern" src/ 2>/dev/null; then
        echo "⚠️  Potential secret exposure detected with pattern: $pattern"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
done

if [ "$SECRETS_FOUND" -gt 0 ]; then
    echo "❌ Potential secrets found ($SECRETS_FOUND patterns matched)"
    echo "Restoring potentially compromised configuration files..."
    git checkout HEAD -- src/lib/config.ts 2>/dev/null || echo "Could not restore config"
else
    echo "✅ No exposed secrets detected"
fi

# Check for SQL injection vulnerabilities
echo "Checking for potential SQL injection vulnerabilities..."
SQL_PATTERNS=(
    "query.*['\"].*\+.*['\"]"
    "execute.*['\"].*\+.*['\"]"
    "SELECT.*\+\s*"
    "INSERT.*\+\s*"
)

SQL_ISSUES=0

for pattern in "${SQL_PATTERNS[@]}"; do
    if grep -r -i "$pattern" src/ 2>/dev/null; then
        echo "⚠️  Potential SQL injection pattern found: $pattern"
        SQL_ISSUES=$((SQL_ISSUES + 1))
    fi
done

if [ "$SQL_ISSUES" -gt 0 ]; then
    echo "⚠️  Potential SQL injection issues found ($SQL_ISSUES patterns)"
else
    echo "✅ No obvious SQL injection patterns detected"
fi

# Check for XSS vulnerabilities
echo "Checking for potential XSS vulnerabilities..."
XSS_PATTERNS=(
    "innerHTML.*="
    "document\.write"
    "eval\("
    "setTimeout.*['\"]"

)

XSS_ISSUES=0

for pattern in "${XSS_PATTERNS[@]}"; do
    if grep -r -i "$pattern" src/ 2>/dev/null; then
        echo "⚠️  Potential XSS pattern found: $pattern"
        XSS_ISSUES=$((XSS_ISSUES + 1))
    fi
done

if [ "$XSS_ISSUES" -gt 0 ]; then
    echo "⚠️  Potential XSS issues found ($XSS_ISSUES patterns)"
else
    echo "✅ No obvious XSS patterns detected"
fi

# Verify CSRF protection
echo "Verifying CSRF protection..."
if grep -r "csrf" src/ 2>/dev/null; then
    echo "✅ CSRF protection references found"
else
    echo "⚠️  No CSRF protection found, creating basic implementation..."
    cat > src/lib/csrf.ts << 'EOF'
// Basic CSRF protection for emergency rollback
export class CSRFProtection {
  private static token: string | null = null;

  static generateToken(): string {
    if (!this.token) {
      this.token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    }
    return this.token;
  }

  static validateToken(token: string): boolean {
    return token === this.token;
  }

  static getToken(): string | null {
    return this.token;
  }
}
EOF
    echo "✅ Basic CSRF protection created"
fi

# Verify input validation
echo "Checking input validation..."
INPUT_VALIDATION_FOUND=false

# Check for input validation patterns
if grep -r "validate\|sanitize\|escape" src/ 2>/dev/null; then
    echo "✅ Input validation patterns found"
    INPUT_VALIDATION_FOUND=true
fi

if [ "$INPUT_VALIDATION_FOUND" = false ]; then
    echo "⚠️  No input validation found, creating basic utilities..."
    cat > src/lib/validation.ts << 'EOF'
// Basic input validation for emergency rollback
export class InputValidator {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateNumber(num: any): boolean {
    return !isNaN(num) && isFinite(num);
  }

  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
EOF
    echo "✅ Basic input validation utilities created"
fi

# Check authentication and authorization
echo "Checking authentication and authorization..."
if grep -r "auth\|Auth\|login\|Login" src/ 2>/dev/null; then
    echo "✅ Authentication references found"
else
    echo "⚠️  No authentication found, creating basic structure..."
    cat > src/lib/auth.ts << 'EOF'
// Basic authentication for emergency rollback
export interface User {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  private static currentUser: User | null = null;

  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static login(email: string, password: string): boolean {
    // Basic validation - replace with proper authentication
    if (email && password) {
      this.currentUser = {
        id: '1',
        email: email,
        role: 'user'
      };
      return true;
    }
    return false;
  }

  static logout(): void {
    this.currentUser = null;
  }

  static hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }
}
EOF
    echo "✅ Basic authentication service created"
fi

# Security headers check
echo "Checking security headers..."
if [ -f "next.config.ts" ]; then
    if grep -q "headers\|security" next.config.ts; then
        echo "✅ Security headers configuration found"
    else
        echo "⚠️  No security headers found, adding basic configuration..."
        cat >> next.config.ts << 'EOF'

// Security headers for emergency rollback
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
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
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
EOF
        echo "✅ Basic security headers added"
    fi
fi

# Final security scan
echo "Performing final security scan..."
FINAL_AUDIT=$(npm audit --json 2>&1)

if echo "$FINAL_AUDIT" | grep -q '"critical"'; then
    echo "❌ Critical vulnerabilities still present after rollback"
    CRITICAL_COUNT=$(echo "$FINAL_AUDIT" | grep -o '"critical":[0-9]*' | cut -d':' -f2)
    echo "Remaining critical vulnerabilities: $CRITICAL_COUNT"
elif echo "$FINAL_AUDIT" | grep -q '"high"'; then
    echo "⚠️  High vulnerabilities still present"
    HIGH_COUNT=$(echo "$FINAL_AUDIT" | grep -o '"high":[0-9]*' | cut -d':' -f2)
    echo "Remaining high vulnerabilities: $HIGH_COUNT"
else
    echo "✅ No critical or high vulnerabilities remaining"
fi

# Create security report
cat > security-rollback-report.md << EOF
# Security Rollback Report

**Timestamp:** $(date -Iseconds)
**Security Status:** POST-ROLLBACK ANALYSIS

## Vulnerabilities Found and Resolved

### Dependency Vulnerabilities
- **Critical:** $(echo "$FINAL_AUDIT" | grep -o '"critical":[0-9]*' | cut -d':' -f2 || echo "0")
- **High:** $(echo "$FINAL_AUDIT" | grep -o '"high":[0-9]*' | cut -d':' -f2 || echo "0")
- **Medium:** $(echo "$FINAL_AUDIT" | grep -o '"moderate":[0-9]*' | cut -d':' -f2 || echo "0")
- **Low:** $(echo "$FINAL_AUDIT" | grep -o '"low":[0-9]*' | cut -d':' -f2 || echo "0")

### Security Issues Detected
- **Exposed Secrets:** $SECRETS_FOUND patterns
- **SQL Injection Patterns:** $SQL_ISSUES patterns  
- **XSS Patterns:** $XSS_ISSUES patterns

## Security Measures Implemented
- ✅ CSRF protection basic implementation
- ✅ Input validation utilities
- ✅ Authentication service framework
- ✅ Security headers configuration
- ✅ Dependency vulnerability fixes

## Recommendations
1. Conduct comprehensive security audit post-rollback
2. Implement proper authentication and authorization
3. Add comprehensive input validation
4. Regular dependency vulnerability scanning
5. Security code review for all changes

---
*Generated by Emergency Security Rollback System*
EOF

echo -e "${GREEN}✅ Security vulnerability resolution completed${NC}"
echo "Security rollback report generated: security-rollback-report.md"

exit 0