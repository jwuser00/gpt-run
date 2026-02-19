---
name: typescript-react-react-guide
description: React development guide covering component patterns, hooks, state management, and best practices for TypeScript-based React projects.
---

# React Development Guide

## Tech Stack

- React (follow project version)
- TypeScript (follow project version)
- React Router or Next.js App Router for routing

## Node Version Management

- Use **fnm** (Fast Node Manager) for managing local Node.js versions
- Default to **Node.js 24 LTS** for new projects
- **Existing project version always takes priority** — check `.node-version`, `.nvmrc`, or `engines` field in `package.json` before assuming a version
- Set project-level version with `.node-version` file at project root
- Auto-switch on directory change: `eval "$(fnm env --use-on-cd)"` in shell profile

## Component Architecture

### Component Types

- **Presentational Components**: UI rendering only, receive data via props
- **Container Components**: Data fetching, state management, business logic
- **Layout Components**: Page structure, navigation, shared wrappers
- **Page Components**: Route-level entry points

### Component Design Principles

- Single Responsibility: One component, one purpose
- Composition over Inheritance: Build complex UIs by composing smaller components
- Lift State Up: Share state by moving it to the nearest common ancestor
- Colocation: Keep related files (component, styles, tests, stories) together

## Hooks Best Practices

### Built-in Hooks

- `useState`: Local component state; use for simple, independent values
- `useEffect`: Side effects; always specify dependency array; cleanup subscriptions
- `useMemo`: Expensive computations; avoid premature optimization
- `useCallback`: Stabilize function references passed to child components
- `useRef`: DOM access and mutable values that do not trigger re-renders

### Custom Hooks

- Extract reusable logic into custom hooks prefixed with `use`
- Return values as tuple `[value, setter]` or named object `{ data, loading, error }`
- Handle cleanup and error states within the hook

## State Management Strategy

- **Local State**: `useState` for component-scoped data
- **Shared State**: Lift state up or use Context API for cross-component data
- **Server State**: Use data fetching libraries (TanStack Query, SWR) for API data
- **URL State**: Use router params/search params for URL-driven state

## Performance Optimization

- Use `React.memo` for components with stable props
- Use `React.lazy` and `Suspense` for code splitting
- Virtualize long lists with react-window or react-virtuoso
- Profile with React DevTools before optimizing

## Error Handling

- Use Error Boundaries to catch rendering errors
- Provide meaningful fallback UI for error states

## Related Skills

- `@typescript-react-component-guide` - MUI-based component design
- `@typescript-react-testing-guide` - Testing React components
