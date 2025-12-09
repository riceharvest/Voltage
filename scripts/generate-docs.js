#!/usr/bin/env node

/**
 * Automated Documentation Generator
 *
 * This script generates comprehensive documentation for the Energy Drink Calculator App
 * including API documentation, component documentation, and TypeScript API docs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const SRC_DIR = path.join(__dirname, '..', 'src');

/**
 * Generate TypeScript API documentation using TypeDoc
 */
function generateTypeScriptDocs() {
  console.log('🔧 Generating TypeScript API documentation...');

  try {
    // Check if typedoc is available
    execSync('npx typedoc --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  TypeDoc not found. Installing...');
    execSync('npm install --save-dev typedoc', { stdio: 'inherit' });
  }

  const typedocConfig = {
    entryPoints: [
      "src/lib/**/*.ts",
      "src/components/**/*.tsx",
      "src/app/api/**/*.ts"
    ],
    out: path.join(DOCS_DIR, 'api'),
    exclude: [
      "**/node_modules/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.config.ts"
    ],
    includeVersion: true,
    excludeExternals: true,
    excludePrivate: true,
    excludeProtected: true,
    hideGenerator: true,
    theme: 'default',
    name: 'Energy Drink App API',
    readme: path.join(DOCS_DIR, 'api-readme.md'),
    plugin: ['typedoc-plugin-markdown']
  };

  // Write typedoc config
  const configPath = path.join(__dirname, '..', 'typedoc.json');
  fs.writeFileSync(configPath, JSON.stringify(typedocConfig, null, 2));

  try {
    execSync('npx typedoc --options typedoc.json', { stdio: 'inherit' });
    console.log('✅ TypeScript API documentation generated');
  } catch (error) {
    console.log('⚠️  TypeDoc generation failed, but continuing...');
  }

  // Clean up config
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

/**
 * Generate component documentation by analyzing React components
 */
function generateComponentDocs() {
  console.log('🔧 Generating component documentation...');

  const components = [];
  const componentsDir = path.join(SRC_DIR, 'components');

  function scanComponents(dir, prefix = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanComponents(fullPath, prefix ? `${prefix}/${item}` : item);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(SRC_DIR, fullPath);

        // Extract component info
        const componentMatch = content.match(/export (?:default )?(?:function|const) (\w+)/);
        if (componentMatch) {
          const componentName = componentMatch[1];

          // Extract JSDoc comments
          const jsdocMatch = content.match(/\/\*\*\s*\n(?:\s*\*\s*[^*]*\n)*\s*\*\//);
          let description = '';
          let props = [];

          if (jsdocMatch) {
            const jsdoc = jsdocMatch[0];
            const lines = jsdoc.split('\n').map(line => line.replace(/^\s*\*\s*/, '').trim());

            description = lines.find(line => !line.startsWith('@')) || '';

            // Extract @param tags for props
            const paramMatches = jsdoc.match(/@param\s+{([^}]+)}\s+(\w+)\s*-?\s*(.*)/g);
            if (paramMatches) {
              props = paramMatches.map(match => {
                const [, type, name, desc] = match.match(/@param\s+{([^}]+)}\s+(\w+)\s*-?\s*(.*)/);
                return { name, type, description: desc };
              });
            }
          }

          components.push({
            name: componentName,
            file: relativePath,
            description,
            props
          });
        }
      }
    }
  }

  scanComponents(componentsDir);

  // Generate markdown
  let markdown = '# Component Documentation\n\n';
  markdown += 'This document provides an overview of all React components in the application.\n\n';

  components.forEach(component => {
    markdown += `## ${component.name}\n\n`;
    markdown += `**File:** \`${component.file}\`\n\n`;

    if (component.description) {
      markdown += `${component.description}\n\n`;
    }

    if (component.props.length > 0) {
      markdown += '### Props\n\n';
      markdown += '| Prop | Type | Description |\n';
      markdown += '|------|------|-------------|\n';

      component.props.forEach(prop => {
        markdown += `| ${prop.name} | ${prop.type} | ${prop.description} |\n`;
      });
      markdown += '\n';
    }
  });

  const outputPath = path.join(DOCS_DIR, 'components.md');
  fs.writeFileSync(outputPath, markdown);

  console.log('✅ Component documentation generated');
}

/**
 * Generate data structure documentation
 */
function generateDataDocs() {
  console.log('🔧 Generating data structure documentation...');

  const dataDir = path.join(SRC_DIR, 'data');
  let markdown = '# Data Structures\n\n';
  markdown += 'This document describes the data structures used in the application.\n\n';

  function scanDataFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDataFiles(fullPath, prefix ? `${prefix}/${item}` : item);
      } else if (item.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(SRC_DIR, fullPath);

        try {
          const data = JSON.parse(content);
          markdown += `## ${prefix ? `${prefix}/` : ''}${item}\n\n`;
          markdown += `**File:** \`src/${relativePath}\`\n\n`;

          // Generate schema description
          markdown += '### Schema\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify(data, null, 2).substring(0, 500);
          if (JSON.stringify(data).length > 500) {
            markdown += '\n... (truncated)';
          }
          markdown += '\n```\n\n';

          // Add structure analysis
          if (Array.isArray(data) && data.length > 0) {
            markdown += `**Type:** Array of ${typeof data[0] === 'object' ? 'objects' : typeof data[0]}\n\n`;
            if (typeof data[0] === 'object' && data[0] !== null) {
              markdown += '**Object Structure:**\n\n';
              markdown += '| Field | Type | Example |\n';
              markdown += '|-------|------|---------|\n';

              Object.keys(data[0]).forEach(key => {
                const value = data[0][key];
                const type = Array.isArray(value) ? 'array' : typeof value;
                const example = typeof value === 'string' && value.length > 20
                  ? value.substring(0, 20) + '...'
                  : String(value);
                markdown += `| ${key} | ${type} | ${example} |\n`;
              });
              markdown += '\n';
            }
          } else if (typeof data === 'object' && data !== null) {
            markdown += `**Type:** Object\n\n`;
            markdown += '**Fields:**\n\n';
            markdown += '| Field | Type | Value |\n';
            markdown += '|-------|------|-------|\n';

            Object.keys(data).forEach(key => {
              const value = data[key];
              const type = Array.isArray(value) ? 'array' : typeof value;
              const displayValue = typeof value === 'string' && value.length > 30
                ? value.substring(0, 30) + '...'
                : JSON.stringify(value);
              markdown += `| ${key} | ${type} | ${displayValue} |\n`;
            });
            markdown += '\n';
          }
        } catch (error) {
          markdown += 'Error parsing JSON file\n\n';
        }
      }
    }
  }

  scanDataFiles(dataDir);

  const outputPath = path.join(DOCS_DIR, 'data-structures.md');
  fs.writeFileSync(outputPath, markdown);

  console.log('✅ Data structure documentation generated');
}

/**
 * Generate configuration documentation
 */
function generateConfigDocs() {
  console.log('🔧 Generating configuration documentation...');

  let markdown = '# Configuration\n\n';
  markdown += 'This document describes the configuration options and environment variables.\n\n';

  // Read package.json for scripts
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  markdown += '## Package Scripts\n\n';
  markdown += '| Script | Description |\n';
  markdown += '|--------|-------------|\n';

  Object.entries(packageJson.scripts).forEach(([script, description]) => {
    markdown += `| \`${script}\` | ${description.replace(/"/g, '')} |\n`;
  });

  markdown += '\n## Environment Variables\n\n';

  // Extract from .env.example if it exists
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    markdown += '### Required Environment Variables\n\n';
    markdown += '```bash\n';
    markdown += envContent;
    markdown += '```\n\n';
  }

  // Document TypeScript config
  markdown += '## TypeScript Configuration\n\n';
  const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tsconfig.json'), 'utf8'));

  markdown += '### Compiler Options\n\n';
  markdown += '| Option | Value | Description |\n';
  markdown += '|--------|-------|-------------|\n';

  Object.entries(tsconfig.compilerOptions).forEach(([option, value]) => {
    const description = getTSConfigDescription(option);
    markdown += `| ${option} | ${JSON.stringify(value)} | ${description} |\n`;
  });

  markdown += '\n';

  const outputPath = path.join(DOCS_DIR, 'configuration.md');
  fs.writeFileSync(outputPath, markdown);

  console.log('✅ Configuration documentation generated');
}

/**
 * Get description for TypeScript config options
 */
function getTSConfigDescription(option) {
  const descriptions = {
    target: 'ECMAScript target version',
    lib: 'Library files to include',
    allowJs: 'Allow JavaScript files',
    skipLibCheck: 'Skip type checking of declaration files',
    strict: 'Enable all strict type checking options',
    noEmit: 'Do not emit outputs',
    esModuleInterop: 'Enable ES module interoperability',
    module: 'Module system',
    moduleResolution: 'Module resolution strategy',
    resolveJsonModule: 'Include JSON modules',
    isolatedModules: 'Ensure each file is a module',
    jsx: 'JSX emit mode',
    incremental: 'Enable incremental compilation',
    plugins: 'TypeScript plugins',
    paths: 'Path mapping',
    baseUrl: 'Base directory for path resolution'
  };

  return descriptions[option] || '';
}

/**
 * Update documentation index
 */
function updateDocsIndex() {
  console.log('🔧 Updating documentation index...');

  const indexContent = `# Documentation Index

Welcome to the Energy Drink Calculator App documentation.

## Getting Started

- [README](../README.md) - Project overview and setup
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute
- [Code Style Guide](code-style.md) - Coding standards and best practices

## Architecture & Design

- [Architecture Overview](architecture.md) - System architecture and design patterns
- [API Endpoints](api-endpoints.md) - API documentation
- [Data Structures](data-structures.md) - Data models and schemas
- [Configuration](configuration.md) - Configuration and environment setup

## Development

- [Component Documentation](components.md) - React components reference
- [API Reference](api/) - Generated TypeScript API docs
- [OpenAPI Specification](openapi-spec.json) - API specification for external tools

## Deployment & Operations

- [Deployment Guide](../production_readiness_improvements.md) - Deployment procedures
- [Infrastructure](../docs/vercel-infrastructure.md) - Infrastructure documentation

## Tools & Scripts

- \`npm run generate-docs\` - Generate all documentation
- \`npm run generate-openapi\` - Generate OpenAPI specification
- \`npm run test\` - Run test suite
- \`npm run lint\` - Run ESLint

---

*This documentation is automatically generated. Last updated: ${new Date().toISOString()}*
`;

  const indexPath = path.join(DOCS_DIR, 'README.md');
  fs.writeFileSync(indexPath, indexContent);

  console.log('✅ Documentation index updated');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting automated documentation generation...\n');

  try {
    // Ensure docs directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }

    // Generate different types of documentation
    generateTypeScriptDocs();
    console.log('');

    generateComponentDocs();
    console.log('');

    generateDataDocs();
    console.log('');

    generateConfigDocs();
    console.log('');

    updateDocsIndex();
    console.log('');

    console.log('🎉 All documentation generated successfully!');
    console.log(`📁 Documentation available in: ${DOCS_DIR}`);

  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateTypeScriptDocs,
  generateComponentDocs,
  generateDataDocs,
  generateConfigDocs,
  updateDocsIndex
};