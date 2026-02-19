---
description: Security best practices for secure software development
globs: ["**/*.py", "**/*.java", "**/*.js", "**/*.ts", "**/*.go", "**/*.kt"]
alwaysApply: true
---

# Security Rules

## Authentication & Authorization
- Hash passwords with bcrypt/Argon2, never store plain text
- Use short-lived tokens (15-60 min), validate all claims
- Validate JWT on all protected endpoints, return 401 on failure
- Log authentication failures (exclude sensitive data)
- Verify permissions on every request, never trust client-side
- Apply least privilege principle

## Input Validation
- Use parameterized queries (never concatenate SQL)
- Escape output with context-aware encoding (XSS prevention)
- Avoid shell commands; if needed, use parameterized APIs

## Secrets Management
- Never hardcode secrets - use env vars or secret managers
- Different secrets per environment, rotate regularly

## Data Protection
- Encrypt sensitive data at rest and in transit (TLS 1.2+)
- Never log passwords, tokens, or PII

## Error Handling
- Generic messages to users, detailed logs internally
- No stack traces in production

## Forbidden
- Hardcoded credentials/API keys
- `eval()` with user input
- MD5/SHA1 for password hashing
- Disabled security features
- Client-side validation only

## Related
- `@common-coding-guide` - `@common-testing-guide`
