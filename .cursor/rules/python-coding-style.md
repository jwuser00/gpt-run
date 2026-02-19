---
description: Python coding style and conventions (follow project version, recommended 3.13)
globs: ["**/*.py"]
alwaysApply: false
---

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

## Related Skills

- `@common-coding-guide` - SOLID, DRY, KISS, YAGNI principles
- `@common-testing-guide` - Universal testing best practices
