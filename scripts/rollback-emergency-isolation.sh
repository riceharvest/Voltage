#!/bin/bash
# rollback-emergency-isolation.sh - Emergency System Isolation

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 EMERGENCY SYSTEM ISOLATION INITIATED${NC}"
echo "Timestamp: $(date -Iseconds)"

# Kill all running development processes
echo "Stopping all running processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*energy-drink-app" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Enable maintenance mode
echo "Enabling maintenance mode..."
cat > maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>System Maintenance</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #666; margin: 20px 0; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚧 System Maintenance</h1>
        <div class="spinner"></div>
        <p>Emergency rollback procedures in progress...</p>
        <p><small>Estimated completion: 15-30 minutes</small></p>
    </div>
</body>
</html>
EOF

# Clear all caches
echo "Clearing all caches..."
rm -rf .next/cache/* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .eslintcache 2>/dev/null || true
rm -rf tsconfig.tsbuildinfo 2>/dev/null || true

# Clear npm cache
npm cache clean --force 2>/dev/null || true

# Clear any temporary build files
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true

# Kill any hanging processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✅ Emergency isolation completed${NC}"
echo "System isolated and ready for rollback procedures"

exit 0