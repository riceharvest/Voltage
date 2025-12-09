# Developer Integration Guide

This guide provides practical examples and best practices for integrating with the Energy Drink App APIs.

## Quick Start

### Prerequisites
- Application must be age-verified (18+)
- CSRF tokens required for POST/DELETE operations
- HTTPS required in production

### Base Configuration
```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

## Age Verification Flow

### 1. Get CSRF Token
```javascript
async function getCsrfToken() {
  const response = await fetch(`${API_BASE}/api/csrf-token`);
  const data = await response.json();
  return data.csrfToken;
}
```

### 2. Verify Age
```javascript
async function verifyAge(birthYear) {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE}/api/auth/verify-age`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ birthYear })
  });

  const result = await response.json();

  if (response.ok) {
    console.log('Age verified successfully');
    return true;
  } else {
    console.error('Age verification failed:', result.error);
    return false;
  }
}
```

### 3. Check Verification Status
```javascript
async function checkVerificationStatus() {
  const response = await fetch(`${API_BASE}/api/auth/check-verification`, {
    credentials: 'include'
  });

  const result = await response.json();
  return result;
}
```

## Feature Flag Integration

### React Hook Usage
```javascript
import { useFeatureFlag } from '@/lib/use-feature-flag';

function MyComponent() {
  const isNewFeatureEnabled = useFeatureFlag('new_feature');

  return (
    <div>
      {isNewFeatureEnabled ? (
        <NewFeatureComponent />
      ) : (
        <OldFeatureComponent />
      )}
    </div>
  );
}
```

### Manual API Usage
```javascript
async function checkFeatureFlag(flagName, userId) {
  const params = new URLSearchParams({
    name: flagName,
    userId: userId || '',
    environment: process.env.NODE_ENV
  });

  const response = await fetch(`${API_BASE}/api/feature-flags?${params}`);
  const result = await response.json();

  return result.enabled;
}
```

### Server-Side Feature Flag Management
```javascript
async function createFeatureFlag(flagData) {
  const response = await fetch(`${API_BASE}/api/feature-flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(flagData)
  });

  return response.json();
}

async function updateFeatureFlag(flagName, updates) {
  // First get existing flag, then update
  const getResponse = await fetch(`${API_BASE}/api/feature-flags?name=${flagName}`);
  const existingFlag = await getResponse.json();

  const updatedFlag = { ...existingFlag.flag, ...updates };

  const updateResponse = await fetch(`${API_BASE}/api/feature-flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedFlag)
  });

  return updateResponse.json();
}
```

## GDPR Compliance Integration

### Check GDPR Status
```javascript
async function checkGdprStatus() {
  const response = await fetch(`${API_BASE}/api/gdpr/status`);
  const status = await response.json();

  if (status.consentRequired) {
    // Show consent banner
    showConsentBanner();
  }

  return status;
}
```

### Handle User Consent
```javascript
function createConsentCookie(consent) {
  const consentData = {
    necessary: true, // Always required
    analytics: consent.analytics || false,
    marketing: consent.marketing || false,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  // Set cookie (usually handled by GDPR provider component)
  document.cookie = `gdpr-consent=${JSON.stringify(consentData)}; path=/; max-age=31536000; SameSite=Lax`;
}
```

### GDPR Data Access/Erasure
```javascript
async function requestDataAccess() {
  const response = await fetch(`${API_BASE}/api/gdpr/data`, {
    credentials: 'include'
  });

  if (response.ok) {
    const data = await response.json();
    // Display data to user
    displayUserData(data);
  }
}

async function requestDataErasure() {
  const response = await fetch(`${API_BASE}/api/gdpr/data`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (response.ok) {
    // Clear local data and redirect
    clearUserSession();
  }
}
```

## Complete Integration Example

### React Application Integration
```javascript
import { useState, useEffect } from 'react';

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [gdprStatus, setGdprStatus] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    // Check age verification
    const verificationStatus = await checkVerificationStatus();
    setIsVerified(verificationStatus.verified);

    // Get CSRF token
    const token = await getCsrfToken();
    setCsrfToken(token);

    // Check GDPR status
    const gdpr = await checkGdprStatus();
    setGdprStatus(gdpr);
  }

  async function handleAgeVerification(birthYear) {
    const success = await verifyAge(birthYear);
    if (success) {
      setIsVerified(true);
      // Refresh GDPR status
      const gdpr = await checkGdprStatus();
      setGdprStatus(gdpr);
    }
  }

  if (!isVerified) {
    return <AgeVerificationForm onVerify={handleAgeVerification} />;
  }

  return (
    <div>
      {gdprStatus?.consentRequired && <ConsentBanner />}
      <MainApplication />
    </div>
  );
}
```

## Error Handling

### Global Error Handler
```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);

    // Handle specific error types
    if (error.message.includes('CSRF')) {
      // Refresh CSRF token and retry
      const newToken = await getCsrfToken();
      setCsrfToken(newToken);
    }

    throw error;
  }
}
```

### Rate Limiting Handling
```javascript
function handleRateLimit(response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);

    // Implement exponential backoff
    return new Promise(resolve => {
      setTimeout(() => resolve(apiRequest(url, options)), retryAfter * 1000);
    });
  }
}
```

## Testing Integration

### Unit Testing API Calls
```javascript
import { jest } from '@jest/globals';

describe('API Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('verifyAge makes correct API call', async () => {
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await verifyAge(1990);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/verify-age'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toBe(true);
  });
});
```

### E2E Testing
```javascript
import { test, expect } from '@playwright/test';

test('complete age verification flow', async ({ page }) => {
  await page.goto('/');

  // Fill age verification form
  await page.fill('[data-testid="birth-year-input"]', '1990');
  await page.click('[data-testid="verify-button"]');

  // Wait for success
  await expect(page.locator('[data-testid="main-app"]')).toBeVisible();

  // Check that cookie is set
  const cookies = await page.context().cookies();
  const ageCookie = cookies.find(c => c.name === 'age-verified');
  expect(ageCookie).toBeTruthy();
});
```

## Best Practices

### 1. Always Check Age Verification
```javascript
// Before any sensitive operations
const status = await checkVerificationStatus();
if (!status.verified) {
  redirectToAgeVerification();
}
```

### 2. Handle CSRF Tokens Properly
```javascript
// Get fresh token before each state-changing request
const token = await getCsrfToken();
// Include in headers
headers: { 'X-CSRF-Token': token }
```

### 3. Respect GDPR Requirements
```javascript
// Always check consent status
const gdpr = await checkGdprStatus();
if (gdpr.consentRequired && !gdpr.hasConsent) {
  // Block or limit functionality
}
```

### 4. Implement Proper Error Handling
```javascript
try {
  const result = await apiRequest('/api/some-endpoint');
  // Handle success
} catch (error) {
  if (error.message.includes('403')) {
    // Handle authentication errors
  } else if (error.message.includes('429')) {
    // Handle rate limiting
  } else {
    // Handle other errors
  }
}
```

### 5. Cache Appropriately
```javascript
// Cache GDPR status (short-lived)
const gdprStatus = await cache.get('gdpr-status');
if (!gdprStatus) {
  gdprStatus = await checkGdprStatus();
  await cache.set('gdpr-status', gdprStatus, 300); // 5 minutes
}
```

## SDK Development

For larger integrations, consider creating a client SDK:

```javascript
class EnergyDrinkAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async verifyAge(birthYear) {
    // Implementation
  }

  async checkVerification() {
    // Implementation
  }

  async getFeatureFlags() {
    // Implementation
  }

  // ... other methods
}

export default EnergyDrinkAPI;
```

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**
   - Ensure token is fresh (not expired)
   - Include in request headers correctly

2. **Cookie Issues**
   - Ensure `credentials: 'include'` is set
   - Check SameSite and Secure flags

3. **GDPR Blocking**
   - Verify user is not in EU or has given consent
   - Check IP detection is working

4. **Rate Limiting**
   - Implement exponential backoff
   - Check rate limit headers in responses

### Debug Mode
Enable debug logging in development:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('API Request:', url, options);
  console.log('API Response:', response);
}
```

## Support

For integration issues:
1. Check the API documentation
2. Review error messages carefully
3. Test with the provided examples
4. Contact the development team with specific error details