---
description: TypeScript and React coding style conventions for consistent code quality across the team.
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: false
---

# TypeScript React Coding Style

## Runtime

- **Node.js 24 LTS** (default, existing project version takes priority)
- Version manager: **fnm**, project config: `.node-version`
- Package manager: **npm**

## Formatting

- **Indentation**: 2 spaces
- **Max Line Length**: 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes
- **Trailing Commas**: All
- **Bracket Spacing**: Enabled
- **Arrow Function Parens**: Always

## Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile`, `SignInForm`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth`, `useFetchData`)
- **Files (Component)**: PascalCase matching component name (e.g., `UserProfile.tsx`)
- **Files (Utility/Hook)**: camelCase (e.g., `useAuth.ts`, `formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase with descriptive suffix (e.g., `UserProps`, `AuthState`)
- **Enums**: PascalCase for name, PascalCase for members

## Import Order

1. React and framework imports
2. Third-party libraries
3. Internal modules (absolute paths)
4. Relative imports (parent → sibling → child)
5. Style imports

## Forbidden

- `any` type (use `unknown` with type guards)
- Class components (functional only)
- Wildcard imports
- `React.FC` without explicit reason

## Related Skills

- `@typescript-react-react-guide` - React patterns, hooks, state management
- `@typescript-react-governance-guide` - Prettier/ESLint detailed configuration
