---
name: common-testing-guide
description: Universal testing principles and best practices. Use when writing tests, designing test strategies, or reviewing test quality.
---

# Universal Testing Guide

## Test Pyramid

- **Unit tests** (70%) - Fast, isolated, test logic
- **Integration tests** (20%) - Component interactions, real dependencies
- **E2E tests** (10%) - Full user journeys, slow and expensive

## AAA Pattern

Every test follows: **Arrange** → **Act** → **Assert**

## Naming Convention

Pattern: `[method]_[stateUnderTest]_[expectedBehavior]`

Casing follows the language convention:
- **Java / JS / TS**: camelCase — `createUser_withDuplicateEmail_throwsConflictException`
- **Python (pytest)**: snake_case with `test_` prefix — `test_create_user_with_duplicate_email_throws_conflict_exception`

## Best Practices

- Test behavior, not implementation
- One logical assertion per test
- Tests must be independent (no shared mutable state)
- Cover edge cases and boundaries
- Test error paths, not just happy paths

## Mocking Strategy

**Mock:**
- External services (APIs, email, payment)
- Database (in unit tests)
- Time/random providers
- Slow dependencies

**Don't Mock:**
- The class under test
- Simple value objects
- Pure functions
- Everything (over-mocking hides bugs)

## Test Data

- Use fixtures or builders for test data
- Each test creates its own data
- Clean state before each test (truncate or rollback)

## Coverage Guidelines

- Critical business logic: 90%+
- Overall: 80%+ line coverage
- High coverage ≠ good tests (assertions matter)

## Forbidden

- Tests depending on other tests
- Tests without assertions
- Flaky tests (fix or delete)
- Testing private methods directly

## Related Skills

- `@common-coding-guide`
- `@common-database-guide`
- `@common-test-agent`
