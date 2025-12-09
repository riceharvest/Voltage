# API Data Structures and Interfaces

This document provides comprehensive documentation of all data structures, interfaces, and types used throughout the Energy Drink App API and library modules.

## Core Recipe Types

### Ingredient
Represents an ingredient used in energy drink recipes with safety and supplier information.

```typescript
interface Ingredient {
  id: string;
  name: string;
  nameNl: string; // Dutch name
  category: 'caffeine' | 'sweetener' | 'acid' | 'preservative' | 'flavor' | 'amino acid' | 'herb';
  unit: 'g' | 'ml' | 'mg' | 'tsp';
  safety: {
    maxDaily: number;
    warningThreshold: number;
    euCompliant: boolean;
    banned: boolean;
  };
  suppliers: string[];
  supplierProducts?: Record<string, string>; // specific product URLs
  supplierUrls?: string[]; // additional supplier URLs
}
```

### Supplier
Information about ingredient suppliers.

```typescript
interface Supplier {
  id: string;
  name: string;
  url: string;
  location: string;
}
```

### BaseRecipe
Base recipe structure for different energy drink types (classic, zero, plain).

```typescript
interface BaseRecipe {
  id: string;
  name: string;
  nameNl: string;
  type: 'classic' | 'zero' | 'plain';
  yield: {
    syrup: number; // ml
    drink: number; // ml
  };
  ingredients: BaseIngredient[];
  instructions: Instruction[];
  safetyChecks: SafetyCheck[];
}
```

### FlavorRecipe
Flavor-specific recipe information.

```typescript
interface FlavorRecipe {
  id: string;
  name: string;
  nameNl: string;
  profile: string;
  profileNl: string;
  ingredients: FlavorIngredient[];
  color: ColorSpec;
  compatibleBases: string[]; // base IDs
  aging: {
    recommended: number; // hours
    optional: boolean;
  };
  dilutionRatio?: string; // for premade concentrates
  packaging?: string;
  priceRange?: string;
  netherlandsAvailability?: string;
  caffeineContent?: string; // mg per serving for premade concentrates
  affiliateLink?: string;
}
```

### CompleteRecipe
Combined base and flavor recipe with dilution information.

```typescript
interface CompleteRecipe {
  base: BaseRecipe;
  flavor: FlavorRecipe;
  dilution: DilutionRatio;
  caffeineContent: number; // mg per serving
}
```

## Supporting Types

### BaseIngredient
Basic ingredient with amount in a recipe.

```typescript
interface BaseIngredient {
  ingredientId: string;
  amount: number;
}
```

### FlavorIngredient
Flavor-specific ingredient with amount.

```typescript
interface FlavorIngredient {
  ingredientId: string;
  amount: number;
}
```

### Instruction
Recipe preparation instruction.

```typescript
interface Instruction {
  step: number;
  description: string;
  descriptionNl: string;
  warning?: string;
  warningNl?: string;
}
```

### SafetyCheck
Safety validation for recipes.

```typescript
interface SafetyCheck {
  type: 'dosage' | 'compliance' | 'age';
  message: string;
  messageNl: string;
  severity: 'warning' | 'error';
}
```

### ColorSpec
Color specification for flavor recipes.

```typescript
interface ColorSpec {
  type: 'natural' | 'artificial';
  eNumber?: string;
  description: string;
}
```

### DilutionRatio
Water-to-syrup ratio for mixing.

```typescript
interface DilutionRatio {
  syrup: number;
  water: number;
  total: number;
}
```

## Feature Flag System

### FeatureFlag
Configuration for feature flag management.

```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions?: {
    userId?: string[];
    environment?: string[];
    custom?: Record<string, any>;
  };
  metadata?: {
    description?: string;
    owner?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}
```

### FeatureFlagContext
Context for evaluating feature flag conditions.

```typescript
interface FeatureFlagContext {
  userId?: string;
  environment?: string;
  custom?: Record<string, any>;
}
```

## GDPR Compliance Types

### ConsentData
User consent preferences for data processing.

```typescript
interface ConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}
```

### UserData
Encrypted user data for age verification.

```typescript
interface UserData {
  ageVerified: boolean;
  verificationTimestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
```

## Configuration Types

### AppConfig
Application configuration interface.

```typescript
interface AppConfig {
  // Environment
  nodeEnv: string;
  appEnv: Environment;

  // Logging
  logLevel: LogLevel;
  clientLogLevel: LogLevel;

  // API
  apiUrl: string;
  apiTimeout: number;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableDebugMode: boolean;

  // External Services
  analyticsId?: string;
  sentryDsn?: string;
  databaseUrl?: string;

  // Security
  nextAuthSecret?: string;
  nextAuthUrl?: string;

  // Performance
  cacheTtl: number;
}
```

### Environment Types
```typescript
type Environment = 'development' | 'staging' | 'production';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

## API Response Types

### Age Verification API

#### POST /api/auth/verify-age
Request body:
```typescript
{
  birthYear: number
}
```

Response:
```typescript
{
  success: boolean
}
// or error response
{
  error: string
}
```

#### GET /api/auth/check-verification
Response:
```typescript
{
  verified: boolean,
  age?: number,
  verificationDate?: string
}
// or error response
{
  verified: false,
  reason?: 'data_expired' | 'age_invalid'
}
```

### CSRF Token API

#### GET /api/csrf-token
Response:
```typescript
{
  csrfToken: string
}
```

### Feature Flags API

#### GET /api/feature-flags
Query parameters:
- `name` (optional): Specific flag name
- `userId` (optional): User ID for context
- `environment` (optional): Environment for context

Response (all flags):
```typescript
{
  flags: FeatureFlag[],
  stats: {
    total: number;
    enabled: number;
    disabled: number;
  }
}
```

Response (specific flag):
```typescript
{
  flag: string,
  enabled: boolean,
  context: FeatureFlagContext
}
```

#### POST /api/feature-flags
Request body: `FeatureFlag`

Response:
```typescript
{
  success: boolean,
  flag: FeatureFlag
}
```

#### DELETE /api/feature-flags?name=flagName
Response:
```typescript
{
  success: boolean,
  message: string
}
```

### GDPR API

#### GET /api/gdpr/status
Response:
```typescript
{
  isEU: boolean,
  hasConsent: boolean,
  consentRequired: boolean
}
```

#### GET /api/gdpr/data
Response:
```typescript
{
  data: {
    ageVerified: boolean,
    verificationTimestamp: string,
    dataRetentionDays: number,
    dataPurposes: string[],
    dataRecipients: string[],
    legalBasis: string
  },
  rights: {
    access: boolean,
    rectification: boolean,
    erasure: boolean,
    restriction: boolean,
    portability: boolean,
    objection: boolean
  }
}
```

#### DELETE /api/gdpr/data
Response:
```typescript
{
  success: boolean,
  message: string
}
```

### Health Check API

#### GET /api/health
Response:
```typescript
{
  status: 'ok',
  timestamp: string,
  uptime: number,
  environment: string
}
```

## Data Service Functions

### Guide Data Service
```typescript
getSuppliersData(): Promise<Supplier[]>
getIngredientsData(): Promise<Ingredient[]>
getFlavorsData(): Promise<FlavorRecipe[]>
```

### Safety Data Service
```typescript
getLimitsData(): Promise<Record<string, any>>
getIngredientsData(): Promise<Ingredient[]>
addIngredient(current: string[], id: string): string[]
```

### Safety Validation Service
```typescript
validateIngredients(selectedIds: string[]): { valid: boolean, banned: string[] }
calculateComplianceScore(age: number, caffeineMg: number, selectedIngredients: string[]): number
```

## Utility Functions

### Color Utilities
```typescript
getColorHex(color: ColorSpec | string): string
```

### Locale Utilities
```typescript
formatCurrency(amount: number, locale: string, currency?: string): string
```

### Cache System
The cache system provides Redis-backed caching with TTL support and pattern-based invalidation.

### Logger
Structured logging with configurable levels for server and client environments.

## Error Handling

All API endpoints follow consistent error response patterns:
```typescript
{
  error: string
}
```

With appropriate HTTP status codes (400, 403, 404, 500, etc.).

## Security Considerations

- All sensitive user data is encrypted using AES-256-GCM
- CSRF tokens are required for state-changing operations
- Age verification data is automatically deleted after retention period
- IP addresses are anonymized for GDPR compliance
- Feature flags support gradual rollouts and environment-specific enabling