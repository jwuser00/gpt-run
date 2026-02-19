---
name: typescript-react-testing-guide
description: Testing guide for React projects using Vitest, React Testing Library, and jsdom. Covers unit testing, component testing, and user-centric testing strategies.
---

# React Testing Guide

## Tech Stack

- **Vitest**: Test runner and assertion framework (Vite-native, Jest-compatible API)
- **React Testing Library (RTL)**: User-centric component testing utilities
- **jsdom**: Browser environment emulation for Node.js

## Tool Responsibilities

| Tool | Role | Description |
|------|------|-------------|
| **Vitest** | Test Runner | Discovers test files, executes `describe`/`it` blocks, runs `expect` assertions |
| **RTL** | Testing Utility | Renders components, queries DOM elements, fires user events |
| **jsdom** | Environment | Provides `document`, `window`, `localStorage` APIs in Node.js |

## Testing Principles

- **Test user behavior, not implementation**: Query by visible text, roles, labels - not by class names or internal state
- **Arrange-Act-Assert pattern**: Setup state, perform action, verify outcome
- **One assertion focus per test**: Each test should verify one specific behavior
- **Avoid testing implementation details**: Do not test state values or internal methods directly

## Test File Organization

- Place test files adjacent to source files: `Button.tsx` → `Button.test.tsx`
- Use `describe` blocks to group related tests by component or feature
- Use `it` or `test` with descriptive names: `it('renders disabled state when disabled prop is true')`

## RTL Query Priority

Use queries in order of accessibility preference:

1. `getByRole` - Accessible role (button, heading, textbox)
2. `getByLabelText` - Form field labels
3. `getByPlaceholderText` - Input placeholders
4. `getByText` - Visible text content
5. `getByDisplayValue` - Current form values
6. `getByTestId` - Last resort, data-testid attribute

## Async Testing

- Use `findBy*` queries for elements that appear asynchronously
- Wrap state changes in `waitFor` for async assertions
- Use `userEvent` over `fireEvent` for realistic user interaction simulation
- Handle loading states and error states in tests

## SSR Validation

- Test components in jsdom environment to catch server-side rendering issues
- Verify components do not reference `window` or `document` directly during initial render
- Use conditional checks or `useEffect` for browser-only APIs

## Test Coverage Strategy

- All shared/common components must have tests before registry deployment
- Focus on interaction tests: click handlers, form submissions, state changes
- Test edge cases: empty states, error states, loading states, boundary values
- Mock external API calls; do not make real network requests in tests

## Running Tests

- `npm run test` - Run all tests
- `npm run test:watch` - Watch mode for development
- `npm run test:coverage` - Generate coverage report

## Related Skills

- `@typescript-react-react-guide` - React component patterns
- `@typescript-react-governance-guide` - Quality assurance tooling
- `@common-test-agent` - Test generation agent
