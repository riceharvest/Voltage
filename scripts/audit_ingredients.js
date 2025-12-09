const fs = require('fs');
const path = require('path');

const flavorsDir = path.join(__dirname, '../src/data/flavors');
const ingredientsFile = path.join(__dirname, '../src/data/ingredients/ingredients.json');

try {
  let ingredientsData;
  try {
    ingredientsData = JSON.parse(fs.readFileSync(ingredientsFile, 'utf8'));
  } catch (error) {
    console.error(`Error reading or parsing ingredients file: ${error.message}`);
    process.exit(1);
  }
  const definedIngredientIds = new Set(ingredientsData.map(i => i.id));

  const flavorFiles = fs.readdirSync(flavorsDir).filter(f => f.endsWith('.json'));

  const usedIngredientIds = new Set();
  const missingIngredients = new Set();
  let hasErrors = false;

  function validateFlavor(flavor, file) {
      const errors = [];
      if (!flavor.id || typeof flavor.id !== 'string') errors.push('Missing or invalid id');
      if (!flavor.name || typeof flavor.name !== 'string') errors.push('Missing or invalid name');
      if (!flavor.nameNl || typeof flavor.nameNl !== 'string') errors.push('Missing or invalid nameNl');
      if (!flavor.profile || typeof flavor.profile !== 'string') errors.push('Missing or invalid profile');
      if (!flavor.profileNl || typeof flavor.profileNl !== 'string') errors.push('Missing or invalid profileNl');
      if (!Array.isArray(flavor.ingredients)) errors.push('Missing or invalid ingredients array');
      else {
          flavor.ingredients.forEach((ing, idx) => {
              if (!ing.ingredientId || typeof ing.ingredientId !== 'string') errors.push(`Ingredient ${idx}: missing or invalid ingredientId`);
              if (typeof ing.amount !== 'number') errors.push(`Ingredient ${idx}: missing or invalid amount`);
          });
      }
      if (!flavor.color || typeof flavor.color !== 'object') errors.push('Missing or invalid color');
      else {
          if (!flavor.color.type || !['natural', 'artificial'].includes(flavor.color.type)) errors.push('Invalid color type');
          if (!flavor.color.description || typeof flavor.color.description !== 'string') errors.push('Missing or invalid color description');
      }
      if (!Array.isArray(flavor.compatibleBases)) errors.push('Missing or invalid compatibleBases');
      if (!flavor.aging || typeof flavor.aging !== 'object') errors.push('Missing or invalid aging');
      else {
          if (typeof flavor.aging.recommended !== 'number') errors.push('Invalid aging recommended');
          if (typeof flavor.aging.optional !== 'boolean') errors.push('Invalid aging optional');
      }
      return errors;
  }

  flavorFiles.forEach(file => {
      try {
        const flavor = JSON.parse(fs.readFileSync(path.join(flavorsDir, file), 'utf8'));
        const validationErrors = validateFlavor(flavor, file);
        if (validationErrors.length > 0) {
            console.log(`Validation errors in ${file}:`);
            validationErrors.forEach(err => console.log(`  ${err}`));
            hasErrors = true;
        }
        if (flavor.ingredients) {
            flavor.ingredients.forEach(ing => {
                usedIngredientIds.add(ing.ingredientId);
                if (!definedIngredientIds.has(ing.ingredientId)) {
                    missingIngredients.add(ing.ingredientId);
                    console.log(`Missing ingredient definition: ${ing.ingredientId} in ${file}`);
                }
            });
        }
      } catch (error) {
        console.error(`Error reading or parsing flavor file ${file}: ${error.message}`);
        hasErrors = true;
      }
  });

  console.log(`Total unique ingredients used: ${usedIngredientIds.size}`);
  console.log(`defined ingredients: ${definedIngredientIds.size}`);

  if (missingIngredients.size > 0) {
      console.log('Missing ingredients:', Array.from(missingIngredients));
      hasErrors = true;
  } else {
      console.log('All ingredients are defined.');
  }

  // Output list of all ingredients to research
  console.log('--- Ingredients to Research ---');
  ingredientsData.forEach(ing => {
      console.log(`${ing.id} | ${ing.name} | ${ing.nameNl}`);
  });

  console.log('\n--- Summary ---');
  console.log(`Total flavors processed: ${flavorFiles.length}`);
  console.log(`Unique ingredients used: ${usedIngredientIds.size}`);
  console.log(`Defined ingredients: ${definedIngredientIds.size}`);
  console.log(`Missing ingredients: ${missingIngredients.size}`);

  if (hasErrors) {
      console.log('Audit failed: Issues found.');
      process.exit(1);
  } else {
      console.log('Audit passed: All ingredients defined and flavors valid.');
      process.exit(0);
  }
} catch (error) {
  console.error(`Fatal error in audit script: ${error.message}`);
  process.exit(1);
}
