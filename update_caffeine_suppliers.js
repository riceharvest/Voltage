const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Retry utility for network requests
async function retryRequest(fn, maxRetries = 3, delayMs = 2000) {
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

const targetIngredientId = 'caffeine-anhydrous';
const targetSuppliers = ['sportpoeders', 'bulk', 'ietsgezond', 'buxtrade'];

async function findProductUrl(supplierDomain, ingredientSearchTerm) {
  const query = `${ingredientSearchTerm} site:${supplierDomain}`;
  const encodedQuery = encodeURIComponent(query);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;

  return await retryRequest(async () => {
    const { stdout } = await execAsync(`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${googleUrl}"`);
    const html = stdout.toLowerCase();
    console.log(`HTML for ${query}:`, html.substring(0, 1000));

    // Check for CAPTCHA or blocks
    if (html.includes('captcha') || html.includes('blocked') || html.includes('sorry') || html.includes('unusual traffic')) {
      throw new Error(`Google blocked request for ${query}: CAPTCHA or rate limit detected`);
    }

    // Find first /url?q=
    const match = html.match(/\/url\?q=([^&"]*)/);
    console.log('Match:', match);
    if (match) {
      const url = decodeURIComponent(match[1]);
      console.log('Decoded URL:', url);
      // Check if it's from the domain
      if (url.includes(supplierDomain)) {
        return url;
      }
    }
    return null;
  }, 3, 10000); // 3 retries, start with 10s delay
}

async function verifyProductPage(url) {
  try {
    const { stdout } = await execAsync(`curl -s "${url}"`);
    const html = stdout.toLowerCase();
    return html.includes('caffeine') && (html.includes('product') || html.includes('shop') || html.includes('buy') || html.includes('purchase') || html.includes('cart'));
  } catch (e) {
    console.error(`Error verifying ${url}: ${e.message}`);
    return false;
  }
}

async function updateCaffeineSuppliers() {
  try {
    const ing = ingredients.find(i => i.id === targetIngredientId);
    if (!ing) {
      throw new Error('Ingredient not found');
    }

    let supplierProducts = ing.supplierProducts || {};

    for (const supId of targetSuppliers) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const sup = supplierMap[supId];
      if (sup) {
        const domain = new URL(sup.url).hostname;
        const searchTerm = 'caffeine anhydrous';
        const productUrl = await findProductUrl(domain, searchTerm);
        if (productUrl) {
          // Check if appears to be product page (contains /product/ or similar in path)
          const urlObj = new URL(productUrl);
          const path = urlObj.pathname.toLowerCase();
          if (path.includes('/product/') || path.includes('/webshop/') || path.includes('/shop/') || path.includes('/item/')) {
            // Verify by curling
            const verified = await verifyProductPage(productUrl);
            if (verified) {
              supplierProducts[supId] = productUrl;
              console.log(`Updated ${supId} to ${productUrl}`);
            } else {
              console.log(`Verification failed for ${productUrl}, keeping current`);
            }
          } else {
            console.log(`URL ${productUrl} does not appear to be a product page, keeping current`);
          }
        } else {
          console.log(`No URL found for ${supId}, keeping current`);
        }
      } else {
        console.log(`Supplier ${supId} not found in supplierMap, skipping`);
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
    console.error(`Error in updateCaffeineSuppliers: ${error.message}`);
    process.exit(1);
  }
}

updateCaffeineSuppliers();