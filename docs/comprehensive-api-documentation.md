# Energy Drink App API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Security](#authentication--security)
3. [API Categories](#api-categories)
4. [Core Data APIs](#core-data-apis)
5. [Analytics & Testing APIs](#analytics--testing-apis)
6. [Performance & Monitoring APIs](#performance--monitoring-apis)
7. [Integration Examples](#integration-examples)
8. [Error Handling](#error-handling)
9. [Rate Limiting & Caching](#rate-limiting--caching)
10. [SDKs & Client Libraries](#sdks--client-libraries)
11. [Best Practices](#best-practices)
12. [Changelog](#changelog)

## Overview

The Energy Drink App API provides a comprehensive RESTful interface for managing energy drink recipes, conducting A/B tests, tracking affiliate conversions, and monitoring application performance. The API is designed for scalability, security, and developer experience.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.energydrink.app/api`
- **Production**: `https://api.energydrink.app/api`

### API Versioning

Current version: **v2.0**

API versioning is handled through URL paths. Breaking changes will increment the major version.

### Content Type

All API endpoints accept and return JSON data with the `Content-Type: application/json` header.

### Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

Error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": { /* additional error context */ }
}
```

## Authentication & Security

### Age Verification

Most endpoints require age verification through cookie-based authentication.

#### Cookie Authentication

1. **Age Verification**:
   ```javascript
   // First, verify age
   const response = await fetch('/api/auth/verify-age', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRF-Token': csrfToken
     },
     body: JSON.stringify({ birthYear: 1990 })
   });
   
   // Set-cookie header will be automatically included
   // Subsequent requests will include the age-verified cookie
   ```

2. **Check Verification Status**:
   ```javascript
   const status = await fetch('/api/auth/check-verification');
   const data = await status.json();
   // Returns: { verified: true, age: 34, verificationDate: "..." }
   ```

### CSRF Protection

For all state-changing operations (POST, PUT, DELETE), include a CSRF token:

```javascript
// Get CSRF token
const csrfResponse = await fetch('/api/csrf-token');
const { csrfToken } = await csrfResponse.json();

// Use in subsequent requests
const response = await fetch('/api/flavors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ /* request data */ })
});
```

### Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## API Categories

### Core Data APIs
- **Flavors** (`/flavors`) - Energy drink flavor management
- **Ingredients** (`/ingredients`) - Ingredient catalog and safety data
- **Suppliers** (`/suppliers`) - Supplier information and product links

### Analytics & Testing APIs
- **A/B Tests** (`/ab-tests`) - Experiment management and results
- **Feature Flags** (`/feature-flags`) - Feature rollout control
- **Feedback** (`/feedback`) - User feedback collection and analytics

### Performance & Monitoring APIs
- **Performance** (`/performance`) - System metrics and optimization
- **Health** (`/health`) - Application health checks
- **Search** (`/search`) - Intelligent search across all data types
- **Bulk Operations** (`/bulk`) - Efficient batch data retrieval

### Business Logic APIs
- **Affiliate Tracking** (`/affiliate`) - Click and conversion tracking
- **GDPR Compliance** (`/gdpr`) - Data rights and compliance

### Utility APIs
- **Authentication** (`/auth`) - Age verification and session management
- **Security** (`/csrf-token`) - CSRF token generation

## Core Data APIs

### Flavors API

#### Get All Flavors

```javascript
// Basic usage
const response = await fetch('/api/flavors');
const { data, count } = await response.json();

// With filters
const filtered = await fetch('/api/flavors?category=cola&limit=10');
const colaFlavors = await filtered.json();
```

**Query Parameters:**
- `limit` (1-100): Maximum number of results (default: 50)
- `offset` (0+): Number of results to skip (default: 0)
- `category`: Filter by category (citrus, berry, tropical, cola, original)
- `caffeineRange`: Format: "min-max" (e.g., "50-150")

#### Get Specific Flavor

```javascript
const response = await fetch('/api/flavors/cola-kick');
const flavor = await response.json();
// Returns detailed flavor information including recipe and safety data
```

#### Create New Flavor

```javascript
const newFlavor = {
  id: "custom-flavor",
  name: "Custom Flavor",
  profile: "Custom flavor description",
  ingredients: [
    { ingredientId: "caffeine", amount: 80 },
    { ingredientId: "sugar", amount: 10 }
  ],
  compatibleBases: ["classic", "zero"]
};

const response = await fetch('/api/flavors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(newFlavor)
});
```

### Ingredients API

#### Get Ingredients with Safety Data

```javascript
// Get all ingredients
const response = await fetch('/api/ingredients');
const { data } = await response.json();

// Filter by category and safety compliance
const safeIngredients = await fetch('/api/ingredients?category=caffeine&safetyCompliant=true');
const caffeineData = await safeIngredients.json();
```

**Query Parameters:**
- `limit` (1-200): Maximum number of results (default: 100)
- `category`: Filter by ingredient category
- `safetyCompliant`: Filter by EU safety compliance (true/false)
- `banned`: Filter by banned status (true/false)

#### Safety Information

Each ingredient includes comprehensive safety data:

```javascript
{
  "id": "caffeine",
  "safety": {
    "maxDaily": 400,           // mg per day
    "warningThreshold": 300,   // mg warning threshold
    "euCompliant": true,
    "banned": false
  }
}
```

### Suppliers API

#### Get Supplier Information

```javascript
const response = await fetch('/api/suppliers');
const { data } = await response.json();
// Returns supplier details with product links and locations
```

## Analytics & Testing APIs

### A/B Testing API

#### Create A/B Test

```javascript
const testConfig = {
  id: "calculator-ui-test",
  name: "Calculator Interface Test",
  description: "Test new calculator UI design",
  variants: [
    {
      id: "control",
      name: "Current Interface",
      weight: 50,
      config: { uiVersion: "current" }
    },
    {
      id: "treatment", 
      name: "New Interface",
      weight: 50,
      config: { uiVersion: "new" }
    }
  ],
  conversionGoals: [
    {
      id: "calculation_completed",
      name: "Calculation Completed",
      type: "event"
    }
  ],
  trafficAllocation: {
    percentage: 100,
    startDate: "2024-01-15T00:00:00.000Z"
  }
};

const response = await fetch('/api/ab-tests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(testConfig)
});
```

#### Get A/B Test Results

```javascript
// Get all tests
const tests = await fetch('/api/ab-tests');
const { data } = await tests.json();

// Get specific test with statistics
const test = await fetch('/api/ab-tests/calculator-ui-test');
const { data: testData } = await test.json();
// Includes exposure counts, conversion rates, and statistical significance
```

### Feature Flags API

#### Evaluate Feature Flag

```javascript
// Check if feature is enabled for current user
const flag = await fetch('/api/feature-flags?name=new_calculator&userId=user123&environment=production');
const { data } = await flag.json();
// Returns: { flag: "new_calculator", enabled: true, context: {...} }
```

#### Create Feature Flag

```javascript
const flagConfig = {
  name: "enhanced_calculator",
  enabled: true,
  rolloutPercentage: 25,
  conditions: {
    environment: ["production", "staging"],
    userIds: ["premium_users"]
  },
  metadata: {
    description: "Enhanced calculator with new features",
    owner: "feature-team@energydrink.app"
  }
};

const response = await fetch('/api/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(flagConfig)
});
```

### Feedback API

#### Submit Feedback

```javascript
const feedback = {
  category: "ui_ux",
  rating: 4,
  comment: "The calculator interface is intuitive, but could use better mobile optimization.",
  page: "/calculator",
  priority: "medium",
  tags: ["mobile", "calculator", "ui"],
  gdprConsent: true
};

const response = await fetch('/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(feedback)
});
```

#### Get Feedback Analytics

```javascript
const analyticsRequest = {
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
  category: "ui_ux"
};

const response = await fetch('/api/feedback/stats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(analyticsRequest)
});

const stats = await response.json();
// Returns comprehensive analytics including trends, ratings distribution, and category breakdown
```

## Performance & Monitoring APIs

### Search API

#### Intelligent Search

```javascript
// Search across all data types
const response = await fetch('/api/search?q=cola flavor&types=flavors,ingredients&limit=10');
const results = await response.json();

// Returns:
{
  "query": "cola flavor",
  "totalResults": 15,
  "searchTime": 45.2,
  "flavors": [...],
  "ingredients": [...],
  "relevanceScores": {
    "flavors": [{ "id": "cola-kick", "score": 18.5 }],
    "ingredients": [...]
  }
}
```

### Bulk Operations API

#### Efficient Data Retrieval

```javascript
// Get multiple flavors by ID
const response = await fetch('/api/bulk?type=flavors&ids=cola-kick,berry-blast,tropical-bliss');
const { flavors, missingFlavors } = await response.json();

// Complex bulk operations
const bulkRequest = {
  operations: [
    {
      type: "flavors",
      action: "get",
      params: { ids: ["cola-kick", "berry-blast"] }
    },
    {
      type: "ingredients", 
      action: "search",
      params: { query: "caffeine", limit: 5 }
    }
  ],
  includeMetadata: true
};

const response = await fetch('/api/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(bulkRequest)
});
```

### Performance Monitoring API

#### Get Performance Metrics

```javascript
// Basic performance data
const response = await fetch('/api/performance');
const { cache, api } = await response.json();

// Full performance report
const report = await fetch('/api/performance?report=full');
const performanceData = await report.json();

// Export metrics for monitoring systems
const metrics = await fetch('/api/performance?export=true');
const exportedData = await metrics.json();
```

#### Cache Management

```javascript
// Clear cache by pattern
const response = await fetch('/api/performance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    action: "clear",
    pattern: "flavors:*"
  })
});

// Get cache metrics
const metricsResponse = await fetch('/api/performance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    action: "metrics"
  })
});
```

## Integration Examples

### React Integration

```jsx
import { useState, useEffect } from 'react';

function FlavorList() {
  const [flavors, setFlavors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlavors();
  }, []);

  const fetchFlavors = async () => {
    try {
      const response = await fetch('/api/flavors?limit=20');
      const data = await response.json();
      setFlavors(data.data);
    } catch (error) {
      console.error('Error fetching flavors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {flavors.map(flavor => (
        <div key={flavor.id}>
          <h3>{flavor.name}</h3>
          <p>{flavor.profile}</p>
        </div>
      ))}
    </div>
  );
}
```

### Node.js Integration

```javascript
const axios = require('axios');

class EnergyDrinkAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000
    });
  }

  async verifyAge(birthYear) {
    const csrfToken = await this.getCSRFToken();
    
    const response = await this.client.post('/auth/verify-age', 
      { birthYear },
      {
        headers: {
          'X-CSRF-Token': csrfToken
        },
        maxRedirects: 0,
        validateStatus: status => status < 500
      }
    );

    return response.data;
  }

  async getCSRFToken() {
    const response = await this.client.get('/csrf-token');
    return response.data.csrfToken;
  }

  async getFlavors(filters = {}) {
    const response = await this.client.get('/flavors', { params: filters });
    return response.data;
  }

  async createFlavor(flavorData) {
    const csrfToken = await this.getCSRFToken();
    
    const response = await this.client.post('/flavors', flavorData, {
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });

    return response.data;
  }
}

// Usage
const api = new EnergyDrinkAPI();

async function main() {
  try {
    // Verify age first
    await api.verifyAge(1990);
    
    // Get flavors
    const flavors = await api.getFlavors({ category: 'cola', limit: 10 });
    console.log('Found', flavors.count, 'cola flavors');
    
    // Create new flavor
    const newFlavor = await api.createFlavor({
      id: 'custom-flavor',
      name: 'Custom Cola',
      profile: 'Custom cola flavor',
      ingredients: [{ ingredientId: 'caffeine', amount: 80 }],
      compatibleBases: ['classic']
    });
    
    console.log('Created flavor:', newFlavor.data.name);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}
```

### Python Integration

```python
import requests
import json
from typing import Dict, List, Optional

class EnergyDrinkAPI:
    def __init__(self, base_url: str = "http://localhost:3000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.csrf_token = None
    
    def _get_csrf_token(self) -> str:
        """Get CSRF token for state-changing operations."""
        if not self.csrf_token:
            response = self.session.get(f"{self.base_url}/csrf-token")
            response.raise_for_status()
            self.csrf_token = response.json()["csrfToken"]
        return self.csrf_token
    
    def verify_age(self, birth_year: int) -> Dict:
        """Verify user age."""
        csrf_token = self._get_csrf_token()
        
        response = self.session.post(
            f"{self.base_url}/auth/verify-age",
            json={"birthYear": birth_year},
            headers={"X-CSRF-Token": csrf_token}
        )
        response.raise_for_status()
        return response.json()
    
    def get_flavors(self, **filters) -> Dict:
        """Get flavors with optional filters."""
        response = self.session.get(f"{self.base_url}/flavors", params=filters)
        response.raise_for_status()
        return response.json()
    
    def search(self, query: str, types: List[str] = None, limit: int = 20) -> Dict:
        """Search across data types."""
        params = {"q": query, "limit": limit}
        if types:
            params["types"] = ",".join(types)
        
        response = self.session.get(f"{self.base_url}/search", params=params)
        response.raise_for_status()
        return response.json()

# Usage example
api = EnergyDrinkAPI()

# Verify age and get flavors
api.verify_age(1990)
flavors = api.get_flavors(category="cola", limit=5)

# Search for cola-related items
results = api.search("cola", types=["flavors", "ingredients"])

print(f"Found {flavors['count']} cola flavors")
print(f"Search returned {results['totalResults']} total results")
```

### cURL Examples

```bash
# Age verification
curl -X POST http://localhost:3000/api/auth/verify-age \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{"birthYear": 1990}'

# Get flavors with filtering
curl "http://localhost:3000/api/flavors?category=cola&limit=10"

# Create new ingredient
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "id": "new-ingredient",
    "name": "New Ingredient",
    "category": "flavor",
    "unit": "g",
    "safety": {
      "maxDaily": 100,
      "warningThreshold": 80,
      "euCompliant": true,
      "banned": false
    },
    "suppliers": ["supplier-1"]
  }'

# A/B test creation
curl -X POST http://localhost:3000/api/ab-tests \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "id": "ui-test-v1",
    "name": "UI Test",
    "status": "draft",
    "variants": [
      {"id": "control", "name": "Control", "weight": 50},
      {"id": "treatment", "name": "Treatment", "weight": 50}
    ],
    "trafficAllocation": {"percentage": 100}
  }'
```

## Error Handling

### HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|--------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests that created resources |
| 207 | Multi-Status | Partial success in bulk operations |
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |

### Error Response Examples

#### Validation Error
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": [
      {
        "field": "birthYear",
        "message": "Must be between 1900 and 2010",
        "code": "INVALID_RANGE"
      }
    ]
  }
}
```

#### Rate Limiting
```json
{
  "error": "Rate limit exceeded. Try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": "1 hour",
    "retryAfter": 3600
  }
}
```

#### Not Found
```json
{
  "error": "Flavor with ID 'non-existent' not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "resourceType": "flavor",
    "requestedId": "non-existent",
    "availableIds": ["cola-kick", "berry-blast", "tropical-bliss"]
  }
}
```

### Client-Side Error Handling

```javascript
class APIError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new APIError(
        data.error,
        response.status,
        data.code,
        data.details
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    } else if (error.name === 'TypeError') {
      throw new APIError('Network error', 0, 'NETWORK_ERROR');
    } else {
      throw new APIError('Unknown error', 0, 'UNKNOWN_ERROR');
    }
  }
}

// Usage
try {
  const flavors = await apiCall('/api/flavors');
  console.log('Flavors:', flavors.data);
} catch (error) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      console.error('Invalid parameters:', error.details);
      break;
    case 'RATE_LIMIT_EXCEEDED':
      console.error('Too many requests, retry after:', error.details.retryAfter);
      break;
    case 'RESOURCE_NOT_FOUND':
      console.error('Resource not found:', error.details);
      break;
    default:
      console.error('API Error:', error.message);
  }
}
```

## Rate Limiting & Caching

### Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Core Data (GET) | 1000 requests | 1 minute |
| Core Data (POST/PUT/DELETE) | 100 requests | 1 minute |
| Analytics | 200 requests | 1 minute |
| Bulk Operations | 20 requests | 1 minute |
| Health Checks | 10000 requests | 1 minute |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
X-RateLimit-Window: 60
```

### Caching Strategy

| Endpoint Type | Cache Duration | Stale-While-Revalidate |
|---------------|----------------|------------------------|
| Core Data (GET) | 1-6 hours | 1-24 hours |
| Search Results | 1 hour | 1 day |
| Performance Data | No cache | - |
| Health Checks | 1 minute | - |
| GDPR Status | 5 minutes | - |

### Cache Headers

```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
X-Cache-Hit: true
X-Cache-TTL: 3600
```

### Cache Invalidation

```javascript
// Automatically handled by the system
// Manual cache invalidation (admin only)
const response = await fetch('/api/performance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    action: 'clear',
    pattern: 'flavors:*'
  })
});
```

## SDKs & Client Libraries

### Official JavaScript SDK

```javascript
// npm install @energydrink/api-sdk
import { EnergyDrinkAPI } from '@energydrink/api-sdk';

const api = new EnergyDrinkAPI({
  baseURL: 'https://api.energydrink.app',
  timeout: 10000,
  retries: 3
});

// Age verification
await api.auth.verifyAge(1990);

// Get flavors
const flavors = await api.flavors.list({
  category: 'cola',
  limit: 10
});

// Create A/B test
const test = await api.abTests.create({
  id: 'ui-test',
  name: 'UI Test',
  variants: [...]
});

// Search
const results = await api.search.query('cola', {
  types: ['flavors', 'ingredients']
});
```

### Community Libraries

- **Python**: `pip install energy-drink-api`
- **Ruby**: `gem install energy_drink_api`
- **Go**: `go get github.com/energydrink/api-client-go`
- **PHP**: `composer require energy-drink/api-client-php`

## Best Practices

### Request Optimization

1. **Use Bulk Endpoints**: For multiple resources, use `/api/bulk` instead of individual requests.

2. **Implement Pagination**: Always use `limit` and `offset` for large datasets.

3. **Leverage Caching**: Cache GET responses according to the specified cache headers.

4. **Use Filtering**: Apply query parameters to reduce data transfer.

### Error Handling

1. **Always Check Status Codes**: Don't rely only on response structure.

2. **Implement Retry Logic**: For transient errors (5xx, network issues).

3. **Handle Rate Limiting**: Respect `Retry-After` headers and implement exponential backoff.

4. **Log Errors Appropriately**: Include correlation IDs for debugging.

### Security

1. **Never Store CSRF Tokens**: Get fresh tokens for each request.

2. **Validate Input**: Always validate data before sending to API.

3. **Use HTTPS**: Never send requests over HTTP in production.

4. **Implement Proper Session Management**: Handle age verification cookies correctly.

### Performance

1. **Use Appropriate Timeouts**: Set reasonable timeouts for different operations.

2. **Monitor Response Times**: Track API performance in your application.

3. **Implement Circuit Breakers**: Protect against cascading failures.

4. **Use Connection Pooling**: For high-volume applications.

### Example: Production-Ready Client

```javascript
class ProductionAPIClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.energydrink.app';
    this.timeout = config.timeout || 10000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    this.session = {
      verified: false,
      csrfToken: null,
      lastCSRFRefresh: null
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Refresh CSRF token if needed
        if (this.needsCSRFRefresh() && this.shouldRefreshCSRF(options.method)) {
          await this.refreshCSRFToken();
        }

        // Add CSRF token to state-changing requests
        if (this.shouldRefreshCSRF(options.method) && this.session.csrfToken) {
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': this.session.csrfToken
          };
        }

        const response = await fetch(url, config);
        const data = await response.json();

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
          await this.delay(retryAfter * 1000);
          continue;
        }

        // Handle authentication errors
        if (response.status === 401) {
          this.session.verified = false;
          throw new APIError('Authentication required', 401, 'AUTH_REQUIRED');
        }

        if (!response.ok) {
          throw new APIError(data.error, response.status, data.code, data.details);
        }

        return data;

      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError;
  }

  shouldRefreshCSRF(method) {
    return method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  }

  needsCSRFRefresh() {
    if (!this.session.csrfToken) return true;
    if (!this.session.lastCSRFRefresh) return true;
    
    const age = Date.now() - this.session.lastCSRFRefresh;
    return age > 30 * 60 * 1000; // 30 minutes
  }

  async refreshCSRFToken() {
    const response = await this.request('/csrf-token', { method: 'GET' });
    this.session.csrfToken = response.csrfToken;
    this.session.lastCSRFRefresh = Date.now();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async verifyAge(birthYear) {
    const response = await this.request('/auth/verify-age', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthYear })
    });
    
    this.session.verified = response.success;
    return response;
  }

  async getFlavors(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/flavors?${params}`);
  }

  async search(query, options = {}) {
    const params = new URLSearchParams({ q: query, ...options });
    return this.request(`/search?${params}`);
  }
}

// Usage
const client = new ProductionAPIClient();

async function example() {
  try {
    // Verify age
    await client.verifyAge(1990);
    
    // Get flavors
    const flavors = await client.getFlavors({ category: 'cola', limit: 10 });
    
    // Search
    const results = await client.search('cola', { types: 'flavors,ingredients' });
    
    console.log('Success:', { flavors: flavors.count, searchResults: results.totalResults });
    
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.error('Rate limited, try again later');
    } else if (error.code === 'AUTH_REQUIRED') {
      console.error('Authentication required');
    } else {
      console.error('API Error:', error.message);
    }
  }
}
```

## Changelog

### Version 2.0.0 (2024-01-15)

#### Added
- Enhanced OpenAPI 3.0 specification with comprehensive documentation
- A/B testing endpoints with statistical analysis
- Affiliate tracking with attribution management
- Bulk operations for efficient data retrieval
- Performance monitoring and optimization endpoints
- Advanced search with relevance scoring
- Feature flag management with gradual rollouts
- Comprehensive feedback and analytics system

#### Enhanced
- GDPR compliance endpoints with data rights management
- Improved error handling with detailed error codes
- Rate limiting with per-endpoint customization
- Caching strategies with stale-while-revalidate
- Security headers and CSRF protection

#### Deprecated
- v1.0 endpoints (will be removed in v3.0)

### Version 1.0.0 (2023-12-01)

#### Added
- Initial API release
- Basic CRUD operations for flavors, ingredients, suppliers
- Age verification system
- GDPR compliance basic implementation

---

## Support

- **Documentation**: https://docs.energydrink.app/api
- **Support Email**: api-support@energydrink.app
- **Status Page**: https://status.energydrink.app
- **Community Forum**: https://community.energydrink.app

For technical support, please include:
- API version (v2.0)
- Request/response details (without sensitive data)
- Error codes and messages
- Steps to reproduce the issue