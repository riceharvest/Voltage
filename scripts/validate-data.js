#!/usr/bin/env node

/**
 * Data Validation Script
 * Validates JSON data files for structure and integrity
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Validation schemas
const ingredientSchema = {
  required: ['id', 'name', 'category', 'unit', 'safety'],
  safety: {
    required: ['maxDaily', 'warningThreshold', 'euCompliant', 'banned']
  }
};

const supplierSchema = {
  required: ['id', 'name', 'url', 'location']
};

const baseRecipeSchema = {
  required: ['id', 'name', 'description', 'ingredients']
};

const flavorRecipeSchema = {
  required: ['id', 'name', 'description', 'base', 'ingredients']
};

const safetyLimitsSchema = {
  required: ['caffeine', 'taurine', 'nicotine', 'alcohol']
};

function validateObject(obj, schema, path = '') {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj)) {
        errors.push(`${path}${field} is required`);
      }
    }
  }

  // Check nested objects
  if (schema.safety && obj.safety) {
    errors.push(...validateObject(obj.safety, schema.safety, `${path}safety.`));
  }

  return errors;
}

function validateIngredients(data) {
  const errors = [];

  if (!Array.isArray(data)) {
    return ['Ingredients data must be an array'];
  }

  data.forEach((item, index) => {
    const itemErrors = validateObject(item, ingredientSchema, `ingredients[${index}].`);
    errors.push(...itemErrors);

    // Additional validations
    if (item.id && typeof item.id !== 'string') {
      errors.push(`ingredients[${index}].id must be a string`);
    }
    if (item.name && typeof item.name !== 'string') {
      errors.push(`ingredients[${index}].name must be a string`);
    }
    if (item.safety && typeof item.safety.maxDaily !== 'number') {
      errors.push(`ingredients[${index}].safety.maxDaily must be a number`);
    }
  });

  return errors;
}

function validateSuppliers(data) {
  const errors = [];

  if (!Array.isArray(data)) {
    return ['Suppliers data must be an array'];
  }

  data.forEach((item, index) => {
    const itemErrors = validateObject(item, supplierSchema, `suppliers[${index}].`);
    errors.push(...itemErrors);

    // Check for duplicate IDs
    const duplicateIds = data.filter(s => s.id === item.id);
    if (duplicateIds.length > 1) {
      errors.push(`Duplicate supplier ID: ${item.id}`);
    }
  });

  return errors;
}

function validateRecipe(data, isFlavor = false) {
  const schema = isFlavor ? flavorRecipeSchema : baseRecipeSchema;
  return validateObject(data, schema);
}

function validateSafetyLimits(data) {
  return validateObject(data, safetyLimitsSchema);
}

function validateFile(filePath, validator) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const errors = validator(data);

    if (errors.length > 0) {
      console.log(`❌ ${path.relative(process.cwd(), filePath)}:`);
      errors.forEach(error => console.log(`  - ${error}`));
      return false;
    } else {
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${path.relative(process.cwd(), filePath)}: ${error.message}`);
    return false;
  }
}

function validateAllData() {
  console.log('Validating data files...\n');

  const validations = [
    { path: path.join(DATA_DIR, 'ingredients', 'ingredients.json'), validator: validateIngredients },
    { path: path.join(DATA_DIR, 'suppliers', 'netherlands.json'), validator: validateSuppliers },
    { path: path.join(DATA_DIR, 'safety', 'limits.json'), validator: validateSafetyLimits },
    { path: path.join(DATA_DIR, 'bases', 'classic.json'), validator: (data) => validateRecipe(data, false) },
    { path: path.join(DATA_DIR, 'bases', 'plain.json'), validator: (data) => validateRecipe(data, false) },
    { path: path.join(DATA_DIR, 'bases', 'zero.json'), validator: (data) => validateRecipe(data, false) }
  ];

  // Add flavor validations
  const flavorsDir = path.join(DATA_DIR, 'flavors');
  if (fs.existsSync(flavorsDir)) {
    const flavorFiles = fs.readdirSync(flavorsDir).filter(f => f.endsWith('.json'));
    flavorFiles.forEach(file => {
      validations.push({
        path: path.join(flavorsDir, file),
        validator: (data) => validateRecipe(data, true)
      });
    });
  }

  let totalValid = 0;
  let totalInvalid = 0;

  validations.forEach(({ path: filePath, validator }) => {
    if (validateFile(filePath, validator)) {
      totalValid++;
    } else {
      totalInvalid++;
    }
  });

  console.log(`\nValidation complete: ${totalValid} valid, ${totalInvalid} invalid files`);

  return totalInvalid === 0;
}

// Run validation if called directly
if (require.main === module) {
  const isValid = validateAllData();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateAllData, validateIngredients, validateSuppliers, validateRecipe, validateSafetyLimits };