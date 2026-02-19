---
name: common-create-project
description: Orchestrate new project creation by gathering input and delegating to per-stack create-project, setup, and setup-vscode skills.
---

# Project Creation Orchestrator

## Step 0: Pre-flight Checks (Before Anything Else)

Before starting, confirm the following with the user:

### 1. Require PLAN Mode

PLAN Mode cannot be detected automatically. **Always** ask the user to confirm explicitly before proceeding:

> 이 작업은 복잡한 다단계 작업으로, 반드시 **PLAN Mode**에서 실행해야 합니다.
> 현재 **PLAN Mode**로 실행 중이신가요? (예 / 아니오)
>
> This is a complex, multi-step operation that **must** be run in **PLAN Mode**.
> Are you currently running in **PLAN Mode**? (Yes / No)

If the user answers **No** (or is unsure), output the warning below and **immediately stop**:

> ⚠️ **Warning:** Please restart with `/plan` and try again.
>
> ⚠️ **경고:** `/plan`을 입력하여 PLAN Mode로 재시작한 후 다시 시도해 주세요.

Only proceed if the user explicitly confirms **Yes**.

### 2. Verify Supported Tech Stack

Supported components:

| Component | Skill |
|-----------|-------|
| `kotlin-springboot` | `@kotlin-springboot-create-project` |
| `java-springboot` | Spring Initializr / template |
| `typescript-react` | `@typescript-react-create-project` |

For each component the user requests:
- If it is **not listed above**, output the warning below and **immediately stop**:

> ⚠️ **Warning:** The requested tech stack (`{component}`) is not supported. Supported stacks are: `kotlin-springboot`, `java-springboot`, `typescript-react`. Please restart with a supported stack.
>
> ⚠️ **경고:** 요청하신 기술 스택(`{component}`)은 **지원되지 않는 팩입니다.** 지원 스택: `kotlin-springboot`, `java-springboot`, `typescript-react`. 지원되는 스택으로 다시 시작해 주세요.

- If it is listed above but the corresponding skill/pack **cannot be found or verified** in the current environment, explicitly inform the user and **immediately stop**:

> ⚠️ **Warning:** The pack for `{component}` (`{skill-name}`) could not be found. Please ensure the pack is installed before proceeding.
>
> ⚠️ **경고:** `{component}`에 해당하는 팩(`{skill-name}`)을 **찾을 수 없습니다.** 해당 팩이 설치되어 있는지 확인한 후 다시 시작해 주세요.

---

## Step 1: Gather Input

| Input | Required | Example |
|-------|----------|---------|
| **Project name** | Yes | `payment-service` |
| **Components** | Yes | `kotlin-springboot`, `typescript-react`, `java-springboot` |
| **Package path** (JVM only) | If JVM component | `com.skt.commerce.payment` |
| **Frontend path** (if frontend) | If frontend component | `frontend` |

Multiple components can be selected (e.g., `kotlin-springboot` + `typescript-react` for full-stack).

## Step 2: Create Project per Component

**Single component:** Create directly in the project root — no sub-directory needed.

```
{project-name}/
├── src/
├── build.gradle.kts   ← kotlin-springboot example
└── ...
```

**Multiple components:** Each component is created in its own sub-directory under the project root.

```
{project-name}/
├── backend/           ← kotlin-springboot or java-springboot
│   ├── src/
│   └── build.gradle.kts
├── frontend/          ← typescript-react
│   ├── src/
│   └── package.json
└── worker/            ← additional services (if any)
```

| Component | Single | Multiple | Skill |
|-----------|--------|----------|-------|
| Kotlin Spring Boot | project root | `backend/` | `@kotlin-springboot-create-project` with project name and package path |
| Java Spring Boot | project root | `backend/` | Spring Initializr or template, configure build file with project name and package |
| TypeScript React | project root | `frontend/` | `@typescript-react-create-project` with project name, type (spa/library), target path |

## Step 3: Add Default Implementation

After project scaffolding, add a minimal working feature that connects all components end-to-end. This verifies the full-stack wiring before any real development begins.

### Backend — `/hello` API

| Aspect | Detail |
|--------|--------|
| **Endpoint** | `GET /hello` |
| **Response** | JSON with `message` field: `{"message": "Hello from {project-name}!"}` |
| **Controller** | `HelloController` in the root controller package |
| **CORS** | Enable for frontend dev origin (default `http://localhost:5173`) |

| Component | Guideline |
|-----------|-----------|
| Kotlin Spring Boot | Create `HelloController` with `@RestController` and `@GetMapping("/hello")` returning a data class response. Configure CORS via `@CrossOrigin` or a global `WebMvcConfigurer`. |
| Java Spring Boot | Create `HelloController` with `@RestController` and `@GetMapping("/hello")` returning a response object. Configure CORS via `@CrossOrigin` or a global `WebMvcConfigurer`. |

### Frontend — Display Hello Message

| Aspect | Detail |
|--------|--------|
| **API call** | `GET http://localhost:8080/hello` on page load |
| **Display** | Show the returned `message` value on the default landing page |
| **Error handling** | Display a fallback message if the API is unreachable |

| Component | Guideline |
|-----------|-----------|
| TypeScript React | On the landing page component, fetch from the backend `/hello` endpoint on mount and render the `message` field from the JSON response. |

This step ensures that backend and frontend are properly connected and the development environment is verified working before proceeding.

## Step 4: Setup Runtime Environment

| Component | Version Manager | Project Config File |
|-----------|----------------|---------------------|
| JVM (Java/Kotlin) | SDKMAN: `sdk install java 21-tem` | `.sdkmanrc` via `sdk env init` |
| Node (TypeScript React) | fnm: `fnm install 24` | `.node-version` |

## Step 5: Setup VSCode Debugging

| Component | Skill |
|-----------|-------|
| Java Spring Boot | `@java-springboot-setup-vscode` |
| Kotlin Spring Boot | `@kotlin-springboot-setup-vscode` |
| TypeScript React | `@typescript-react-setup-vscode` |
| **Multi-component (2+)** | `@common-setup-vscode` — adds `compounds` for "Full Stack Run" |

## Step 6: Post-Creation Checklist

After all steps are complete, instruct the user:

> ✅ **Project setup is complete!**
>
> **Important:** Reload the VSCode window to ensure the debugger works correctly.
> Open the Command Palette (`Cmd + Shift + P`) and run:
> ```
> Developer: Reload Window
> ```
> Without this step, VSCode debug configurations may not be recognized properly.
>
> ✅ **프로젝트 설정이 완료되었습니다!**
>
> **중요:** 디버거가 올바르게 동작하려면 VSCode 창을 반드시 새로고침해야 합니다.
> 커맨드 팔레트(`Cmd + Shift + P`)를 열고 아래 명령을 실행하세요:
> ```
> Developer: Reload Window
> ```
> 이 단계를 건너뛰면 VSCode 디버그 설정이 제대로 인식되지 않을 수 있습니다.

## Related Skills

- `@kotlin-springboot-create-project`
- `@typescript-react-create-project`
- `@common-setup-vscode`
