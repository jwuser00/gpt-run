---
description: FastAPI coding style and conventions for Python web API development (follow project version)
globs: ["**/*.py"]
alwaysApply: false
---

# FastAPI Coding Style

## Project Structure

```
app/
├── main.py                 # FastAPI application factory and startup
├── core/
│   ├── config.py           # Settings via pydantic-settings (BaseSettings)
│   ├── security.py         # Auth utilities (JWT, OAuth2, password hashing)
│   └── exceptions.py       # Custom exception classes and handlers
├── routers/
│   └── {resource}.py       # Route definitions grouped by domain resource
├── services/
│   └── {resource}.py       # Business logic layer
├── schemas/
│   └── {resource}.py       # Pydantic v2 request/response models
├── models/
│   └── {resource}.py       # SQLAlchemy ORM models (if applicable)
├── dependencies/
│   └── {name}.py           # Reusable Depends() callables
├── repositories/
│   └── {resource}.py       # Data access layer (if separating from services)
└── tests/
    ├── conftest.py
    ├── test_routers/
    ├── test_services/
    └── test_schemas/
```

## Naming Conventions

- **Modules**: snake_case (e.g., `user_service.py`, `auth_router.py`)
- **Classes**: PascalCase (e.g., `UserCreate`, `ItemResponse`)
- **Functions / Variables**: snake_case (e.g., `get_current_user`, `access_token`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE`, `MAX_UPLOAD_MB`)
- **Router files**: name by domain resource, not by HTTP method
- **Schema classes**: suffix with purpose (`UserCreate`, `UserUpdate`, `UserResponse`, `UserInDB`)

## Router Conventions

- One router per domain resource, mounted in `main.py` via `app.include_router()`
- Always set `prefix`, `tags`, and shared `dependencies` at the router level
- Use `response_model` on every endpoint to enforce output schema
- Use `status_code` parameter for non-200 default responses (201 for creation, 204 for deletion)
- Path parameters use the resource noun: `/users/{user_id}`, not `/users/{id}`
- Version prefix on the app or top-level router: `/api/v1`

## Dependency Injection

- Define reusable dependencies in `dependencies/` as async callables or classes with `__call__`
- Use `Depends()` for database sessions, auth, pagination, and shared query params
- Prefer `Annotated[T, Depends(dep)]` type alias pattern over bare `Depends()` in signatures
- Scoped dependencies (e.g., `get_db`) should use `yield` for cleanup
- Never instantiate services or repositories directly in route functions

## Pydantic v2 Schemas

- Inherit from `pydantic.BaseModel` for all request/response schemas
- Use `model_config = ConfigDict(from_attributes=True)` when mapping from ORM models
- Separate schemas per operation: `Create`, `Update`, `Response`, `InDB`
- Use `Field()` for validation constraints, descriptions, and examples
- Prefer `Annotated` types for reusable field definitions
- Use `model_validator` and `field_validator` over legacy `validator`

## Async / Sync

- Use `async def` for I/O-bound endpoints (database, HTTP calls, file I/O)
- Use plain `def` only for CPU-bound or trivially synchronous operations (FastAPI runs these in a threadpool)
- Never mix blocking I/O inside `async def` without wrapping in `run_in_executor`
- Use async-compatible libraries: `httpx` (not `requests`), `asyncpg` / `aiosqlite` (not sync drivers)

## Error Handling

- Define domain-specific exceptions in `core/exceptions.py`
- Register exception handlers in `main.py` using `@app.exception_handler()`
- Return consistent error response schema: `{"detail": "message"}` or structured error object
- Use `HTTPException` for simple cases; custom exceptions for business logic errors
- Never let unhandled exceptions leak stack traces in production

## Middleware and Lifecycle

- Register middleware in `main.py` in order: CORS, request ID, logging, authentication
- Use `lifespan` context manager (not deprecated `on_event`) for startup/shutdown
- Add `CORSMiddleware` with explicit `allow_origins`, never use `["*"]` in production

## Configuration

- Use `pydantic-settings` `BaseSettings` with `.env` file support
- Nest related settings into sub-models for clarity
- Access settings via a cached dependency: `Depends(get_settings)`
- Never import settings as module-level globals in route files

## Logging

- Use Python `logging` module, not `print()`
- Configure structured logging (JSON format) for production
- Log at appropriate levels: DEBUG for development detail, INFO for request flow, WARNING for recoverable issues, ERROR for failures
- Include request context (request ID, user ID) in log records via middleware

## Documentation

- Provide `summary` and `description` on endpoints for OpenAPI clarity
- Add `response_description` for non-obvious response semantics
- Use `tags` consistently to group endpoints in Swagger UI
- Define `responses` dict for documenting error status codes per endpoint

## Forbidden

- Circular imports between routers and services
- Business logic inside router functions (delegate to services)
- Raw SQL strings in route handlers (use repositories or ORM)
- `from fastapi import Request` for accessing body when a Pydantic model suffices
- Hardcoded secrets or configuration values (use `BaseSettings`)
- Wildcard CORS in production (`allow_origins=["*"]`)
- Synchronous database drivers inside `async def` endpoints

## Related

- `@python-coding-style` - Base Python conventions
- `@common-coding-guide` - SOLID, DRY, KISS, YAGNI
- `@common-testing-guide` - Testing principles
- `@common-database-guide` - Database access patterns
