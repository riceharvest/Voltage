#!/usr/bin/env node

/**
 * OpenAPI Specification Generator
 *
 * This script analyzes the API routes in src/app/api/ and generates
 * an OpenAPI 3.0 specification file that can be used for automated
 * API documentation.
 */

const fs = require('fs');
const path = require('path');

const API_BASE_PATH = path.join(__dirname, '..', 'src', 'app', 'api');

/**
 * Analyze a route file to extract endpoint information
 */
function analyzeRouteFile(filePath, routePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const endpoints = [];

  // Extract exported functions (GET, POST, DELETE, etc.)
  const exportMatches = content.match(/export async function (\w+)/g) || [];

  exportMatches.forEach(match => {
    const method = match.replace('export async function ', '').toUpperCase();

    // Extract JSDoc comments for description
    const methodIndex = content.indexOf(match);
    const commentStart = content.lastIndexOf('/**', methodIndex);
    const commentEnd = content.indexOf('*/', commentStart);

    let description = '';
    let summary = '';
    if (commentStart !== -1 && commentEnd !== -1 && commentEnd > methodIndex) {
      const comment = content.substring(commentStart + 3, commentEnd);
      const lines = comment.split('\n').map(line => line.trim().replace(/^\*\s*/, ''));

      summary = lines.find(line => !line.startsWith('@')) || '';
      description = lines.filter(line => !line.startsWith('@')).join(' ').trim();
    }

    // Extract parameters from function signature and body
    const functionStart = content.indexOf(match);
    const functionEnd = content.indexOf('\n}', functionStart) + 2;
    const functionBody = content.substring(functionStart, functionEnd);

    const parameters = [];

    // Check for query parameters
    if (functionBody.includes('searchParams.get(')) {
      const paramMatches = functionBody.match(/searchParams\.get\('([^']+)'\)/g) || [];
      paramMatches.forEach(match => {
        const paramName = match.replace("searchParams.get('", '').replace("')", '');
        parameters.push({
          name: paramName,
          in: 'query',
          schema: { type: 'string' },
          description: `Query parameter: ${paramName}`
        });
      });
    }

    // Check for JSON body
    let requestBody = null;
    if (method === 'POST' || method === 'PUT') {
      if (functionBody.includes('await request.json()')) {
        requestBody = {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Request body'
              }
            }
          }
        };
      }
    }

    // Determine response schema based on endpoint
    let responseSchema = { type: 'object' };

    if (routePath.includes('/health')) {
      responseSchema = {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          environment: { type: 'string' }
        }
      };
    } else if (routePath.includes('/csrf-token')) {
      responseSchema = {
        type: 'object',
        properties: {
          csrfToken: { type: 'string' }
        }
      };
    } else if (routePath.includes('/auth/check-verification')) {
      responseSchema = {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          age: { type: 'number' },
          verificationDate: { type: 'string', format: 'date-time' }
        }
      };
    } else if (routePath.includes('/auth/verify-age')) {
      responseSchema = {
        type: 'object',
        properties: {
          success: { type: 'boolean' }
        }
      };
    } else if (routePath.includes('/feature-flags')) {
      if (method === 'GET') {
        responseSchema = {
          type: 'object',
          properties: {
            flags: {
              type: 'array',
              items: { $ref: '#/components/schemas/FeatureFlag' }
            },
            stats: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                enabled: { type: 'number' },
                disabled: { type: 'number' }
              }
            }
          }
        };
      } else {
        responseSchema = {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            flag: { $ref: '#/components/schemas/FeatureFlag' }
          }
        };
      }
    } else if (routePath.includes('/gdpr/status')) {
      responseSchema = {
        type: 'object',
        properties: {
          isEU: { type: 'boolean' },
          hasConsent: { type: 'boolean' },
          consentRequired: { type: 'boolean' }
        }
      };
    } else if (routePath.includes('/gdpr/data')) {
      if (method === 'GET') {
        responseSchema = {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                ageVerified: { type: 'boolean' },
                verificationTimestamp: { type: 'string', format: 'date-time' },
                dataRetentionDays: { type: 'number' },
                dataPurposes: { type: 'array', items: { type: 'string' } },
                dataRecipients: { type: 'array', items: { type: 'string' } },
                legalBasis: { type: 'string' }
              }
            },
            rights: {
              type: 'object',
              properties: {
                access: { type: 'boolean' },
                rectification: { type: 'boolean' },
                erasure: { type: 'boolean' },
                restriction: { type: 'boolean' },
                portability: { type: 'boolean' },
                objection: { type: 'boolean' }
              }
            }
          }
        };
      } else {
        responseSchema = {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        };
      }
    }

    const responses = {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: responseSchema
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      },
      '403': {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      }
    };

    // Add specific responses based on endpoint
    if (routePath.includes('/auth/verify-age') && method === 'POST') {
      responses['403'] = {
        description: 'Age verification failed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'You must be at least 18 years old' }
              }
            }
          }
        }
      };
    }

    endpoints.push({
      method: method.toLowerCase(),
      summary: summary || `${method} ${routePath}`,
      description,
      parameters,
      requestBody,
      responses
    });
  });

  return endpoints;
}

/**
 * Recursively scan API directory for routes
 */
function scanApiRoutes(dirPath, currentPath = '') {
  const routes = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Check if this directory has a route.ts file
      const routeFile = path.join(fullPath, 'route.ts');
      if (fs.existsSync(routeFile)) {
        const routePath = `${currentPath}/${item}`;
        const endpoints = analyzeRouteFile(routeFile, routePath);
        routes.push(...endpoints.map(endpoint => ({
          ...endpoint,
          path: routePath
        })));
      } else {
        // Recurse into subdirectory
        routes.push(...scanApiRoutes(fullPath, `${currentPath}/${item}`));
      }
    }
  }

  return routes;
}

/**
 * Generate OpenAPI specification
 */
function generateOpenAPISpec(routes) {
  const paths = {};

  routes.forEach(route => {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    paths[route.path][route.method] = {
      summary: route.summary,
      description: route.description,
      parameters: route.parameters,
      requestBody: route.requestBody,
      responses: route.responses,
      security: [
        {
          cookieAuth: []
        }
      ]
    };

    // Add CSRF requirement for state-changing operations
    if (['post', 'put', 'delete'].includes(route.method)) {
      paths[route.path][route.method].security.push({
        csrfAuth: []
      });
    }
  });

  const openapiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Energy Drink App API',
      version: '1.0.0',
      description: 'API for the Energy Drink Calculator and Recipe Application',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server'
      }
    ],
    security: [
      {
        cookieAuth: []
      }
    ],
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'age-verified'
        },
        csrfAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token'
        }
      },
      schemas: {
        FeatureFlag: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            rolloutPercentage: { type: 'number', minimum: 0, maximum: 100 },
            conditions: {
              type: 'object',
              properties: {
                userId: { type: 'array', items: { type: 'string' } },
                environment: { type: 'array', items: { type: 'string' } },
                custom: { type: 'object' }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                owner: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          required: ['name', 'enabled']
        },
        ConsentData: {
          type: 'object',
          properties: {
            necessary: { type: 'boolean' },
            analytics: { type: 'boolean' },
            marketing: { type: 'boolean' },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' }
          },
          required: ['necessary', 'timestamp', 'version']
        },
        UserData: {
          type: 'object',
          properties: {
            ageVerified: { type: 'boolean' },
            verificationTimestamp: { type: 'string', format: 'date-time' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' }
          }
        }
      }
    }
  };

  return openapiSpec;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Analyzing API routes...');

  const routes = scanApiRoutes(API_BASE_PATH);
  console.log(`📊 Found ${routes.length} API endpoints`);

  const openapiSpec = generateOpenAPISpec(routes);

  const outputPath = path.join(__dirname, '..', 'docs', 'openapi-spec.json');
  fs.writeFileSync(outputPath, JSON.stringify(openapiSpec, null, 2));

  console.log(`✅ OpenAPI specification generated: ${outputPath}`);
  console.log('🚀 You can now use this file with Swagger UI or other OpenAPI tools');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateOpenAPISpec, scanApiRoutes, analyzeRouteFile };