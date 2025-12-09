const fs = require('fs');
const path = require('path');

const flavorsDir = path.join(__dirname, '../src/data/flavors');
const ingredientsFile = path.join(__dirname, '../src/data/ingredients/ingredients.json');

try {
  let definedIngredientIds;
  try {
    const ingredientsData = JSON.parse(fs.readFileSync(ingredientsFile, 'utf8'));
    if (!Array.isArray(ingredientsData)) {
      throw new Error('ingredientsData is not an array');
    }
    if (!ingredientsData.every(i => i && typeof i.id === 'string')) {
      throw new Error('Some ingredients are missing or have invalid id');
    }
    definedIngredientIds = new Set(ingredientsData.map(i => i.id));
  } catch (error) {
    console.error('Error reading ingredients file:', error.message);
    process.exit(1);
  }

  const flavorFiles = fs.readdirSync(flavorsDir).filter(f => f.endsWith('.json'));

  const missingIngredients = new Set();

  flavorFiles.forEach(file => {
      try {
          const flavor = JSON.parse(fs.readFileSync(path.join(flavorsDir, file), 'utf8'));
          if (flavor.ingredients) {
              flavor.ingredients.forEach(ing => {
                  if (!definedIngredientIds.has(ing.ingredientId)) {
                      missingIngredients.add(ing.ingredientId);
                  }
              });
          }
      } catch (error) {
          console.error(`Error reading flavor file ${file}:`, error.message);
      }
  });

  console.log('MISSING:', Array.from(missingIngredients).join(', '));
} catch (error) {
  console.error(`Fatal error in check script: ${error.message}`);
  process.exit(1);
}
