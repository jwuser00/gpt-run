# 세션 요약: Claude Code 응답 완료 시 macOS 알림 훅 구현

- **날짜**: 2026-03-02
- **프로젝트**: gpt-run (글로벌 설정이므로 모든 프로젝트에 적용)
- **브랜치**: main

## 수행 작업

### 1. macOS 네이티브 알림 훅 구현

Claude Code 응답이 완료되면 macOS 알림 센터로 알림을 보내는 훅을 구현했다.

#### 구현 배경
- Claude Code에서 작업 지시 후 응답을 기다리는 동안 다른 작업을 하다가 응답 완료를 놓치는 문제 해결
- macOS 알림 센터를 활용하여 응답 완료 시 소리와 함께 알림 수신

#### 기술 선택 과정
1. **`osascript` (실패)**: macOS 기본 명령어 `display notification`을 사용했으나, VSCode/Cursor(antigravity) 환경에서 알림이 표시되지 않음
2. **`terminal-notifier` (채택)**: Homebrew로 설치 (`brew install terminal-notifier`). 독립적인 알림 권한을 가지므로 터미널 앱 설정과 무관하게 동작

#### 알림 권한 설정 (필수)
- **시스템 설정 > 알림 > terminal-notifier** 에서 알림 허용 필요
- 최초 설치 시 알림 등록만 되고, 별도로 허용해야 실제 알림 수신 가능

### 2. 프로젝트명 표시 기능

알림에 현재 작업 중인 프로젝트 폴더명을 `subtitle`로 표시하도록 구현.
- `$CLAUDE_PROJECT_DIR` 환경변수에서 `basename` 추출
- 여러 프로젝트를 동시에 작업할 때 어떤 프로젝트의 응답인지 구분 가능

### 3. 짧은 응답 필터링 (10초 미만 스킵)

빠른 응답(10초 미만)에는 알림을 보내지 않도록 시간 기반 필터링 구현.

#### 동작 원리
1. **`UserPromptSubmit` 훅** (`record-prompt-time.sh`): 사용자가 프롬프트를 제출하면 현재 Unix timestamp를 `/tmp/claude-code-last-prompt-{session_id}` 파일에 기록
2. **`Stop` 훅** (`notify-complete.sh`): Claude 응답 완료 시 경과 시간 계산. 10초 미만이면 알림 스킵, 10초 이상이면 경과 시간과 함께 알림 발송

#### 세션 격리
- 훅은 stdin으로 JSON을 받으며, 그 안의 `session_id` 필드를 사용하여 타임스탬프 파일을 세션별로 분리
- 같은 프로젝트에서 여러 세션을 열어도 각각 독립적으로 시간 추적
- 타임스탬프 파일 경로: `/tmp/claude-code-last-prompt-{session_id}`

## 변경 파일

| 타입 | 파일 | 설명 |
|------|------|------|
| Added | `~/.claude/hooks/notify-complete.sh` | Stop 훅 - 응답 완료 시 macOS 알림 발송 (10초 미만 필터링, 프로젝트명/경과시간 포함) |
| Added | `~/.claude/hooks/record-prompt-time.sh` | UserPromptSubmit 훅 - 프롬프트 제출 시 세션별 타임스탬프 기록 |
| Modified | `~/.claude/settings.json` | `hooks` 섹션 추가 (UserPromptSubmit + Stop 훅 등록) |

## 최종 파일 내용

### `~/.claude/hooks/record-prompt-time.sh`
```bash
#!/bin/bash
set -euo pipefail

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')

TIMESTAMP_FILE="/tmp/claude-code-last-prompt-${session_id}"
date +%s > "$TIMESTAMP_FILE"
```

### `~/.claude/hooks/notify-complete.sh`
```bash
#!/bin/bash
set -euo pipefail

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')

TIMESTAMP_FILE="/tmp/claude-code-last-prompt-${session_id}"

# 마지막 프롬프트 시간이 없으면 알림 스킵
if [[ ! -f "$TIMESTAMP_FILE" ]]; then
  exit 0
fi

start_time=$(cat "$TIMESTAMP_FILE")
now=$(date +%s)
elapsed=$((now - start_time))

# 10초 이내 응답이면 알림 스킵
if [[ $elapsed -lt 10 ]]; then
  exit 0
fi

project_name=$(basename "${CLAUDE_PROJECT_DIR:-$PWD}")
terminal-notifier -title "Claude Code" -subtitle "$project_name" -message "응답이 완료되었습니다 (${elapsed}초)" -sound default
```

### `~/.claude/settings.json` (hooks 섹션)
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/record-prompt-time.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## 재활용 시 필요 사항

1. **`terminal-notifier` 설치**: `brew install terminal-notifier`
2. **알림 권한**: 시스템 설정 > 알림 > terminal-notifier 허용
3. **`jq` 설치 필요**: 훅 스크립트에서 stdin JSON 파싱에 사용 (macOS에 기본 미포함, `brew install jq`)
4. **훅 파일 실행 권한**: `chmod +x` 필요
5. **세션 재시작**: 훅 설정 변경 후 Claude Code 세션 재시작 필요 (훅은 세션 시작 시 로드)

## 핵심 학습

- `osascript`는 VSCode/Cursor 환경에서 알림이 동작하지 않을 수 있음 → `terminal-notifier` 사용
- 훅은 stdin으로 JSON을 받으며, `session_id`, `tool_name`, `tool_input` 등의 필드 포함
- `$CLAUDE_PROJECT_DIR` 환경변수로 현재 프로젝트 경로 접근 가능
- 훅은 세션 시작 시 로드되지만, 일부 경우 동적으로 반영될 수도 있음 (테스트에서 재시작 없이 적용됨)

## Git 커밋

커밋 없음 (글로벌 설정 파일이므로 프로젝트 git에 포함되지 않음)

---

## 추가 수정: AskUserQuestion 알림 누락 시도

### 문제
`Stop` 훅은 Claude가 응답을 완전히 마칠 때만 발동. `AskUserQuestion`(사용자에게 선택지를 제시하는 질문)은 Stop이 아닌 대기 상태이므로 알림이 오지 않았음.

### 시도 1: PostToolUse + AskUserQuestion (실패)
`PostToolUse` 훅에 matcher `AskUserQuestion`을 추가. 그러나 `AskUserQuestion`은 사용자가 답변을 완료한 후에야 도구가 완료되므로, 질문 표시 시점에 알림이 발동하지 않음.

### 시도 2: Notification 이벤트 (미검증)
`PostToolUse`를 `Notification` 이벤트로 교체. 그러나 세션 중 새로 추가한 훅 타입은 동적으로 로드되지 않아 테스트 불가. **세션 재시작 후 재검증 필요.**

### 현재 settings.json 상태
```json
"Notification": [
  {
    "matcher": "*",
    "hooks": [
      {
        "type": "command",
        "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
        "timeout": 5
      }
    ]
  }
]
```

### 알림이 발동하는 전체 이벤트 (현재)
| 훅 이벤트 | 매처 | 설명 | 상태 |
|-----------|------|------|------|
| `UserPromptSubmit` | `*` | 프롬프트 제출 시 타임스탬프 기록 | 동작 확인 |
| `Notification` | `*` | Claude 알림 발생 시 알림 발송 | 미검증 (재시작 필요) |
| `Stop` | `*` | 응답 완료 시 알림 발송 | 동작 확인 |

### 핵심 학습 (추가)
- 세션 시작 시 등록된 훅 타입(`Stop`, `UserPromptSubmit`)은 설정 변경 시 동적 반영됨
- 세션 중 **새로운 훅 타입**(`PostToolUse`, `Notification`)을 추가하면 동적 로드되지 않음 → 세션 재시작 필요
- `PostToolUse`는 `AskUserQuestion`에 부적합: 사용자 응답 후에야 발동하므로 알림 타이밍이 맞지 않음

## 남은 작업

- [x] 세션 재시작 후 `Notification` 훅이 `AskUserQuestion` 시점에 알림을 보내는지 검증
- [x] `Notification` 실패 시 대안 탐색 (`PreToolUse` + `AskUserQuestion` 등)

---

## 추가 수정 (2): Notification 훅 검증 및 PreToolUse 대안 적용

### Notification 훅 검증 결과 (실패)

세션 재시작 후 `Notification` 훅 테스트 수행:
1. 20초 대기 후 `AskUserQuestion` 호출
2. **알림이 오지 않음** — `Notification` 이벤트는 `AskUserQuestion` 시점에 발동하지 않는 것으로 확인

### Claude Code 훅 이벤트 전체 목록 (조사)

총 17개 훅 이벤트가 존재:

| 이벤트 | 설명 |
|--------|------|
| `SessionStart` | 세션 시작/재개 |
| `UserPromptSubmit` | 프롬프트 제출 시 |
| `PreToolUse` | 도구 실행 직전 |
| `PermissionRequest` | 권한 대화상자 표시 시 |
| `PostToolUse` | 도구 실행 성공 후 |
| `PostToolUseFailure` | 도구 실행 실패 후 |
| `Notification` | Claude Code가 알림을 보낼 때 |
| `SubagentStart` | 서브에이전트 생성 시 |
| `SubagentStop` | 서브에이전트 완료 시 |
| `Stop` | Claude 응답 완료 시 |
| `TeammateIdle` | 에이전트 팀 동료 idle 시 |
| `TaskCompleted` | 태스크 완료 시 |
| `ConfigChange` | 설정 파일 변경 시 |
| `WorktreeCreate` | 워크트리 생성 시 |
| `WorktreeRemove` | 워크트리 제거 시 |
| `PreCompact` | 컨텍스트 압축 전 |
| `SessionEnd` | 세션 종료 시 |

`Notification` 이벤트의 notification_type에 `elicitation_dialog`가 포함되어 있으나, 실제 `AskUserQuestion` 호출 시에는 발동하지 않았음.

### 시도 3: PreToolUse + AskUserQuestion (적용, 미검증)

`Notification` 훅을 제거하고 `PreToolUse` 훅으로 교체:
- **`PreToolUse`**: 도구 실행 **직전**에 발동 (사용자에게 표시되기 전)
- **matcher**: `AskUserQuestion`으로 한정
- `PostToolUse`와 달리 사용자 응답 완료를 기다리지 않으므로 타이밍 적합

### 현재 settings.json 상태

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/record-prompt-time.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 알림이 발동하는 전체 이벤트 (현재)

| 훅 이벤트 | 매처 | 설명 | 상태 |
|-----------|------|------|------|
| `UserPromptSubmit` | `*` | 프롬프트 제출 시 타임스탬프 기록 | 동작 확인 |
| `PreToolUse` | `AskUserQuestion` | 질문 도구 실행 직전 알림 발송 | 미검증 (재시작 필요) |
| `Stop` | `*` | 응답 완료 시 알림 발송 | 동작 확인 |

### 변경 파일

| 타입 | 파일 | 설명 |
|------|------|------|
| Modified | `~/.claude/settings.json` | `Notification` 훅 → `PreToolUse` (matcher: `AskUserQuestion`)으로 교체 |

### 핵심 학습 (추가)

- `Notification` 이벤트는 `AskUserQuestion` 시점에 발동하지 않음 (검증 완료)
- `PreToolUse`는 도구 실행 직전에 발동하므로, `AskUserQuestion` 알림에 적합할 가능성 높음
- `PreToolUse`는 새로운 훅 타입이므로 세션 재시작 후 테스트 필요

### Git 커밋

커밋 없음 (글로벌 설정 파일이므로 프로젝트 git에 포함되지 않음)

## 남은 작업

- [x] 세션 재시작 후 `PreToolUse` + `AskUserQuestion` 훅이 질문 시점에 알림을 보내는지 검증 → **동작 확인 (2026-03-02)**
- [x] `PreToolUse` 실패 시 대안 탐색 → 불필요 (PreToolUse 성공)

---

## 최종 확정 (2026-03-02)

모든 검증이 완료되어 최종 상태를 정리한다.

### 알림 발동 이벤트

| 훅 이벤트 | 매처 | 동작 | 상태 |
|-----------|------|------|------|
| `UserPromptSubmit` | `*` | 프롬프트 제출 시 세션별 타임스탬프 기록 | 동작 확인 |
| `PreToolUse` | `AskUserQuestion` | 질문 도구 실행 직전 알림 발송 | 동작 확인 |
| `Stop` | `*` | 응답 완료 시 알림 발송 | 동작 확인 |

### 알림 조건

- 프롬프트 제출 후 **10초 이상** 경과한 경우에만 알림 발송
- 알림에 **프로젝트명**과 **경과 시간** 포함
- 세션별 타임스탬프 파일로 **다중 세션 격리**

### AskUserQuestion 알림을 위한 시행착오 요약

| 시도 | 훅 이벤트 | 결과 | 사유 |
|------|-----------|------|------|
| 1 | `PostToolUse` + `AskUserQuestion` | 실패 | 사용자 응답 완료 후에야 발동 (타이밍 부적합) |
| 2 | `Notification` + `*` | 실패 | `AskUserQuestion` 시점에 발동하지 않음 |
| 3 | **`PreToolUse` + `AskUserQuestion`** | **성공** | 도구 실행 직전에 발동하여 타이밍 적합 |

### 최종 파일 내용

#### `~/.claude/hooks/record-prompt-time.sh`
```bash
#!/bin/bash
set -euo pipefail

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')

TIMESTAMP_FILE="/tmp/claude-code-last-prompt-${session_id}"
date +%s > "$TIMESTAMP_FILE"
```

#### `~/.claude/hooks/notify-complete.sh`
```bash
#!/bin/bash
set -euo pipefail

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')

TIMESTAMP_FILE="/tmp/claude-code-last-prompt-${session_id}"

# 마지막 프롬프트 시간이 없으면 알림 스킵
if [[ ! -f "$TIMESTAMP_FILE" ]]; then
  exit 0
fi

start_time=$(cat "$TIMESTAMP_FILE")
now=$(date +%s)
elapsed=$((now - start_time))

# 10초 이내 응답이면 알림 스킵
if [[ $elapsed -lt 10 ]]; then
  exit 0
fi

project_name=$(basename "${CLAUDE_PROJECT_DIR:-$PWD}")
terminal-notifier -title "Claude Code" -subtitle "$project_name" -message "응답이 완료되었습니다 (${elapsed}초)" -sound default
```

#### `~/.claude/settings.json` (hooks 섹션)
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/record-prompt-time.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/{user}/.claude/hooks/notify-complete.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 재활용 시 필요 사항

1. `brew install terminal-notifier jq`
2. 시스템 설정 > 알림 > terminal-notifier 허용
3. `chmod +x ~/.claude/hooks/*.sh`
4. `settings.json` 경로의 `{user}` 를 실제 사용자명으로 교체
5. 훅 설정 변경 후 Claude Code 세션 재시작

### 전체 핵심 학습

- `osascript`는 VSCode/Cursor 환경에서 동작하지 않음 → `terminal-notifier` 사용
- 훅은 stdin으로 JSON을 받으며, `session_id`, `tool_name`, `tool_input` 등의 필드 포함
- `$CLAUDE_PROJECT_DIR` 환경변수로 현재 프로젝트 경로 접근 가능
- 기존 훅 타입의 설정 변경은 동적 반영되지만, **새로운 훅 타입 추가는 세션 재시작 필요**
- `PostToolUse`는 `AskUserQuestion`에 부적합 (사용자 응답 후 발동)
- `Notification`은 `AskUserQuestion` 시점에 발동하지 않음
- **`PreToolUse`가 `AskUserQuestion` 알림에 적합** (도구 실행 직전 발동)
