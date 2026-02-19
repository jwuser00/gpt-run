---
name: typescript-react-create-project
description: Initialize a new TypeScript React project with Vite. Scaffolds project, configures governance tooling, and pins Node version.
---

# TypeScript React Project Initialization

## Step 1: Gather Project Information

| Input | Required | Default | Example |
|-------|----------|---------|---------|
| **Project name** | Yes | Current directory name | `my-app` |
| **Project type** | Yes | `spa` | `spa` or `library` |
| **Target path** | No | `.` or `frontend` | `frontend` |

- `spa`: Standalone single-page application
- `library`: Reusable component library (Vite Library Mode)

## Step 2: Scaffold Project

```bash
# Standalone (target path = ".")
npm create vite@latest . -- --template react-ts

# Sub-directory (e.g., multi-component project)
npm create vite@latest {target-path} -- --template react-ts
```

## Step 3: Pin Node Version

```bash
node -v > .node-version
```

## Step 4: Configure Governance Tooling

See `@typescript-react-governance-guide` for detailed configuration.

```bash
npm install -D eslint prettier husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

## Step 5: Library Mode Setup (library type only)

1. Configure `vite.config.ts` for Library Mode — see `@typescript-react-vite-guide`
2. Configure `package.json` exports — see `@typescript-react-packaging-guide`
3. Install Storybook: `npx storybook@latest init`

## Related Skills

- `@typescript-react-vite-guide` - Vite build configuration and Library Mode
- `@typescript-react-governance-guide` - ESLint, Prettier, Husky setup details
- `@typescript-react-packaging-guide` - Library packaging and registry deployment
