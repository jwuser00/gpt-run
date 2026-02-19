---
name: fastapi-setup-vscode
description: VS Code / Cursor setup guide for FastAPI development including extensions, debugging, linting, and testing integration.
---

# FastAPI - VS Code / Cursor Development Setup

## Overview

Guide for configuring VS Code (Cursor) for FastAPI development. Covers required extensions, debugger configuration, linter/formatter setup, and test runner integration.

## Prerequisites

- Python 3.13 installed (via pyenv, system package, or official installer); respect existing project version if already set
- `uv` for virtual environment and package management; respect existing tool if already configured
- FastAPI project initialized with `main.py` entry point

## Required Extensions

| Extension | ID | Purpose |
|-----------|----|---------|
| Python | `ms-python.python` | Language support, IntelliSense, virtual env detection |
| Pylance | `ms-python.vscode-pylance` | Fast type checking and auto-completion |
| Ruff | `charliermarsh.ruff` | Linting and formatting (replaces flake8, isort, black) |
| Python Debugger | `ms-python.debugpy` | Debug launch configurations |
| Even Better TOML | `tamasfe.even-better-toml` | `pyproject.toml` syntax support |

### Optional but Recommended

| Extension | ID | Purpose |
|-----------|----|---------|
| REST Client | `humao.rest-client` | Send HTTP requests from `.http` files |
| Thunder Client | `rangav.vscode-thunder-client` | GUI-based API testing |
| SQLTools | `mtxr.sqltools` | Database browser (if using SQL backend) |
| Docker | `ms-azuretools.vscode-docker` | Dockerfile and compose support |

## Workspace Settings

Configure `.vscode/settings.json` for consistent developer experience across the team.

### Python Environment

- Set `python.defaultInterpreterPath` to the project virtual environment (e.g., `.venv/bin/python`)
- Enable `python.analysis.typeCheckingMode` at `"basic"` or `"standard"` level via Pylance

### Ruff (Linter + Formatter)

- Set Ruff as the default formatter: `editor.defaultFormatter` = `"charliermarsh.ruff"`
- Enable format on save: `editor.formatOnSave` = `true`
- Configure Ruff rule selection in `pyproject.toml` under `[tool.ruff]` (not in VS Code settings)
- Recommended Ruff rule sets: `E`, `F`, `W`, `I` (isort), `UP` (pyupgrade), `B` (bugbear), `SIM` (simplify), `ASYNC` (async rules)

### Type Checking

- Pylance `python.analysis.typeCheckingMode`: use `"basic"` for pragmatic checking or `"standard"` for stricter enforcement
- Add `py.typed` marker to your package root if publishing as a typed library

## Launch Configuration

### Debug FastAPI with Uvicorn (`launch.json`)

Create `.vscode/launch.json` for debugging the FastAPI application via `debugpy` + Uvicorn.

#### Configuration Fields

| Field | Value | Description |
|-------|-------|-------------|
| `name` | `"FastAPI Debug"` | Display name in debug dropdown |
| `type` | `"debugpy"` | Uses Python debugger |
| `request` | `"launch"` | Starts a new process |
| `module` | `"uvicorn"` | Runs Uvicorn as the ASGI server |
| `args` | `["app.main:app", "--reload", "--port", "8000"]` | Application path and server options |
| `jinja` | `true` | Enables Jinja2 template debugging (if used) |
| `env` | `{"ENV": "development"}` | Environment variables for the debug session |
| `postDebugTask` | `"stopBackend"` | Cleanup task to kill server on debug end |

#### Key Points

- `module: "uvicorn"` launches the server through `python -m uvicorn`, enabling breakpoints in route handlers, services, and dependencies
- `--reload` enables auto-restart on code changes during development
- Set `"justMyCode": false` if you need to step into FastAPI or Pydantic internals
- Press **F5** to start; breakpoints work in all `.py` files

### Stop Task (`tasks.json`)

Add a cleanup task to `.vscode/tasks.json`:

- **label**: `"stopBackend"` -- kills the Uvicorn process on port 8000
- **command**: `lsof -t -i:8000 | xargs kill -9 2>/dev/null; true`
- **presentation**: `reveal: "silent"`, `panel: "shared"`, `close: true`

## Testing Integration

### pytest Configuration

- VS Code discovers tests automatically when `pytest` is installed in the active environment
- Configure `python.testing.pytestEnabled`: `true`
- Set `python.testing.pytestArgs` to `["tests/", "-v"]`
- Tests appear in the Testing sidebar (beaker icon) for individual or batch execution

### Running Tests with Coverage

- Use `pytest --cov=app --cov-report=term-missing` from terminal
- For in-editor coverage visualization, install the **Coverage Gutters** extension (`ryanluker.vscode-coverage-gutters`) and generate `coverage.xml`

## Compound Debugging (Full Stack)

When working with a frontend (e.g., React/Vite), use VS Code `compounds` to launch both FastAPI backend and frontend debuggers.

### Compound Configuration

| Field | Value | Description |
|-------|-------|-------------|
| `name` | `"Full Stack Run"` | Display name in debug dropdown |
| `configurations` | `["FastAPI Debug", "Frontend (Chrome)"]` | Debug configs to launch together |
| `stopAll` | `true` | Stops all sessions when any one terminates |

For compound setup details, see `@common-setup-vscode`.

## Termination Behavior

When the debug session ends:

1. `postDebugTask: "stopBackend"` runs automatically
2. Kills the Uvicorn process on port **8000** via `lsof -t -i:8000 | xargs kill -9`
3. In compound mode, stopping any session terminates all linked sessions, then each `postDebugTask` runs independently

## Troubleshooting

- **Breakpoints not hitting**: Verify `module` is set to `"uvicorn"` (not `"python"`), and the app path matches your project layout
- **Import errors on launch**: Ensure the active Python interpreter is from the project virtual environment
- **Ruff conflicts with other formatters**: Disable `black` and `isort` extensions; Ruff replaces both
- **Pylance cannot resolve imports**: Add `"python.analysis.extraPaths": ["./app"]` if using a non-standard source root
- **Port already in use**: Check if port 8000 is occupied; change `--port` in `args` or kill the existing process

## Related Skills

- `@python-coding-style` - Base Python conventions
- `@common-setup-vscode` - Multi-component compound debugging
- `@fastapi-coding-style` - FastAPI project structure and conventions
