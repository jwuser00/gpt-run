---
name: typescript-react-vite-guide
description: Vite build tool guide covering Library Mode configuration, Rollup optimization, ESM/CJS output, and development server setup.
---

# Vite Build & Development Guide

## Overview

Vite serves as the primary build tool for React library development. It leverages ESBuild for fast development server startup and Rollup for optimized production builds with superior tree-shaking capabilities.

## Runtime

- Node.js and npm (see `@typescript-react-react-guide` for version policy)

## Build Toolchain

| Phase | Tool | Language | Role |
|-------|------|----------|------|
| **Development** | ESBuild | Go | Lightning-fast dependency pre-bundling and HMR |
| **Code Transform** | SWC | Rust | JSX/TSX compilation (Babel replacement) |
| **Production** | Rollup | JavaScript | Final bundle with precise tree-shaking |

## Library Mode Configuration

### Key Configuration Points (`vite.config.ts`)

- **entry**: Define library entry point via `build.lib.entry`
- **formats**: Output both ESM (`es`) and UMD/CJS formats simultaneously
- **fileName**: Custom naming pattern per format (e.g., `my-lib.es.js`, `my-lib.umd.js`)
- **external**: Exclude peer dependencies (`react`, `react-dom`) from the bundle
- **globals**: Map external packages to global variable names for UMD builds

### Why Vite Library Mode Over Next.js for Libraries

- **Dedicated support**: `build.lib` configuration purpose-built for library output
- **Clean output**: Produces pure component code without framework runtime overhead
- **Tree-shaking**: Rollup-based bundling ensures unused code elimination for consumers
- **Multi-format**: ESM and CJS output from a single build configuration
- **Framework neutral**: Output works with Next.js, Vite SPA, Remix, or any React environment

## Type Definition Generation

- Use `vite-plugin-dts` to auto-generate `.d.ts` files during build
- Configure `insertTypesEntry: true` for automatic type entry point
- Set `include: ['src']` to scope type extraction to source directory
- Generated types enable IDE autocompletion and compile-time error detection for consumers

## Development Server

- **HMR (Hot Module Replacement)**: Instant updates without full page reload
- **Dependency Pre-bundling**: ESBuild converts `node_modules` to ESM on first run
- **On-demand Compilation**: Only transforms requested modules, not the entire project

## Storybook Integration

- Use Storybook as the primary development playground for library components
- Enables isolated component development without running Next.js server
- Interactive Props panel for visual testing of component variants
- Serves as living documentation for designers and developers

## Related Skills

- `@typescript-react-packaging-guide` - Packaging and deployment strategy
- `@typescript-react-react-guide` - React development patterns
