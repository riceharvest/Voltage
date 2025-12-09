# Code Style Guide and Best Practices

This document outlines the coding standards, style guidelines, and best practices for the Energy Drink Calculator App.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [React/Next.js Patterns](#reactnextjs-patterns)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Code Formatting](#code-formatting)
- [Error Handling](#error-handling)
- [Performance Best Practices](#performance-best-practices)
- [Security Guidelines](#security-guidelines)
- [Testing Standards](#testing-standards)

## General Principles

### Code Quality

- **Readability First**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns throughout the codebase
- **Maintainability**: Write code that is easy to modify and extend
- **Performance**: Consider performance implications of code changes

### Best Practices

- Keep functions small and focused on a single responsibility
- Use descriptive variable and function names
- Avoid magic numbers and strings
- Prefer immutable data structures
- Handle errors gracefully
- Write comprehensive tests

## TypeScript Guidelines

### Type Definitions

```typescript
// ✅ Good: Explicit types for clarity
interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  preferences: UserPreferences;
}

// ✅ Good: Use union types for constrained values
type Environment = 'development' | 'staging' | 'production';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ❌ Avoid: any type usage
function processData(data: any) { // Don't do this
  // ...
}

// ✅ Good: Use unknown for truly unknown data
function processData(data: unknown) {
  if (typeof data === 'string') {
    // Handle string case
  }
}
```

### Type Assertions

```typescript
// ✅ Good: Use type assertions sparingly and safely
const user = userData as UserProfile;

// ✅ Better: Use type guards
function isUserProfile(data: unknown): data is UserProfile {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}
```

### Generics

```typescript
// ✅ Good: Use generics for reusable components
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  return response.json();
}
```

## React/Next.js Patterns

### Component Structure

```typescript
// ✅ Good: Functional components with proper typing
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Hooks Usage

```typescript
// ✅ Good: Custom hooks for reusable logic
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Server Components

```typescript
// ✅ Good: Server components for data fetching
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUserData(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ Good: Client components for interactivity
'use client';

function InteractiveChart({ data }: { data: ChartData[] }) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  return (
    <Chart
      data={data}
      onPointClick={setSelectedPoint}
      selectedPoint={selectedPoint}
    />
  );
}
```

## File Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── calculator/        # Calculator page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── calculator/       # Calculator-specific components
│   └── layout/           # Layout components
├── lib/                   # Utility functions and services
│   ├── cache.ts          # Caching logic
│   ├── config.ts         # Configuration management
│   └── logger.ts         # Logging utilities
├── data/                  # Static data files
│   ├── ingredients/
│   ├── suppliers/
│   └── safety/
└── types/                 # TypeScript type definitions
```

### File Naming

- Use kebab-case for file names: `user-profile.tsx`
- Use PascalCase for component files: `Button.tsx`
- Use camelCase for utility files: `formatDate.ts`
- Group related files in directories
- Use `index.ts` for barrel exports

### Imports

```typescript
// ✅ Good: Group and sort imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getUserData } from '@/lib/user-service';
import type { UserProfile } from '@/types/user';

// ❌ Avoid: Unorganized imports
import { getUserData } from '@/lib/user-service';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
```

## Naming Conventions

### Variables and Functions

```typescript
// ✅ Good: Descriptive names
const userProfile = getUserProfile(userId);
const isValidEmail = validateEmailFormat(email);

// ❌ Avoid: Abbreviations or unclear names
const usrProf = getUsrProf(uid);
const valid = checkEmail(em);
```

### Constants

```typescript
// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const CACHE_TTL_SECONDS = 3600;
const API_BASE_URL = 'https://api.example.com';
```

### Components

```typescript
// ✅ Good: PascalCase for component names
function UserProfileCard() {
  return <div>...</div>;
}

// ✅ Good: Component file names match component names
// UserProfileCard.tsx
export function UserProfileCard() { ... }
```

### Hooks

```typescript
// ✅ Good: use* prefix for custom hooks
function useLocalStorage<T>(key: string, initialValue: T) { ... }
function useDebounce<T>(value: T, delay: number) { ... }
```

## Code Formatting

### ESLint Configuration

The project uses ESLint with Next.js recommended rules:

- `eslint-config-next/core-web-vitals` for performance
- `eslint-config-next/typescript` for TypeScript
- Custom rules for project-specific standards

### Prettier Configuration

Code formatting is handled by Prettier with these settings:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Formatting Rules

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in ES5-compatible places
- Limit line length to 80 characters

## Error Handling

### Error Boundaries

```typescript
// ✅ Good: Use error boundaries for React components
class ErrorBoundary extends Component {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// ✅ Good: Structured error handling for API calls
async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw new Error('Unable to load user data. Please try again.');
  }
}
```

### Validation

```typescript
// ✅ Good: Input validation with descriptive errors
function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}
```

## Performance Best Practices

### React Optimization

```typescript
// ✅ Good: Use React.memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
  onChange
}: ExpensiveComponentProps) {
  return (
    <div>
      {data.map(item => (
        <Item key={item.id} item={item} onChange={onChange} />
      ))}
    </div>
  );
});

// ✅ Good: Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.filter(item => item.active).map(processItem);
}, [data]);

// ✅ Good: Use useCallback for event handlers
const handleClick = useCallback(() => {
  setCount(count => count + 1);
}, []);
```

### Data Fetching

```typescript
// ✅ Good: Implement proper loading states
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const userData = await fetchUsers();
        setUsers(userData);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  return <UserGrid users={users} />;
}
```

### Bundle Optimization

- Use dynamic imports for code splitting
- Lazy load components and routes
- Optimize images and assets
- Minimize bundle size

## Security Guidelines

### Input Validation

```typescript
// ✅ Good: Sanitize and validate all inputs
import DOMPurify from 'dompurify';

function sanitizeHtmlInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

function validateUserInput(input: string): boolean {
  // Implement validation logic
  const maxLength = 1000;
  const allowedChars = /^[a-zA-Z0-9\s\-_.]+$/;

  return input.length <= maxLength && allowedChars.test(input);
}
```

### Authentication & Authorization

- Never store sensitive data in localStorage
- Use HTTP-only cookies for session tokens
- Implement proper session management
- Validate user permissions on both client and server

### API Security

- Use HTTPS for all API calls
- Implement rate limiting
- Validate API inputs on the server
- Use CSRF protection for state-changing operations

## Testing Standards

### Unit Tests

```typescript
// ✅ Good: Test pure functions thoroughly
describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('handles zero values', () => {
    expect(formatCurrency(0, 'EUR')).toBe('€0.00');
  });

  it('rounds decimal places', () => {
    expect(formatCurrency(123.456, 'USD')).toBe('$123.46');
  });
});
```

### Component Tests

```typescript
// ✅ Good: Test component behavior
describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Cover happy path and error scenarios
- Test edge cases and boundary conditions
- Include integration tests for critical paths

### Testing Best Practices

- Use descriptive test names
- Arrange, Act, Assert pattern
- Mock external dependencies
- Test one thing per test
- Keep tests fast and reliable

This style guide ensures consistency, maintainability, and quality across the codebase. All team members should familiarize themselves with these guidelines and follow them in their daily development work.