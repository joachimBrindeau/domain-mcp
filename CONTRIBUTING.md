# Contributing to the Dynadot Domain MCP Server

Help improve AI-powered domain management for the MCP ecosystem.

Thank you for your interest in contributing to the Dynadot Domain MCP Server! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/domain-mcp.git
   cd domain-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file:
   ```bash
   DYNADOT_API_KEY=your_api_key_here
   DYNADOT_SANDBOX=true  # Use sandbox for development
   ```

## Development Workflow

### Code Quality Standards

This project enforces strict code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Consistent code formatting
- **Vitest**: Unit and functional testing with 80% coverage minimum

### Before Committing

Run these commands to ensure your code meets quality standards:

```bash
# Type check
npm run typecheck

# Lint and fix issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test

# Check coverage
npm run test:coverage
```

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
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
feat(dns): add support for CAA records

Adds support for CAA (Certification Authority Authorization)
records in DNS management.

Closes #123
```

```
fix(client): handle rate limiting errors

Improves error handling for API rate limit responses.
```

## Making Changes

### Adding New Features

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature:
   - Add/update code in `src/`
   - Add JSDoc comments for public APIs
   - Follow existing code patterns

3. Add tests:
   - E2E tests in `test/e2e.test.ts` for endpoint validation
   - Functional tests in `test/functional.test.ts` for CRUD operations

4. Update documentation:
   - Update README.md if needed
   - Add inline code comments for complex logic

5. Run quality checks:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```

### Bug Fixes

1. Create a bug fix branch:
   ```bash
   git checkout -b fix/issue-description
   ```

2. Write a failing test that reproduces the bug

3. Fix the bug

4. Ensure the test passes and all existing tests still pass

5. Update documentation if the fix changes behavior

## Testing Guidelines

### E2E Tests

E2E tests validate that API endpoints are properly mapped and return responses:

```typescript
it('should execute domain_info command', async () => {
  const result = await client.execute('domain_info', { domain: 'example.com' });
  expect(hasValidResponse(result)).toBe(true);
});
```

### Functional Tests

Functional tests verify real operations work end-to-end:

```typescript
it('should create and delete a folder', async () => {
  // Create
  const createResult = await client.execute('create_folder', { folder_name: 'test' });
  const folderId = extractId(createResult);

  // Verify exists
  const listResult = await client.execute('folder_list');
  expect(listResult).toContainFolder(folderId);

  // Delete
  await client.execute('delete_folder', { folder_id: folderId });

  // Verify deleted
  const listResult2 = await client.execute('folder_list');
  expect(listResult2).not.toContainFolder(folderId);
});
```

### Test Requirements

- All new features must include tests
- Bug fixes should include a regression test
- Tests must pass with the sandbox API
- Functional tests should clean up any resources they create

## Pull Request Process

1. Update your branch with the latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes:
   ```bash
   git push origin your-branch-name
   ```

3. Create a Pull Request on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include any breaking changes
   - Add screenshots for UI changes (if applicable)

4. Address review feedback:
   - Make requested changes
   - Push new commits
   - Respond to comments

5. Once approved, a maintainer will merge your PR

## Code Style

### TypeScript

- Use explicit types where they add clarity
- Avoid `any` - use `unknown` if type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer `const` over `let`, never use `var`

### Functions

- Use async/await instead of promises where possible
- Keep functions small and focused
- Add JSDoc comments for exported functions

### Naming

- Use `camelCase` for variables and functions
- Use `PascalCase` for types and interfaces
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that convey intent

## API Quirks to Know

When contributing, be aware of these Dynadot API quirks:

### edit_contact Requires All Fields
The `edit_contact` API requires ALL contact fields, not just changed ones:
```typescript
// ❌ This will fail
await client.execute('edit_contact', {
  contact_id: '123',
  name: 'New Name'
});

// ✅ This works
await client.execute('edit_contact', {
  contact_id: '123',
  name: 'New Name',
  email: 'email@example.com',
  phonecc: '1',
  phonenum: '5551234567',
  // ... all other fields
});
```

### lock_domain Unlock May Not Work
The `lock_domain` unlock command may fail due to domain protection settings. This is a Dynadot API limitation.

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues and PRs first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
