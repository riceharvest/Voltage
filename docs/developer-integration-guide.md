# Developer Integration Guide

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [API Integration Guide](#api-integration-guide)
3. [SDK and Library Integration](#sdk-and-library-integration)
4. [Business Logic Integration](#business-logic-integration)
5. [Advanced Integration Features](#advanced-integration-features)
6. [Third-Party Platform Integration](#third-party-platform-integration)
7. [Testing and Development](#testing-and-development)
8. [Production Deployment](#production-deployment)
9. [Integration Patterns and Examples](#integration-patterns-and-examples)
10. [Support and Resources](#support-and-resources)

## Integration Overview

### Welcome to the Energy Drink Calculator API

The Energy Drink Calculator API is a comprehensive platform that provides developers with powerful tools to integrate energy drink calculation, recipe management, safety validation, and analytics capabilities into their applications.

### Available Integration Options

Our API ecosystem provides multiple integration pathways:

- **RESTful APIs**: Direct HTTP integration with JSON payloads
- **SDK Libraries**: Pre-built client libraries for popular languages
- **Bulk Operations**: Efficient batch processing for large datasets
- **Real-time Webhooks**: Event-driven integrations for live updates
- **A/B Testing Framework**: Built-in experimentation capabilities
- **Analytics Integration**: Comprehensive tracking and reporting tools

### Authentication and Authorization

#### Age Verification (Required)
All API endpoints require age verification for compliance:

```javascript
// Age verification is mandatory before accessing any data
await api.auth.verifyAge(1990); // User born in 1990 (35 years old)
```

#### CSRF Protection
State-changing operations require CSRF tokens:

```javascript
// Get CSRF token for POST/PUT/DELETE requests
const { csrfToken } = await api.getCSRFToken();

// Include in request headers
headers: { 'X-CSRF-Token': csrfToken }
```

### Rate Limiting and Usage Policies

- **Standard Tier**: 1,000 requests per hour
- **Developer Tier**: 10,000 requests per hour  
- **Enterprise Tier**: 100,000 requests per hour
- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Getting Started Guide

#### Step 1: Choose Your Integration Method

```bash
# Option 1: Install SDK
npm install @energydrink/api-sdk

# Option 2: Use direct HTTP
# No installation required

# Option 3: Import OpenAPI spec for code generation
curl -o openapi.json https://api.energydrink.app/openapi-spec-enhanced.json
```

#### Step 2: Basic Configuration

```javascript
const config = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.energydrink.app' 
    : 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  rateLimit: 'standard' // or 'developer', 'enterprise'
};

const api = new EnergyDrinkAPI(config);
```

#### Step 3: Verify Access and Test

```javascript
async function testIntegration() {
  try {
    // Verify age (required)
    await api.auth.verifyAge(1990);
    
    // Test basic functionality
    const health = await api.health.getStatus();
    console.log('API Health:', health.status);
    
    // Fetch sample data
    const flavors = await api.flavors.list({ limit: 5 });
    console.log(`Found ${flavors.count} flavors`);
    
    return true;
  } catch (error) {
    console.error('Integration test failed:', error);
    return false;
  }
}
```

## API Integration Guide

### Authentication Setup

#### Age Verification Process

```javascript
class AgeVerificationManager {
  constructor(api) {
    this.api = api;
    this.verified = false;
  }

  async verifyAge(birthYear) {
    try {
      // Get CSRF token first for security
      const csrfResponse = await this.api.getCSRFToken();
      
      // Verify age with CSRF protection
      const result = await this.api.auth.verifyAge(birthYear, {
        headers: { 'X-CSRF-Token': csrfResponse.csrfToken }
      });
      
      this.verified = result.success;
      return result;
    } catch (error) {
      throw new Error(`Age verification failed: ${error.message}`);
    }
  }

  async checkVerificationStatus() {
    if (!this.verified) {
      throw new Error('Age verification required before API access');
    }
    
    return await this.api.auth.checkVerification();
  }
}
```

#### Token Management

```javascript
class TokenManager {
  constructor(api) {
    this.api = api;
    this.tokens = new Map();
  }

  async getValidToken(operation) {
    const key = `token_${operation}`;
    let token = this.tokens.get(key);
    
    if (!token || this.isTokenExpired(token)) {
      token = await this.refreshToken(operation);
      this.tokens.set(key, token);
    }
    
    return token.access_token;
  }

  isTokenExpired(token) {
    return Date.now() >= token.expires_at;
  }

  async refreshToken(operation) {
    // Implement token refresh logic based on your auth strategy
    const response = await this.api.auth.refreshToken(operation);
    return {
      ...response,
      expires_at: Date.now() + (response.expires_in * 1000)
    };
  }
}
```

### Request/Response Examples

#### JavaScript/TypeScript

```typescript
// Complete integration example
import { EnergyDrinkAPI } from '@energydrink/api-sdk';

class EnergyDrinkIntegration {
  private api: EnergyDrinkAPI;
  private tokenManager: TokenManager;

  constructor(config: APIConfig) {
    this.api = new EnergyDrinkAPI(config);
    this.tokenManager = new TokenManager(this.api);
  }

  async initialize(birthYear: number): Promise<void> {
    await this.api.auth.verifyAge(birthYear);
  }

  async getFlavorsWithSafety(filters: FlavorFilters): Promise<Flavor[]> {
    const flavors = await this.api.flavors.list(filters);
    
    // Enhance with safety validation
    const enhancedFlavors = await Promise.all(
      flavors.data.map(async (flavor) => {
        const safety = await this.api.safety.validateRecipe(flavor);
        return { ...flavor, safety };
      })
    );
    
    return enhancedFlavors;
  }

  async performCalculation(ingredients: Ingredient[]): Promise<CalculationResult> {
    const calculation = await this.api.calculator.compute({
      ingredients,
      userPreferences: {
        caffeineLimit: 400, // mg per day
        sugarLimit: 50,     // g per day
        avoidIngredients: ['artificial-colors']
      }
    });

    return {
      caffeine: calculation.caffeine,
      sugar: calculation.sugar,
      calories: calculation.calories,
      safety: calculation.safety,
      recommendations: calculation.recommendations
    };
  }
}
```

#### Python

```python
import asyncio
from energy_drink_api import EnergyDrinkAPI
from typing import List, Dict, Any

class EnergyDrinkIntegration:
    def __init__(self, config: Dict[str, Any]):
        self.api = EnergyDrinkAPI(**config)
        self.verified = False
    
    async def initialize(self, birth_year: int) -> bool:
        """Initialize the integration with age verification"""
        try:
            result = await self.api.auth.verify_age(birth_year)
            self.verified = result['success']
            return self.verified
        except Exception as e:
            raise Exception(f"Initialization failed: {e}")
    
    async def search_recipes(self, query: str, filters: Dict = None) -> Dict:
        """Search for energy drink recipes"""
        if not self.verified:
            raise Exception("Age verification required")
        
        search_params = {
            'q': query,
            'limit': 20,
            'include_safety': True,
            **filters
        }
        
        results = await self.api.search.query(**search_params)
        return {
            'recipes': results.get('data', []),
            'total': results.get('totalResults', 0),
            'facets': results.get('facets', {})
        }
    
    async def bulk_ingredient_analysis(self, ingredients: List[str]) -> Dict:
        """Analyze multiple ingredients in bulk for efficiency"""
        bulk_request = {
            'type': 'ingredients',
            'ids': ingredients,
            'include_safety': True,
            'include_suppliers': True,
            'include_nutrition': True
        }
        
        results = await self.api.bulk.get(bulk_request)
        
        # Process and validate results
        analysis = {
            'total_analyzed': len(results['data']),
            'safe_ingredients': 0,
            'warnings': [],
            'suppliers': {},
            'nutrition_summary': {}
        }
        
        for ingredient in results['data']:
            if ingredient.get('safety', {}).get('maxDaily'):
                analysis['safe_ingredients'] += 1
            if ingredient.get('safety', {}).get('warningThreshold'):
                analysis['warnings'].append({
                    'ingredient': ingredient['name'],
                    'warning': ingredient['safety']['warningThreshold']
                })
        
        return analysis
```

#### Java

```java
import com.energydrink.api.EnergyDrinkAPI;
import com.energydrink.api.models.*;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.Map;

public class EnergyDrinkIntegration {
    private final EnergyDrinkAPI api;
    private boolean verified = false;

    public EnergyDrinkIntegration(APIConfig config) {
        this.api = new EnergyDrinkAPI(config);
    }

    public CompletableFuture<Boolean> initialize(int birthYear) {
        return api.auth().verifyAge(birthYear)
            .thenApply(result -> {
                this.verified = result.isSuccess();
                return this.verified;
            })
            .exceptionally(throwable -> {
                throw new RuntimeException("Initialization failed: " + 
                    throwable.getMessage());
            });
    }

    public CompletableFuture<List<Flavor>> getFlavorsWithAnalysis(FlavorFilters filters) {
        if (!verified) {
            throw new IllegalStateException("Age verification required");
        }

        return api.flavors().list(filters)
            .thenCompose(response -> {
                List<CompletableFuture<Flavor>> enhancedFlavors = response.getData()
                    .stream()
                    .map(flavor -> enhanceFlavorWithSafety(flavor))
                    .collect(java.util.stream.Collectors.toList());

                return CompletableFuture.allOf(
                    enhancedFlavors.toArray(new CompletableFuture[0])
                ).thenApply(v -> enhancedFlavors.stream()
                    .map(CompletableFuture::join)
                    .collect(java.util.stream.Collectors.toList()));
            });
    }

    private CompletableFuture<Flavor> enhanceFlavorWithSafety(Flavor flavor) {
        return api.safety().validateRecipe(flavor.getId())
            .thenApply(safety -> {
                flavor.setSafety(safety);
                return flavor;
            });
    }

    public CompletableFuture<CalculationResult> calculateNutrition(List<Ingredient> ingredients) {
        CalculationRequest request = CalculationRequest.builder()
            .withIngredients(ingredients)
            .withUserPreferences(UserPreferences.builder()
                .withCaffeineLimit(400) // mg
                .withSugarLimit(50)     // g
                .withAvoidIngredients(List.of("artificial-colors"))
                .build())
            .build();

        return api.calculator().compute(request);
    }
}
```

### Error Handling Best Practices

#### Comprehensive Error Handling

```javascript
class APIErrorHandler {
  static handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      status: error.status,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    };

    // Log error for debugging
    console.error('API Error:', errorInfo);

    // Determine user-friendly response
    switch (error.code) {
      case 'AGE_VERIFICATION_REQUIRED':
        return {
          type: 'auth_required',
          message: 'Please verify your age to continue.',
          action: 'show_age_verification_modal'
        };

      case 'RATE_LIMIT_EXCEEDED':
        return {
          type: 'rate_limit',
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: error.details.retryAfter,
          action: 'implement_exponential_backoff'
        };

      case 'VALIDATION_ERROR':
        return {
          type: 'validation',
          message: 'Please check your input and try again.',
          errors: error.details.validationErrors,
          action: 'show_validation_errors'
        };

      case 'RESOURCE_NOT_FOUND':
        return {
          type: 'not_found',
          message: 'The requested resource was not found.',
          action: 'show_404_page'
        };

      case 'SAFETY_VIOLATION':
        return {
          type: 'safety',
          message: 'This combination exceeds safety limits.',
          safetyDetails: error.details.safetyInfo,
          action: 'show_safety_warning'
        };

      default:
        return {
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again.',
          action: 'show_generic_error'
        };
    }
  }

  static async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Don't retry on client errors (except rate limiting)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + 
                     Math.random() * baseDelay * 0.1;
        
        console.log(`Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Usage example
try {
  const result = await APIErrorHandler.retryWithBackoff(
    () => api.flavors.list({ category: 'cola' })
  );
  displayResults(result);
} catch (error) {
  const errorResponse = APIErrorHandler.handle(error, { 
    operation: 'fetch_flavors',
    filters: { category: 'cola' }
  });
  showUserError(errorResponse);
}
```

### Webhook and Event Notification Setup

```javascript
class WebhookManager {
  constructor(api, webhookSecret) {
    this.api = api;
    this.webhookSecret = webhookSecret;
    this.eventHandlers = new Map();
  }

  async registerWebhook(endpoint, events, secret = null) {
    const webhookConfig = {
      endpoint,
      events,
      secret: secret || this.webhookSecret,
      active: true
    };

    return await this.api.webhooks.register(webhookConfig);
  }

  async handleWebhook(payload, signature) {
    // Verify webhook signature
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { event, data } = payload;

    // Find registered handler
    const handler = this.eventHandlers.get(event);
    if (handler) {
      return await handler(data);
    }

    console.log(`Unhandled webhook event: ${event}`);
    return { status: 'ignored' };
  }

  verifySignature(payload, signature) {
    // Implement HMAC-SHA256 verification
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  on(event, handler) {
    this.eventHandlers.set(event, handler);
  }
}

// Register webhook handlers
const webhookManager = new WebhookManager(api, process.env.WEBHOOK_SECRET);

webhookManager.on('flavor.updated', async (data) => {
  console.log('Flavor updated:', data.flavorId);
  // Update local cache or notify users
  await updateLocalFlavorCache(data);
});

webhookManager.on('safety.alert', async (data) => {
  console.log('Safety alert:', data.alert);
  // Handle safety warnings
  await notifySafetyTeam(data.alert);
});

webhookManager.on('user.feedback.submitted', async (data) => {
  console.log('New feedback:', data.feedback);
  // Process feedback for analytics
  await processFeedbackAnalytics(data.feedback);
});
```

## SDK and Library Integration

### JavaScript/TypeScript SDK

#### Installation and Setup

```bash
npm install @energydrink/api-sdk @energydrink/types
# or
yarn add @energydrink/api-sdk @energydrink/types
```

#### Complete SDK Usage

```typescript
import { 
  EnergyDrinkAPI, 
  FlavorFilters, 
  CalculationRequest,
  SafetyValidation,
  BulkOperation 
} from '@energydrink/api-sdk';

class AdvancedEnergyDrinkSDK {
  private api: EnergyDrinkAPI;
  private cache: Map<string, { data: any; expires: number }>;

  constructor(config: SDKConfig) {
    this.api = new EnergyDrinkAPI(config);
    this.cache = new Map();
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.api.addRequestInterceptor(async (config) => {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      return config;
    });

    // Response interceptor for caching
    this.api.addResponseInterceptor((response) => {
      if (response.config.cache) {
        this.setCache(response.config.cache.key, response.data);
      }
      return response;
    });
  }

  // Flavors with advanced filtering
  async getFlavorsAdvanced(filters: AdvancedFlavorFilters): Promise<Flavor[]> {
    const cacheKey = `flavors_${JSON.stringify(filters)}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.api.flavors.list({
      ...filters,
      include: ['safety', 'nutrition', 'suppliers', 'reviews']
    });

    this.setCache(cacheKey, response.data, 5 * 60 * 1000); // 5 min cache
    return response.data;
  }

  // Safety-first recipe validation
  async validateRecipeSafety(recipe: Recipe): Promise<SafetyValidation> {
    const validation = await this.api.safety.validateRecipe(recipe);
    
    if (validation.severity === 'critical') {
      throw new SafetyError('Recipe exceeds safety limits', validation);
    }
    
    return validation;
  }

  // Bulk operations for performance
  async bulkAnalyzeFlavors(flavorIds: string[]): Promise<BulkAnalysisResult> {
    const bulkRequest: BulkOperation = {
      type: 'flavors',
      operation: 'analyze',
      ids: flavorIds,
      options: {
        includeSafety: true,
        includeNutrition: true,
        includeComparisons: true
      }
    };

    return await this.api.bulk.process(bulkRequest);
  }

  // A/B testing integration
  async createABTest(config: ABTestConfig): Promise<ABTest> {
    return await this.api.abTests.create({
      ...config,
      trafficAllocation: {
        percentage: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
  }

  // Feature flags for gradual rollouts
  async evaluateFeatureFlag(flagName: string, context: FeatureContext): Promise<boolean> {
    const flag = await this.api.featureFlags.evaluate(flagName, context);
    return flag.enabled;
  }

  // Private cache methods
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  private isAuthenticated(): boolean {
    // Check authentication status
    return true; // Simplified for example
  }
}

// Usage examples
const sdk = new AdvancedEnergyDrinkSDK({
  baseURL: 'https://api.energydrink.app',
  apiKey: process.env.API_KEY,
  cacheEnabled: true,
  retryAttempts: 3
});

// Advanced flavor search with safety
const flavors = await sdk.getFlavorsAdvanced({
  category: ['cola', 'citrus'],
  caffeineRange: [50, 200],
  maxSugar: 10,
  avoidIngredients: ['artificial-colors', 'high-fructose-corn-syrup'],
  sortBy: 'safety_rating',
  includeReviews: true
});

// Safety-first recipe creation
const recipe = await sdk.createCustomRecipe({
  name: 'My Custom Energy Drink',
  base: 'classic',
  flavors: ['cola-kick', 'tropical-bliss'],
  customizations: {
    caffeine: 80,
    sugar: 5
  }
});

const safety = await sdk.validateRecipeSafety(recipe);
console.log('Recipe safety:', safety.overallRating);
```

### Python SDK

#### Installation

```bash
pip install energy-drink-api[async] pandas numpy
```

#### Async Integration Example

```python
import asyncio
import pandas as pd
from energy_drink_api import AsyncEnergyDrinkAPI
from typing import List, Dict, Optional
import aiohttp
import json

class EnergyDrinkAnalytics:
    def __init__(self, api_key: str):
        self.api = AsyncEnergyDrinkAPI(
            api_key=api_key,
            base_url="https://api.energydrink.app",
            timeout=30
        )
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def analyze_market_trends(self, timeframe: str = "30d") -> Dict:
        """Analyze energy drink market trends"""
        
        # Get comprehensive data
        flavors_task = self.api.flavors.list(limit=100)
        ingredients_task = self.api.ingredients.list()
        feedback_task = self.api.feedback.get_stats({
            'timeframe': timeframe,
            'include_sentiment': True
        })
        
        flavors, ingredients, feedback = await asyncio.gather(
            flavors_task, ingredients_task, feedback_task
        )
        
        # Analyze trends
        trends = {
            'popular_categories': self._analyze_popular_categories(flavors['data']),
            'safety_concerns': self._analyze_safety_concerns(feedback['data']),
            'ingredient_trends': self._analyze_ingredient_trends(ingredients['data']),
            'user_satisfaction': feedback['data']['satisfaction_score']
        }
        
        return trends
    
    async def bulk_recipe_analysis(self, recipes: List[Dict]) -> pd.DataFrame:
        """Analyze multiple recipes in bulk"""
        
        # Prepare bulk request
        recipe_ids = [r['id'] for r in recipes]
        
        bulk_result = await self.api.bulk.get({
            'type': 'recipes',
            'ids': recipe_ids,
            'include': ['safety', 'nutrition', 'cost_analysis', 'market_data']
        })
        
        # Convert to DataFrame for analysis
        analysis_data = []
        for recipe_data in bulk_result['data']:
            analysis_data.append({
                'id': recipe_data['id'],
                'name': recipe_data['name'],
                'caffeine': recipe_data['nutrition']['caffeine'],
                'sugar': recipe_data['nutrition']['sugar'],
                'safety_score': recipe_data['safety']['overall_score'],
                'cost_per_serving': recipe_data['cost_analysis']['per_serving'],
                'market_potential': recipe_data['market_data']['potential_score']
            })
        
        df = pd.DataFrame(analysis_data)
        
        # Add calculated metrics
        df['caffeine_per_dollar'] = df['caffeine'] / df['cost_per_serving']
        df['safety_efficiency'] = df['safety_score'] / df['cost_per_serving']
        
        return df.sort_values('market_potential', ascending=False)
    
    async def create_custom_ingredient_analysis(self, ingredient_list: List[str]) -> Dict:
        """Analyze custom ingredient combinations"""
        
        # Get detailed ingredient data
        ingredients_data = await self.api.bulk.get({
            'type': 'ingredients',
            'ids': ingredient_list,
            'include': ['safety', 'suppliers', 'cost', 'availability']
        })
        
        # Analyze combinations
        analysis = {
            'individual_analysis': {},
            'combination_safety': {},
            'cost_optimization': {},
            'supplier_recommendations': {}
        }
        
        for ingredient in ingredients_data['data']:
            ingredient_id = ingredient['id']
            
            # Individual analysis
            analysis['individual_analysis'][ingredient_id] = {
                'safety_rating': ingredient['safety']['overall_rating'],
                'cost_per_gram': ingredient['cost']['per_gram'],
                'supplier_count': len(ingredient['suppliers']),
                'availability_score': ingredient['availability']['score']
            }
        
        # Combination analysis
        combinations = self._generate_ingredient_combinations(ingredient_list)
        for combo in combinations:
            safety = await self.api.safety.validate_combination(combo)
            analysis['combination_safety']['_'.join(combo)] = safety
        
        return analysis
    
    def _analyze_popular_categories(self, flavors: List[Dict]) -> Dict:
        """Analyze which flavor categories are most popular"""
        category_counts = {}
        category_ratings = {}
        
        for flavor in flavors:
            category = flavor['category']
            rating = flavor.get('user_rating', 0)
            
            if category not in category_counts:
                category_counts[category] = 0
                category_ratings[category] = []
            
            category_counts[category] += 1
            category_ratings[category].append(rating)
        
        return {
            category: {
                'count': count,
                'avg_rating': sum(ratings) / len(ratings),
                'popularity_score': count * (sum(ratings) / len(ratings))
            }
            for category, count in category_counts.items()
            for ratings in [category_ratings[category]]
        }
    
    def _analyze_safety_concerns(self, feedback_data: Dict) -> Dict:
        """Analyze safety concerns from user feedback"""
        safety_issues = {}
        
        for feedback in feedback_data.get('feedback', []):
            if feedback.get('category') == 'safety':
                issue = feedback.get('issue_type')
                if issue not in safety_issues:
                    safety_issues[issue] = 0
                safety_issues[issue] += 1
        
        return safety_issues
    
    def _analyze_ingredient_trends(self, ingredients: List[Dict]) -> Dict:
        """Analyze ingredient usage trends"""
        category_usage = {}
        
        for ingredient in ingredients:
            category = ingredient['category']
            usage_count = ingredient.get('usage_frequency', 0)
            
            if category not in category_usage:
                category_usage[category] = 0
            category_usage[category] += usage_count
        
        return category_usage
    
    def _generate_ingredient_combinations(self, ingredients: List[str]) -> List[List[str]]:
        """Generate all possible combinations of ingredients"""
        combinations = []
        
        for i in range(2, min(len(ingredients) + 1, 6)):  # Max 5 ingredient combinations
            from itertools import combinations as iter_combinations
            combinations.extend(list(iter_combinations(ingredients, i)))
        
        return combinations

# Usage example
async def main():
    async with EnergyDrinkAnalytics(api_key="your-api-key") as analytics:
        # Analyze market trends
        trends = await analytics.analyze_market_trends("30d")
        print("Market Trends:", trends)
        
        # Bulk recipe analysis
        recipes = [
            {"id": "recipe1", "name": "Classic Cola"},
            {"id": "recipe2", "name": "Tropical Mix"}
        ]
        df = await analytics.bulk_recipe_analysis(recipes)
        print(df.head())
        
        # Custom ingredient analysis
        ingredients = ["caffeine", "taurine", "b-vitamins"]
        analysis = await analytics.create_custom_ingredient_analysis(ingredients)
        print("Ingredient Analysis:", analysis)

if __name__ == "__main__":
    asyncio.run(main())
```

### Mobile App Integration

#### React Native

```typescript
// EnergyDrinkReactNative.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { EnergyDrinkAPI } from '@energydrink/api-sdk-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EnergyDrinkContextType {
  api: EnergyDrinkAPI;
  isAuthenticated: boolean;
  userAge: number | null;
  verifyAge: (birthYear: number) => Promise<boolean>;
  flavors: Flavor[];
  searchFlavors: (query: string) => Promise<Flavor[]>;
  calculateNutrition: (ingredients: Ingredient[]) => Promise<CalculationResult>;
}

const EnergyDrinkContext = createContext<EnergyDrinkContextType | null>(null);

export const EnergyDrinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, setApi] = useState<EnergyDrinkAPI | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [flavors, setFlavors] = useState<Flavor[]>([]);

  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    try {
      // Initialize with offline support
      const apiInstance = new EnergyDrinkAPI({
        baseURL: 'https://api.energydrink.app',
        offlineStorage: AsyncStorage,
        cacheEnabled: true,
        retryAttempts: 3
      });

      // Check for existing age verification
      const savedAge = await AsyncStorage.getItem('userAge');
      if (savedAge) {
        const age = parseInt(savedAge);
        try {
          await apiInstance.auth.verifyAge(2024 - age);
          setIsAuthenticated(true);
          setUserAge(age);
        } catch (error) {
          // Age verification expired or invalid
          await AsyncStorage.removeItem('userAge');
        }
      }

      setApi(apiInstance);
    } catch (error) {
      console.error('Failed to initialize API:', error);
    }
  };

  const verifyAge = async (birthYear: number): Promise<boolean> => {
    if (!api) return false;

    try {
      const result = await api.auth.verifyAge(birthYear);
      if (result.success) {
        const age = 2024 - birthYear;
        setIsAuthenticated(true);
        setUserAge(age);
        await AsyncStorage.setItem('userAge', age.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Age verification failed:', error);
      return false;
    }
  };

  const searchFlavors = async (query: string): Promise<Flavor[]> => {
    if (!api || !isAuthenticated) return [];

    try {
      const results = await api.search.query(query, {
        limit: 20,
        includeSafety: true
      });
      return results.data || [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  const calculateNutrition = async (ingredients: Ingredient[]): Promise<CalculationResult> => {
    if (!api || !isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await api.calculator.compute({
        ingredients,
        userPreferences: {
          caffeineLimit: 400,
          sugarLimit: userAge && userAge < 18 ? 25 : 50
        }
      });
    } catch (error) {
      console.error('Calculation failed:', error);
      throw error;
    }
  };

  return (
    <EnergyDrinkContext.Provider
      value={{
        api: api!,
        isAuthenticated,
        userAge,
        verifyAge,
        flavors,
        searchFlavors,
        calculateNutrition
      }}
    >
      {children}
    </EnergyDrinkContext.Provider>
  );
};

export const useEnergyDrink = () => {
  const context = useContext(EnergyDrinkContext);
  if (!context) {
    throw new Error('useEnergyDrink must be used within EnergyDrinkProvider');
  }
  return context;
};

// Age Verification Component
export const AgeVerificationScreen: React.FC = () => {
  const { verifyAge } = useEnergyDrink();
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    if (!birthYear) return;

    setLoading(true);
    const success = await verifyAge(parseInt(birthYear));
    setLoading(false);

    if (!success) {
      Alert.alert('Error', 'Age verification failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Age Verification Required</Text>
      <Text style={styles.subtitle}>
        Please enter your birth year to access energy drink information.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Birth Year (e.g., 1990)"
        value={birthYear}
        onChangeText={setBirthYear}
        keyboardType="numeric"
        maxLength={4}
      />
      
      <Button
        title={loading ? "Verifying..." : "Verify Age"}
        onPress={handleVerification}
        disabled={loading || !birthYear}
      />
    </View>
  );
};

// Main App Component
const EnergyDrinkApp: React.FC = () => {
  const { isAuthenticated, flavors, searchFlavors, calculateNutrition } = useEnergyDrink();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Flavor[]>([]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchFlavors(searchQuery);
      setSearchResults(results);
    }
  };

  if (!isAuthenticated) {
    return <AgeVerificationScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Energy Drink Calculator</Text>
      
      {/* Search Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search flavors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FlavorCard flavor={item} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? 'No flavors found' : 'Search for flavors to get started'}
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginRight: 8
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32
  }
});
```

#### iOS (Swift)

```swift
// EnergyDrinkiOS.swift
import Foundation
import Combine

class EnergyDrinkManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var userAge: Int?
    @Published var flavors: [Flavor] = []
    @Published var isLoading = false
    
    private let apiClient = APIClient(baseURL: "https://api.energydrink.app")
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        checkAuthenticationStatus()
    }
    
    func verifyAge(birthYear: Int) -> AnyPublisher<Bool, Error> {
        return apiClient.post("/auth/verify-age", body: ["birthYear": birthYear])
            .map { response -> Bool in
                if response["success"] as? Bool == true {
                    DispatchQueue.main.async {
                        self.isAuthenticated = true
                        self.userAge = 2024 - birthYear
                        self.saveUserAge(birthYear)
                    }
                    return true
                }
                return false
            }
            .catch { error -> AnyPublisher<Bool, Error> in
                print("Age verification failed: \(error)")
                return Just(false).setFailureType(to: Error.self).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    func searchFlavors(query: String) -> AnyPublisher<[Flavor], Error> {
        guard isAuthenticated else {
            return Fail(error: APIError.authenticationRequired).eraseToAnyPublisher()
        }
        
        isLoading = true
        
        return apiClient.get("/search", parameters: ["q": query, "limit": 20])
            .map { response -> [Flavor] in
                let data = response["data"] as? [[String: Any]] ?? []
                return data.compactMap { Flavor(from: $0) }
            }
            .handleEvents(receiveCompletion: { _ in
                DispatchQueue.main.async {
                    self.isLoading = false
                }
            })
            .eraseToAnyPublisher()
    }
    
    func calculateNutrition(ingredients: [Ingredient]) -> AnyPublisher<CalculationResult, Error> {
        guard isAuthenticated else {
            return Fail(error: APIError.authenticationRequired).eraseToAnyPublisher()
        }
        
        let request = CalculationRequest(
            ingredients: ingredients,
            userPreferences: UserPreferences(
                caffeineLimit: 400,
                sugarLimit: userAge ?? 25 < 18 ? 25 : 50
            )
        )
        
        return apiClient.post("/calculator/compute", body: request.toDictionary())
            .map { CalculationResult(from: $0) }
            .eraseToAnyPublisher()
    }
    
    private func checkAuthenticationStatus() {
        if let savedAge = UserDefaults.standard.value(forKey: "userBirthYear") as? Int {
            verifyAge(birthYear: savedAge)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure = completion {
                            UserDefaults.standard.removeObject(forKey: "userBirthYear")
                        }
                    },
                    receiveValue: { success in
                        if !success {
                            UserDefaults.standard.removeObject(forKey: "userBirthYear")
                        }
                    }
                )
                .store(in: &cancellables)
        }
    }
    
    private func saveUserAge(_ birthYear: Int) {
        UserDefaults.standard.set(birthYear, forKey: "userBirthYear")
    }
}

// MARK: - Models
struct Flavor: Identifiable, Codable {
    let id: String
    let name: String
    let category: String
    let caffeine: Double
    let sugar: Double
    let safety: SafetyInfo?
    
    init?(from dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String,
              let name = dictionary["name"] as? String,
              let category = dictionary["category"] as? String,
              let caffeine = dictionary["caffeine"] as? Double,
              let sugar = dictionary["sugar"] as? Double else {
            return nil
        }
        
        self.id = id
        self.name = name
        self.category = category
        self.caffeine = caffeine
        self.sugar = sugar
        self.safety = dictionary["safety"].flatMap { SafetyInfo(from: $0 as? [String: Any]) }
    }
}

struct SafetyInfo {
    let overallScore: Double
    let warnings: [String]
    let maxDaily: Double?
    
    init?(from dictionary: [String: Any]?) {
        guard let dict = dictionary else { return nil }
        
        self.overallScore = dict["overallScore"] as? Double ?? 0.0
        self.warnings = dict["warnings"] as? [String] ?? []
        self.maxDaily = dict["maxDaily"] as? Double
    }
}

struct CalculationRequest: Codable {
    let ingredients: [Ingredient]
    let userPreferences: UserPreferences
    
    func toDictionary() -> [String: Any] {
        return [
            "ingredients": ingredients.map { $0.toDictionary() },
            "userPreferences": userPreferences.toDictionary()
        ]
    }
}

struct UserPreferences: Codable {
    let caffeineLimit: Double
    let sugarLimit: Double
    let avoidIngredients: [String]?
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "caffeineLimit": caffeineLimit,
            "sugarLimit": sugarLimit
        ]
        if let avoidIngredients = avoidIngredients {
            dict["avoidIngredients"] = avoidIngredients
        }
        return dict
    }
}

// MARK: - API Client
class APIClient {
    private let baseURL: String
    private let session = URLSession.shared
    
    init(baseURL: String) {
        self.baseURL = baseURL
    }
    
    func get(_ endpoint: String, parameters: [String: Any] = [:]) -> AnyPublisher<[String: Any], Error> {
        var url = URL(string: baseURL + endpoint)!
        
        if !parameters.isEmpty {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            components.queryItems = parameters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
            url = components.url!
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: [String: Any].self, decoder: JSONDecoder())
            .mapError { $0 as Error }
            .eraseToAnyPublisher()
    }
    
    func post(_ endpoint: String, body: [String: Any]) -> AnyPublisher<[String: Any], Error> {
        let url = URL(string: baseURL + endpoint)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: [String: Any].self, decoder: JSONDecoder())
            .mapError { $0 as Error }
            .eraseToAnyPublisher()
    }
}

// MARK: - Error Types
enum APIError: Error {
    case authenticationRequired
    case networkError
    case serverError(statusCode: Int)
    case invalidResponse
}
```

#### Android (Kotlin)

```kotlin
// EnergyDrinkManager.kt
class EnergyDrinkManager private constructor(
    private val context: Context
) : Observable() {
    
    private val apiClient = APIClient("https://api.energydrink.app")
    private val preferences = context.getSharedPreferences("energy_drink_prefs", Context.MODE_PRIVATE)
    
    val isAuthenticated: Boolean get() = preferences.getBoolean("authenticated", false)
    val userAge: Int? get() = preferences.getInt("user_age", -1).takeIf { it > 0 }
    
    private val _flavors = MutableLiveData<List<Flavor>>()
    val flavors: LiveData<List<Flavor>> = _flavors
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    init {
        checkAuthenticationStatus()
    }
    
    companion object {
        @Volatile
        private var INSTANCE: EnergyDrinkManager? = null
        
        fun getInstance(context: Context): EnergyDrinkManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: EnergyDrinkManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    suspend fun verifyAge(birthYear: Int): Result<Boolean> {
        return try {
            val response = apiClient.post("/auth/verify-age", mapOf("birthYear" to birthYear))
            val success = response["success"] as? Boolean ?: false
            
            if (success) {
                val age = Calendar.getInstance().get(Calendar.YEAR) - birthYear
                preferences.edit()
                    .putBoolean("authenticated", true)
                    .putInt("user_age", age)
                    .putInt("birth_year", birthYear)
                    .apply()
                
                setChanged()
                notifyObservers()
            }
            
            Result.success(success)
        } catch (e: Exception) {
            Log.e("EnergyDrinkManager", "Age verification failed", e)
            Result.failure(e)
        }
    }
    
    suspend fun searchFlavors(query: String): Result<List<Flavor>> {
        if (!isAuthenticated) {
            return Result.failure(IllegalStateException("Authentication required"))
        }
        
        return try {
            _isLoading.value = true
            
            val response = apiClient.get("/search", mapOf(
                "q" to query,
                "limit" to 20,
                "include_safety" to true
            ))
            
            val data = response["data"] as? List<Map<String, Any>> ?: emptyList()
            val flavors = data.mapNotNull { Flavor.fromMap(it) }
            
            _flavors.value = flavors
            Result.success(flavors)
        } catch (e: Exception) {
            Log.e("EnergyDrinkManager", "Search failed", e)
            Result.failure(e)
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun calculateNutrition(ingredients: List<Ingredient>): Result<CalculationResult> {
        if (!isAuthenticated) {
            return Result.failure(IllegalStateException("Authentication required"))
        }
        
        return try {
            val userAge = this.userAge ?: 25 // Default to adult if unknown
            val sugarLimit = if (userAge < 18) 25.0 else 50.0
            
            val request = mapOf(
                "ingredients" to ingredients.map { it.toMap() },
                "userPreferences" to mapOf(
                    "caffeineLimit" to 400.0,
                    "sugarLimit" to sugarLimit
                )
            )
            
            val response = apiClient.post("/calculator/compute", request)
            val result = CalculationResult.fromMap(response)
            
            Result.success(result)
        } catch (e: Exception) {
            Log.e("EnergyDrinkManager", "Calculation failed", e)
            Result.failure(e)
        }
    }
    
    suspend fun getFlavorsByCategory(category: String): Result<List<Flavor>> {
        return searchFlavors("") // Filter client-side for now
            .map { flavors -> flavors.filter { it.category == category } }
    }
    
    private fun checkAuthenticationStatus() {
        // Verify stored authentication if present
        val birthYear = preferences.getInt("birth_year", -1)
        if (birthYear > 0) {
            // Optionally re-verify age on app start
            lifecycleScope.launch {
                verifyAge(birthYear)
            }
        }
    }
}

// MARK: - Data Models
data class Flavor(
    val id: String,
    val name: String,
    val category: String,
    val caffeine: Double,
    val sugar: Double,
    val safety: SafetyInfo?
) {
    companion object {
        fun fromMap(map: Map<String, Any>): Flavor? {
            return try {
                Flavor(
                    id = map["id"] as? String ?: return null,
                    name = map["name"] as? String ?: return null,
                    category = map["category"] as? String ?: return null,
                    caffeine = (map["caffeine"] as? Number)?.toDouble() ?: 0.0,
                    sugar = (map["sugar"] as? Number)?.toDouble() ?: 0.0,
                    safety = (map["safety"] as? Map<String, Any>)?.let { SafetyInfo.fromMap(it) }
                )
            } catch (e: Exception) {
                Log.e("Flavor", "Failed to parse flavor from map", e)
                null
            }
        }
    }
}

data class SafetyInfo(
    val overallScore: Double,
    val warnings: List<String>,
    val maxDaily: Double?
) {
    companion object {
        fun fromMap(map: Map<String, Any>): SafetyInfo? {
            return try {
                SafetyInfo(
                    overallScore = (map["overallScore"] as? Number)?.toDouble() ?: 0.0,
                    warnings = map["warnings"] as? List<String> ?: emptyList(),
                    maxDaily = (map["maxDaily"] as? Number)?.toDouble()
                )
            } catch (e: Exception) {
                Log.e("SafetyInfo", "Failed to parse safety info", e)
                null
            }
        }
    }
}

data class Ingredient(
    val id: String,
    val name: String,
    val amount: Double,
    val unit: String
) {
    fun toMap(): Map<String, Any> = mapOf(
        "id" to id,
        "name" to name,
        "amount" to amount,
        "unit" to unit
    )
}

data class CalculationResult(
    val caffeine: Double,
    val sugar: Double,
    val calories: Double,
    val safety: SafetyInfo,
    val recommendations: List<String>
) {
    companion object {
        fun fromMap(map: Map<String, Any>): CalculationResult? {
            return try {
                CalculationResult(
                    caffeine = (map["caffeine"] as? Number)?.toDouble() ?: 0.0,
                    sugar = (map["sugar"] as? Number)?.toDouble() ?: 0.0,
                    calories = (map["calories"] as? Number)?.toDouble() ?: 0.0,
                    safety = (map["safety"] as? Map<String, Any>)?.let { SafetyInfo.fromMap(it) } 
                        ?: SafetyInfo(0.0, emptyList(), null),
                    recommendations = map["recommendations"] as? List<String> ?: emptyList()
                )
            } catch (e: Exception) {
                Log.e("CalculationResult", "Failed to parse calculation result", e)
                null
            }
        }
    }
}

// MARK: - API Client
class APIClient(private val baseURL: String) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val originalRequest = chain.request()
            val requestWithHeaders = originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .method(originalRequest.method, originalRequest.body)
                .build()
            chain.proceed(requestWithHeaders)
        }
        .build()
    
    suspend fun get(endpoint: String, parameters: Map<String, Any> = emptyMap()): Map<String, Any> {
        val url = buildURL(endpoint, parameters)
        val request = Request.Builder()
            .url(url)
            .get()
            .build()
            
        return makeRequest(request)
    }
    
    suspend fun post(endpoint: String, body: Map<String, Any>): Map<String, Any> {
        val url = URL(baseURL + endpoint)
        val json = JSONObject(body).toString()
        val requestBody = json.toRequestBody("application/json".toMediaType())
        
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()
            
        return makeRequest(request)
    }
    
    private suspend fun makeRequest(request: Request): Map<String, Any> {
        return withContext(Dispatchers.IO) {
            try {
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw IOException("HTTP ${response.code}: ${response.message}")
                    }
                    
                    response.body?.string()?.let { responseBody ->
                        JSONObject(responseBody).toMap()
                    } ?: throw IOException("Empty response body")
                }
            } catch (e: Exception) {
                Log.e("APIClient", "Request failed", e)
                throw e
            }
        }
    }
    
    private fun buildURL(endpoint: String, parameters: Map<String, Any>): URL {
        val url = URL(baseURL + endpoint)
        if (parameters.isEmpty()) return url
        
        val uri = URI(
            url.protocol,
            url.host,
            url.path,
            parameters.entries.joinToString("&") { "${it.key}=${it.value}" },
            null
        )
        return uri.toURL()
    }
}

// MARK: - Age Verification Activity
class AgeVerificationActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAgeVerificationBinding
    private lateinit var energyDrinkManager: EnergyDrinkManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAgeVerificationBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        energyDrinkManager = EnergyDrinkManager.getInstance(this)
        
        binding.verifyButton.setOnClickListener {
            val birthYear = binding.birthYearEditText.text.toString().toIntOrNull()
            
            if (birthYear == null) {
                showError("Please enter a valid birth year")
                return@setOnClickListener
            }
            
            if (birthYear > Calendar.getInstance().get(Calendar.YEAR) - 18) {
                showError("You must be at least 18 years old")
                return@setOnClickListener
            }
            
            verifyAge(birthYear)
        }
    }
    
    private fun verifyAge(birthYear: Int) {
        lifecycleScope.launch {
            binding.verifyButton.isEnabled = false
            binding.progressBar.visibility = View.VISIBLE
            
            energyDrinkManager.verifyAge(birthYear).let { result ->
                binding.progressBar.visibility = View.GONE
                binding.verifyButton.isEnabled = true
                
                if (result.isSuccess && result.getOrDefault(false)) {
                    // Success - navigate to main app
                    startActivity(Intent(this@AgeVerificationActivity, MainActivity::class.java))
                    finish()
                } else {
                    showError("Age verification failed. Please try again.")
                }
            }
        }
    }
    
    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }
}
```

## Business Logic Integration

### Calculator Functionality Integration

#### Core Calculator Integration

```javascript
class EnergyDrinkCalculator {
  constructor(api) {
    this.api = api;
    this.userProfile = null;
    this.calculationHistory = [];
  }

  async setUserProfile(profile) {
    this.userProfile = {
      age: profile.age,
      weight: profile.weight, // kg
      caffeineSensitivity: profile.caffeineSensitivity || 'normal', // low, normal, high
      healthConditions: profile.healthConditions || [],
      medications: profile.medications || [],
      activityLevel: profile.activityLevel || 'moderate'
    };

    // Get personalized safety limits
    this.safetyLimits = await this.api.safety.getPersonalizedLimits(this.userProfile);
  }

  async calculateRecipe(recipe) {
    // Validate recipe structure
    this.validateRecipe(recipe);

    // Get detailed ingredient information
    const ingredientDetails = await this.getIngredientDetails(recipe.ingredients);

    // Calculate nutritional values
    const nutrition = this.calculateNutrition(recipe, ingredientDetails);

    // Perform safety validation
    const safety = await this.validateSafety(recipe, nutrition);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(recipe, nutrition, safety);

    const result = {
      recipe: recipe,
      nutrition: nutrition,
      safety: safety,
      recommendations: recommendations,
      score: this.calculateOverallScore(nutrition, safety),
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.calculationHistory.push(result);

    return result;
  }

  validateRecipe(recipe) {
    const errors = [];

    if (!recipe.name || recipe.name.trim().length === 0) {
      errors.push('Recipe name is required');
    }

    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    }

    // Validate ingredients
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.id) {
        errors.push(`Ingredient ${index + 1}: ID is required`);
      }
      if (!ingredient.amount || ingredient.amount <= 0) {
        errors.push(`Ingredient ${index + 1}: Valid amount is required`);
      }
      if (!ingredient.unit) {
        errors.push(`Ingredient ${index + 1}: Unit is required`);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError('Recipe validation failed', errors);
    }
  }

  async getIngredientDetails(ingredients) {
    const ingredientIds = ingredients.map(i => i.id);
    
    const bulkResult = await this.api.bulk.get({
      type: 'ingredients',
      ids: ingredientIds,
      include: ['nutrition', 'safety', 'interactions', 'suppliers']
    });

    return bulkResult.data.reduce((acc, ingredient) => {
      acc[ingredient.id] = ingredient;
      return acc;
    }, {});
  }

  calculateNutrition(recipe, ingredientDetails) {
    let totalCaffeine = 0;
    let totalSugar = 0;
    let totalCalories = 0;
    let totalVolume = 0;
    const nutrientBreakdown = {};

    recipe.ingredients.forEach(recipeIngredient => {
      const ingredient = ingredientDetails[recipeIngredient.id];
      if (!ingredient) return;

      const amount = recipeIngredient.amount;
      const multiplier = this.convertToGrams(amount, recipeIngredient.unit, ingredient);

      totalCaffeine += (ingredient.nutrition?.caffeine || 0) * multiplier;
      totalSugar += (ingredient.nutrition?.sugar || 0) * multiplier;
      totalCalories += (ingredient.nutrition?.calories || 0) * multiplier;
      totalVolume += (ingredient.volume || 0) * multiplier;

      // Track individual nutrients
      Object.entries(ingredient.nutrition || {}).forEach(([nutrient, value]) => {
        if (!nutrientBreakdown[nutrient]) {
          nutrientBreakdown[nutrient] = 0;
        }
        nutrientBreakdown[nutrient] += value * multiplier;
      });
    });

    return {
      caffeine: Math.round(totalCaffeine * 100) / 100,
      sugar: Math.round(totalSugar * 100) / 100,
      calories: Math.round(totalCalories * 100) / 100,
      volume: Math.round(totalVolume * 100) / 100,
      nutrients: nutrientBreakdown,
      perServing: {
        caffeine: totalCaffeine / (recipe.servings || 1),
        sugar: totalSugar / (recipe.servings || 1),
        calories: totalCalories / (recipe.servings || 1)
      }
    };
  }

  async validateSafety(recipe, nutrition) {
    const safetyChecks = [];

    // Check caffeine limits
    const caffeineLimit = this.safetyLimits?.caffeine?.maxDaily || 400;
    if (nutrition.caffeine > caffeineLimit) {
      safetyChecks.push({
        type: 'caffeine_limit',
        severity: 'high',
        message: `Caffeine content (${nutrition.caffeine}mg) exceeds daily limit (${caffeineLimit}mg)`,
        limit: caffeineLimit,
        current: nutrition.caffeine
      });
    }

    // Check sugar limits
    const sugarLimit = this.safetyLimits?.sugar?.maxDaily || 50;
    if (nutrition.sugar > sugarLimit) {
      safetyChecks.push({
        type: 'sugar_limit',
        severity: 'medium',
        message: `Sugar content (${nutrition.sugar}g) exceeds recommended limit (${sugarLimit}g)`,
        limit: sugarLimit,
        current: nutrition.sugar
      });
    }

    // Check ingredient interactions
    const interactions = await this.checkIngredientInteractions(recipe.ingredients);
    if (interactions.length > 0) {
      safetyChecks.push({
        type: 'ingredient_interactions',
        severity: interactions.some(i => i.severity === 'high') ? 'high' : 'medium',
        message: 'Potential ingredient interactions detected',
        interactions: interactions
      });
    }

    // Check age-appropriate limits
    if (this.userProfile && this.userProfile.age < 18) {
      const youthLimits = await this.api.safety.getYouthLimits();
      if (nutrition.caffeine > youthLimits.maxCaffeine) {
        safetyChecks.push({
          type: 'age_restriction',
          severity: 'high',
          message: `Caffeine content not appropriate for minors`,
          limit: youthLimits.maxCaffeine,
          current: nutrition.caffeine
        });
      }
    }

    // Overall safety score
    const severityWeights = { low: 1, medium: 3, high: 5 };
    const maxScore = 100;
    const deductions = safetyChecks.reduce((sum, check) => 
      sum + severityWeights[check.severity] * 10, 0);
    const safetyScore = Math.max(0, maxScore - deductions);

    return {
      overallScore: safetyScore,
      checks: safetyChecks,
      safe: safetyScore >= 70,
      warnings: safetyChecks.filter(c => c.severity !== 'low'),
      recommendations: this.generateSafetyRecommendations(safetyChecks)
    };
  }

  async checkIngredientInteractions(ingredients) {
    // Get interaction data for all ingredients
    const interactionData = await this.api.safety.getInteractions(
      ingredients.map(i => i.id)
    );

    const interactions = [];

    // Check pairwise interactions
    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        const interaction = interactionData.find(int => 
          (int.ingredient1 === ingredients[i].id && int.ingredient2 === ingredients[j].id) ||
          (int.ingredient1 === ingredients[j].id && int.ingredient2 === ingredients[i].id)
        );

        if (interaction) {
          interactions.push({
            ingredients: [ingredients[i].id, ingredients[j].id],
            type: interaction.type,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation
          });
        }
      }
    }

    return interactions;
  }

  async generateRecommendations(recipe, nutrition, safety) {
    const recommendations = [];

    // Safety-based recommendations
    if (safety.overallScore < 70) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        message: 'Consider reducing caffeine or sugar content for better safety profile'
      });
    }

    // Nutritional optimization
    if (nutrition.caffeine < 50) {
      recommendations.push({
        type: 'energy',
        priority: 'medium',
        message: 'Consider adding more caffeine for better energy boost'
      });
    }

    if (nutrition.sugar > 30) {
      recommendations.push({
        type: 'sugar',
        priority: 'medium',
        message: 'Consider using sugar-free alternatives to reduce sugar content'
      });
    }

    // Cost optimization
    const costAnalysis = await this.api.calculator.analyzeCost(recipe);
    if (costAnalysis.optimizationSuggestions.length > 0) {
      recommendations.push({
        type: 'cost',
        priority: 'low',
        message: 'Cost optimization opportunities available',
        suggestions: costAnalysis.optimizationSuggestions
      });
    }

    // Taste profile recommendations
    const tasteProfile = await this.api.calculator.analyzeTasteProfile(recipe);
    if (tasteProfile.balance < 0.7) {
      recommendations.push({
        type: 'taste',
        priority: 'medium',
        message: 'Taste profile could be improved for better balance',
        suggestions: tasteProfile.improvementSuggestions
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  calculateOverallScore(nutrition, safety) {
    // Weighted scoring system
    const safetyWeight = 0.4;
    const nutritionWeight = 0.3;
    const tasteWeight = 0.2;
    const costWeight = 0.1;

    const nutritionScore = this.calculateNutritionScore(nutrition);
    const tasteScore = nutrition.tasteScore || 0.7; // Placeholder
    const costScore = nutrition.costScore || 0.8; // Placeholder

    return Math.round(
      safety.overallScore * safetyWeight +
      nutritionScore * nutritionWeight +
      tasteScore * tasteWeight +
      costScore * costWeight
    );
  }

  calculateNutritionScore(nutrition) {
    let score = 100;

    // Penalize excessive caffeine
    if (nutrition.caffeine > 300) score -= 20;
    else if (nutrition.caffeine > 200) score -= 10;

    // Penalize high sugar
    if (nutrition.sugar > 40) score -= 15;
    else if (nutrition.sugar > 25) score -= 8;

    // Bonus for balanced nutrition
    if (nutrition.caffeine >= 80 && nutrition.caffeine <= 160) score += 5;
    if (nutrition.sugar <= 15) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  convertToGrams(amount, unit, ingredient) {
    // Convert various units to grams for consistent calculation
    const conversions = {
      'g': 1,
      'mg': 0.001,
      'kg': 1000,
      'ml': ingredient.density || 1, // Assume 1g/ml if density not available
      'l': (ingredient.density || 1) * 1000,
      'tsp': 5,
      'tbsp': 15,
      'cup': 240
    };

    return amount * (conversions[unit] || 1);
  }

  // Recipe optimization
  async optimizeRecipe(targetRecipe, optimizationGoals) {
    const current = await this.calculateRecipe(targetRecipe);
    
    const optimizationRequest = {
      recipe: targetRecipe,
      goals: optimizationGoals,
      constraints: {
        maxCaffeine: optimizationGoals.maxCaffeine || 400,
        maxSugar: optimizationGoals.maxSugar || 50,
        targetCost: optimizationGoals.targetCost,
        preferredIngredients: optimizationGoals.preferredIngredients || []
      }
    };

    const optimized = await this.api.calculator.optimize(optimizationRequest);
    
    return {
      original: current,
      optimized: await this.calculateRecipe(optimized.recipe),
      improvements: optimized.improvements,
      tradeoffs: optimized.tradeoffs
    };
  }
}

// Usage example
const calculator = new EnergyDrinkCalculator(api);

// Set up user profile
await calculator.setUserProfile({
  age: 30,
  weight: 70,
  caffeineSensitivity: 'normal',
  healthConditions: ['anxiety'],
  activityLevel: 'high'
});

// Calculate recipe
const customRecipe = {
  name: 'My Custom Energy Drink',
  base: 'classic',
  servings: 1,
  ingredients: [
    { id: 'caffeine', amount: 100, unit: 'mg' },
    { id: 'taurine', amount: 1000, unit: 'mg' },
    { id: 'b-vitamins', amount: 1, unit: 'g' },
    { id: 'sugar', amount: 10, unit: 'g' }
  ]
};

const result = await calculator.calculateRecipe(customRecipe);
console.log('Recipe Analysis:', {
  score: result.score,
  caffeine: result.nutrition.caffeine,
  safety: result.safety.overallScore,
  recommendations: result.recommendations
});
```

### Safety Validation Service Integration

```javascript
class SafetyValidationService {
  constructor(api) {
    this.api = api;
    this.validationCache = new Map();
  }

  async validateComprehensive(recipe, userProfile) {
    const validationId = this.generateValidationId(recipe, userProfile);
    
    // Check cache first
    const cached = this.validationCache.get(validationId);
    if (cached && this.isCacheValid(cached)) {
      return cached.result;
    }

    const validations = await Promise.all([
      this.validateIngredients(recipe.ingredients, userProfile),
      this.validateDosages(recipe.ingredients, userProfile),
      this.validateInteractions(recipe.ingredients, userProfile),
      this.validateContraindications(recipe.ingredients, userProfile),
      this.validateAgeAppropriate(recipe, userProfile),
      this.validateHealthConditions(recipe, userProfile)
    ]);

    const result = this.combineValidationResults(validations, userProfile);
    
    // Cache result
    this.validationCache.set(validationId, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

  async validateIngredients(ingredients, userProfile) {
    const ingredientIds = ingredients.map(i => i.id);
    const bulkData = await this.api.bulk.get({
      type: 'ingredients',
      ids: ingredientIds,
      include: ['safety', 'contraindications', 'age_restrictions']
    });

    const validationResults = [];

    for (const ingredientData of bulkData.data) {
      const recipeIngredient = ingredients.find(i => i.id === ingredientData.id);
      const validation = this.validateSingleIngredient(ingredientData, recipeIngredient, userProfile);
      validationResults.push(validation);
    }

    return {
      type: 'ingredients',
      results: validationResults,
      overall: this.calculateOverallIngredientSafety(validationResults)
    };
  }

  validateSingleIngredient(ingredient, recipeIngredient, userProfile) {
    const issues = [];
    const warnings = [];

    // Check banned ingredients
    if (ingredient.safety?.banned) {
      issues.push({
        type: 'banned_ingredient',
        severity: 'critical',
        message: `${ingredient.name} is banned in this application`,
        ingredient: ingredient.id
      });
    }

    // Check age restrictions
    if (ingredient.safety?.age_restrictions) {
      const ageRestriction = ingredient.safety.age_restrictions.find(restriction =>
        userProfile.age < restriction.min_age
      );

      if (ageRestriction) {
        issues.push({
          type: 'age_restriction',
          severity: 'high',
          message: `${ingredient.name} is not recommended for ages under ${ageRestriction.min_age}`,
          ingredient: ingredient.id,
          minAge: ageRestriction.min_age
        });
      }
    }

    // Check health condition contraindications
    if (userProfile.healthConditions && userProfile.healthConditions.length > 0) {
      const contraindications = ingredient.contraindications?.filter(contra =>
        userProfile.healthConditions.some(condition => 
          contra.condition === condition || 
          contra.category === condition
        )
      ) || [];

      contraindications.forEach(contra => {
        issues.push({
          type: 'contraindication',
          severity: contra.severity,
          message: `${ingredient.name} may be contraindicated for ${contra.condition}`,
          ingredient: ingredient.id,
          condition: contra.condition
        });
      });
    }

    // Check medication interactions
    if (userProfile.medications && userProfile.medications.length > 0) {
      const interactions = ingredient.drug_interactions?.filter(interaction =>
        userProfile.medications.some(med => 
          med.toLowerCase().includes(interaction.medication.toLowerCase())
        )
      ) || [];

      interactions.forEach(interaction => {
        issues.push({
          type: 'drug_interaction',
          severity: interaction.severity,
          message: `${ingredient.name} may interact with ${interaction.medication}`,
          ingredient: ingredient.id,
          medication: interaction.medication
        });
      });
    }

    return {
      ingredient: ingredient.id,
      name: ingredient.name,
      issues,
      warnings,
      safe: issues.filter(i => i.severity === 'critical').length === 0,
      safetyScore: this.calculateIngredientScore(issues, warnings)
    };
  }

  calculateIngredientScore(issues, warnings) {
    let score = 100;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    score -= criticalIssues * 30;
    score -= highIssues * 15;
    score -= mediumIssues * 8;
    score -= warnings.length * 2;
    
    return Math.max(0, score);
  }

  async validateDosages(ingredients, userProfile) {
    const dosageValidations = [];
    
    for (const ingredient of ingredients) {
      const validation = await this.api.safety.validateDosage({
        ingredientId: ingredient.id,
        amount: ingredient.amount,
        unit: ingredient.unit,
        userProfile
      });
      
      dosageValidations.push({
        ingredient: ingredient.id,
        validation
      });
    }
    
    return {
      type: 'dosages',
      results: dosageValidations,
      overall: this.calculateOverallDosageSafety(dosageValidations)
    };
  }

  async validateInteractions(ingredients, userProfile) {
    const ingredientIds = ingredients.map(i => i.id);
    const interactions = await this.api.safety.getIngredientInteractions(ingredientIds);
    
    const relevantInteractions = interactions.filter(interaction => 
      this.isInteractionRelevant(interaction, userProfile)
    );
    
    return {
      type: 'interactions',
      results: relevantInteractions,
      overall: relevantInteractions.length === 0 ? 'safe' : 'caution'
    };
  }

  isInteractionRelevant(interaction, userProfile) {
    // Check if interaction affects user's health conditions or medications
    if (userProfile.healthConditions) {
      return interaction.affectedConditions?.some(condition => 
        userProfile.healthConditions.includes(condition)
      );
    }
    
    if (userProfile.medications) {
      return interaction.affectedMedications?.some(medication => 
        userProfile.medications.some(med => 
          med.toLowerCase().includes(medication.toLowerCase())
        )
      );
    }
    
    return interaction.severity !== 'minor';
  }

  async validateContraindications(ingredients, userProfile) {
    if (!userProfile.healthConditions || userProfile.healthConditions.length === 0) {
      return {
        type: 'contraindications',
        results: [],
        overall: 'safe'
      };
    }
    
    const contraindications = [];
    const ingredientIds = ingredients.map(i => i.id);
    
    for (const condition of userProfile.healthConditions) {
      const conditionContraindications = await this.api.safety.getContraindications(
        condition,
        ingredientIds
      );
      
      contraindications.push(...conditionContraindications);
    }
    
    return {
      type: 'contraindications',
      results: contraindications,
      overall: contraindications.length === 0 ? 'safe' : 'contraindicated'
    };
  }

  async validateAgeAppropriate(recipe, userProfile) {
    const ageValidations = [];
    
    for (const ingredient of recipe.ingredients) {
      const validation = await this.api.safety.checkAgeAppropriate({
        ingredientId: ingredient.id,
        userAge: userProfile.age
      });
      
      if (!validation.appropriate) {
        ageValidations.push({
          ingredient: ingredient.id,
          reason: validation.reason,
          minimumAge: validation.minimumAge
        });
      }
    }
    
    return {
      type: 'age_appropriate',
      results: ageValidations,
      overall: ageValidations.length === 0 ? 'appropriate' : 'restricted'
    };
  }

  async validateHealthConditions(recipe, userProfile) {
    if (!userProfile.healthConditions || userProfile.healthConditions.length === 0) {
      return {
        type: 'health_conditions',
        results: [],
        overall: 'safe'
      };
    }
    
    const healthWarnings = [];
    
    for (const condition of userProfile.healthConditions) {
      const warnings = await this.api.safety.getHealthConditionWarnings(
        condition,
        recipe.ingredients.map(i => i.id)
      );
      
      if (warnings.length > 0) {
        healthWarnings.push({
          condition,
          warnings
        });
      }
    }
    
    return {
      type: 'health_conditions',
      results: healthWarnings,
      overall: healthWarnings.length === 0 ? 'safe' : 'caution'
    };
  }

  combineValidationResults(validations, userProfile) {
    const overall = {
      safe: true,
      score: 100,
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };
    
    validations.forEach(validation => {
      if (validation.overall === 'contraindicated' || validation.overall === 'restricted') {
        overall.safe = false;
      }
      
      validation.results.forEach(result => {
        if (result.issues) {
          result.issues.forEach(issue => {
            if (issue.severity === 'critical') {
              overall.criticalIssues.push(issue);
              overall.safe = false;
            } else {
              overall.warnings.push(issue);
            }
          });
        }
      });
    });
    
    // Calculate overall score
    const deductions = overall.criticalIssues.length * 30 + overall.warnings.length * 5;
    overall.score = Math.max(0, 100 - deductions);
    
    // Generate recommendations
    if (!overall.safe) {
      overall.recommendations.push('Consult healthcare provider before consumption');
    }
    
    if (overall.score < 70) {
      overall.recommendations.push('Consider reducing ingredient amounts');
    }
    
    return overall;
  }

  generateValidationId(recipe, userProfile) {
    const recipeHash = JSON.stringify(recipe.ingredients.sort((a, b) => a.id.localeCompare(b.id)));
    const profileHash = JSON.stringify({
      age: userProfile.age,
      healthConditions: userProfile.healthConditions?.sort() || [],
      medications: userProfile.medications?.sort() || []
    });
    
    return btoa(recipeHash + profileHash).replace(/[^a-zA-Z0-9]/g, '');
  }

  isCacheValid(cached) {
    // Cache valid for 1 hour
    return Date.now() - cached.timestamp < 3600000;
  }

  calculateOverallIngredientSafety(results) {
    if (results.length === 0) return 'unknown';
    
    const unsafeIngredients = results.filter(r => !r.safe).length;
    const safetyRatio = (results.length - unsafeIngredients) / results.length;
    
    if (safetyRatio === 1) return 'safe';
    if (safetyRatio >= 0.8) return 'mostly_safe';
    if (safetyRatio >= 0.5) return 'caution';
    return 'unsafe';
  }

  calculateOverallDosageSafety(results) {
    if (results.length === 0) return 'unknown';
    
    const invalidDosages = results.filter(r => !r.validation.valid).length;
    const safetyRatio = (results.length - invalidDosages) / results.length;
    
    if (safetyRatio === 1) return 'safe';
    if (safetyRatio >= 0.8) return 'mostly_safe';
    if (safetyRatio >= 0.5) return 'caution';
    return 'unsafe';
  }
}

// Custom validation error
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
```

### Recipe and Flavor Data Integration

```javascript
class RecipeDataIntegration {
  constructor(api) {
    this.api = api;
    this.recipeCache = new Map();
    this.flavorCache = new Map();
  }

  async getComprehensiveFlavorData(flavorId) {
    const cacheKey = `flavor_${flavorId}`;
    let cached = this.flavorCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    // Get all related data in parallel
    const [flavorData, safetyData, nutritionData, supplierData, reviews] = await Promise.all([
      this.api.flavors.get(flavorId),
      this.api.safety.validateFlavor(flavorId),
      this.api.nutrition.getFlavorNutrition(flavorId),
      this.api.suppliers.getFlavorSuppliers(flavorId),
      this.api.reviews.getFlavorReviews(flavorId)
    ]);

    const comprehensiveData = {
      ...flavorData,
      safety: safetyData,
      nutrition: nutritionData,
      suppliers: supplierData,
      reviews: reviews,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 30 minutes
    this.flavorCache.set(cacheKey, {
      data: comprehensiveData,
      timestamp: Date.now()
    });

    return comprehensiveData;
  }

  async searchFlavorsAdvanced(searchCriteria) {
    const searchParams = {
      query: searchCriteria.query,
      category: searchCriteria.categories || [],
      caffeineRange: searchCriteria.caffeineRange,
      sugarRange: searchCriteria.sugarRange,
      ingredients: searchCriteria.ingredients || [],
      avoidIngredients: searchCriteria.avoidIngredients || [],
      safetyRating: searchCriteria.minSafetyRating,
      sortBy: searchCriteria.sortBy || 'popularity',
      sortOrder: searchCriteria.sortOrder || 'desc',
      limit: Math.min(searchCriteria.limit || 50, 100),
      offset: searchCriteria.offset || 0
    };

    const results = await this.api.search.searchFlavors(searchParams);

    // Enhance results with additional data if requested
    if (searchCriteria.includeEnhancements) {
      const enhancedResults = await Promise.all(
        results.data.map(async (flavor) => {
          const [safety, nutrition] = await Promise.all([
            this.api.safety.validateFlavor(flavor.id),
            this.api.nutrition.getFlavorNutrition(flavor.id)
          ]);
          return {
            ...flavor,
            safety,
            nutrition,
            searchScore: this.calculateSearchScore(flavor, searchCriteria)
          };
        })
      );

      // Sort by search score if provided
      if (searchCriteria.includeEnhancements) {
        enhancedResults.sort((a, b) => b.searchScore - a.searchScore);
      }

      return {
        ...results,
        data: enhancedResults
      };
    }

    return results;
  }

  async createCustomRecipe(recipeData) {
    // Validate recipe structure
    const validation = await this.validateRecipeStructure(recipeData);
    if (!validation.valid) {
      throw new ValidationError('Invalid recipe structure', validation.errors);
    }

    // Check ingredient availability
    const availabilityCheck = await this.checkIngredientAvailability(recipeData.ingredients);
    if (!availabilityCheck.allAvailable) {
      throw new ValidationError('Some ingredients unavailable', availabilityCheck.unavailable);
    }

    // Calculate initial nutrition
    const nutrition = await this.api.calculator.compute({
      ingredients: recipeData.ingredients,
      servings: recipeData.servings || 1
    });

    // Perform safety validation
    const safety = await this.api.safety.validateRecipe({
      ingredients: recipeData.ingredients,
      nutrition
    });

    // Create recipe
    const newRecipe = await this.api.recipes.create({
      ...recipeData,
      calculatedNutrition: nutrition,
      safetyValidation: safety,
      status: 'draft'
    });

    return newRecipe;
  }

  async optimizeRecipeForPreferences(recipeId, preferences) {
    const originalRecipe = await this.api.recipes.get(recipeId);
    const optimizationRequest = {
      recipe: originalRecipe,
      goals: {
        targetCaffeine: preferences.targetCaffeine,
        maxSugar: preferences.maxSugar,
        budgetConstraint: preferences.maxCost,
        tasteProfile: preferences.tasteProfile,
        avoidIngredients: preferences.avoidIngredients
      },
      constraints: {
        maintainRecipeName: true,
        maxIngredientChanges: preferences.maxChanges || 3,
        preserveKeyIngredients: preferences.preserveIngredients || []
      }
    };

    const optimized = await this.api.recipes.optimize(optimizationRequest);
    
    return {
      original: originalRecipe,
      optimized: optimized.recipe,
      improvements: optimized.improvements,
      tradeoffs: optimized.tradeoffs,
      optimizationScore: optimized.score
    };
  }

  calculateSearchScore(flavor, criteria) {
    let score = 0;

    // Base score from relevance
    score += flavor.relevanceScore || 0;

    // Boost for exact category matches
    if (criteria.categories && criteria.categories.includes(flavor.category)) {
      score += 10;
    }

    // Boost for safety rating
    if (criteria.minSafetyRating && flavor.safety?.overallScore >= criteria.minSafetyRating) {
      score += 5;
    }

    // Penalize for avoided ingredients
    if (criteria.avoidIngredients) {
      const hasAvoidedIngredients = flavor.ingredients?.some(ingredient =>
        criteria.avoidIngredients.includes(ingredient.id)
      );
      if (hasAvoidedIngredients) {
        score -= 20;
      }
    }

    return score;
  }

  async validateRecipeStructure(recipeData) {
    const errors = [];

    // Required fields
    if (!recipeData.name || recipeData.name.trim().length === 0) {
      errors.push('Recipe name is required');
    }

    // Ingredients validation
    if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else {
      recipeData.ingredients.forEach((ingredient, index) => {
        if (!ingredient.id) {
          errors.push(`Ingredient ${index + 1}: ID is required`);
        }
        if (!ingredient.amount || ingredient.amount <= 0) {
          errors.push(`Ingredient ${index + 1}: Valid amount is required`);
        }
        if (!ingredient.unit) {
          errors.push(`Ingredient ${index + 1}: Unit is required`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async checkIngredientAvailability(ingredients) {
    const ingredientIds = ingredients.map(i => i.id);
    const availability = await this.api.ingredients.checkAvailability(ingredientIds);

    const unavailable = availability.filter(item => !item.available);
    
    return {
      allAvailable: unavailable.length === 0,
      unavailable: unavailable.map(item => ({
        ingredient: item.id,
        reason: item.reason,
        alternatives: item.alternatives || []
      }))
    };
  }

  isCacheValid(cached) {
    return Date.now() - cached.timestamp < 1800000; // 30 minutes
  }
}
```

### User Preference and Customization Integration

```javascript
class UserPreferenceIntegration {
  constructor(api) {
    this.api = api;
    this.preferenceCache = new Map();
  }

  async setUserPreferences(userId, preferences) {
    const validatedPreferences = this.validatePreferences(preferences);
    
    const saved = await this.api.userPreferences.set(userId, validatedPreferences);
    
    // Update cache
    this.preferenceCache.set(userId, {
      data: validatedPreferences,
      timestamp: Date.now()
    });
    
    return saved;
  }

  async getPersonalizedRecommendations(userId, context = {}) {
    const preferences = await this.getUserPreferences(userId);
    
    // Get base recommendations
    const baseRecommendations = await this.api.recommendations.getBase();
    
    // Apply user preferences
    const personalizedRecommendations = this.applyPreferences(
      baseRecommendations,
      preferences,
      context
    );
    
    // Apply machine learning adjustments
    const mlAdjusted = await this.api.recommendations.applyML(
      userId,
      personalizedRecommendations
    );
    
    return {
      recommendations: mlAdjusted,
      preferences: preferences,
      confidence: mlAdjusted.confidence,
      explanations: mlAdjusted.explanations
    };
  }

  async trackPreferenceChange(userId, change) {
    // Track what user changed
    await this.api.analytics.trackEvent({
      userId,
      event: 'preference_changed',
      properties: {
        category: change.category,
        previousValue: change.previous,
        newValue: change.new,
        timestamp: new Date().toISOString()
      }
    });
    
    // Update ML model
    await this.api.ml.updateUserProfile(userId, change);
  }

  validatePreferences(preferences) {
    const validated = {
      tasteProfile: this.validateTasteProfile(preferences.tasteProfile),
      caffeinePreference: this.validateCaffeinePreference(preferences.caffeinePreference),
      sugarPreference: this.validateSugarPreference(preferences.sugarPreference),
      ingredientPreferences: this.validateIngredientPreferences(preferences.ingredientPreferences),
      dietaryRestrictions: this.validateDietaryRestrictions(preferences.dietaryRestrictions),
      healthGoals: this.validateHealthGoals(preferences.healthGoals),
      budgetRange: this.validateBudgetRange(preferences.budgetRange),
      brandPreferences: this.validateBrandPreferences(preferences.brandPreferences)
    };
    
    return validated;
  }

  validateTasteProfile(tasteProfile) {
    const validProfiles = ['sweet', 'tart', 'bitter', 'umami', 'neutral'];
    if (!tasteProfile || !validProfiles.includes(tasteProfile)) {
      return 'neutral';
    }
    return tasteProfile;
  }

  validateCaffeinePreference(preference) {
    if (!preference) return 'moderate';
    
    const validPreferences = ['low', 'moderate', 'high', 'none'];
    return validPreferences.includes(preference) ? preference : 'moderate';
  }

  validateSugarPreference(preference) {
    if (!preference) return 'low';
    
    const validPreferences = ['none', 'low', 'moderate', 'high'];
    return validPreferences.includes(preference) ? preference : 'low';
  }

  validateIngredientPreferences(preferences) {
    if (!Array.isArray(preferences)) return { avoid: [], prefer: [] };
    
    return {
      avoid: preferences.filter(item => item.type === 'avoid').map(item => item.ingredientId),
      prefer: preferences.filter(item => item.type === 'prefer').map(item => item.ingredientId)
    };
  }

  validateDietaryRestrictions(restrictions) {
    if (!Array.isArray(restrictions)) return [];
    
    const validRestrictions = [
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
      'nut-free', 'sugar-free', 'caffeine-free', 'organic-only'
    ];
    
    return restrictions.filter(restriction => validRestrictions.includes(restriction));
  }

  validateHealthGoals(goals) {
    if (!Array.isArray(goals)) return [];
    
    const validGoals = [
      'weight-loss', 'muscle-gain', 'energy-boost', 'focus-enhancement',
      'athletic-performance', 'mental-clarity', 'mood-enhancement'
    ];
    
    return goals.filter(goal => validGoals.includes(goal));
  }

  validateBudgetRange(budgetRange) {
    if (!budgetRange || typeof budgetRange.min !== 'number' || typeof budgetRange.max !== 'number') {
      return { min: 0, max: 100 };
    }
    
    return {
      min: Math.max(0, budgetRange.min),
      max: Math.max(budgetRange.min, budgetRange.max)
    };
  }

  validateBrandPreferences(brands) {
    if (!Array.isArray(brands)) return [];
    return brands.filter(brand => brand && typeof brand === 'string');
  }

  applyPreferences(recommendations, preferences, context) {
    return recommendations.filter(recommendation => {
      return this.matchesTasteProfile(recommendation, preferences.tasteProfile) &&
             this.matchesCaffeinePreference(recommendation, preferences.caffeinePreference) &&
             this.matchesSugarPreference(recommendation, preferences.sugarPreference) &&
             !this.hasAvoidedIngredients(recommendation, preferences.ingredientPreferences?.avoid) &&
             this.matchesBudget(recommendation, preferences.budgetRange) &&
             this.matchesDietaryRestrictions(recommendation, preferences.dietaryRestrictions);
    });
  }

  matchesTasteProfile(recommendation, tasteProfile) {
    if (!tasteProfile || tasteProfile === 'neutral') return true;
    return recommendation.tasteProfile === tasteProfile;
  }

  matchesCaffeinePreference(recommendation, preference) {
    if (!preference || preference === 'moderate') return true;
    
    const caffeineLevel = this.getCaffeineLevel(recommendation.caffeine);
    switch (preference) {
      case 'none': return caffeineLevel === 'none';
      case 'low': return caffeineLevel === 'low';
      case 'high': return caffeineLevel === 'high';
      default: return true;
    }
  }

  matchesSugarPreference(recommendation, preference) {
    if (!preference || preference === 'low') return true;
    
    const sugarLevel = this.getSugarLevel(recommendation.sugar);
    switch (preference) {
      case 'none': return sugarLevel === 'none';
      case 'moderate': return sugarLevel === 'low' || sugarLevel === 'moderate';
      case 'high': return true; // Accept all sugar levels
      default: return true;
    }
  }

  hasAvoidedIngredients(recommendation, avoidedIngredients) {
    if (!avoidedIngredients || avoidedIngredients.length === 0) return false;
    
    return recommendation.ingredients?.some(ingredient =>
      avoidedIngredients.includes(ingredient.id)
    );
  }

  matchesBudget(recommendation, budgetRange) {
    if (!budgetRange) return true;
    
    const cost = recommendation.estimatedCost || 0;
    return cost >= budgetRange.min && cost <= budgetRange.max;
  }

  matchesDietaryRestrictions(recommendation, restrictions) {
    if (!restrictions || restrictions.length === 0) return true;
    
    return restrictions.every(restriction => {
      switch (restriction) {
        case 'sugar-free': return (recommendation.sugar || 0) < 1;
        case 'caffeine-free': return (recommendation.caffeine || 0) < 5;
        case 'vegan': return this.isVegan(recommendation);
        case 'vegetarian': return this.isVegetarian(recommendation);
        case 'gluten-free': return this.isGlutenFree(recommendation);
        default: return true;
      }
    });
  }

  getCaffeineLevel(caffeine) {
    if (!caffeine) return 'none';
    if (caffeine < 50) return 'low';
    if (caffeine > 150) return 'high';
    return 'moderate';
  }

  getSugarLevel(sugar) {
    if (!sugar) return 'none';
    if (sugar < 5) return 'low';
    if (sugar > 20) return 'high';
    return 'moderate';
  }

  isVegan(recommendation) {
    // Check if any non-vegan ingredients
    const nonVeganIngredients = ['gelatin', 'honey', 'animal-based-vitamins'];
    return !recommendation.ingredients?.some(ingredient =>
      nonVeganIngredients.includes(ingredient.id)
    );
  }

  isVegetarian(recommendation) {
    // Similar to vegan but allows honey
    const nonVegetarianIngredients = ['gelatin', 'animal-based-vitamins'];
    return !recommendation.ingredients?.some(ingredient =>
      nonVegetarianIngredients.includes(ingredient.id)
    );
  }

  isGlutenFree(recommendation) {
    // Check for gluten-containing ingredients
    const glutenIngredients = ['wheat', 'barley', 'rye', 'malt'];
    return !recommendation.ingredients?.some(ingredient =>
      glutenIngredients.some(glutenIngredient =>
        ingredient.name.toLowerCase().includes(glutenIngredient)
      )
    );
  }

  async getUserPreferences(userId) {
    const cached = this.preferenceCache.get(userId);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    const preferences = await this.api.userPreferences.get(userId);
    
    // Cache for 1 hour
    this.preferenceCache.set(userId, {
      data: preferences,
      timestamp: Date.now()
    });
    
    return preferences;
  }

  isCacheValid(cached) {
    return Date.now() - cached.timestamp < 3600000; // 1 hour
  }
}
```

### Analytics and Tracking Integration

```javascript
class AnalyticsIntegration {
  constructor(api) {
    this.api = api;
    this.eventQueue = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    this.startBatchProcessor();
  }

  // Track user interactions
  async trackUserInteraction(userId, interaction) {
    const event = {
      userId,
      timestamp: new Date().toISOString(),
      type: 'user_interaction',
      data: {
        action: interaction.action,
        target: interaction.target,
        context: interaction.context,
        value: interaction.value,
        duration: interaction.duration
      }
    };
    
    await this.queueEvent(event);
    
    // Real-time processing for critical events
    if (this.isCriticalEvent(interaction)) {
      await this.processEventImmediately(event);
    }
  }

  // Track calculation events
  async trackCalculation(userId, calculation) {
    const event = {
      userId,
      timestamp: new Date().toISOString(),
      type: 'calculation',
      data: {
        recipeId: calculation.recipeId,
        ingredients: calculation.ingredients?.map(i => i.id),
        caffeine: calculation.caffeine,
        sugar: calculation.sugar,
        calories: calculation.calories,
        safetyScore: calculation.safetyScore,
        calculationTime: calculation.calculationTime,
        success: calculation.success,
        error: calculation.error
      }
    };
    
    await this.queueEvent(event);
  }

  // Track recipe interactions
  async trackRecipeInteraction(userId, interaction) {
    const event = {
      userId,
      timestamp: new Date().toISOString(),
      type: 'recipe_interaction',
      data: {
        recipeId: interaction.recipeId,
        action: interaction.action, // 'view', 'favorite', 'share', 'modify', 'calculate'
        source: interaction.source, // 'search', 'recommendation', 'direct'
        context: interaction.context,
        duration: interaction.duration
      }
    };
    
    await this.queueEvent(event);
  }

  // Track conversion events
  async trackConversion(userId, conversion) {
    const event = {
      userId,
      timestamp: new Date().toISOString(),
      type: 'conversion',
      data: {
        conversionType: conversion.type, // 'purchase_intent', 'share', 'save_recipe'
        value: conversion.value,
        recipeId: conversion.recipeId,
        source: conversion.source,
        attribution: conversion.attribution
      }
    };
    
    await this.queueEvent(event);
    
    // Trigger real-time attribution update
    await this.api.attribution.updateConversion(userId, conversion);
  }

  // Get user analytics
  async getUserAnalytics(userId, timeframe = '30d') {
    const [activity, preferences, conversions, engagement] = await Promise.all([
      this.api.analytics.getUserActivity(userId, timeframe),
      this.api.analytics.getUserPreferences(userId),
      this.api.analytics.getUserConversions(userId, timeframe),
      this.api.analytics.getUserEngagement(userId, timeframe)
    ]);

    return {
      userId,
      timeframe,
      activity,
      preferences,
      conversions,
      engagement,
      calculatedMetrics: this.calculateMetrics(activity, conversions, engagement)
    };
  }

  // Get real-time dashboard data
  async getRealtimeDashboard() {
    const [currentUsers, recentCalculations, topRecipes, systemHealth] = await Promise.all([
      this.api.analytics.getCurrentActiveUsers(),
      this.api.analytics.getRecentCalculations(100),
      this.api.analytics.getTopRecipes('24h'),
      this.api.analytics.getSystemHealth()
    ]);

    return {
      timestamp: new Date().toISOString(),
      currentUsers,
      recentCalculations,
      topRecipes,
      systemHealth,
      alerts: this.generateAlerts(systemHealth)
    };
  }

  // Generate custom reports
  async generateCustomReport(config) {
    const reportConfig = {
      timeframe: config.timeframe || '7d',
      metrics: config.metrics || ['users', 'calculations', 'conversions'],
      filters: config.filters || {},
      groupBy: config.groupBy || 'day',
      format: config.format || 'json'
    };

    const rawData = await this.api.analytics.getCustomData(reportConfig);
    
    if (config.applyInsights) {
      const insights = await this.api.analytics.generateInsights(rawData);
      return {
        data: rawData,
        insights,
        summary: this.generateSummary(rawData, insights),
        recommendations: insights.recommendations
      };
    }

    return { data: rawData };
  }

  // Privacy-compliant tracking
  async trackWithConsent(userId, event, consent) {
    // Check consent for different data types
    const analyticsConsent = consent.analytics || false;
    const personalizationConsent = consent.personalization || false;
    const marketingConsent = consent.marketing || false;

    if (!analyticsConsent) {
      return; // Skip tracking if no analytics consent
    }

    // Anonymize data if required
    const anonymizedEvent = this.anonymizeEvent(event, consent);
    
    await this.queueEvent(anonymizedEvent);
    
    // Update personalization models only if consent given
    if (personalizationConsent) {
      await this.api.ml.updateUserModel(userId, anonymizedEvent);
    }
  }

  // A/B testing integration
  async trackABTestEvent(userId, testId, variant, event, metadata = {}) {
    const eventData = {
      userId,
      testId,
      variant,
      event,
      timestamp: new Date().toISOString(),
      metadata,
      sessionId: metadata.sessionId
    };

    await this.queueEvent({
      type: 'ab_test',
      data: eventData
    });

    // Real-time test result calculation for high-traffic tests
    if (this.isHighTrafficTest(testId)) {
      await this.api.abTests.updateRealtimeResults(testId, eventData);
    }
  }

  // Private methods
  async queueEvent(event) {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  startBatchProcessor() {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await this.api.analytics.trackBatch(batch);
    } catch (error) {
      console.error('Failed to flush analytics batch:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...batch);
    }
  }

  async processEventImmediately(event) {
    try {
      await this.api.analytics.trackEvent(event);
    } catch (error) {
      console.error('Failed to process critical event:', error);
    }
  }

  isCriticalEvent(interaction) {
    const criticalActions = ['purchase', 'share', 'report_safety_issue'];
    return criticalActions.includes(interaction.action);
  }

  calculateMetrics(activity, conversions, engagement) {
    return {
      totalUsers: activity.uniqueUsers,
      activeUsers: activity.activeUsers,
      averageSessionDuration: engagement.avgSessionDuration,
      calculationCount: activity.calculations,
      conversionRate: conversions.rate,
      topRecipe: activity.topRecipe,
      averageSafetyScore: activity.avgSafetyScore
    };
  }

  generateAlerts(systemHealth) {
    const alerts = [];
    
    if (systemHealth.errorRate > 0.05) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate detected: ${(systemHealth.errorRate * 100).toFixed(2)}%`
      });
    }
    
    if (systemHealth.responseTime > 2000) {
      alerts.push({
        type: 'response_time',
        severity: 'medium',
        message: `High response time: ${systemHealth.responseTime}ms`
      });
    }
    
    return alerts;
  }

  anonymizeEvent(event, consent) {
    const anonymized = { ...event };
    
    // Remove PII based on consent level
    if (!consent.detailedAnalytics) {
      delete anonymized.userId;
      anonymized.userId = this.hashUserId(event.userId);
    }
    
    // Remove location data if not consented
    if (!consent.location) {
      delete anonymized.data.location;
    }
    
    return anonymized;
  }

  hashUserId(userId) {
    // Simple hash function - in production use crypto
    return btoa(userId).slice(0, 16);
  }

  isHighTrafficTest(testId) {
    // Check if test is marked as high-traffic
    return this.highTrafficTests?.includes(testId);
  }

  async getABTestResults(testId) {
    return await this.api.abTests.getResults(testId);
  }

  // GDPR compliance
  async deleteUserData(userId, retentionPeriod = null) {
    const deletionRequest = {
      userId,
      retentionPeriod,
      timestamp: new Date().toISOString()
    };
    
    return await this.api.gdpr.deleteUserData(deletionRequest);
  }

  async exportUserData(userId) {
    const exportRequest = {
      userId,
      format: 'json',
      includeAnalytics: true,
      includePreferences: true,
      timestamp: new Date().toISOString()
    };
    
    return await this.api.gdpr.exportUserData(exportRequest);
  }
}
```

## Advanced Integration Features

### Bulk Data Operations and Batch Processing

```javascript
class BulkOperationsManager {
  constructor(api) {
    this.api = api;
    this.batchQueue = [];
    this.maxBatchSize = 100;
    this.processing = false;
  }

  // Bulk ingredient analysis
  async bulkAnalyzeIngredients(ingredientIds, options = {}) {
    const batches = this.createBatches(ingredientIds, this.maxBatchSize);
    const results = [];
    
    for (const batch of batches) {
      const batchResult = await this.processBatch('analyzeIngredients', batch, options);
      results.push(...batchResult);
      
      // Rate limiting delay
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  // Bulk recipe creation
  async bulkCreateRecipes(recipes, options = {}) {
    const batches = this.createBatches(recipes, this.maxBatchSize);
    const results = [];
    
    for (const batch of batches) {
      const batchResult = await this.processBatch('createRecipes', batch, options);
      results.push(...batchResult);
      
      await this.delay(2000); // Longer delay for writes
    }
    
    return results;
  }

  // Bulk safety validation
  async bulkValidateSafety(recipes, userProfiles) {
    const validationTasks = recipes.map(async (recipe, index) => {
      const userProfile = userProfiles[index % userProfiles.length];
      try {
        const validation = await this.api.safety.validateRecipe(recipe, userProfile);
        return {
          recipeId: recipe.id,
          valid: true,
          validation,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          recipeId: recipe.id,
          valid: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    return await Promise.allSettled(validationTasks);
  }

  // Bulk supplier data sync
  async bulkSyncSupplierData(supplierIds) {
    const syncResults = [];
    
    for (const supplierId of supplierIds) {
      try {
        const syncResult = await this.api.suppliers.sync(supplierId);
        syncResults.push({
          supplierId,
          success: true,
          data: syncResult,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        syncResults.push({
          supplierId,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Respect rate limits
      await this.delay(500);
    }
    
    return syncResults;
  }

  // Process large dataset in chunks
  async processLargeDataset(dataset, processor, options = {}) {
    const chunkSize = options.chunkSize || 1000;
    const results = [];
    
    for (let i = 0; i < dataset.length; i += chunkSize) {
      const chunk = dataset.slice(i, i + chunkSize);
      
      console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(dataset.length / chunkSize)}`);
      
      const chunkResults = await Promise.allSettled(
        chunk.map(item => processor(item))
      );
      
      // Collect successful results
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to process item ${i + index}:`, result.reason);
        }
      });
      
      // Progress callback
      if (options.onProgress) {
        options.onProgress({
          completed: Math.min(i + chunkSize, dataset.length),
          total: dataset.length,
          results: results.length
        });
      }
      
      // Delay between chunks
      if (i + chunkSize < dataset.length) {
        await this.delay(options.chunkDelay || 1000);
      }
    }
    
    return results;
  }

  // Bulk calculation with optimization
  async bulkCalculateNutrition(recipes, optimization = {}) {
    const calculationTasks = recipes.map(recipe => async () => {
      const calculation = await this.api.calculator.compute({
        ingredients: recipe.ingredients,
        servings: recipe.servings || 1,
        optimization
      });
      
      return {
        recipeId: recipe.id,
        calculation,
        processingTime: Date.now()
      };
    });
    
    // Execute with concurrency control
    return await this.executeWithConcurrency(calculationTasks, 5);
  }

  // Utility methods
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(operation, batch, options) {
    const batchRequest = {
      operation,
      items: batch,
      options: {
        includeErrors: true,
        continueOnError: options.continueOnError !== false,
        timeout: options.timeout || 30000,
        ...options
      }
    };
    
    return await this.api.bulk.process(batchRequest);
  }

  async executeWithConcurrency(tasks, maxConcurrency) {
    const results = [];
    const executing = [];
    
    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      
      results.push(promise);
      executing.push(promise);
      
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }
    
    return Promise.allSettled(results);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Real-time Data Synchronization

```javascript
class RealtimeSyncManager {
  constructor(api, websocketUrl = null) {
    this.api = api;
    this.websocket = null;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    
    if (websocketUrl) {
      this.initializeWebSocket(websocketUrl);
    }
  }

  // Subscribe to real-time updates
  subscribe(channel, callback, options = {}) {
    const subscription = {
      channel,
      callback,
      options: {
        filter: options.filter || {},
        batch: options.batch || false,
        batchInterval: options.batchInterval || 1000,
        ...options
      },
      buffer: [],
      lastFlush: Date.now()
    };
    
    this.subscriptions.set(channel, subscription);
    
    // Send subscription to server
    this.sendSubscription(channel, subscription.options);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(channel);
      this.sendUnsubscription(channel);
    };
  }

  // Real-time flavor updates
  subscribeFlavorUpdates(flavorId, callback) {
    return this.subscribe(`flavor.${flavorId}`, callback, {
      includeHistory: false
    });
  }

  // Real-time safety alerts
  subscribeSafetyAlerts(userProfile, callback) {
    return this.subscribe('safety.alerts', callback, {
      filter: {
        userProfile: userProfile.id,
        conditions: userProfile.healthConditions
      }
    });
  }

  // Real-time calculation results
  subscribeCalculationUpdates(sessionId, callback) {
    return this.subscribe(`calculation.${sessionId}`, callback, {
      batch: true,
      batchInterval: 500
    });
  }

  // Real-time system status
  subscribeSystemStatus(callback) {
    return this.subscribe('system.status', callback, {
      filter: { critical: true }
    });
  }

  // Publish events to other clients
  async publish(channel, event, options = {}) {
    const message = {
      type: 'publish',
      channel,
      event: {
        ...event,
        timestamp: new Date().toISOString(),
        id: this.generateEventId()
      },
      options
    };
    
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      // Queue for later sending
      await this.api.queue.publish(channel, event);
    }
  }

  // WebSocket management
  initializeWebSocket(url) {
    this.websocket = new WebSocket(url);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.resubscribeAll();
    };
    
    this.websocket.onmessage = (event) => {
      this.handleWebSocketMessage(JSON.parse(event.data));
    };
    
    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopHeartbeat();
      this.attemptReconnect();
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'subscription_data':
        this.handleSubscriptionData(message);
        break;
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'system_notification':
        this.handleSystemNotification(message);
        break;
      case 'error':
        this.handleError(message);
        break;
    }
  }

  handleSubscriptionData(message) {
    const subscription = this.subscriptions.get(message.channel);
    if (!subscription) return;
    
    if (subscription.options.batch) {
      subscription.buffer.push(message.data);
      
      const timeSinceLastFlush = Date.now() - subscription.lastFlush;
      if (timeSinceLastFlush >= subscription.options.batchInterval) {
        this.flushSubscriptionBuffer(message.channel);
      }
    } else {
      subscription.callback(message.data);
    }
  }

  flushSubscriptionBuffer(channel) {
    const subscription = this.subscriptions.get(channel);
    if (!subscription || subscription.buffer.length === 0) return;
    
    subscription.callback([...subscription.buffer]);
    subscription.buffer = [];
    subscription.lastFlush = Date.now();
  }

  handleHeartbeat(message) {
    // Respond to server heartbeat
    this.send({ type: 'heartbeat_ack', id: message.id });
  }

  handleSystemNotification(message) {
    // Handle system-wide notifications
    console.log('System notification:', message);
    
    // Notify all subscribers to system channel
    const systemSubscribers = Array.from(this.subscriptions.entries())
      .filter(([channel]) => channel.startsWith('system.'))
      .map(([, subscription]) => subscription.callback);
    
    systemSubscribers.forEach(callback => {
      try {
        callback(message.data);
      } catch (error) {
        console.error('Error in system notification callback:', error);
      }
    });
  }

  handleError(message) {
    console.error('WebSocket error message:', message);
    
    // Handle specific error types
    switch (message.code) {
      case 'AUTHENTICATION_FAILED':
        this.reauthenticate();
        break;
      case 'SUBSCRIPTION_NOT_FOUND':
        this.resubscribeAll();
        break;
    }
  }

  // Private methods
  send(message) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  sendSubscription(channel, options) {
    this.send({
      type: 'subscribe',
      channel,
      options
    });
  }

  sendUnsubscription(channel) {
    this.send({
      type: 'unsubscribe',
      channel
    });
  }

  resubscribeAll() {
    this.subscriptions.forEach((subscription, channel) => {
      this.sendSubscription(channel, subscription.options);
    });
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.initializeWebSocket(this.websocket.url);
    }, delay);
  }

  async reauthenticate() {
    try {
      const newToken = await this.api.auth.refreshToken();
      this.send({
        type: 'auth',
        token: newToken
      });
    } catch (error) {
      console.error('Reauthentication failed:', error);
    }
  }

  generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup
  disconnect() {
    this.stopHeartbeat();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.subscriptions.clear();
  }
}
```