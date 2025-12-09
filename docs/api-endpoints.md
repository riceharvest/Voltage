# API Endpoints Documentation

This document provides detailed documentation for all API endpoints in the Energy Drink App.

## Base URL
All API endpoints are relative to the application base URL.

## Authentication & Security
- Age verification is required for most features
- CSRF tokens are required for POST/DELETE operations
- All sensitive data is encrypted
- GDPR compliance with data anonymization

## API Endpoints

### Age Verification

#### POST `/api/auth/verify-age`
Verify user's age for accessing the application.

**Request:**
```http
POST /api/auth/verify-age
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "birthYear": 1990
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "error": "You must be at least 18 years old"
}
```

**Status Codes:**
- `200` - Age verified successfully
- `400` - Invalid birth year
- `403` - Age verification failed or invalid CSRF token
- `500` - Server error

**Security:**
- Requires valid CSRF token
- Sets encrypted cookie with user data
- Data retention: 30 days

#### GET `/api/auth/check-verification`
Check if current user is age verified.

**Request:**
```http
GET /api/auth/check-verification
Cookie: age-verified=<encrypted-data>
```

**Response (Verified):**
```json
{
  "verified": true,
  "age": 34,
  "verificationDate": "2024-01-15T10:30:00.000Z"
}
```

**Response (Not Verified):**
```json
{
  "verified": false
}
```

**Response (Expired Data):**
```json
{
  "verified": false,
  "reason": "data_expired"
}
```

**Status Codes:**
- `200` - Verification status returned
- `403` - Not verified or data expired
- `500` - Server error

### CSRF Protection

#### GET `/api/csrf-token`
Generate a new CSRF token for form submissions.

**Request:**
```http
GET /api/csrf-token
```

**Response:**
```json
{
  "csrfToken": "abc123def456..."
}
```

**Status Codes:**
- `200` - Token generated successfully
- `500` - Server error

### Feature Flags

#### GET `/api/feature-flags`
Get all feature flags or check a specific flag.

**Request (All flags):**
```http
GET /api/feature-flags
```

**Request (Specific flag):**
```http
GET /api/feature-flags?name=new_calculator&userId=user123&environment=production
```

**Response (All flags):**
```json
{
  "flags": [
    {
      "name": "new_calculator",
      "enabled": true,
      "rolloutPercentage": 50,
      "conditions": {
        "environment": ["production", "staging"]
      },
      "metadata": {
        "description": "New calculator interface",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    }
  ],
  "stats": {
    "total": 5,
    "enabled": 3,
    "disabled": 2
  }
}
```

**Response (Specific flag):**
```json
{
  "flag": "new_calculator",
  "enabled": true,
  "context": {
    "userId": "user123",
    "environment": "production"
  }
}
```

**Status Codes:**
- `200` - Flags retrieved successfully
- `500` - Server error

#### POST `/api/feature-flags`
Create or update a feature flag.

**Request:**
```http
POST /api/feature-flags
Content-Type: application/json

{
  "name": "new_feature",
  "enabled": true,
  "rolloutPercentage": 25,
  "conditions": {
    "environment": ["production"]
  },
  "metadata": {
    "description": "New feature description",
    "owner": "developer@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "flag": {
    "name": "new_feature",
    "enabled": true,
    "rolloutPercentage": 25,
    "conditions": {
      "environment": ["production"]
    },
    "metadata": {
      "description": "New feature description",
      "owner": "developer@example.com",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Status Codes:**
- `200` - Flag created/updated successfully
- `400` - Invalid request data
- `500` - Server error

#### DELETE `/api/feature-flags`
Remove a feature flag.

**Request:**
```http
DELETE /api/feature-flags?name=new_feature
```

**Response:**
```json
{
  "success": true,
  "message": "Flag 'new_feature' removed"
}
```

**Status Codes:**
- `200` - Flag removed successfully
- `400` - Missing flag name
- `404` - Flag not found
- `500` - Server error

### GDPR Compliance

#### GET `/api/gdpr/status`
Check GDPR compliance status for current user.

**Request:**
```http
GET /api/gdpr/status
```

**Response:**
```json
{
  "isEU": true,
  "hasConsent": false,
  "consentRequired": true
}
```

**Status Codes:**
- `200` - Status retrieved successfully
- `500` - Server error

**Caching:**
- Cached for short duration (5 minutes) based on IP

#### GET `/api/gdpr/data`
Get user's stored data (GDPR access request).

**Request:**
```http
GET /api/gdpr/data
Cookie: age-verified=<encrypted-data>
```

**Response:**
```json
{
  "data": {
    "ageVerified": true,
    "verificationTimestamp": "2024-01-15T10:30:00.000Z",
    "dataRetentionDays": 30,
    "dataPurposes": [
      "Age verification for legal compliance",
      "Preventing access to inappropriate content"
    ],
    "dataRecipients": ["This website only"],
    "legalBasis": "Legal obligation (age verification requirement)"
  },
  "rights": {
    "access": true,
    "rectification": false,
    "erasure": true,
    "restriction": true,
    "portability": false,
    "objection": true
  }
}
```

**Status Codes:**
- `200` - Data retrieved successfully
- `404` - No user data found
- `500` - Server error

#### DELETE `/api/gdpr/data`
Delete user's data (GDPR right to erasure).

**Request:**
```http
DELETE /api/gdpr/data
```

**Response:**
```json
{
  "success": true,
  "message": "All user data has been deleted"
}
```

**Status Codes:**
- `200` - Data deleted successfully
- `500` - Server error

### Health Check

#### GET `/api/health`
Application health check endpoint.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

**Status Codes:**
- `200` - Application is healthy
- `500` - Health check failed

**Caching:**
- Cached for short duration (1 minute)

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

## Rate Limiting

- All endpoints are subject to rate limiting
- Limits vary by endpoint sensitivity
- Rate limit headers are included in responses

## CORS Policy

- CORS is configured for web application access
- Credentials are supported for cookie-based authentication

## Data Privacy

- All user data is encrypted at rest
- IP addresses are anonymized
- Data retention policies are enforced automatically
- GDPR compliance with user rights implementation

## Versioning

- API is versioned through URL paths when needed
- Current version is implicit (v1)
- Breaking changes will be versioned explicitly

## SDKs and Libraries

For easier integration, consider using the following client libraries:

- **JavaScript/TypeScript**: Direct fetch API calls
- **React**: Custom hooks provided in `src/lib/use-feature-flag.ts`
- **Node.js**: Server-side integration available

## Testing

All endpoints include comprehensive test coverage:

- Unit tests for business logic
- Integration tests for API behavior
- E2E tests for user workflows
- Security tests for authentication and authorization

## Monitoring

API endpoints are monitored for:

- Response times
- Error rates
- Usage patterns
- Security incidents

Logs are structured and include correlation IDs for debugging.