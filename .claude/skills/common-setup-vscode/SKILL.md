---
name: common-setup-vscode
description: Configure VSCode/Cursor AI compound debugging for multi-component projects. Combines individual component debug configurations into a unified Full Stack debugging experience.
---

# VSCode Multi-Component Debugging Setup

Each component must first have its own debug configuration applied. This skill combines them via `compounds`.

## Prerequisites: Per-Component Config Names

| Component | Skill | Debug Config Name |
|-----------|-------|-------------------|
| Java Spring Boot | `@java-springboot-setup-vscode` | `"Backend (Spring Boot)"` |
| Kotlin Spring Boot | `@kotlin-springboot-setup-vscode` | `"BootRunDebugWait (compile) + Attach :5005"` |
| TypeScript React | `@typescript-react-setup-vscode` | `"Frontend (Chrome)"` |
| FastAPI | `@fastapi-setup-vscode` | `"FastAPI Debug"` |

## Step 1: Merge tasks.json

Combine all component tasks into a single `.vscode/tasks.json`.

**Notes:**
- Java launch type does not need a `preLaunchTask` — the Java Debugger handles startup directly
- Kotlin uses a Gradle background task (`bootRunDebugWait`) — see `@kotlin-springboot-setup-vscode`
- Frontend tasks must be `isBackground: true`

## Step 2: Add Compounds to launch.json

Merge all individual `configurations` and add `compounds`:

### Java + TypeScript React

```json
"compounds": [
  {
    "name": "Full Stack Run",
    "configurations": ["Backend (Spring Boot)", "Frontend (Chrome)"],
    "stopAll": true
  }
]
```

### Kotlin + TypeScript React

```json
"compounds": [
  {
    "name": "Full Stack Run",
    "configurations": ["BootRunDebugWait (compile) + Attach :5005", "Frontend (Chrome)"],
    "stopAll": true
  }
]
```

### FastAPI + TypeScript React

```json
"compounds": [
  {
    "name": "Full Stack Run",
    "configurations": ["FastAPI Debug", "Frontend (Chrome)"],
    "stopAll": true
  }
]
```

**Key:** `configurations` array must use the exact `name` string from each configuration entry (case-sensitive).

## Step 3: Termination Behavior

When `stopAll: true` is set in a compound configuration, the debug termination flow works as follows:

1. **User stops any one debug session** (e.g., clicks Stop on Backend or Frontend)
2. **VS Code terminates all linked sessions** in the compound group simultaneously
3. **Each configuration's `postDebugTask` runs independently** to clean up only its own process:
   - Java Backend config → `stopBackend` task → kills port **8080** (server only; Java launch mode does not use an explicit debug port)
   - Kotlin Backend config → `stopBackend` task → kills ports **8080** (server) and **5005** (JDWP debug port used by remote attach)
   - Frontend config → `stopFrontend` task → kills port **5173** (Vite dev server)

This ensures no orphan processes remain after debugging ends.

## Step 4: Add Stop Tasks to tasks.json

Each component needs a cleanup task. Merge these into the combined `tasks.json`:

- **`stopBackend` (Java)**: `lsof -t -i:8080 | xargs kill -9 2>/dev/null; true`
- **`stopBackend` (Kotlin)**: `lsof -t -i:8080 | xargs kill -9 2>/dev/null; lsof -t -i:5005 | xargs kill -9 2>/dev/null; true`
- **`stopBackend` (FastAPI)**: `lsof -t -i:8000 | xargs kill -9 2>/dev/null; true`
- **`stopFrontend`**: `lsof -t -i:5173 | xargs kill -9 2>/dev/null; true`

Both should use `presentation: { "reveal": "silent", "panel": "shared", "close": true }` to run silently.

## Troubleshooting

- **One component fails**: Test each configuration individually first
- **`preLaunchTask` mismatch**: Labels must match exactly between `tasks.json` and `launch.json`
- **Orphan process after stop**: Verify `postDebugTask` is set on each configuration and stop task labels match exactly

## Related Skills

- `@java-springboot-setup-vscode`
- `@kotlin-springboot-setup-vscode`
- `@typescript-react-setup-vscode`
- `@fastapi-setup-vscode`
- `@python-setup-vscode`
