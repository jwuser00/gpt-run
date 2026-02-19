---
name: typescript-react-governance-guide
description: Development governance guide covering Prettier, ESLint, GTS, Husky, and lint-staged configuration for consistent code quality enforcement.
---

# Development Governance Guide

## Overview

Standardized tooling configuration to enforce code quality, formatting consistency, and automated pre-commit validation across all team projects.

## Tool Stack

| Tool | Category | Role |
|------|----------|------|
| **Prettier** | Formatter | Auto-corrects code formatting (indentation, quotes, line width) |
| **ESLint** | Linter | Prevents code errors and enforces anti-pattern rules |
| **GTS** | Config Preset | Google TypeScript Style - bundles Prettier, ESLint, and tsconfig settings |
| **Husky** | Git Hooks | Executes scripts before git events (pre-commit) |
| **lint-staged** | Scope Filter | Runs lint only on staged (changed) files for efficiency |

## Prettier Configuration

### Recommended Settings

| Option | Value | Rationale |
|--------|-------|-----------|
| `semi` | `true` | Prevents ASI (Automatic Semicolon Insertion) issues |
| `singleQuote` | `true` | JS/TS community standard |
| `trailingComma` | `'all'` | Cleaner git diffs, fewer merge conflicts |
| `tabWidth` | `2` | Frontend standard indentation |
| `printWidth` | `100` | Balance between readability and line density |
| `bracketSpacing` | `true` | Readable import statements |
| `arrowParens` | `'always'` | Consistent, safe for parameter changes |

### Execution

- **On Save**: Configure IDE "Format on Save" with Prettier as default formatter
- **On Commit**: Automated via Husky + lint-staged pipeline

## ESLint Configuration

### Key Rule Categories

- **Error Prevention**: Unused variables, undefined references, unreachable code, duplicate cases
- **React Hooks Rules**: Dependency array completeness for `useEffect`/`useMemo`
- **JSX Validation**: `className` usage, `key` prop enforcement in lists

### Prettier Conflict Resolution

- Install `eslint-config-prettier` (required): Disables ESLint style rules that conflict with Prettier
- Install `eslint-plugin-prettier` (recommended): Surfaces Prettier violations as ESLint errors
- Result: ESLint handles code quality only; Prettier handles formatting exclusively

## GTS (Google TypeScript Style)

GTS provides a single-install solution that configures:

- **Prettier**: Google's formatting preferences
- **ESLint**: Google's TypeScript lint rules
- **tsconfig.json**: Google's recommended TypeScript compiler settings

Use GTS when the team wants an opinionated, zero-config baseline.

## Git Hooks Pipeline (Husky + lint-staged)

### Process Flow

1. Developer runs `git commit`
2. **Husky** intercepts the `pre-commit` hook
3. **lint-staged** identifies only staged files
4. Configured scripts run on matched files (ESLint, Prettier)
5. If any check fails, commit is blocked
6. On all checks passed, commit proceeds

### Benefits

- Only changed files are checked (fast even on large codebases)
- Prevents committing code that violates team standards
- No false negatives from other developers' legacy code

## IDE Setup

- Install Prettier and ESLint extensions in VS Code / Cursor
- Enable "Format on Save" in editor settings
- Set Prettier as the default formatter
- ESLint auto-fix on save for linting rules

## Related Skills

- `@typescript-react-coding_style` - Coding style rule (auto-applied)
- `@typescript-react-testing-guide` - Quality assurance via testing
- `@common-commit_rule` - Commit message conventions
