---
name: typescript-react-component-guide
description: React component design guide covering component classification, standard props patterns, design tokens, and Storybook-driven development.
---

# React Component Design Guide

## Overview

Guide for designing reusable, consistent React components with a clear classification system, standardized props interface, and design token architecture.

## Component Classification

### Basic Components (Atomic)

Single-purpose UI elements that form the foundation:

- Button, Input/TextField, Select/Dropdown
- Checkbox, Radio, Switch
- Icon, Typography
- Spinner/Progress, Divider/Spacer

### Combination Components (Molecular)

Composed from Basic Components for common UI patterns:

- Modal/Dialog, Drawer
- Toast/Snackbar, Tooltip/Popover
- Tabs, Table, Pagination
- Form Layout, Card

## Standard Props Pattern

Shared components should follow a unified props interface for consistency:

| Prop | Type | Description |
|------|------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | Component size variant |
| `variant` | Component-specific union | Visual style variant |
| `disabled` | `boolean` | Interaction disabled state |
| `loading` | `boolean` | Loading state indicator |

### Design Principles

- Props carry the same semantic meaning across all components
- Consistent naming: `size`, `variant`, `disabled` used uniformly
- Extend via composition, not deep prop drilling

## Design Token Architecture

- **Color tokens**: Semantic color names mapped to palette values
- **Typography tokens**: Font family, size, weight, line-height scales
- **Spacing tokens**: Consistent spacing scale for margins and padding
- **Theme support**: Light/dark mode via token switching

## Component Scope

### In Scope

- Generic, reusable UI components
- Standard parameter and usage contracts
- Design tokens (Color, Font, Spacing)

### Out of Scope

- Service-specific UI
- Page-level UI compositions
- Components coupled with business logic
- Feature components with built-in data logic

## Storybook Development

- Develop each component in isolation using Storybook
- Define stories for all prop combinations and states
- Use Autodocs for automatic documentation generation
- Share Storybook with designers for visual spec validation

## Related Skills

- `@typescript-react-react-guide` - React development patterns
- `@typescript-react-vite-guide` - Build configuration for library mode
- `@typescript-react-packaging-guide` - Library packaging and distribution
