# Architecture Overview

This document describes the architecture, design decisions, and patterns used in the Energy Drink Calculator App.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Key Design Decisions](#key-design-decisions)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)

## System Overview

The Energy Drink Calculator App is a Next.js-based web application that helps users create safe, custom energy drink recipes. The application follows a modern, scalable architecture designed for maintainability, performance, and user safety.

### Core Components

- **Frontend**: React-based user interface with TypeScript
- **Backend**: Next.js API routes handling server-side logic
- **Data Layer**: JSON-based data storage with caching layer
- **Infrastructure**: Vercel deployment with Redis caching
- **Security**: Multi-layered security including CSRF protection, rate limiting, and GDPR compliance

## Technology Stack

### Frontend Framework
- **Next.js 15**: React framework with App Router for modern routing and SSR
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development throughout the application

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Consistent icon library

### State Management & Data
- **React Context**: For global state (GDPR, age verification)
- **JSON Files**: Static data storage for ingredients, suppliers, and safety limits
- **Redis**: Distributed caching layer with in-memory fallback

### Development & Quality
- **ESLint**: Code linting with Next.js configuration
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing with accessibility checks
- **Husky**: Git hooks for pre-commit quality checks

### Infrastructure & Deployment
- **Vercel**: Serverless deployment platform
- **Sentry**: Error monitoring and performance tracking
- **Vercel Analytics**: Usage analytics

### Security & Compliance
- **next-csrf**: CSRF protection
- **express-rate-limit**: API rate limiting
- **GDPR**: Cookie consent and data protection
- **Age Verification**: Content access control

## Architecture Patterns

### 1. Component Composition Pattern

The application uses a composition-based approach with reusable UI components:

```typescript
// Example: Composable button component
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

<Button variant="primary" size="lg">
  <Calculator className="mr-2" />
  Calculate Recipe
</Button>
```

**Benefits:**
- High reusability across the application
- Consistent design system
- Easy maintenance and updates

### 2. Provider Pattern

Global application state is managed through React Context providers:

```typescript
// GDPR Provider wrapping the application
<GDPRProvider>
  <AgeVerificationProvider>
    <App />
  </AgeVerificationProvider>
</GDPRProvider>
```

**Benefits:**
- Centralized state management for cross-cutting concerns
- Clean separation of concerns
- Easy testing with provider mocking

### 3. Data Service Pattern

Data access is abstracted through service functions with caching:

```typescript
// Cached data service
export async function getIngredientsData() {
  const cached = await cache.get(cacheKeys.data.ingredients);
  if (cached) return cached;

  await cache.set(cacheKeys.data.ingredients, ingredientsData, CACHE_TTL.LONG);
  return ingredientsData;
}
```

**Benefits:**
- Consistent data access patterns
- Built-in caching for performance
- Easy to mock for testing

### 4. Singleton Pattern

Infrastructure services use singleton instances:

```typescript
class CacheManager {
  private static instance: CacheManager;
  private client: RedisClientType | null = null;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
}
```

**Benefits:**
- Single point of configuration
- Resource efficiency
- Consistent behavior across the application

### 5. Configuration as Code

Environment configuration is validated at startup:

```typescript
export function getConfig(): AppConfig {
  if (!configCache) {
    configCache = validateEnvironment();
  }
  return configCache;
}
```

**Benefits:**
- Type-safe configuration access
- Validation prevents runtime errors
- Environment-specific behavior

## Key Design Decisions

### 1. Next.js App Router

**Decision**: Use Next.js 15 with App Router instead of Pages Router.

**Rationale**:
- Better performance with nested layouts
- Improved SEO with server components
- Future-proof architecture
- Better code organization

### 2. TypeScript Throughout

**Decision**: Use TypeScript for all code, including configuration files.

**Rationale**:
- Compile-time type checking prevents runtime errors
- Better IDE support and developer experience
- Self-documenting code with types
- Easier refactoring and maintenance

### 3. JSON-based Data Storage

**Decision**: Store ingredient and supplier data as static JSON files.

**Rationale**:
- Simple deployment and versioning
- No database complexity for read-heavy data
- Easy to update and maintain
- Fast loading with caching

### 4. Redis Caching with Fallback

**Decision**: Use Redis for caching with automatic fallback to in-memory storage.

**Rationale**:
- High performance for frequently accessed data
- Graceful degradation when Redis is unavailable
- Scalable across multiple instances
- Easy to monitor and debug

### 5. Comprehensive Testing Strategy

**Decision**: Implement unit, integration, and end-to-end testing.

**Rationale**:
- Ensures code quality and prevents regressions
- Supports continuous integration
- Enables confident refactoring
- Validates user-facing functionality

## Data Flow

### Request Flow

1. **User Request**: Browser makes request to Next.js application
2. **Middleware**: i18n, security, and routing middleware execute
3. **Page Component**: Server component renders with data fetching
4. **Data Services**: Cached data services provide ingredient/supplier information
5. **API Routes**: Server-side API routes handle dynamic requests
6. **Response**: Optimized HTML/JSON returned to browser

### Caching Strategy

- **Browser Cache**: Static assets cached with appropriate headers
- **Server Cache**: Redis stores frequently accessed data
- **API Cache**: Short-lived caching for API responses
- **CDN Cache**: Vercel Edge Network caches globally

### State Management

- **Local State**: React useState for component-specific state
- **Global State**: Context providers for app-wide state
- **Server State**: Next.js server components for initial data
- **Persistent State**: Local storage for user preferences

## Security Architecture

### Multi-Layer Security

1. **Network Layer**:
   - HTTPS enforcement
   - Rate limiting on API endpoints
   - CORS configuration

2. **Application Layer**:
   - CSRF protection on forms
   - Input validation and sanitization
   - Age verification for content access

3. **Data Layer**:
   - GDPR compliance with cookie consent
   - Data minimization principles
   - Secure data transmission

### Authentication & Authorization

- **Age Verification**: Required for calculator access
- **Session Management**: Secure session handling
- **Access Control**: Route-based protection

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**:
   - Dynamic imports for large components
   - Route-based code splitting
   - Vendor chunk separation

2. **Caching Layers**:
   - Browser caching for static assets
   - Redis caching for data
   - Service worker for offline functionality

3. **Image Optimization**:
   - Next.js automatic image optimization
   - WebP format with fallbacks
   - Responsive images

4. **Bundle Optimization**:
   - Tree shaking for unused code
   - Minification and compression
   - Modern JavaScript targeting

### Monitoring & Metrics

- **Core Web Vitals**: Real user monitoring
- **Performance Budgets**: Build-time performance checks
- **Error Tracking**: Sentry integration for error monitoring
- **Analytics**: Usage patterns and performance metrics

## Testing Strategy

### Testing Pyramid

1. **Unit Tests** (Vitest):
   - Utility functions and business logic
   - Component rendering and interactions
   - API route handlers

2. **Integration Tests**:
   - Component integration
   - API to database interactions
   - Cross-component workflows

3. **End-to-End Tests** (Playwright):
   - Complete user journeys
   - Cross-browser compatibility
   - Accessibility compliance

### Test Organization

- **Colocation**: Tests alongside implementation files
- **Naming Convention**: `*.test.ts`, `*.spec.ts`
- **Mocking**: External dependencies and APIs
- **Coverage**: Minimum 80% coverage requirement

### Continuous Integration

- **Pre-commit Hooks**: ESLint and type checking
- **CI Pipeline**: Automated testing on every PR
- **Quality Gates**: Tests must pass before merge
- **Performance Checks**: Lighthouse CI integration

## Future Considerations

### Scalability

- **Microservices**: Potential split into separate services
- **Database**: Migration to database for dynamic content
- **CDN**: Enhanced global content delivery

### Maintainability

- **Documentation**: Automated API documentation generation
- **Code Quality**: Regular dependency updates and security audits
- **Developer Experience**: Improved tooling and onboarding

### Monitoring & Observability

- **Distributed Tracing**: Request tracing across services
- **Log Aggregation**: Centralized logging solution
- **Alerting**: Proactive issue detection and notification

This architecture provides a solid foundation for the Energy Drink Calculator App, balancing performance, security, maintainability, and user experience.