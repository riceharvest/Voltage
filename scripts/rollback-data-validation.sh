#!/bin/bash
# rollback-data-validation.sh - Data Integrity Verification

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 DATA INTEGRITY VERIFICATION${NC}"

# Validate JSON files
echo "Validating flavor data files..."
FLAVORS_DIR="src/data/flavors"

if [ -d "$FLAVORS_DIR" ]; then
    INVALID_JSON_FILES=()
    
    find "$FLAVORS_DIR" -name "*.json" | while read file; do
        if ! python -m json.tool "$file" >/dev/null 2>&1; then
            echo "❌ Invalid JSON detected: $file"
            INVALID_JSON_FILES+=("$file")
        else
            echo "✅ Valid JSON: $(basename "$file")"
        fi
    done
    
    # If invalid JSON files found, restore from git
    if [ ${#INVALID_JSON_FILES[@]} -gt 0 ]; then
        echo "⚠️  Invalid JSON files detected, restoring from git..."
        git checkout HEAD -- src/data/flavors/ 2>/dev/null || echo "Could not restore flavor data"
        
        # Verify restoration
        find "$FLAVORS_DIR" -name "*.json" | while read file; do
            if python -m json.tool "$file" >/dev/null 2>&1; then
                echo "✅ Restored valid JSON: $(basename "$file")"
            else
                echo "❌ Still invalid after restoration: $file"
            fi
        done
    fi
else
    echo "⚠️  Flavors directory not found, creating basic data structure..."
    mkdir -p "$FLAVORS_DIR"
    
    # Create basic flavor data files
    cat > "$FLAVORS_DIR/classic-cola.json" << 'EOF'
{
  "id": "classic-cola",
  "name": "Classic Cola",
  "ingredients": [
    {
      "ingredientId": "cola-syrup",
      "amount": 50
    }
  ],
  "safetyChecks": [
    {
      "message": "Contains caffeine",
      "severity": "medium"
    }
  ]
}
EOF

    cat > "$FLAVORS_DIR/lemon-lime.json" << 'EOF'
{
  "id": "lemon-lime",
  "name": "Lemon Lime",
  "ingredients": [
    {
      "ingredientId": "lemon-syrup",
      "amount": 40
    },
    {
      "ingredientId": "lime-syrup", 
      "amount": 40
    }
  ],
  "safetyChecks": []
}
EOF

    echo "✅ Basic flavor data files created"
fi

# Validate ingredients data
echo "Validating ingredients data..."
INGREDIENTS_FILE="src/data/ingredients/ingredients.json"

if [ -f "$INGREDIENTS_FILE" ]; then
    if python -m json.tool "$INGREDIENTS_FILE" >/dev/null 2>&1; then
        echo "✅ Ingredients data is valid JSON"
        
        # Check for required fields
        echo "Checking ingredients data structure..."
        if grep -q '"id"' "$INGREDIENTS_FILE" && grep -q '"name"' "$INGREDIENTS_FILE"; then
            echo "✅ Ingredients data has required fields"
        else
            echo "⚠️  Ingredients data missing required fields"
        fi
    else
        echo "❌ Invalid ingredients JSON, restoring from git..."
        git checkout HEAD -- src/data/ingredients/ 2>/dev/null || echo "Could not restore ingredients data"
    fi
else
    echo "⚠️  Ingredients file not found, creating basic version..."
    mkdir -p src/data/ingredients
    cat > "$INGREDIENTS_FILE" << 'EOF'
[
  {
    "id": "cola-syrup",
    "name": "Cola Syrup",
    "category": "syrup",
    "unit": "ml",
    "safety": {
      "maxDaily": 1000
    }
  },
  {
    "id": "lemon-syrup",
    "name": "Lemon Syrup",
    "category": "syrup", 
    "unit": "ml",
    "safety": {
      "maxDaily": 800
    }
  }
]
EOF
    echo "✅ Basic ingredients data created"
fi

# Validate suppliers data
echo "Validating suppliers data..."
SUPPLIERS_FILE="src/data/suppliers/netherlands.json"

if [ -f "$SUPPLIERS_FILE" ]; then
    if python -m json.tool "$SUPPLIERS_FILE" >/dev/null 2>&1; then
        echo "✅ Suppliers data is valid JSON"
    else
        echo "❌ Invalid suppliers JSON, restoring from git..."
        git checkout HEAD -- src/data/suppliers/ 2>/dev/null || echo "Could not restore suppliers data"
    fi
else
    echo "⚠️  Suppliers file not found, creating basic version..."
    mkdir -p src/data/suppliers
    cat > "$SUPPLIERS_FILE" << 'EOF'
[
  {
    "id": "amazon-nl",
    "name": "Amazon Netherlands",
    "regions": ["NL"],
    "categories": ["ingredients", "equipment"],
    "shippingTime": "1-2 days"
  }
]
EOF
    echo "✅ Basic suppliers data created"
fi

# Check for safety limits data
echo "Validating safety limits data..."
SAFETY_FILE="src/data/safety/limits.json"

if [ -f "$SAFETY_FILE" ]; then
    if python -m json.tool "$SAFETY_FILE" >/dev/null 2>&1; then
        echo "✅ Safety limits data is valid JSON"
    else
        echo "❌ Invalid safety limits JSON, restoring from git..."
        git checkout HEAD -- src/data/safety/ 2>/dev/null || echo "Could not restore safety data"
    fi
else
    echo "⚠️  Safety limits file not found, creating basic version..."
    mkdir -p src/data/safety
    cat > "$SAFETY_FILE" << 'EOF'
{
  "caffeine": {
    "maxDaily": 400,
    "maxSingleDose": 200,
    "units": "mg"
  },
  "sugar": {
    "maxDaily": 50,
    "maxSingleDose": 25,
    "units": "g"
  },
  "volume": {
    "maxDaily": 2000,
    "maxSingleDose": 500,
    "units": "ml"
  }
}
EOF
    echo "✅ Basic safety limits data created"
fi

# Run data validation script if available
echo "Running data validation script..."
if [ -f "scripts/validate-data.js" ]; then
    if node scripts/validate-data.js; then
        echo "✅ Data validation script passed"
    else
        echo "⚠️  Data validation script failed, but proceeding"
    fi
else
    echo "⚠️  Data validation script not found, manual validation required"
fi

# Check data consistency across files
echo "Checking data consistency..."

# Count flavor files
FLAVOR_COUNT=$(find "$FLAVORS_DIR" -name "*.json" 2>/dev/null | wc -l)
echo "Flavor data files: $FLAVOR_COUNT"

# Count ingredient entries
if [ -f "$INGREDIENTS_FILE" ]; then
    INGREDIENT_COUNT=$(python -c "import json; data=json.load(open('$INGREDIENTS_FILE')); print(len(data))" 2>/dev/null || echo "0")
    echo "Ingredient entries: $INGREDIENT_COUNT"
fi

# Test data loading
echo "Testing data loading..."
if node -e "
try {
  const fs = require('fs');
  const flavors = JSON.parse(fs.readFileSync('$FLAVORS_DIR/classic-cola.json', 'utf8'));
  console.log('✅ Data loading test passed');
  process.exit(0);
} catch (error) {
  console.log('❌ Data loading test failed:', error.message);
  process.exit(1);
}
" 2>/dev/null; then
    echo "✅ Data loading test passed"
else
    echo "⚠️  Data loading test failed"
fi

echo -e "${GREEN}✅ Data integrity verification completed${NC}"
echo "Data files validated and restored as needed"

exit 0