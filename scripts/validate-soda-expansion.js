#!/usr/bin/env node

/**
 * Data Model Expansion Validation Script
 * 
 * Comprehensive validation for the Global Soda Platform expansion including:
 * - Data integrity checks for new flavor files
 * - API endpoint validation with new filtering capabilities
 * - Safety validation testing for mixed categories
 * - Interface compliance verification
 * 
 * Usage: node scripts/validate-soda-expansion.js
 */

const fs = require('fs');
const path = require('path');

// Validation configuration
const VALIDATION_CONFIG = {
  requiredFields: ['id', 'name', 'nameNl', 'profile', 'profileNl', 'ingredients', 'color', 'compatibleBases', 'aging'],
  optionalFields: ['category', 'sodaType', 'caffeineCategory', 'premadeProducts', 'netherlandsAvailability', 'priceRange', 'caffeineContent'],
  validCategories: ['classic', 'energy', 'hybrid'],
  validSodaTypes: ['cola', 'citrus', 'fruit', 'cream', 'root-beer', 'ginger-ale', 'energy-drink'],
  validCaffeineCategories: ['none', 'low', 'medium', 'high'],
  amazonProductFields: ['asin', 'region', 'price', 'currency', 'availability', 'affiliateUrl', 'title'],
  baseRecipeTypes: ['classic', 'zero', 'plain', 'classic-soda', 'citrus-soda', 'cream-soda']
};

// Test results storage
const testResults = {
  dataIntegrity: { passed: 0, failed: 0, errors: [] },
  apiValidation: { passed: 0, failed: 0, errors: [] },
  safetyValidation: { passed: 0, failed: 0, errors: [] },
  interfaceCompliance: { passed: 0, failed: 0, errors: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

/**
 * Load and parse JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load or parse ${filePath}: ${error.message}`);
  }
}

/**
 * Validate flavor recipe data integrity
 */
function validateFlavorRecipe(flavorPath, flavor) {
  const errors = [];
  
  // Check required fields
  VALIDATION_CONFIG.requiredFields.forEach(field => {
    if (!(field in flavor)) {
      errors.push(`${flavorPath}: Missing required field '${field}'`);
    }
  });
  
  // Validate optional category fields
  if (flavor.category && !VALIDATION_CONFIG.validCategories.includes(flavor.category)) {
    errors.push(`${flavorPath}: Invalid category '${flavor.category}'. Must be one of: ${VALIDATION_CONFIG.validCategories.join(', ')}`);
  }
  
  if (flavor.sodaType && !VALIDATION_CONFIG.validSodaTypes.includes(flavor.sodaType)) {
    errors.push(`${flavorPath}: Invalid sodaType '${flavor.sodaType}'. Must be one of: ${VALIDATION_CONFIG.validSodaTypes.join(', ')}`);
  }
  
  if (flavor.caffeineCategory && !VALIDATION_CONFIG.validCaffeineCategories.includes(flavor.caffeineCategory)) {
    errors.push(`${flavorPath}: Invalid caffeineCategory '${flavor.caffeineCategory}'. Must be one of: ${VALIDATION_CONFIG.validCaffeineCategories.join(', ')}`);
  }
  
  // Validate ingredients structure
  if (!Array.isArray(flavor.ingredients)) {
    errors.push(`${flavorPath}: 'ingredients' must be an array`);
  } else {
    flavor.ingredients.forEach((ingredient, index) => {
      if (!ingredient.ingredientId || typeof ingredient.amount !== 'number') {
        errors.push(`${flavorPath}: ingredients[${index}] must have 'ingredientId' (string) and 'amount' (number)`);
      }
    });
  }
  
  // Validate color specification
  if (!flavor.color || typeof flavor.color !== 'object') {
    errors.push(`${flavorPath}: 'color' must be an object with type and description`);
  } else {
    if (!['natural', 'artificial'].includes(flavor.color.type)) {
      errors.push(`${flavorPath}: color.type must be 'natural' or 'artificial'`);
    }
    if (!flavor.color.description) {
      errors.push(`${flavorPath}: color.description is required`);
    }
  }
  
  // Validate compatible bases
  if (!Array.isArray(flavor.compatibleBases)) {
    errors.push(`${flavorPath}: 'compatibleBases' must be an array`);
  }
  
  // Validate aging specification
  if (!flavor.aging || typeof flavor.aging !== 'object') {
    errors.push(`${flavorPath}: 'aging' must be an object with 'recommended' and 'optional' properties`);
  } else {
    if (typeof flavor.aging.recommended !== 'number') {
      errors.push(`${flavorPath}: aging.recommended must be a number`);
    }
    if (typeof flavor.aging.optional !== 'boolean') {
      errors.push(`${flavorPath}: aging.optional must be a boolean`);
    }
  }
  
  // Validate premade products if present
  if (flavor.premadeProducts) {
    if (!Array.isArray(flavor.premadeProducts)) {
      errors.push(`${flavorPath}: 'premadeProducts' must be an array`);
    } else {
      flavor.premadeProducts.forEach((product, index) => {
        VALIDATION_CONFIG.amazonProductFields.forEach(field => {
          if (!(field in product)) {
            errors.push(`${flavorPath}: premadeProducts[${index}] missing required field '${field}'`);
          }
        });
        
        // Validate specific field constraints
        if (!VALIDATION_CONFIG.amazonProductFields.includes(product.region)) {
          const validRegions = ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'];
          if (!validRegions.includes(product.region)) {
            errors.push(`${flavorPath}: premadeProducts[${index}] has invalid region '${product.region}'`);
          }
        }
        
        if (!['in-stock', 'out-of-stock', 'pre-order'].includes(product.availability)) {
          errors.push(`${flavorPath}: premadeProducts[${index}] has invalid availability '${product.availability}'`);
        }
      });
    }
  }
  
  return errors;
}

/**
 * Validate base recipe data integrity
 */
function validateBaseRecipe(basePath, base) {
  const errors = [];
  
  const requiredFields = ['id', 'name', 'nameNl', 'type', 'yield', 'ingredients', 'instructions'];
  requiredFields.forEach(field => {
    if (!(field in base)) {
      errors.push(`${basePath}: Missing required field '${field}'`);
    }
  });
  
  // Validate type
  if (!VALIDATION_CONFIG.baseRecipeTypes.includes(base.type)) {
    errors.push(`${basePath}: Invalid type '${base.type}'. Must be one of: ${VALIDATION_CONFIG.baseRecipeTypes.join(', ')}`);
  }
  
  // Validate yield
  if (!base.yield || typeof base.yield.syrup !== 'number' || typeof base.yield.drink !== 'number') {
    errors.push(`${basePath}: yield must have 'syrup' and 'drink' as numbers`);
  }
  
  // Validate ingredients
  if (!Array.isArray(base.ingredients)) {
    errors.push(`${basePath}: 'ingredients' must be an array`);
  } else {
    base.ingredients.forEach((ingredient, index) => {
      if (!ingredient.ingredientId || typeof ingredient.amount !== 'number') {
        errors.push(`${basePath}: ingredients[${index}] must have 'ingredientId' and 'amount'`);
      }
    });
  }
  
  // Validate instructions
  if (!Array.isArray(base.instructions)) {
    errors.push(`${basePath}: 'instructions' must be an array`);
  } else {
    base.instructions.forEach((instruction, index) => {
      if (typeof instruction.step !== 'number' || !instruction.description || !instruction.descriptionNl) {
        errors.push(`${basePath}: instructions[${index}] must have 'step' (number), 'description', and 'descriptionNl'`);
      }
    });
  }
  
  return errors;
}

/**
 * Main validation function
 */
function runValidation() {
  console.log('🚀 Starting Global Soda Platform Data Model Expansion Validation...\n');
  
  // Test 1: Data Integrity Validation
  console.log('📋 Test 1: Data Integrity Validation');
  console.log('=====================================');
  
  try {
    // Validate new flavor files
    const flavorsDir = path.join(__dirname, '..', 'src', 'data', 'flavors');
    const flavorFiles = fs.readdirSync(flavorsDir).filter(file => file.endsWith('.json'));
    
    const classicFlavorFiles = [
      'classic-cola.json',
      'orange-soda.json',
      'ginger-ale.json',
      'root-beer.json',
      'lemon-lime-soda.json',
      'cream-soda.json'
    ];
    
    // Validate classic soda flavors
    classicFlavorFiles.forEach(fileName => {
      const filePath = path.join(flavorsDir, fileName);
      if (fs.existsSync(filePath)) {
        const flavor = loadJsonFile(filePath);
        const errors = validateFlavorRecipe(fileName, flavor);
        
        if (errors.length === 0) {
          console.log(`✅ ${fileName}: PASSED`);
          testResults.dataIntegrity.passed++;
        } else {
          console.log(`❌ ${fileName}: FAILED`);
          errors.forEach(error => console.log(`   - ${error}`));
          testResults.dataIntegrity.failed++;
          testResults.dataIntegrity.errors.push(...errors);
        }
      } else {
        console.log(`⚠️  ${fileName}: NOT FOUND`);
        testResults.dataIntegrity.failed++;
        testResults.dataIntegrity.errors.push(`${fileName}: File not found`);
      }
    });
    
    // Validate existing energy drink flavors (spot check)
    const energyFlavorFiles = ['berry-citrus-fusion.json', 'cola-kick.json', 'red-bull.json'];
    energyFlavorFiles.forEach(fileName => {
      const filePath = path.join(flavorsDir, fileName);
      if (fs.existsSync(filePath)) {
        const flavor = loadJsonFile(filePath);
        const errors = validateFlavorRecipe(fileName, flavor);
        
        if (errors.length === 0) {
          console.log(`✅ ${fileName}: PASSED (backward compatibility)`);
          testResults.dataIntegrity.passed++;
        } else {
          console.log(`❌ ${fileName}: FAILED (backward compatibility)`);
          errors.forEach(error => console.log(`   - ${error}`));
          testResults.dataIntegrity.failed++;
          testResults.dataIntegrity.errors.push(...errors);
        }
      }
    });
    
  } catch (error) {
    console.log(`❌ Data integrity validation failed: ${error.message}`);
    testResults.dataIntegrity.failed++;
    testResults.dataIntegrity.errors.push(error.message);
  }
  
  console.log('\n');
  
  // Test 2: Base Recipe Validation
  console.log('🏗️  Test 2: Base Recipe Validation');
  console.log('===================================');
  
  try {
    const basesDir = path.join(__dirname, '..', 'src', 'data', 'bases');
    const baseFiles = fs.readdirSync(basesDir).filter(file => file.endsWith('.json'));
    
    const newBaseFiles = ['classic-soda.json', 'citrus-soda.json', 'cream-soda.json'];
    
    newBaseFiles.forEach(fileName => {
      const filePath = path.join(basesDir, fileName);
      if (fs.existsSync(filePath)) {
        const base = loadJsonFile(filePath);
        const errors = validateBaseRecipe(fileName, base);
        
        if (errors.length === 0) {
          console.log(`✅ ${fileName}: PASSED`);
          testResults.dataIntegrity.passed++;
        } else {
          console.log(`❌ ${fileName}: FAILED`);
          errors.forEach(error => console.log(`   - ${error}`));
          testResults.dataIntegrity.failed++;
          testResults.dataIntegrity.errors.push(...errors);
        }
      } else {
        console.log(`⚠️  ${fileName}: NOT FOUND`);
        testResults.dataIntegrity.failed++;
        testResults.dataIntegrity.errors.push(`${fileName}: File not found`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Base recipe validation failed: ${error.message}`);
    testResults.dataIntegrity.failed++;
    testResults.dataIntegrity.errors.push(error.message);
  }
  
  console.log('\n');
  
  // Test 3: Interface Compliance Validation
  console.log('🔧 Test 3: Interface Compliance Validation');
  console.log('==========================================');
  
  try {
    // Check if interfaces file exists and has required exports
    const typesPath = path.join(__dirname, '..', 'src', 'lib', 'types.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Check for AmazonProduct interface
    if (typesContent.includes('export interface AmazonProduct')) {
      console.log('✅ AmazonProduct interface: FOUND');
      testResults.interfaceCompliance.passed++;
    } else {
      console.log('❌ AmazonProduct interface: MISSING');
      testResults.interfaceCompliance.failed++;
      testResults.interfaceCompliance.errors.push('AmazonProduct interface not found');
    }
    
    // Check for FlavorRecipe extensions
    if (typesContent.includes('category?:') && typesContent.includes('sodaType?:') && typesContent.includes('caffeineCategory?:')) {
      console.log('✅ FlavorRecipe extensions: FOUND');
      testResults.interfaceCompliance.passed++;
    } else {
      console.log('❌ FlavorRecipe extensions: MISSING');
      testResults.interfaceCompliance.failed++;
      testResults.interfaceCompliance.errors.push('FlavorRecipe interface extensions not found');
    }
    
    // Check for premadeProducts field
    if (typesContent.includes('premadeProducts?: AmazonProduct[]')) {
      console.log('✅ premadeProducts field: FOUND');
      testResults.interfaceCompliance.passed++;
    } else {
      console.log('❌ premadeProducts field: MISSING');
      testResults.interfaceCompliance.failed++;
      testResults.interfaceCompliance.errors.push('premadeProducts field not found in FlavorRecipe');
    }
    
  } catch (error) {
    console.log(`❌ Interface compliance validation failed: ${error.message}`);
    testResults.interfaceCompliance.failed++;
    testResults.interfaceCompliance.errors.push(error.message);
  }
  
  console.log('\n');
  
  // Test 4: API Endpoint Validation
  console.log('🌐 Test 4: API Endpoint Validation');
  console.log('===================================');
  
  try {
    const apiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'flavors', 'route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    // Check for new filter parameters
    const requiredFilters = [
      'sodaType',
      'caffeine',
      'validCategories',
      'validSodaTypes',
      'validCaffeineLevels'
    ];
    
    requiredFilters.forEach(filter => {
      if (apiContent.includes(filter)) {
        console.log(`✅ ${filter} filter: IMPLEMENTED`);
        testResults.apiValidation.passed++;
      } else {
        console.log(`❌ ${filter} filter: MISSING`);
        testResults.apiValidation.failed++;
        testResults.apiValidation.errors.push(`${filter} filter not implemented`);
      }
    });
    
  } catch (error) {
    console.log(`❌ API endpoint validation failed: ${error.message}`);
    testResults.apiValidation.failed++;
    testResults.apiValidation.errors.push(error.message);
  }
  
  console.log('\n');
  
  // Test 5: Safety Validation Enhancement
  console.log('🛡️  Test 5: Safety Validation Enhancement');
  console.log('=========================================');
  
  try {
    const safetyPath = path.join(__dirname, '..', 'src', 'lib', 'safety-validation-service.ts');
    const safetyContent = fs.readFileSync(safetyPath, 'utf8');
    
    // Check for new safety functions
    const requiredFunctions = [
      'validateCategorySpecificSafety',
      'validateMixedCategoryConsumption'
    ];
    
    requiredFunctions.forEach(func => {
      if (safetyContent.includes(`export function ${func}`)) {
        console.log(`✅ ${func}: IMPLEMENTED`);
        testResults.safetyValidation.passed++;
      } else {
        console.log(`❌ ${func}: MISSING`);
        testResults.safetyValidation.failed++;
        testResults.safetyValidation.errors.push(`${func} function not found`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Safety validation enhancement failed: ${error.message}`);
    testResults.safetyValidation.failed++;
    testResults.safetyValidation.errors.push(error.message);
  }
  
  console.log('\n');
  
  // Generate summary report
  console.log('📊 Validation Summary');
  console.log('====================');
  
  const totalPassed = testResults.dataIntegrity.passed + testResults.apiValidation.passed + 
                     testResults.safetyValidation.passed + testResults.interfaceCompliance.passed;
  const totalFailed = testResults.dataIntegrity.failed + testResults.apiValidation.failed + 
                     testResults.safetyValidation.failed + testResults.interfaceCompliance.failed;
  
  testResults.overall.passed = totalPassed;
  testResults.overall.failed = totalFailed;
  testResults.overall.total = totalPassed + totalFailed;
  
  console.log(`✅ Tests Passed: ${totalPassed}`);
  console.log(`❌ Tests Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (totalFailed > 0) {
    console.log('\n🚨 All Errors:');
    [...testResults.dataIntegrity.errors, ...testResults.apiValidation.errors, 
     ...testResults.safetyValidation.errors, ...testResults.interfaceCompliance.errors]
      .forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n🎯 Next Steps:');
  if (totalFailed === 0) {
    console.log('✅ All validation tests passed! The data model expansion is ready for deployment.');
    console.log('🚀 Ready to test API endpoints and update documentation.');
  } else {
    console.log('❌ Please fix the failing tests before proceeding with deployment.');
  }
  
  console.log('\n✨ Validation completed at:', new Date().toISOString());
  
  // Exit with appropriate code
  process.exit(totalFailed === 0 ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, testResults, VALIDATION_CONFIG };