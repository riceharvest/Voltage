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

let ingredients, suppliers, supplierMap;

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

async function findProductUrl(supplierDomain, ingredientSearchTerm) {
  const query = `${ingredientSearchTerm} site:${supplierDomain}`;
  const encodedQuery = encodeURIComponent(query);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;

  return await retryRequest(async () => {
    const { stdout } = await execAsync(`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${googleUrl}"`);
    const html = stdout;
    // Find all /url?q= and check each
    const matches = html.match(/\/url\?q=([^&"]*)/g);
    if (matches) {
      for (const match of matches) {
        const url = decodeURIComponent(match.slice(7)); // remove /url?q=
        // Check if it's from the domain
        if (url.includes(supplierDomain)) {
          return url;
        }
      }
    }
    throw new Error(`No valid URL found for ${query}`);
  });
}

async function verifyProductUrl(url, ingredientName) {
  try {
    const { stdout } = await execAsync(`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${url}"`);
    const html = stdout.toLowerCase();
    return html.includes(ingredientName.toLowerCase()) && (html.includes('product') || html.includes('buy') || html.includes('shop'));
  } catch (e) {
    console.error(`Error verifying ${url}: ${e.message}`);
    return false;
  }
}

async function updateIngredient(ingId) {
  try {
    const ing = ingredients.find(i => i.id === ingId);
    if (!ing) {
      throw new Error(`Ingredient ${ingId} not found`);
    }
    let supplierProducts = {};
    for (const supId of ing.suppliers) {
      const sup = supplierMap[supId];
      if (sup) {
        const domain = new URL(sup.url).hostname;
        const searchTerm = ing.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        const productUrl = await findProductUrl(domain, searchTerm);
        if (productUrl) {
          const verified = await verifyProductUrl(productUrl, ing.name);
          if (verified) {
            supplierProducts[supId] = productUrl;
            console.log(`Updated ${supId} to ${productUrl}`);
          }
        }
      }
    }
    if (Object.keys(supplierProducts).length === 0) {
      // no verified, set to first supplier's url
      const firstSup = ing.suppliers[0];
      if (firstSup && supplierMap[firstSup]) {
        supplierProducts[firstSup] = supplierMap[firstSup].url;
        console.log(`No verified product page found, set to ${supplierProducts[firstSup]}`);
      }
    }
    ing.supplierProducts = supplierProducts;
    fs.writeFileSync('src/data/ingredients/ingredients.json', JSON.stringify(ingredients, null, 2));
    // Validate
    try {
      JSON.parse(fs.readFileSync('src/data/ingredients/ingredients.json', 'utf8'));
      console.log('JSON is valid');
    } catch (e) {
      console.error('JSON invalid:', e.message);
    }
  } catch (error) {
    console.error(`Error updating ingredient ${ingId}: ${error.message}`);
    process.exit(1);
  }
}

const ingId = process.argv[2];
if (!ingId || !ingredients.find(i => i.id === ingId)) {
  console.error('Please provide a valid ingredient id as argument');
  process.exit(1);
}
updateIngredient(ingId);