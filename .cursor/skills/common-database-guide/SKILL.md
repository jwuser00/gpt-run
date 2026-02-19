---
name: common-database-guide
description: Universal database design and query optimization principles. Use when designing schemas, optimizing queries, or implementing data access.
---

# Universal Database Guide

## Schema Design

- Normalize to 3NF by default
- Denormalize only for proven read performance needs
- Use appropriate primary key strategy (auto-increment, UUID, composite)
- Add audit columns: created_at, updated_at, created_by, updated_by

## Indexing

- Index columns used in WHERE, JOIN, ORDER BY
- Composite indexes follow leftmost prefix rule
- Don't index low-cardinality columns (boolean, status with few values)
- Don't over-index - impacts write performance

## N+1 Prevention

- Use JOIN FETCH / Eager loading for known associations
- Use batch loading (IN clause) for collections
- Use projections/DTOs when you don't need full entities
- Always verify query count in development

## Query Optimization

- SELECT only needed columns
- Use EXPLAIN/ANALYZE to verify execution plans
- Keyset/cursor pagination for large datasets (avoid OFFSET)
- Avoid functions on indexed columns in WHERE clause

## Transaction Management

- Keep transactions short
- Use appropriate isolation level (READ COMMITTED default)
- Optimistic locking for low-contention scenarios
- Pessimistic locking (SELECT FOR UPDATE) for high-contention

## Connection Pool

- Size: (core_count * 2) + spindle_count (typically 10-20)
- Set connection timeout and leak detection

## Forbidden

- SELECT * in production code
- N+1 queries
- Long-running transactions
- Missing indexes on foreign keys

## Related Skills

- `@common-coding-guide`
- `@common-testing-guide`
