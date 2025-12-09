const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Retry utility for network requests
async function retryRequest(fn, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

let ingredients, suppliers, supplierMap, targetIngredients;

try {
  ingredients = JSON.parse(fs.readFileSync('src/data/ingredients/ingredients.json', 'utf8'));
} catch (error) {
  console.error(`Error reading ingredients file: ${error.message}`);
  process.exit(1);
}

try {
  suppliers = JSON.parse(fs.readFileSync('src/data/suppliers/netherlands.json', 'utf8'));
} catch (error) {
  console.error(`Error reading suppliers file: ${error.message}`);
  process.exit(1);
}

supplierMap = suppliers.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

targetIngredients = ingredients.filter(ing => !ing.supplierProducts || Object.keys(ing.supplierProducts).length === 0).map(ing => ing.id);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyUrl(url) {
  try {
    const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`);
    return stdout.trim() === '200';
  } catch (e) {
    console.error(`Error verifying URL ${url}: ${e.message}`);
    return false;
  }
}

async function findProductUrl(supplierDomain, ingredientSearchTerm) {
  const query = `${ingredientSearchTerm} site:${supplierDomain}`;
  const encodedQuery = encodeURIComponent(query);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;

  return await retryRequest(async () => {
    const { stdout } = await execAsync(`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${googleUrl}"`);
    const html = stdout;
    // Find first /url?q=
    const match = html.match(/\/url\?q=([^&"]*)/);
    if (match) {
      const url = decodeURIComponent(match[1]);
      // Check if it's from the domain
      if (url.includes(supplierDomain)) {
        return url;
      }
    }
    throw new Error(`No valid URL found for ${query}`);
  });
}

async function updateIngredients() {
  try {
    for (const ing of ingredients) {
      if (targetIngredients.includes(ing.id)) {
        if (!ing.suppliers || !Array.isArray(ing.suppliers)) {
          console.warn(`Skipping ingredient ${ing.id}: suppliers not found or not an array`);
          continue;
        }
        let supplierProducts = ing.supplierProducts || {};
        for (const supId of ing.suppliers) {
          const sup = supplierMap[supId];
          if (sup) {
            const domain = new URL(sup.url).hostname;
            const searchTerm = ing.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
            const productUrl = await findProductUrl(domain, searchTerm);
            if (productUrl && await verifyUrl(productUrl)) {
              supplierProducts[supId] = productUrl;
            } else {
              // keep existing or set to sup.url if not exists
              if (!supplierProducts[supId]) {
                supplierProducts[supId] = sup.url;
              }
            }
          }
          // Rate limiting: delay 1 second between requests
          await delay(1000);
        }
        ing.supplierProducts = supplierProducts;
      }
    }
    fs.writeFileSync('src/data/ingredients/ingredients.json', JSON.stringify(ingredients, null, 2));
    // Validate
    try {
      JSON.parse(fs.readFileSync('src/data/ingredients/ingredients.json', 'utf8'));
      console.log('JSON is valid');
    } catch (e) {
      console.error('JSON invalid:', e.message);
    }
  } catch (error) {
    console.error(`Error in updateIngredients: ${error.message}`);
    process.exit(1);
  }
}

updateIngredients();