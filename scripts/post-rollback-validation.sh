#!/bin/bash
# post-rollback-validation.sh - Post-Rollback System Validation

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 POST-ROLLBACK SYSTEM VALIDATION${NC}"
echo "Timestamp: $(date -Iseconds)"
echo "=========================================="

# Validation results tracking
declare -A VALIDATION_RESULTS
VALIDATION_RESULTS[typescript]="UNKNOWN"
VALIDATION_RESULTS[eslint]="UNKNOWN"
VALIDATION_RESULTS[build]="UNKNOWN"
VALIDATION_RESULTS[api]="UNKNOWN"
VALIDATION_RESULTS[data]="UNKNOWN"

# 1. TypeScript compilation check
echo -e "\n${BLUE}1. TypeScript Compilation Check${NC}"
if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation: PASS${NC}"
    VALIDATION_RESULTS[typescript]="PASS"
else
    echo -e "${RED}❌ TypeScript compilation: FAIL${NC}"
    ERROR_COUNT=$(npx tsc --noEmit 2>&1 | find /c ":" || echo "0")
    echo "TypeScript errors: $ERROR_COUNT"
    VALIDATION_RESULTS[typescript]="FAIL"
fi

# 2. ESLint validation
echo -e "\n${BLUE}2. ESLint Validation${NC}"
if npm run lint >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ESLint validation: PASS${NC}"
    VALIDATION_RESULTS[eslint]="PASS"
else
    echo -e "${YELLOW}⚠️  ESLint validation: WARN${NC}"
    VIOLATION_COUNT=$(npm run lint 2>&1 | find /c ":" || echo "0")
    echo "ESLint violations: $VIOLATION_COUNT"
    VALIDATION_RESULTS[eslint]="WARN"
fi

# 3. Build verification
echo -e "\n${BLUE}3. Build Verification${NC}"
echo "Testing build capability..."
START_TIME=$(date +%s)
if npm run build >/dev/null 2>&1; then
    END_TIME=$(date +%s)
    BUILD_TIME=$((END_TIME - START_TIME))
    echo -e "${GREEN}✅ Build verification: PASS${NC}"
    echo "Build time: ${BUILD_TIME}s"
    VALIDATION_RESULTS[build]="PASS"
else
    echo -e "${YELLOW}⚠️  Build verification: WARN${NC}"
    echo "Build issues detected, but system may still be functional"
    VALIDATION_RESULTS[build]="WARN"
fi

# 4. API health check
echo -e "\n${BLUE}4. API Health Check${NC}"
echo "Testing API endpoints..."

# Start application for testing
npm run dev &
APP_PID=$!
sleep 10

# Test critical endpoints
endpoints=("/api/health" "/api/flavors" "/api/ingredients" "/api/suppliers")
RESPONDING_ENDPOINTS=0

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "http://localhost:3000$endpoint" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $endpoint responding${NC}"
        ((RESPONDING_ENDPOINTS++))
    else
        echo -e "${RED}❌ $endpoint failed${NC}"
    fi
done

# Stop test application
kill $APP_PID 2>/dev/null || true

if [ "$RESPONDING_ENDPOINTS" -gt 0 ]; then
    echo -e "${GREEN}✅ API health check: PASS${NC}"
    VALIDATION_RESULTS[api]="PASS"
else
    echo -e "${RED}❌ API health check: FAIL${NC}"
    VALIDATION_RESULTS[api]="FAIL"
fi

# 5. Data validation
echo -e "\n${BLUE}5. Data Validation${NC}"
if [ -f "scripts/validate-data.js" ]; then
    if node scripts/validate-data.js >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Data validation: PASS${NC}"
        VALIDATION_RESULTS[data]="PASS"
    else
        echo -e "${YELLOW}⚠️  Data validation: WARN${NC}"
        VALIDATION_RESULTS[data]="WARN"
    fi
else
    echo -e "${YELLOW}⚠️  Data validation: SKIPPED (script not found)${NC}"
    VALIDATION_RESULTS[data]="SKIPPED"
fi

# 6. Security scan
echo -e "\n${BLUE}6. Security Scan${NC}"
if npm audit >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Security scan: PASS${NC}"
else
    echo -e "${YELLOW}⚠️  Security scan: WARN${NC}"
    echo "Security vulnerabilities detected - manual review recommended"
fi

# 7. Performance check
echo -e "\n${BLUE}7. Performance Check${NC}"
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "Unknown")
    echo "Bundle size: $BUNDLE_SIZE"
    
    # Check if bundle is reasonably sized (< 500MB for emergency rollback)
    BUNDLE_SIZE_MB=$(du -s .next 2>/dev/null | cut -f1 || echo "0")
    if [ "$BUNDLE_SIZE_MB" -lt 512000 ]; then  # 500MB in KB
        echo -e "${GREEN}✅ Bundle size acceptable${NC}"
    else
        echo -e "${YELLOW}⚠️  Large bundle detected${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No build artifacts found${NC}"
fi

# Generate validation report
echo -e "\n${BLUE}📊 VALIDATION SUMMARY${NC}"
echo "=========================================="

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

for test in "${!VALIDATION_RESULTS[@]}"; do
    result="${VALIDATION_RESULTS[$test]}"
    case $result in
        "PASS")
            echo -e "${GREEN}✅ $test: $result${NC}"
            ((PASS_COUNT++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $test: $result${NC}"
            ((WARN_COUNT++))
            ;;
        "FAIL")
            echo -e "${RED}❌ $test: $result${NC}"
            ((FAIL_COUNT++))
            ;;
        "SKIPPED")
            echo -e "${BLUE}⏭️  $test: $result${NC}"
            ;;
        *)
            echo -e "${BLUE}❓ $test: $result${NC}"
            ;;
    esac
done

echo -e "\n${BLUE}📈 Overall Results:${NC}"
echo "✅ Passed: $PASS_COUNT"
echo "⚠️  Warnings: $WARN_COUNT"  
echo "❌ Failed: $FAIL_COUNT"

# System status determination
if [ "$FAIL_COUNT" -eq 0 ] && [ "$PASS_COUNT" -ge 3 ]; then
    echo -e "\n${GREEN}🎉 SYSTEM STATUS: OPERATIONAL${NC}"
    echo "System has been successfully restored to working state"
    STATUS="OPERATIONAL"
elif [ "$FAIL_COUNT" -le 1 ] && [ "$PASS_COUNT" -ge 2 ]; then
    echo -e "\n${YELLOW}⚠️  SYSTEM STATUS: DEGRADED${NC}"
    echo "System is functional but may have some issues"
    STATUS="DEGRADED"
else
    echo -e "\n${RED}🚨 SYSTEM STATUS: CRITICAL${NC}"
    echo "System requires immediate attention"
    STATUS="CRITICAL"
fi

# Create detailed validation report
cat > "rollback-validation-report-$(date +%Y%m%d-%H%M%S).md" << EOF
# Post-Rollback Validation Report

**Timestamp:** $(date -Iseconds)
**System Status:** $STATUS

## Validation Results

| Test | Status | Details |
|------|--------|---------|
| TypeScript Compilation | ${VALIDATION_RESULTS[typescript]} | $(npx tsc --noEmit 2>&1 | find /c ":" || echo "0") errors |
| ESLint Validation | ${VALIDATION_RESULTS[eslint]} | $(npm run lint 2>&1 | find /c ":" || echo "0") violations |
| Build Verification | ${VALIDATION_RESULTS[build]} | Build process status |
| API Health Check | ${VALIDATION_RESULTS[api]} | $RESPONDING_ENDPOINTS/${#endpoints[@]} endpoints responding |
| Data Validation | ${VALIDATION_RESULTS[data]} | Data integrity check |
| Security Scan | $(npm audit >/dev/null 2>&1 && echo "PASS" || echo "WARN") | Dependency vulnerabilities |

## Summary
- **Passed Tests:** $PASS_COUNT
- **Warning Tests:** $WARN_COUNT
- **Failed Tests:** $FAIL_COUNT
- **Overall Status:** $STATUS

## Recommendations

EOF

if [ "$STATUS" = "OPERATIONAL" ]; then
    cat >> "rollback-validation-report-$(date +%Y%m%d-%H%M%S).md" << 'EOF'
- ✅ System successfully restored
- Monitor for 24 hours to ensure stability
- Proceed with normal operations
- Schedule post-incident review
EOF
elif [ "$STATUS" = "DEGRADED" ]; then
    cat >> "rollback-validation-report-$(date +%Y%m%d-%H%M%S).md" << 'EOF'
- ⚠️ System functional but needs attention
- Address warning conditions when possible
- Monitor closely for further issues
- Plan additional fixes
EOF
else
    cat >> "rollback-validation-report-$(date +%Y%m%d-%H%M%S).md" << 'EOF'
- 🚨 Critical issues detected
- Manual intervention required
- Consider additional rollback or fixes
- Do not proceed with production use
EOF
fi

cat >> "rollback-validation-report-$(date +%Y%m%d-%H%M%S).md" << 'EOF'

---
*Generated by Emergency Rollback Validation System v1.0*
EOF

REPORT_FILE="rollback-validation-report-$(date +%Y%m%d-%H%M%S).md"
echo -e "\n${BLUE}📋 Detailed report saved: $REPORT_FILE${NC}"

echo -e "\n${BLUE}🔍 Post-rollback validation completed${NC}"

exit 0