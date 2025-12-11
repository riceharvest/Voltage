#!/bin/bash
# rollback-api-restoration.sh - API System Restoration

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 API SYSTEM RESTORATION${NC}"

# Test current API health
echo "Testing current API health..."
API_HEALTHY=false

if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ API is currently responding"
    API_HEALTHY=true
else
    echo "❌ API is not responding, performing restoration..."
fi

# If API is not healthy, restore API routes
if [ "$API_HEALTHY" = false ]; then
    echo "Restoring API routes from git..."
    
    # Restore API routes
    if [ -d "src/app/api" ]; then
        git checkout HEAD -- src/app/api/ 2>/dev/null || echo "Could not restore all API routes"
    else
        echo "Creating basic API structure..."
        mkdir -p src/app/api/health
        mkdir -p src/app/api/flavors
        mkdir -p src/app/api/ingredients
        mkdir -p src/app/api/suppliers
    fi

    # Clear API cache
    echo "Clearing API cache..."
    rm -rf .next/cache/api
    rm -rf .next/server/pages/api

    # Create basic API endpoints if they don't exist
    echo "Ensuring basic API endpoints exist..."

    # Health check endpoint
    if [ ! -f "src/app/api/health/route.ts" ]; then
        echo "Creating health check endpoint..."
        mkdir -p src/app/api/health
        cat > src/app/api/health/route.ts << 'EOF'
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'energy-drink-calculator'
    }),
    { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}
EOF
    fi

    # Flavors endpoint
    if [ ! -f "src/app/api/flavors/route.ts" ]; then
        echo "Creating flavors endpoint..."
        mkdir -p src/app/api/flavors
        cat > src/app/api/flavors/route.ts << 'EOF'
export async function GET() {
  try {
    // Return basic flavor data
    const flavors = [
      {
        id: 'classic-cola',
        name: 'Classic Cola',
        ingredients: [
          { ingredientId: 'cola-syrup', amount: 50 },
          { ingredientId: 'carbonated-water', amount: 200 }
        ],
        safetyChecks: []
      }
    ];

    return new Response(
      JSON.stringify(flavors),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}
EOF
    fi

    # Ingredients endpoint
    if [ ! -f "src/app/api/ingredients/route.ts" ]; then
        echo "Creating ingredients endpoint..."
        mkdir -p src/app/api/ingredients
        cat > src/app/api/ingredients/route.ts << 'EOF'
export async function GET() {
  try {
    const ingredients = [
      {
        id: 'cola-syrup',
        name: 'Cola Syrup',
        category: 'syrup',
        unit: 'ml',
        safety: { maxDaily: 1000 }
      },
      {
        id: 'carbonated-water',
        name: 'Carbonated Water',
        category: 'base',
        unit: 'ml',
        safety: { maxDaily: 2000 }
      }
    ];

    return new Response(
      JSON.stringify(ingredients),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}
EOF
    fi

    # Suppliers endpoint
    if [ ! -f "src/app/api/suppliers/route.ts" ]; then
        echo "Creating suppliers endpoint..."
        mkdir -p src/app/api/suppliers
        cat > src/app/api/suppliers/route.ts << 'EOF'
export async function GET() {
  try {
    const suppliers = [
      {
        id: 'amazon',
        name: 'Amazon',
        regions: ['US', 'CA', 'UK', 'DE'],
        categories: ['ingredients', 'equipment']
      }
    ];

    return new Response(
      JSON.stringify(suppliers),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}
EOF
    fi

    echo "Basic API endpoints created"
fi

# Test API endpoints after restoration
echo "Testing API endpoints..."

# Wait for application to potentially start
sleep 5

# Test critical endpoints
endpoints=("/api/health" "/api/flavors" "/api/ingredients" "/api/suppliers")
RESPONDING_ENDPOINTS=0

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "http://localhost:3000$endpoint" >/dev/null 2>&1; then
        echo "✅ $endpoint responding"
        ((RESPONDING_ENDPOINTS++))
    else
        echo "❌ $endpoint failed"
    fi
done

# If no endpoints are responding, try to start the application
if [ "$RESPONDING_ENDPOINTS" -eq 0 ]; then
    echo "No endpoints responding, attempting to start application..."
    
    # Start application in background
    npm run dev &
    APP_PID=$!
    
    echo "Application started with PID: $APP_PID"
    
    # Wait for startup
    echo "Waiting for application to start..."
    for i in {1..30}; do
        sleep 2
        if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
            echo "✅ Application started successfully"
            break
        fi
        echo "Waiting... ($i/30)"
    done
    
    # Test endpoints again
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:3000$endpoint" >/dev/null 2>&1; then
            echo "✅ $endpoint now responding"
            ((RESPONDING_ENDPOINTS++))
        else
            echo "❌ $endpoint still failing"
        fi
    done
fi

# Check API error logs
echo "Checking for API errors..."
if [ -f ".next/trace" ]; then
    echo "Next.js trace file exists - checking for errors..."
    tail -n 50 .next/trace 2>/dev/null | grep -i error || echo "No recent errors in trace"
fi

# Verify API response structure
echo "Verifying API response structure..."
if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo "✅ API health check response valid"
    else
        echo "⚠️  API health check response format unexpected"
    fi
fi

# Final API status
if [ "$RESPONDING_ENDPOINTS" -gt 0 ]; then
    echo -e "${GREEN}✅ API system restoration completed${NC}"
    echo "API endpoints restored: $RESPONDING_ENDPOINTS/${#endpoints[@]}"
else
    echo "⚠️  API system restoration completed with issues"
    echo "No endpoints responding - manual intervention may be required"
fi

exit 0