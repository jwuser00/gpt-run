---
name: python-setup-vscode
description: VS Code / Cursor AI setup guide for Python development. Covers extensions, virtual environments, debugger configuration, linting, and formatting.
---

# Python - VS Code Development Setup

## Overview

Guide for configuring VS Code (Cursor AI) to develop and debug Python applications. Enables IntelliSense, linting, formatting, debugging, and testing directly in the IDE.

## Prerequisites

- Python installed (recommended: 3.13)
- `uv` for package management (respect existing setup if already configured)
- Project with a virtual environment created

## Python Version Management

- Use **pyenv** for managing local Python versions
- Set project-level version with `.python-version` file at project root
- Auto-switch on directory change: configure shell integration (`pyenv init`)
- Default to **Python 3.13** for new projects
- **Existing project version always takes priority** - check `pyproject.toml` (`requires-python`), `.python-version`, or `Pipfile` before assuming a version

## Virtual Environment Setup

- Use **uv** for environment creation; if the project already uses `venv` or `poetry`, respect that
- Create the environment inside or alongside the project root
- Common conventions: `.venv/` directory at project root
- VS Code auto-detects `.venv/` - select it via `Python: Select Interpreter` command if not detected
- Add `.venv/` to `.gitignore`

## Required Extensions

- **Python** (Microsoft): IntelliSense, linting, debugging, Jupyter support
  - Extension ID: `ms-python.python`
- **Ruff** (Astral Software): Fast linter and formatter
  - Extension ID: `charliermarsh.ruff`
- **Even Better TOML** (tamasfe): Syntax highlighting for `pyproject.toml`
  - Extension ID: `tamasfe.even-better-toml`

## Workspace Settings

Configure `.vscode/settings.json` with the following settings:

### Interpreter and Environment

| Setting | Value | Description |
|---------|-------|-------------|
| `python.defaultInterpreterPath` | `".venv/bin/python"` | Points to the project virtual environment |
| `python.terminal.activateEnvironment` | `true` | Auto-activate venv in integrated terminal |

### Formatting and Linting

| Setting | Value | Description |
|---------|-------|-------------|
| `editor.defaultFormatter` (for `[python]`) | `"charliermarsh.ruff"` | Use Ruff as the default Python formatter |
| `editor.formatOnSave` | `true` | Format on save |
| `editor.codeActionsOnSave` | `{ "source.organizeImports.ruff": "explicit" }` | Auto-sort imports on save via Ruff |
| `ruff.lineLength` | `88` | Match project line length (Ruff/Black default) |

### Type Checking

| Setting | Value | Description |
|---------|-------|-------------|
| `python.analysis.typeCheckingMode` | `"standard"` | Enable Pylance type checking at standard level |

## Launch Configuration

### Basic Python Debug (`launch.json`)

Create or update `.vscode/launch.json` with the following configuration:

- **type**: `"debugpy"` - Uses the debugpy debugger bundled with the Python extension
- **request**: `"launch"` - Starts a new Python process
- **program**: `"${file}"` for current file, or path to the entry point module

### Configuration Fields

| Field | Value | Description |
|-------|-------|-------------|
| `type` | `"debugpy"` | Selects Python debugger |
| `request` | `"launch"` | Launches a new process |
| `program` | `"${file}"` or `"${workspaceFolder}/src/main.py"` | Script to debug |
| `console` | `"integratedTerminal"` | Uses integrated terminal for I/O |
| `justMyCode` | `true` | Skip stepping into library code (set `false` to debug libraries) |
| `cwd` | `"${workspaceFolder}"` | Working directory |
| `env` | `{}` | Additional environment variables |

### Module-based Launch

For running a module (e.g., `python -m mypackage`):

| Field | Value | Description |
|-------|-------|-------------|
| `type` | `"debugpy"` | Selects Python debugger |
| `request` | `"launch"` | Launches a new process |
| `module` | `"mypackage"` | Module to run (replaces `program`) |

### Key Points

- Press **F5** to start debugging with breakpoints and variable inspection
- Breakpoints can be set in any `.py` source file
- The debugger respects the selected Python interpreter (virtual environment)
- Use **Debug Console** for evaluating expressions during a paused session

## Testing Configuration

### pytest Integration

Configure VS Code to discover and run tests with pytest:

| Setting | Value | Description |
|---------|-------|-------------|
| `python.testing.pytestEnabled` | `true` | Enable pytest as the test runner |
| `python.testing.pytestArgs` | `["tests"]` | Test discovery root directory |
| `python.testing.unittestEnabled` | `false` | Disable unittest runner |

### Running Tests

- Open the **Testing** sidebar to discover and run tests
- Click the play button next to individual tests or test files
- Tests can be debugged with breakpoints via the debug icon in the Testing sidebar
- Use `Python: Configure Tests` command to reconfigure test discovery

## Troubleshooting

- **Interpreter not found**: Run `Python: Select Interpreter` and point to `.venv/bin/python`
- **Import errors in editor**: Ensure the correct virtual environment is selected and dependencies are installed
- **Ruff not formatting**: Verify `editor.defaultFormatter` is set to `"charliermarsh.ruff"` for `[python]` language scope
- **Breakpoints not hitting**: Ensure `justMyCode` is set appropriately and the correct `program`/`module` is configured
- **Type errors not showing**: Set `python.analysis.typeCheckingMode` to `"standard"` or `"strict"`

## Related Skills

- `@common-setup-vscode` - Multi-component compound debugging setup
- `@common-coding-guide` - Universal coding principles
- `@common-testing-guide` - Testing best practices
