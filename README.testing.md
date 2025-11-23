# Testing Framework Documentation

This project includes comprehensive testing capabilities for SDLC compliance:

## Test Types Supported

### 1. Unit Tests (Vitest)
Tests individual functions and logic in isolation.

**Location:** `src/test/*.test.ts`

**Run:**
```bash
npm run test
npm run test:coverage  # With coverage report
```

**Example Tests:**
- Signal detection keyword matching
- Confidence score calculations
- Role hierarchy detection
- Proximity scoring logic
- Phase detection algorithms

### 2. Integration Tests (Vitest + React Testing Library)
Tests component interactions and integration points.

**Location:** `src/test/components/*.test.tsx`

**Run:**
```bash
npm run test
```

**Example Tests:**
- Component rendering with mock data
- User interactions and state changes
- API integration testing

### 3. End-to-End Tests (Playwright)
Tests complete user workflows across browsers.

**Location:** `e2e/*.spec.ts`

**Run:**
```bash
npm run test:e2e
npm run test:e2e:ui  # With interactive UI
```

**Example Tests:**
- Full user journey from homepage to signal detection
- Authentication flows
- Multi-page navigation
- Responsive design verification

### 4. Stress Tests (Playwright)
Tests system behavior under load.

**Location:** `e2e/stress-test.spec.ts`

**Run:**
```bash
npm run test:e2e
```

**Example Tests:**
- Rapid navigation stress testing
- Large dataset rendering
- Concurrent user simulation

### 5. Cross-Browser Testing (Playwright)
Automated testing across browsers and devices.

**Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## Test Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical user flows
- **E2E Tests:** All major user journeys
- **Stress Tests:** Performance baselines

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should behave correctly', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test('user flow description', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## SDLC Test Mapping

| Test Type | SDLC Phase | Purpose |
|-----------|------------|---------|
| Unit Tests | Development | Code quality & logic verification |
| Integration Tests | Integration | Component interaction validation |
| SIT (System Integration Test) | Integration | Full system integration |
| UAT (User Acceptance Test) | UAT Phase | E2E tests simulate real user acceptance |
| Smoke Tests | Deployment | Quick validation (subset of E2E) |
| Stress Tests | Performance | Load & concurrency validation |

## Running Full Test Suite

**Pre-deployment checklist:**
```bash
# 1. Unit & Integration tests
npm run test:coverage

# 2. E2E tests (all browsers)
npm run test:e2e

# 3. Review coverage report
open coverage/index.html
```

## Debugging Tests

**Vitest:**
```bash
npm run test:ui  # Interactive UI
```

**Playwright:**
```bash
npm run test:e2e:debug  # Step through tests
npm run test:e2e -- --headed  # See browser
```

## Best Practices

1. **Keep tests fast:** Unit tests should run in milliseconds
2. **Test behavior, not implementation:** Focus on user-facing outcomes
3. **Use meaningful test names:** Describe what's being tested
4. **Mock external dependencies:** Isolate code under test
5. **Run tests in CI/CD:** Automate on every commit
6. **Maintain test coverage:** Aim for 80%+ on critical paths

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
