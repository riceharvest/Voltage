const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

try {
  const ingredients = JSON.parse(fs.readFileSync('src/data/ingredients/ingredients.json', 'utf8'));
  const suppliers = JSON.parse(fs.readFileSync('src/data/suppliers/netherlands.json', 'utf8'));
} catch (error) {
  console.error('Error reading or parsing JSON files:', error.message);
  process.exit(1);
}

const supplierMap = suppliers.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

async function findProductUrl(supplierDomain, ingredientSearchTerm) {
  const query = `${ingredientSearchTerm} site:${supplierDomain}`;
  const encodedQuery = encodeURIComponent(query);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;
  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
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
  } catch (e) {
    console.error(`Error searching Google for ${query}: ${e.message}`);
  }
  return null;
}

async function verifyProductUrl(url) {
  try {
    const { stdout } = await execAsync(`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${url}"`);
    const html = stdout.toLowerCase();
    return html.includes('taurine') && (html.includes('product') || html.includes('buy') || html.includes('prijs') || html.includes('€'));
  } catch (e) {
    console.error(`Error verifying ${url}: ${e.message}`);
    return false;
  }
}

async function updateTaurine() {
  const ing = ingredients.find(i => i.id === 'taurine');
  if (!ing || !ing.suppliers) {
    console.error('Taurine ingredient not found or has no suppliers');
    return;
  }
  let supplierProducts = ing.supplierProducts || {};
  for (const supId of ing.suppliers) {
    const sup = supplierMap[supId];
    if (sup) {
      let domain;
      try {
        domain = new URL(sup.url).hostname;
      } catch (error) {
        console.error('Invalid supplier URL for ' + supId + ':', error.message);
        continue;
      }
      const searchTerm = 'taurine powder';
      const productUrl = await findProductUrl(domain, searchTerm);
      if (productUrl) {
        // Check if appears to be product page
        let path;
        try {
          path = new URL(productUrl).pathname.toLowerCase();
        } catch (error) {
          console.error('Invalid product URL:', productUrl, error.message);
          continue;
        }
        if (path.includes('/product/') || path.includes('/shop/') || path.includes('/item/') || path.includes('/p/')) {
          // Verify
          const verified = await verifyProductUrl(productUrl);
          if (verified) {
            supplierProducts[supId] = productUrl;
            console.log(`Updated ${supId} to ${productUrl}`);
          } else {
            console.log(`Verification failed for ${productUrl}, keeping current`);
          }
        } else {
          console.log(`URL ${productUrl} does not appear to be product page, keeping current`);
        }
      } else {
        console.log(`No URL found for ${supId}, keeping current`);
      }
    }
  }
  ing.supplierProducts = supplierProducts;
  try {
    fs.writeFileSync('src/data/ingredients/ingredients.json', JSON.stringify(ingredients, null, 2));
  } catch (error) {
    console.error('Error writing to ingredients file:', error.message);
  }
  // Validate
  try {
    JSON.parse(fs.readFileSync('src/data/ingredients/ingredients.json', 'utf8'));
    console.log('JSON is valid');
  } catch (e) {
    console.error('JSON invalid:', e.message);
  }
}

updateTaurine();