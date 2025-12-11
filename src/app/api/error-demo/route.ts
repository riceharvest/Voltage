/**
 * Error Handling Demonstration API Endpoint
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

import { NextRequest } from 'next/server';
import { withErrorHandling, AppException, ErrorType } from '@/lib/api-error-handling';
import { RetryHandler, ErrorLogger } from '@/lib/error-handling';

// Demo data
const demoData = [
  { id: 1, name: 'Energy Drink 1', caffeine: 80 },
  { id: 2, name: 'Energy Drink 2', caffeine: 120 },
  { id: 3, name: 'Energy Drink 3', caffeine: 160 }
];

// Simulate external service calls
const simulateExternalCall = async (serviceName: string, shouldFail: boolean = false) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  if (shouldFail) {
    throw new Error(`External service ${serviceName} failed`);
  }
  
  return { service: serviceName, status: 'success', timestamp: new Date() };
};

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const errorType = searchParams.get('error');
  const simulateSlow = searchParams.get('slow') === 'true';
  const simulateExternalFail = searchParams.get('externalFail') === 'true';
  
  console.log(`[Error Demo] Request: error=${errorType}, slow=${simulateSlow}, externalFail=${simulateExternalFail}`);

  // Simulate slow response
  if (simulateSlow) {
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Trigger specific error types for demonstration
  switch (errorType) {
    case 'validation':
      throw AppException.validation('Invalid parameter: name must be at least 3 characters', {
        parameter: 'name',
        provided: 'ab',
        expected: 'min 3 characters'
      });

    case 'not-found':
      const id = searchParams.get('id') || '999';
      throw AppException.notFound(`Energy drink with ID ${id} not found`, {
        requestedId: id,
        availableIds: demoData.map(d => d.id)
      });

    case 'unauthorized':
      throw AppException.unauthorized('Invalid API key provided');

    case 'forbidden':
      throw AppException.forbidden('User does not have permission to access this resource');

    case 'server-error':
      throw AppException.serverError('Database connection failed', {
        service: 'database',
        query: 'SELECT * FROM energy_drinks',
        timeout: 5000
      });

    case 'network':
      // Simulate network error by calling non-existent service
      const response = await fetch('https://non-existent-service.example.com/api/data');
      if (!response.ok) {
        throw AppException.networkError('Failed to fetch from external service', 
          new Error(`HTTP ${response.status}: ${response.statusText}`));
      }
      break;

    case 'timeout':
      // Simulate timeout
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(AppException.timeoutError('Request timeout after 3 seconds'));
        }, 3000);
      });
      break;

    case 'rate-limit':
      throw AppException.rateLimitError('Rate limit exceeded. Try again later', {
        limit: 100,
        window: '1 hour',
        retryAfter: 3600
      });

    case 'circuit-breaker':
      // Demonstrate circuit breaker with external service
      const circuitBreakerResult = await ErrorLogger.getCircuitBreaker('demo-external-service')
        .execute(() => simulateExternalCall('demo-service', simulateExternalFail));
      
      return new Response(JSON.stringify({
        success: true,
        data: circuitBreakerResult,
        message: 'Circuit breaker test completed'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    case 'retry':
      // Demonstrate retry mechanism
      const retryResult = await RetryHandler.withRetry(async () => {
        const shouldFail = Math.random() > 0.3; // 70% chance to fail
        return simulateExternalCall('retry-demo-service', shouldFail);
      }, {
        maxAttempts: 3,
        baseDelay: 1000,
        retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER_ERROR]
      });

      return new Response(JSON.stringify({
        success: true,
        data: retryResult,
        message: 'Retry mechanism test completed'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    case 'external-api':
      // Simulate external API error
      try {
        await simulateExternalCall('external-api', simulateExternalFail);
      } catch (error) {
        // This will be caught and formatted by the error handling middleware
        throw new Error('External API simulation failed');
      }
      break;

    case 'dependency':
      throw AppException.create({
        type: ErrorType.DEPENDENCY,
        message: 'Required dependency service is unavailable',
        statusCode: 503,
        context: {
          dependency: 'user-auth-service',
          lastCheck: new Date().toISOString(),
          impact: 'Cannot verify user permissions'
        },
        recoverable: true,
        retryable: true
      });

    case 'business-logic':
      throw AppException.create({
        type: ErrorType.BUSINESS_LOGIC,
        message: 'Caffeine content exceeds safe daily limit',
        statusCode: 422,
        context: {
          currentIntake: 450,
          dailyLimit: 400,
          userProfile: 'adult',
          recommendation: 'Reduce consumption'
        },
        recoverable: true,
        retryable: false
      });

    default:
      // Normal successful response
      return new Response(JSON.stringify({
        success: true,
        data: demoData,
        timestamp: new Date().toISOString(),
        message: 'Demo data retrieved successfully'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
  }

  // This should not be reached for most error cases
  return new Response(JSON.stringify({
    success: true,
    data: { message: 'Request completed' },
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

}, {
  timeoutMs: 10000, // 10 second timeout
  enableCircuitBreaker: true,
  circuitBreakerName: 'error-demo-endpoint'
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { action, data } = body;

    console.log(`[Error Demo POST] Action: ${action}`, data);

    switch (action) {
      case 'validate':
        if (!data.name || data.name.length < 3) {
          throw AppException.validation('Name must be at least 3 characters', {
            field: 'name',
            provided: data.name,
            minLength: 3
          });
        }
        break;

      case 'caffeine-check':
        const caffeine = parseInt(data.caffeine);
        if (isNaN(caffeine) || caffeine < 0 || caffeine > 500) {
          throw AppException.validation('Caffeine must be between 0 and 500mg', {
            field: 'caffeine',
            provided: data.caffeine,
            range: '0-500'
          });
        }
        break;

      case 'create-drink':
        // Simulate creating a new energy drink
        if (!data.name || !data.caffeine) {
          throw AppException.validation('Name and caffeine are required', {
            missingFields: ['name', 'caffeine'].filter(field => !data[field])
          });
        }

        // Simulate database error with 10% probability
        if (Math.random() < 0.1) {
          throw AppException.serverError('Failed to save energy drink to database', {
            operation: 'create',
            data,
            errorCode: 'DB_CONNECTION_FAILED'
          });
        }

        const newDrink = {
          id: Date.now(),
          name: data.name,
          caffeine: parseInt(data.caffeine),
          createdAt: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          data: newDrink,
          message: 'Energy drink created successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'trigger-error':
        const errorTypes = ['network', 'timeout', 'server-error', 'validation'];
        const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        
        // Recursively call this endpoint to trigger an error
        const errorResponse = await fetch(`${req.nextUrl.origin}/api/error-demo?error=${randomError}`);
        if (!errorResponse.ok) {
          throw AppException.serverError(`Failed to trigger error: ${randomError}`);
        }
        break;

      default:
        throw AppException.validation('Unknown action', {
          action,
          availableActions: ['validate', 'caffeine-check', 'create-drink', 'trigger-error']
        });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Action '${action}' completed successfully`,
      data,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Error Demo POST] Error:', error);
    throw error; // Let the error handling middleware deal with it
  }
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw AppException.validation('ID is required for update operations');
  }

  // Simulate updating an energy drink
  const body = await req.json();
  
  if (!body.name || !body.caffeine) {
    throw AppException.validation('Name and caffeine are required for updates');
  }

  // Simulate a 20% failure rate for demonstration
  if (Math.random() < 0.2) {
    throw AppException.serverError('Failed to update energy drink', {
      id,
      operation: 'update',
      reason: 'Database constraint violation'
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      id: parseInt(id),
      ...body,
      updatedAt: new Date().toISOString()
    },
    message: 'Energy drink updated successfully'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw AppException.validation('ID is required for delete operations');
  }

  // Check if the energy drink exists
  const drink = demoData.find(d => d.id === parseInt(id));
  if (!drink) {
    throw AppException.notFound(`Energy drink with ID ${id} not found`, {
      requestedId: id,
      availableIds: demoData.map(d => d.id)
    });
  }

  // Simulate a 15% failure rate for demonstration
  if (Math.random() < 0.15) {
    throw AppException.serverError('Failed to delete energy drink', {
      id,
      operation: 'delete',
      reason: 'Referential integrity constraint'
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: { id: parseInt(id), deleted: true },
    message: 'Energy drink deleted successfully'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});