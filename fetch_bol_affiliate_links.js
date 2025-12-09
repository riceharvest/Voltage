const fs = require('fs');
const path = require('path');

// Validate required environment variables
const requiredEnvVars = ['BOL_API_KEY', 'BOL_CLIENT_ID', 'BOL_CLIENT_SECRET', 'BOL_SITE_ID'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName] || process.env[varName].trim() === '') {
    console.error(`Environment variable ${varName} is not set or empty`);
    process.exit(1);
  }
}

const clientId = process.env.BOL_CLIENT_ID;
const clientSecret = process.env.BOL_CLIENT_SECRET;
const siteId = process.env.BOL_SITE_ID;

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

async function getAccessToken() {
  return await retryRequest(async () => {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.access_token;
  });
}

async function searchProduct(searchTerm, token) {
  return await retryRequest(async () => {
    const url = `https://api.bol.com/marketing-catalog/v1/search?search-term=${encodeURIComponent(searchTerm)}&country-code=NL&include-offer=true&include-image=true`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      throw new Error('No products found for search term or invalid data structure');
    }
    const product = data.products[0];
    return { ean: product.ean, title: product.title };
  });
}

function constructAffiliateLink(flavor, ean, title) {
  const encodedTitle = encodeURIComponent(title.replace(/\s+/g, '-').toLowerCase());
  const subid = siteId || '';
  return `https://partner.bol.com/click/click?p=1&t=url&f=TXL&subid=${subid}&name=${encodeURIComponent(flavor)}&url=https%3A//www.bol.com/nl/p/${encodedTitle}/${ean}/&f=TXL`;
}

async function main() {
  try {
    if (!clientId || !clientSecret) {
      throw new Error('BOL_CLIENT_ID and BOL_CLIENT_SECRET environment variables are required');
    }

    const flavorsDir = path.join(__dirname, 'src', 'data', 'flavors');
    const files = fs.readdirSync(flavorsDir).filter(f => f.endsWith('.json'));

    const token = await getAccessToken();

    for (const file of files) {
      const flavorName = file.replace('.json', '').replace(/-/g, ' ');
      const searchTerm = `${flavorName} energy drink`;
      try {
        const { ean, title } = await searchProduct(searchTerm, token);
        const affiliateLink = constructAffiliateLink(flavorName, ean, title);
        const filePath = path.join(flavorsDir, file);
        let originalContent;
        try {
          originalContent = fs.readFileSync(filePath, 'utf8');
        } catch (readError) {
          console.error(`Failed to read file ${file}: ${readError.message}`);
          continue;
        }
        let data;
        try {
          data = JSON.parse(originalContent);
        } catch (parseError) {
          console.error(`Failed to parse JSON in ${file}: ${parseError.message}`);
          continue;
        }
        // Create backup
        try {
          fs.writeFileSync(filePath + '.backup', originalContent);
        } catch (backupError) {
          console.warn(`Failed to create backup for ${file}: ${backupError.message}`);
        }
        data.affiliateLink = affiliateLink;
        try {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (writeError) {
          console.error(`Failed to write file ${file}: ${writeError.message}`);
          continue;
        }
        console.log(`Updated ${file} with affiliate link`);
        // Rate limiting: delay 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Fatal error in main: ${error.message}`);
    process.exit(1);
  }
}

main();