---
name: common-coding-guide
description: Universal coding principles for any programming language. Use when designing, refactoring, or reviewing code.
---

# Universal Coding Guide

## Core Principles

- **SOLID** - Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Aren't Gonna Need It

## Clean Code Practices

- Meaningful names (classes: nouns, methods: verbs, booleans: isX/hasX/canX)
- Functions do one thing, keep them small (5-20 lines ideal)
- One level of abstraction per function
- Avoid deep nesting (max 2-3 levels, use early returns)
- No magic numbers/strings - use named constants

## Error Handling

- Fail fast - validate inputs early
- Exceptions for unrecoverable errors, Result/Optional for expected failures
- Never swallow exceptions silently

## Code Organization

- Feature-based package structure over layer-based
- High cohesion, low coupling
- Depend on abstractions, not implementations

## Comments

- Explain **why**, not **what**
- No commented-out code
- No redundant comments

## Forbidden

- God classes (multiple responsibilities)
- Premature optimization
- Premature abstraction
- Copy-paste programming

## Related Skills

- `@common-database-guide`
- `@common-testing-guide`
