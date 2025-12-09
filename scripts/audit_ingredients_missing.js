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

  const missingIngredients = new Set();
  const missingDetails = [];
  const invalidDetails = [];

  flavorFiles.forEach(file => {
      let flavor;
      try {
          flavor = JSON.parse(fs.readFileSync(path.join(flavorsDir, file), 'utf8'));
      } catch (error) {
          console.error(`Error reading or parsing flavor file ${file}: ${error.message}`);
          return;
      }

      if (!flavor.ingredients || !Array.isArray(flavor.ingredients)) {
          invalidDetails.push({ file, error: 'ingredients is not an array or missing' });
          return;
      }

      flavor.ingredients.forEach((ing, index) => {
          if (!ing || typeof ing !== 'object' || !ing.ingredientId || typeof ing.ingredientId !== 'string') {
              invalidDetails.push({ file, index, error: 'ingredient missing or invalid ingredientId' });
              return;
          }
          if (!definedIngredientIds.has(ing.ingredientId)) {
              missingIngredients.add(ing.ingredientId);
              missingDetails.push({ file, id: ing.ingredientId });
          }
      });
  });

  if (missingIngredients.size > 0) {
      console.log('MISSING_INGREDIENTS_START');
      console.log(JSON.stringify(missingDetails, null, 2));
      console.log('MISSING_INGREDIENTS_END');
  }

  if (invalidDetails.length > 0) {
      console.log('INVALID_STRUCTURES_START');
      console.log(JSON.stringify(invalidDetails, null, 2));
      console.log('INVALID_STRUCTURES_END');
  }

  if (missingIngredients.size === 0 && invalidDetails.length === 0) {
      console.log('ALL_OK');
  }
} catch (error) {
  console.error(`Fatal error in audit script: ${error.message}`);
  process.exit(1);
}
