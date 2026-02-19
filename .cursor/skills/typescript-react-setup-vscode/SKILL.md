---
name: typescript-react-setup-vscode
description: Configure VSCode/Cursor AI for TypeScript React debugging. Sets up Vite dev server task and Chrome debugger integration.
---

# TypeScript React VSCode Debugging Setup

Uses the built-in JavaScript Debugger (`pwa-chrome`). No additional extensions required.

## Step 1: Create tasks.json

Vite dev server must run as a background task before the debugger attaches.

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "frontend: dev",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "pattern": {
          "regexp": "^([^\\s].*)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\):\\s+(.*)$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "VITE v",
          "endsPattern": "Local:"
        }
      },
      "presentation": {
        "group": "group",
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "stopFrontend",
      "type": "shell",
      "command": "lsof -t -i:5173 | xargs kill -9 2>/dev/null; true",
      "presentation": { "reveal": "silent", "panel": "shared", "close": true }
    }
  ]
}
```

- **`type: "shell"`**: Uses shell type instead of `"npm"` because the npm task provider fails to pass terminal output to problemMatcher in certain workspace configurations
- `beginsPattern` / `endsPattern`: Detects Vite startup and readiness to signal the debugger
- `options.cwd`: Adjust to your frontend directory path
- `stopFrontend`: Kills Vite dev server process on port 5173 when debugging ends

## Step 2: Create launch.json

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-chrome",
      "name": "Frontend (Chrome)",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend",
      "preLaunchTask": "frontend: dev",
      "postDebugTask": "stopFrontend"
    }
  ]
}
```

- `webRoot`: Must point to frontend source root for source map resolution
- `postDebugTask`: Automatically kills the Vite dev server when the debug session ends
- For multi-component compound debugging, see `@common-setup-vscode`

## Termination Behavior

When the debug session ends (manual stop or browser close):

1. The `postDebugTask: "stopFrontend"` runs automatically
2. `stopFrontend` kills the Vite dev server process on port **5173** via `lsof -t -i:5173 | xargs kill -9`
3. In compound mode (`stopAll: true`), stopping any session terminates all linked sessions — then each configuration's `postDebugTask` runs independently to clean up only its own process (Backend → `stopBackend`, Frontend → `stopFrontend`)

This ensures no orphan Vite/Node processes remain after debugging ends. For compound configuration details, see `@common-setup-vscode`.

## Troubleshooting

- **Breakpoints not hitting**: Verify `webRoot` path, ensure source maps enabled (`build.sourcemap: true`)
- **Server not detected as ready**: Adjust `beginsPattern`/`endsPattern` for your Vite version output
- **Project at root (not sub-directory)**: Set `"path": "."` in tasks.json and `"webRoot": "${workspaceFolder}"` in launch.json

## Related Skills

- `@typescript-react-react-guide`
- `@typescript-react-vite-guide`
- `@common-setup-vscode`
