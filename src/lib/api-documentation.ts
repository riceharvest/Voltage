/**
 * API Documentation and Developer Tools
 * 
 * Provides comprehensive API documentation, interactive testing,
 * SDK generation, code examples, and developer portal capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';

// Documentation Types
export interface APIDocumentation {
  title: string;
  version: string;
  description: string;
  servers: APIServer[];
  security: APISecurity[];
  tags: APITag[];
  paths: Record<string, APIPath>;
  components: APIComponents;
  externalDocs?: APIExternalDocs;
}

export interface APIServer {
  url: string;
  description: string;
  variables?: Record<string, APIServerVariable>;
}

export interface APIServerVariable {
  enum?: string[];
  default: string;
  description: string;
}

export interface APISecurity {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  flows?: Record<string, OAuthFlow>;
}

export interface OAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface APITag {
  name: string;
  description?: string;
  externalDocs?: APIExternalDocs;
}

export interface APIExternalDocs {
  description: string;
  url: string;
}

export interface APIPath {
  summary?: string;
  description?: string;
  parameters?: APIParameter[];
  responses: Record<string, APIResponse>;
  security?: APISecurity[];
  servers?: APIServer[];
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: APISchema;
  example?: any;
  examples?: Record<string, APIExample>;
}

export interface APIResponse {
  description: string;
  headers?: Record<string, APIHeader>;
  content?: Record<string, APIMediaType>;
  links?: Record<string, APILink>;
}

export interface APIHeader {
  description: string;
  schema: APISchema;
}

export interface APIMediaType {
  schema?: APISchema;
  example?: any;
  examples?: Record<string, APIExample>;
  encoding?: Record<string, APIEncoding>;
}

export interface APIExample {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface APIEncoding {
  contentType: string;
  headers?: Record<string, APIHeader>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface APILink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: APIServer;
}

export interface APIComponents {
  schemas?: Record<string, APISchema>;
  responses?: Record<string, APIResponse>;
  parameters?: Record<string, APIParameter>;
  examples?: Record<string, APIExample>;
  requestBodies?: Record<string, APIRequestBody>;
  headers?: Record<string, APIHeader>;
  securitySchemes?: Record<string, APISecurity>;
  links?: Record<string, APILink>;
  callbacks?: Record<string, APICallback>;
  traceId?: string;
}

export interface APISchema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, APISchema>;
  items?: APISchema;
  allOf?: APISchema[];
  oneOf?: APISchema[];
  anyOf?: APISchema[];
  not?: APISchema;
  additionalProperties?: APISchema | boolean;
  enum?: any[];
  default?: any;
  example?: any;
  examples?: any[];
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: APIXML;
  externalDocs?: APIExternalDocs;
  deprecated?: boolean;
}

export interface APIXML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface APIRequestBody {
  description?: string;
  content: Record<string, APIMediaType>;
  required?: boolean;
}

export interface APICallback {
  expression: string;
  traceId?: string;
}

// SDK Generation Types
export interface SDKConfig {
  language: SDKLanguage;
  framework?: string;
  version: string;
  packageName: string;
  author: string;
  license: string;
  description: string;
  baseUrl: string;
  authentication: SDKAuth;
  features: SDKFeature[];
}

export enum SDKLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  PHP = 'php',
  RUBY = 'ruby',
  GO = 'go',
  CSHARP = 'csharp',
  SWIFT = 'swift',
  KOTLIN = 'kotlin'
}

export enum SDKFeature {
  AUTHENTICATION = 'authentication',
  PAGINATION = 'pagination',
  RATE_LIMITING = 'rate-limiting',
  RETRY_LOGIC = 'retry-logic',
  ERROR_HANDLING = 'error-handling',
  VALIDATION = 'validation',
  SERIALIZATION = 'serialization',
  WEBHOOKS = 'webhooks',
  STREAMING = 'streaming',
  BATCH_OPERATIONS = 'batch-operations'
}

export interface SDKAuth {
  type: 'bearer' | 'api-key' | 'oauth2' | 'basic';
  name?: string;
  location?: 'header' | 'query' | 'cookie';
  scopes?: string[];
}

export interface SDKTemplate {
  files: SDKFile[];
  dependencies?: SDKDependency[];
  installation: string;
  usage: string;
}

export interface SDKFile {
  path: string;
  content: string;
  template: string;
}

export interface SDKDependency {
  name: string;
  version: string;
  type: 'runtime' | 'development' | 'peer';
}

// Interactive API Playground
export interface APIPlayground {
  endpoint: string;
  method: string;
  parameters: ParameterConfig[];
  requestBody?: RequestBodyConfig;
  responseSchema: APISchema;
  examples: PlaygroundExample[];
}

export interface ParameterConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  options?: any[];
  validation?: ValidationRule[];
}

export interface RequestBodyConfig {
  schema: APISchema;
  contentType: string;
  examples: Record<string, APIExample>;
}

export interface PlaygroundExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requestBody?: any;
  expectedResponse: any;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'required';
  value: any;
  message: string;
}

// API Documentation Generator
export class APIDocumentationGenerator {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private schemas: Map<string, APISchema> = new Map();
  private config: DocumentationConfig;

  constructor(config: DocumentationConfig) {
    this.config = config;
    this.initializeDefaultSchemas();
  }

  // Register API Endpoints
  registerEndpoint(endpoint: APIEndpoint): void {
    const path = `${endpoint.method.toLowerCase()} ${endpoint.path}`;
    this.endpoints.set(path, endpoint);
    
    // Auto-generate schema if not provided
    if (endpoint.responseSchema && !this.schemas.has(endpoint.responseSchema.$ref)) {
      this.schemas.set(endpoint.responseSchema.$ref, endpoint.responseSchema);
    }
  }

  registerSchema(name: string, schema: APISchema): void {
    this.schemas.set(name, schema);
  }

  // Generate OpenAPI Documentation
  generateOpenAPIDoc(): APIDocumentation {
    const paths: Record<string, APIPath> = {};
    
    for (const [path, endpoint] of this.endpoints) {
      const [method, url] = path.split(' ');
      
      const pathItem: APIPath = {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: this.generateParameters(endpoint.parameters),
        responses: this.generateResponses(endpoint.responses),
        tags: endpoint.tags,
        deprecated: endpoint.deprecated
      };

      paths[url] = { ...paths[url], [method.toLowerCase()]: pathItem };
    }

    return {
      title: this.config.title,
      version: this.config.version,
      description: this.config.description,
      servers: this.config.servers,
      security: this.config.security,
      tags: this.config.tags,
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
        securitySchemes: this.generateSecuritySchemes()
      },
      externalDocs: this.config.externalDocs
    };
  }

  // Generate Interactive Documentation
  generateInteractiveDocs(): InteractiveDocumentation {
    return {
      title: this.config.title,
      version: this.config.version,
      description: this.config.description,
      navigation: this.generateNavigation(),
      endpoints: this.generateEndpointDocs(),
      examples: this.generateCodeExamples(),
      playground: this.generatePlayground(),
      changelog: this.config.changelog,
      support: this.config.support
    };
  }

  // Generate Code Examples
  generateCodeExamples(): CodeExamples {
    const examples: Record<string, Record<string, string>> = {};
    
    for (const [path, endpoint] of this.endpoints) {
      const [method, url] = path.split(' ');
      const exampleKey = `${method.toLowerCase()}_${this.normalizePath(url)}`;
      
      examples[exampleKey] = {
        curl: this.generateCurlExample(method, url, endpoint),
        javascript: this.generateJavaScriptExample(method, url, endpoint),
        python: this.generatePythonExample(method, url, endpoint),
        java: this.generateJavaExample(method, url, endpoint)
      };
    }

    return examples;
  }

  private generateCurlExample(method: string, url: string, endpoint: APIEndpoint): string {
    let curl = `curl -X ${method.toUpperCase()} "${url}" \\\n`;
    
    // Add headers
    curl += '  -H "Content-Type: application/json" \\\n';
    curl += '  -H "Authorization: Bearer YOUR_TOKEN" \\\n';
    
    // Add parameters
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    if (queryParams.length > 0) {
      const queryString = queryParams.map(p => `  -G --data-urlencode "${p.name}=\${${p.name}}"`).join(' \\\n');
      curl += queryString + ' \\\n';
    }
    
    // Add request body
    if (endpoint.requestBody) {
      curl += '  -d \'{"example": "value"}\'';
    }
    
    return curl;
  }

  private generateJavaScriptExample(method: string, url: string, endpoint: APIEndpoint): string {
    let js = `// Using fetch API\nconst response = await fetch('${url}', {\n`;
    js += `  method: '${method.toUpperCase()}',\n`;
    js += `  headers: {\n`;
    js += `    'Content-Type': 'application/json',\n`;
    js += `    'Authorization': 'Bearer YOUR_TOKEN'\n`;
    js += `  },\n`;
    
    if (endpoint.requestBody) {
      js += `  body: JSON.stringify({\n`;
      js += `    example: 'value'\n`;
      js += `  })\n`;
    }
    
    js += `});\n\nconst data = await response.json();\n`;
    js += `console.log(data);`;
    
    return js;
  }

  private generatePythonExample(method: string, url: string, endpoint: APIEndpoint): string {
    let python = `import requests\n\n`;
    python += `response = requests.${method.toLowerCase()}(\n`;
    python += `    '${url}',\n`;
    python += `    headers={\n`;
    python += `        'Content-Type': 'application/json',\n`;
    python += `        'Authorization': 'Bearer YOUR_TOKEN'\n`;
    python += `    },\n`;
    
    if (endpoint.requestBody) {
      python += `    json={\n`;
      python += `        'example': 'value'\n`;
      python += `    }\n`;
    }
    
    python += `)\n\n`;
    python += `data = response.json()\n`;
    python += `print(data)`;
    
    return python;
  }

  private generateJavaExample(method: string, url: string, endpoint: APIEndpoint): string {
    let java = `import java.net.http.HttpClient;\n`;
    java += `import java.net.http.HttpRequest;\n`;
    java += `import java.net.http.HttpResponse;\n\n`;
    
    java += `HttpClient client = HttpClient.newHttpClient();\n\n`;
    java += `HttpRequest request = HttpRequest.newBuilder()\n`;
    java += `    .uri(URI.create("${url}"))\n`;
    java += `    .${method.toLowerCase()}(HttpRequest.BodyPublishers.ofString(\n`;
    java += `        "{\\"example\\": \\"value\\"}"\n`;
    java += `    ))\n`;
    java += `    .header("Content-Type", "application/json")\n`;
    java += `    .header("Authorization", "Bearer YOUR_TOKEN")\n`;
    java += `    .build();\n\n`;
    
    java += `HttpResponse<String> response = client.send(request,\n`;
    java += `    HttpResponse.BodyHandlers.ofString());\n\n`;
    java += `System.out.println(response.body());`;
    
    return java;
  }

  // Generate SDK
  async generateSDK(config: SDKConfig): Promise<SDKTemplate> {
    const templates = this.getSDKTemplates();
    const template = templates[config.language];
    
    if (!template) {
      throw new Error(`SDK template not found for language: ${config.language}`);
    }

    return this.processTemplate(template, config);
  }

  private getSDKTemplates(): Record<SDKLanguage, string[]> {
    return {
      [SDKLanguage.JAVASCRIPT]: [
        'package.json',
        'src/client.js',
        'src/auth.js',
        'src/endpoints/flavors.js',
        'src/endpoints/ingredients.js',
        'README.md'
      ],
      [SDKLanguage.TYPESCRIPT]: [
        'package.json',
        'src/client.ts',
        'src/types.ts',
        'src/auth.ts',
        'src/endpoints/flavors.ts',
        'src/endpoints/ingredients.ts',
        'README.md'
      ],
      [SDKLanguage.PYTHON]: [
        'setup.py',
        'voltage_soda/__init__.py',
        'voltage_soda/client.py',
        'voltage_soda/auth.py',
        'voltage_soda/endpoints/flavors.py',
        'voltage_soda/endpoints/ingredients.py',
        'README.md'
      ],
      [SDKLanguage.JAVA]: [
        'pom.xml',
        'src/main/java/com/voltagesoda/Client.java',
        'src/main/java/com/voltagesoda/Auth.java',
        'src/main/java/com/voltagesoda/endpoints/FlavorsEndpoint.java',
        'README.md'
      ],
      [SDKLanguage.PHP]: [
        'composer.json',
        'src/Client.php',
        'src/Auth.php',
        'src/Endpoints/Flavors.php',
        'src/Endpoints/Ingredients.php',
        'README.md'
      ],
      [SDKLanguage.RUBY]: [
        'voltage_soda.gemspec',
        'lib/voltage_soda/client.rb',
        'lib/voltage_soda/auth.rb',
        'lib/voltage_soda/endpoints/flavors.rb',
        'README.md'
      ],
      [SDKLanguage.GO]: [
        'go.mod',
        'client.go',
        'auth.go',
        'endpoints/flavors.go',
        'endpoints/ingredients.go',
        'README.md'
      ],
      [SDKLanguage.CSHARP]: [
        'VoltageSoda.sln',
        'VoltageSoda/Client.cs',
        'VoltageSoda/Auth.cs',
        'VoltageSoda/Endpoints/Flavors.cs',
        'VoltageSoda/Endpoints/Ingredients.cs',
        'README.md'
      ],
      [SDKLanguage.SWIFT]: [
        'Package.swift',
        'Sources/VoltageSoda/Client.swift',
        'Sources/VoltageSoda/Auth.swift',
        'Sources/VoltageSoda/Endpoints/Flavors.swift',
        'README.md'
      ],
      [SDKLanguage.KOTLIN]: [
        'build.gradle.kts',
        'src/main/kotlin/com/voltagesoda/Client.kt',
        'src/main/kotlin/com/voltagesoda/Auth.kt',
        'src/main/kotlin/com/voltagesoda/endpoints/Flavors.kt',
        'README.md'
      ]
    };
  }

  private processTemplate(template: string[], config: SDKConfig): SDKTemplate {
    const files: SDKFile[] = [];
    const dependencies: SDKDependency[] = [];

    for (const fileName of template) {
      const content = this.generateFileContent(fileName, config);
      files.push({
        path: fileName,
        content,
        template: fileName
      });
    }

    return {
      files,
      dependencies: this.getDefaultDependencies(config.language),
      installation: this.getInstallationInstructions(config.language),
      usage: this.getUsageInstructions(config.language)
    };
  }

  private generateFileContent(fileName: string, config: SDKConfig): string {
    // Template generation logic for different files
    switch (fileName) {
      case 'README.md':
        return this.generateReadme(config);
      case 'package.json':
        return this.generatePackageJson(config);
      case 'src/client.js':
        return this.generateJavaScriptClient(config);
      default:
        return `// Generated file: ${fileName}`;
    }
  }

  private generateReadme(config: SDKConfig): string {
    return `# ${config.packageName}

${config.description}

## Installation

${this.getInstallationInstructions(config.language)}

## Quick Start

\`\`\`${config.language === 'javascript' ? 'javascript' : 'text'}
${this.getUsageInstructions(config.language)}
\`\`\`

## Authentication

This SDK supports ${config.authentication.type} authentication.

## Features

${config.features.map(feature => `- ${feature.replace('-', ' ').toUpperCase()}`).join('\n')}

## API Coverage

${Array.from(this.endpoints.values()).map(ep => `- ${ep.method} ${ep.path}`).join('\n')}

## License

${config.license}

## Support

For support, contact ${config.author} or visit our [documentation](${this.config.externalDocs?.url || '#'}).
`;
  }

  private generatePackageJson(config: SDKConfig): string {
    return JSON.stringify({
      name: config.packageName,
      version: config.version,
      description: config.description,
      main: config.framework === 'commonjs' ? 'dist/client.js' : 'dist/client.mjs',
      scripts: {
        build: 'tsc',
        test: 'jest',
        lint: 'eslint src/**/*.ts'
      },
      dependencies: {
        'axios': '^1.0.0',
        'form-data': '^4.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0',
        'eslint': '^8.0.0'
      },
      keywords: ['api', 'voltage-soda', 'soda-recipes'],
      author: config.author,
      license: config.license
    }, null, 2);
  }

  private generateJavaScriptClient(config: SDKConfig): string {
    return `import axios from 'axios';

class VoltageSodaClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '${config.baseUrl}';
    this.apiKey = options.apiKey;
    this.accessToken = options.accessToken;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = \`Bearer \${this.accessToken}\`;
      } else if (this.apiKey) {
        config.headers['X-API-Key'] = this.apiKey;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Flavor endpoints
  async getFlavors(params = {}) {
    const response = await this.client.get('/api/flavors', { params });
    return response.data;
  }

  async getFlavor(id) {
    const response = await this.client.get(\`/api/flavors/\${id}\`);
    return response.data;
  }

  // Ingredient endpoints
  async getIngredients(params = {}) {
    const response = await this.client.get('/api/ingredients', { params });
    return response.data;
  }

  async searchIngredients(query) {
    const response = await this.client.get('/api/ingredients/search', {
      params: { q: query }
    });
    return response.data;
  }
}

export default VoltageSodaClient;
`;
  }

  private getInstallationInstructions(language: SDKLanguage): string {
    const instructions = {
      [SDKLanguage.JAVASCRIPT]: 'npm install voltage-soda-sdk',
      [SDKLanguage.TYPESCRIPT]: 'npm install voltage-soda-sdk',
      [SDKLanguage.PYTHON]: 'pip install voltage-soda-sdk',
      [SDKLanguage.JAVA]: 'Add dependency to your build.gradle or pom.xml',
      [SDKLanguage.PHP]: 'composer require voltage-soda/sdk',
      [SDKLanguage.RUBY]: 'gem install voltage_soda',
      [SDKLanguage.GO]: 'go get github.com/voltage-soda/sdk',
      [SDKLanguage.CSHARP]: 'dotnet add package VoltageSoda.SDK',
      [SDKLanguage.SWIFT]: 'Add to your Package.swift dependencies',
      [SDKLanguage.KOTLIN]: 'Add to your build.gradle dependencies'
    };
    
    return instructions[language];
  }

  private getUsageInstructions(language: SDKLanguage): string {
    const instructions = {
      [SDKLanguage.JAVASCRIPT]: `import VoltageSodaClient from 'voltage-soda-sdk';

const client = new VoltageSodaClient({
  apiKey: 'your-api-key'
});

const flavors = await client.getFlavors();`,
      [SDKLanguage.TYPESCRIPT]: `import VoltageSodaClient from 'voltage-soda-sdk';

const client = new VoltageSodaClient({
  apiKey: 'your-api-key'
});

const flavors: Flavor[] = await client.getFlavors();`,
      [SDKLanguage.PYTHON]: `from voltage_soda import VoltageSodaClient

client = VoltageSodaClient(api_key='your-api-key')
flavors = client.get_flavors()`,
      [SDKLanguage.JAVA]: `VoltageSodaClient client = new VoltageSodaClient("your-api-key");
List<Flavor> flavors = client.getFlavors();`,
      [SDKLanguage.PHP]: `use VoltageSoda\\Client;

$client = new Client(['api_key' => 'your-api-key']);
$flavors = $client->getFlavors();`,
      [SDKLanguage.RUBY]: `require 'voltage_soda'

client = VoltageSoda::Client.new(api_key: 'your-api-key')
flavors = client.flavors`,
      [SDKLanguage.GO]: `client := voltagesoda.NewClient("your-api-key")
flavors, err := client.GetFlavors()`,
      [SDKLanguage.CSHARP]: `var client = new VoltageSodaClient("your-api-key");
var flavors = await client.GetFlavorsAsync();`,
      [SDKLanguage.SWIFT]: `let client = VoltageSodaClient(apiKey: "your-api-key")
let flavors = try await client.getFlavors()`,
      [SDKLanguage.KOTLIN]: `val client = VoltageSodaClient("your-api-key")
val flavors = client.getFlavors()`
    };
    
    return instructions[language];
  }

  private getDefaultDependencies(language: SDKLanguage): SDKDependency[] {
    const dependencies = {
      [SDKLanguage.JAVASCRIPT]: [
        { name: 'axios', version: '^1.0.0', type: 'runtime' }
      ],
      [SDKLanguage.TYPESCRIPT]: [
        { name: 'axios', version: '^1.0.0', type: 'runtime' },
        { name: 'typescript', version: '^5.0.0', type: 'development' }
      ],
      [SDKLanguage.PYTHON]: [
        { name: 'requests', version: '^2.28.0', type: 'runtime' }
      ],
      [SDKLanguage.JAVA]: [
        { name: 'okhttp', version: '4.10.0', type: 'runtime' }
      ]
    };
    
    return dependencies[language] || [];
  }

  // Helper Methods
  private initializeDefaultSchemas(): void {
    // Initialize with common schemas
    this.schemas.set('Error', {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        code: { type: 'string' }
      },
      required: ['error', 'message']
    });
  }

  private generateParameters(endpoint: APIParameter[]): APIParameter[] | undefined {
    if (!endpoint || endpoint.length === 0) return undefined;
    
    return endpoint.map(param => ({
      name: param.name,
      in: param.in,
      required: param.required,
      description: param.description,
      schema: param.schema,
      example: param.example
    }));
  }

  private generateResponses(endpoint: APIResponse[]): Record<string, APIResponse> {
    const responses: Record<string, APIResponse> = {};
    
    for (const response of endpoint) {
      responses[response.status] = response;
    }
    
    return responses;
  }

  private generateSecuritySchemes(): Record<string, APISecurity> {
    return {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    };
  }

  private generateNavigation(): NavigationItem[] {
    return [
      {
        title: 'Getting Started',
        items: [
          { title: 'Introduction', href: '#introduction' },
          { title: 'Authentication', href: '#authentication' },
          { title: 'Base URL', href: '#base-url' }
        ]
      },
      {
        title: 'API Reference',
        items: [
          { title: 'Flavors', href: '#flavors' },
          { title: 'Ingredients', href: '#ingredients' },
          { title: 'Suppliers', href: '#suppliers' },
          { title: 'Amazon Integration', href: '#amazon' }
        ]
      },
      {
        title: 'Guides',
        items: [
          { title: 'Rate Limiting', href: '#rate-limiting' },
          { title: 'Error Handling', href: '#error-handling' },
          { title: 'SDK Usage', href: '#sdk' }
        ]
      }
    ];
  }

  private generateEndpointDocs(): EndpointDocumentation[] {
    return Array.from(this.endpoints.values()).map(endpoint => ({
      id: `${endpoint.method.toLowerCase()}-${this.normalizePath(endpoint.path)}`,
      method: endpoint.method,
      path: endpoint.path,
      summary: endpoint.summary,
      description: endpoint.description,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      examples: endpoint.examples,
      tags: endpoint.tags
    }));
  }

  private generatePlayground(): PlaygroundConfig {
    return {
      enabled: true,
      environments: ['development', 'staging', 'production'],
      defaultEnvironment: 'development',
      authMethods: ['bearer', 'api-key'],
      variables: {
        baseUrl: {
          development: 'https://api.dev.voltagesoda.com',
          staging: 'https://api.staging.voltagesoda.com',
          production: 'https://api.voltagesoda.com'
        }
      }
    };
  }

  private normalizePath(path: string): string {
    return path.replace(/[^\w]/g, '-').toLowerCase();
  }
}

// Supporting Types
export interface APIEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags: string[];
  deprecated?: boolean;
  examples?: CodeExample[];
}

export interface CodeExample {
  language: string;
  code: string;
  description?: string;
}

export interface DocumentationConfig {
  title: string;
  version: string;
  description: string;
  servers: APIServer[];
  security: APISecurity[];
  tags: APITag[];
  externalDocs?: APIExternalDocs;
  changelog?: ChangelogEntry[];
  support?: SupportInfo;
}

export interface InteractiveDocumentation {
  title: string;
  version: string;
  description: string;
  navigation: NavigationItem[];
  endpoints: EndpointDocumentation[];
  examples: Record<string, Record<string, string>>;
  playground: PlaygroundConfig;
  changelog?: ChangelogEntry[];
  support?: SupportInfo;
}

export interface NavigationItem {
  title: string;
  items: { title: string; href: string }[];
}

export interface EndpointDocumentation {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples?: CodeExample[];
  tags: string[];
}

export interface CodeExamples {
  [key: string]: {
    curl: string;
    javascript: string;
    python: string;
    java: string;
  };
}

export interface PlaygroundConfig {
  enabled: boolean;
  environments: string[];
  defaultEnvironment: string;
  authMethods: string[];
  variables: Record<string, Record<string, string>>;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  breaking?: boolean;
}

export interface SupportInfo {
  email?: string;
  documentation?: string;
  status?: string;
  sla?: string;
}

// Default Configuration
export const DEFAULT_DOCUMENTATION_CONFIG: DocumentationConfig = {
  title: 'Voltage Soda Platform API',
  version: '2.0.0',
  description: 'Comprehensive API for the global soda platform with recipe management, ingredient tracking, and third-party integrations.',
  servers: [
    {
      url: 'https://api.voltagesoda.com',
      description: 'Production server'
    },
    {
      url: 'https://api.staging.voltagesoda.com',
      description: 'Staging server'
    },
    {
      url: 'https://api.dev.voltagesoda.com',
      description: 'Development server'
    }
  ],
  security: [
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    }
  ],
  tags: [
    { name: 'flavors', description: 'Recipe and flavor management' },
    { name: 'ingredients', description: 'Ingredient data and search' },
    { name: 'suppliers', description: 'Supplier and pricing information' },
    { name: 'amazon', description: 'Amazon Product Advertising API integration' },
    { name: 'calculator', description: 'Recipe calculation and scaling' },
    { name: 'analytics', description: 'Usage analytics and reporting' },
    { name: 'admin', description: 'Administrative operations' }
  ],
  externalDocs: {
    description: 'Find more information about the Voltage Soda Platform',
    url: 'https://docs.voltagesoda.com'
  },
  changelog: [
    {
      version: '2.0.0',
      date: '2025-12-10',
      changes: [
        'Added GraphQL API support',
        'Enhanced webhook system',
        'Improved rate limiting',
        'Added batch processing capabilities'
      ],
      breaking: true
    }
  ],
  support: {
    email: 'api-support@voltagesoda.com',
    documentation: 'https://docs.voltagesoda.com',
    status: 'https://status.voltagesoda.com',
    sla: '99.9% uptime guarantee'
  }
};