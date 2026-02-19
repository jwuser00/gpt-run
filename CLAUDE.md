# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Running Management App — upload TCX files from GPS watches, view activity summaries, lap-by-lap analysis, and charts. Built with React (Vite) frontend + FastAPI backend + SQLite.

## Common Commands

### Docker (full stack)
```bash
docker-compose up --build          # Build and run both services
# Frontend: http://localhost:3000  Backend: http://localhost:8000/docs
```

### Backend (local development)
```bash
cd backend
uv sync                                        # Install dependencies
uv run uvicorn main:app --reload               # Start dev server on :8000
```

### Frontend (local development)
```bash
cd frontend
fnm use 24.11.1                    # Set Node version
npm install                        # Install dependencies
npm run dev                        # Start Vite dev server on :5173
npm run build                      # Production build
npm run lint                       # ESLint
```

### Prerequisites
- Python 3.11.14 (pyenv), Poetry for backend
- Node 24.11.1 (fnm) for frontend
- Docker uses `requirements.txt` (not Poetry) and standard Node image (not fnm)

## Architecture

### Backend (`backend/`)

FastAPI app with two routers mounted in `main.py`:

| File | Purpose |
|------|---------|
| `main.py` | App init, CORS config, router registration, DB table creation |
| `database.py` | SQLAlchemy engine + session factory (SQLite at `./sql_app.db`) |
| `models.py` | ORM models: User → Activity → Lap (cascade deletes) |
| `schemas.py` | Pydantic request/response schemas |
| `auth.py` | JWT auth (HS256, 30min expiry), bcrypt password hashing, `get_current_user` dependency |
| `tcx_parser.py` | lxml-based TCX XML parser, extracts activity + lap metrics |
| `routers/users.py` | `POST /users/` (register), `POST /users/token` (login → JWT) |
| `routers/activities.py` | Upload TCX, list/get/delete activities (all authenticated) |

**Auth flow:** Login returns JWT → client sends `Authorization: Bearer {token}` → `get_current_user` dependency validates token and injects user. Secret key from `SECRET_KEY` env var.

**DB relationships:** User has many Activities, Activity has many Laps. All cascade on delete.

**TCX parsing:** Handles Garmin TrainingCenterDatabase v2 XML with ns3 extensions for RunCadence. Duplicate detection by `(user_id, start_time)` → 409 Conflict.

### Frontend (`frontend/`)

React 19 SPA using Vite, React Router v7, Axios, Recharts.

| File/Dir | Purpose |
|----------|---------|
| `src/main.jsx` | Entry point with BrowserRouter |
| `src/App.jsx` | Route definitions + PrivateRoute auth guard |
| `src/api.js` | Axios instance with token interceptor + 401 → `auth-error` event |
| `src/pages/Login.jsx` | Login form |
| `src/pages/Register.jsx` | Registration form |
| `src/pages/Dashboard.jsx` | Activity list, TCX upload (drag-and-drop), year/month filters |
| `src/pages/ActivityDetail.jsx` | Activity metrics, lap table, Recharts pace/HR chart |
| `src/components/Layout.jsx` | App shell with sidebar navigation |
| `src/components/ActivityCard.jsx` | Activity list item card |
| `src/components/AuthErrorModal.jsx` | Portal-based modal for session expiration |

**Auth flow:** Token stored in `localStorage('token')`. Axios request interceptor adds Bearer header. Response interceptor catches 401 → dispatches global `auth-error` event → modal clears token and redirects to login.

**Styling:** SB Admin 2 theme (Bootstrap) + CSS custom properties in `index.css`. Bootstrap loaded via CDN in `index.html`.

**API base URL:** Hardcoded to `http://localhost:8000` in `src/api.js`. In Docker, nginx serves frontend on port 80 (mapped to 3000).

**Time zones:** Dashboard converts UTC times to KST (+9 hours) for display.

### Docker Setup

- **Backend Dockerfile:** `python:3.11-slim`, installs from `requirements.txt`, runs uvicorn on :8000
- **Frontend Dockerfile:** Multi-stage — Node 24-alpine builds, nginx-alpine serves static files on :80
- **Nginx:** SPA routing via `try_files $uri $uri/ /index.html`

## Key Conventions

- Backend documentation and user-facing text are in Korean (한국어)
- CORS origins include `localhost:5173` (Vite dev) and `localhost:3000` (Docker)
- No centralized state management — local component state with React hooks
- Metrics units: distance in meters, time in seconds, pace in seconds/km

<!-- Applies to: **/*.py, **/*.java, **/*.js, **/*.ts, **/*.go, **/*.kt -->
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

<!-- Applies to: **/*.py -->
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

<!-- Applies to: **/*.py -->
# Python Coding Style and Conventions

## Formatting

- **Formatter**: Ruff (preferred) or Black
- **Line length**: 88 characters (Ruff/Black default)
- **Indentation**: 4 spaces (PEP 8)
- **Quotes**: Double quotes for strings (Ruff/Black default)
- **Trailing commas**: Always use in multi-line structures

## Linting

- **Linter**: Ruff (preferred) or Flake8
- Enable at minimum: pyflakes (F), pycodestyle (E/W), isort (I), bugbear (B)
- **Import sorting**: isort-compatible via Ruff or standalone isort
- Import order: stdlib, third-party, local (separated by blank lines)

## Naming Conventions

- **Modules/packages**: lowercase, underscores allowed (`my_module.py`)
- **Classes**: PascalCase (`HttpClient`, `UserService`)
- **Functions/methods**: snake_case (`get_user_by_id`, `validate_input`)
- **Variables**: snake_case (`user_name`, `max_retries`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`)
- **Private**: Single leading underscore (`_internal_helper`)
- **Name-mangled**: Double leading underscore (`__private_attr`) - use sparingly
- **Type variables**: PascalCase (`T`, `KeyType`, `ValueType`)
- **Booleans**: Prefix with `is_`, `has_`, `can_`, `should_` (`is_active`, `has_permission`)

## Type Hints

- Use type hints for all function signatures (parameters and return types)
- Use `from __future__ import annotations` for deferred evaluation when needed
- Prefer built-in generics (`list[str]`, `dict[str, int]`) over `typing` equivalents (Python 3.9+)
- Use `X | None` union syntax instead of `Optional[X]` (Python 3.10+)
- Use `TypeAlias` or `type` statement (Python 3.12+) for complex type aliases
- Avoid `Any` unless interfacing with untyped code

## Modern Python Features

- **Structural pattern matching** (`match`/`case`) for multi-branch dispatch (3.10+)
- **Exception groups** and `except*` for concurrent error handling (3.11+)
- **`type` statement** for type aliases (3.12+)
- **f-strings** for all string interpolation (never `%` or `.format()`)
- **Walrus operator** (`:=`) when it genuinely reduces duplication
- **Data classes** (`@dataclass`) for structured data with behavior
- **`NamedTuple`** for lightweight immutable records
- **`enum.Enum`** / `enum.StrEnum` for fixed sets of values

## Function and Method Design

- Maximum function length: 20-30 lines (guideline, not strict)
- Use early returns to reduce nesting
- Default to keyword-only arguments for functions with 3+ parameters (use `*`)
- Use `**kwargs` sparingly and only when forwarding to another callable
- Document public functions with docstrings (Google style or NumPy style, pick one per project)

## Docstrings

- Triple double-quotes for all docstrings
- Google style (preferred) or NumPy style - consistent within project
- Required on all public modules, classes, functions, and methods
- Include `Args:`, `Returns:`, `Raises:` sections where applicable
- First line is a single-sentence summary ending with a period

## Module Structure

- Module-level docstring
- `from __future__ import annotations` (if needed)
- Standard library imports
- Third-party imports
- Local imports
- Module-level constants
- Module-level classes and functions
- `if __name__ == "__main__":` guard at bottom

## Error Handling

- Raise specific exceptions (`ValueError`, `TypeError`, `KeyError`)
- Create custom exception hierarchies for application-level errors
- Include context in exception messages
- Use `raise ... from ...` for exception chaining
- Never use bare `except:` - always specify exception type
- Use context managers (`with`) for resource management

## Forbidden

- Bare `except:` or `except Exception:` without re-raise or logging
- Mutable default arguments (`def f(items=[])`)
- `from module import *` (star imports)
- Global mutable state
- `%` formatting or `.format()` for string interpolation
- `type()` for type checking (use `isinstance()`)
- Nested functions deeper than one level
- Single-letter variable names outside of comprehensions and very short lambdas

<!-- Applies to: **/*.ts, **/*.tsx, **/*.js, **/*.jsx -->
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
