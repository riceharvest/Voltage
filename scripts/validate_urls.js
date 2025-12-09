const fs = require('fs');
const playwright = require('playwright');

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

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function validateUrls() {
  try {
    // Read ingredients data
    let data;
    try {
      data = JSON.parse(fs.readFileSync('./src/data/ingredients/ingredients.json', 'utf8'));
    } catch (error) {
      console.error(`Error reading ingredients file: ${error.message}`);
      process.exit(1);
    }

    // Extract unique URLs from supplierProducts and supplierUrls
    const urls = new Set();

    data.forEach(entry => {
      if (entry.supplierProducts && typeof entry.supplierProducts === 'object') {
        Object.values(entry.supplierProducts).forEach(url => {
          if (typeof url === 'string' && isValidUrl(url)) urls.add(url);
        });
      }
      if (entry.supplierUrls && Array.isArray(entry.supplierUrls)) {
        entry.supplierUrls.forEach(url => {
          if (typeof url === 'string' && isValidUrl(url)) urls.add(url);
        });
      }
    });

    const urlList = Array.from(urls);
    const results = [];

    // Launch browser
    const browser = await playwright.chromium.launch();

    for (const url of urlList) {
      try {
        const page = await browser.newPage();
        console.log(`Validating: ${url}`);

        // Navigate with timeout handling and retries
        await retryRequest(async () => {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
        });

        // Check for product images
        const imageCount = await page.$$('img');
        const hasImages = imageCount.length > 0;

        // Check for price information with improved regex and targeted selectors
        const hasPrice = await page.evaluate(() => {
          // Target specific selectors for price evaluation
          const selectors = [
            '.price', '[data-price]', '.product-price', '.cost',
            'span.price', 'div.price', 'p.price', '.sale-price'
          ];
          let priceFound = false;

          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent;
              // Improved regex: supports decimals, commas, more currencies
              if (text.match(/(?:€|\$|£|¥)\s*\d+(?:[,.]\d+)?|\d+(?:[,.]\d+)?\s*(?:€|\$|£|¥)/i)) {
                priceFound = true;
              }
            });
          });

          // Fallback to body search if no specific selectors found
          if (!priceFound) {
            const bodyText = document.body.textContent;
            if (bodyText.match(/(?:€|\$|£|¥)\s*\d+(?:[,.]\d+)?|\d+(?:[,.]\d+)?\s*(?:€|\$|£|¥)/i)) {
              priceFound = true;
            }
          }

          return priceFound;
        });

        results.push({
          url,
          status: 'passed',
          hasImages,
          hasPrice
        });

      } catch (error) {
        console.error(`Error validating ${url}: ${error.message}`);
        results.push({
          url,
          status: 'failed',
          error: error.message,
          hasImages: false,
          hasPrice: false
        });
      }

      // Add rate limiting delay (1 second between requests)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();

    // Write results to file with error handling
    try {
      fs.writeFileSync('./validation_results.json', JSON.stringify(results, null, 2));
      console.log('Validation complete. Results saved to validation_results.json');
    } catch (error) {
      console.error(`Error writing validation results: ${error.message}`);
      throw error;
    }
  } catch (error) {
    console.error(`Fatal error in validateUrls: ${error.message}`);
    process.exit(1);
  }
}

validateUrls();