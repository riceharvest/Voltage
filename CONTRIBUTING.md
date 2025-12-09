# Contributing to Energy Drink Calculator App

Thank you for your interest in contributing to the Energy Drink Calculator App! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git for version control
- Basic knowledge of React, Next.js, and TypeScript

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/energy-drink-app.git
   cd energy-drink-app
   ```
3. Set up the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/energy-drink-app.git
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Contributing Guidelines

### Branch Naming

Use descriptive branch names following this pattern:
- `feature/description-of-feature`
- `bugfix/issue-description`
- `docs/update-documentation`
- `refactor/component-name`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(calculator): add caffeine concentration slider
fix(auth): resolve age verification bug
docs(api): update endpoint documentation
```

### Code Style

- Follow the established ESLint and Prettier configuration
- Use TypeScript for all new code
- Maintain consistent naming conventions
- Write self-documenting code with clear variable names
- Add JSDoc comments for complex functions

### File Organization

- Keep components in `src/components/`
- Place utilities in `src/lib/`
- Store data files in `src/data/`
- API routes go in `src/app/api/`
- Tests should be colocated with their respective files

## Pull Request Process

1. **Create a branch** from `main` for your changes
2. **Make your changes** following the guidelines above
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Run the full test suite:**
   ```bash
   npm run test:ci
   ```
6. **Ensure code quality:**
   ```bash
   npm run lint
   npm run type-check
   ```
7. **Commit your changes** with clear messages
8. **Push to your fork** and create a pull request

### PR Template

Use the provided PR template and fill in:
- Description of changes
- Type of change (bug fix, feature, etc.)
- Testing instructions
- Screenshots (if UI changes)
- Related issues

## Code Review Process

### Review Checklist

Reviewers will check for:
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact is considered
- [ ] Accessibility standards are met
- [ ] Changes are backwards compatible

### Review Comments

- Be constructive and specific
- Suggest improvements, don't just point out problems
- Reference coding standards or best practices
- Acknowledge good work

## Testing

### Unit Tests

- Write unit tests for all utility functions
- Use Vitest for testing framework
- Aim for 80%+ code coverage
- Test edge cases and error conditions

### Integration Tests

- Test component interactions
- Verify API endpoints
- Check data flow between components

### End-to-End Tests

- Use Playwright for E2E testing
- Test complete user workflows
- Verify cross-browser compatibility

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain non-obvious code decisions

### User Documentation

- Update user guides for new features
- Maintain API documentation
- Keep README up to date

### Developer Documentation

- Update this contributing guide
- Document architecture decisions
- Maintain code style guides

## Issue Reporting

### Bug Reports

When reporting bugs, include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable
- Console errors

### Feature Requests

For new features, provide:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if possible
- Acceptance criteria

### Labels

Issues are labeled for organization:
- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation updates
- `good first issue`: Suitable for newcomers
- `help wanted`: Community contribution needed

## Community

### Communication

- Use GitHub issues for bugs and features
- Join discussions in GitHub discussions
- Follow the code of conduct in all interactions

### Getting Help

- Check existing issues and documentation first
- Ask questions in GitHub discussions
- Reach out to maintainers for guidance

### Recognition

Contributors are recognized through:
- GitHub contributor statistics
- Mention in release notes
- Attribution in documentation

Thank you for contributing to make the Energy Drink Calculator App better!