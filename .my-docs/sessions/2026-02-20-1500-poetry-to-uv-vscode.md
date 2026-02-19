# 세션 요약: Poetry → uv 마이그레이션 + VSCode 디버깅 설정

- **날짜**: 2026-02-20 15:00
- **프로젝트**: vibe-test (Running Manager App)
- **브랜치**: main

## 수행 작업

### 1. 백엔드 패키지 매니저 Poetry → uv 전환
- `backend/pyproject.toml`을 Poetry 형식에서 PEP 517 표준 형식으로 전면 교체
- `aiofiles` 의존성 추가 (기존 `requirements.txt`에는 있었으나 `pyproject.toml`에 누락)
- `backend/poetry.lock` 삭제
- `uv sync` 실행으로 `.venv/` 및 `uv.lock` 자동 생성 (31개 패키지 resolve)
- `CLAUDE.md` backend 개발 명령어를 `poetry` → `uv` 로 업데이트

### 2. VSCode 풀스택 디버깅 환경 구성
- `.vscode/extensions.json`: Python, Pylance, debugpy, Ruff, ESLint, Prettier 권장 확장 등록
- `.vscode/settings.json`: Python 인터프리터를 `backend/.venv/bin/python`으로 고정, Ruff 포맷터, pytest 설정
- `.vscode/tasks.json`: `frontend: dev` (백그라운드 Next.js 기동), `stopBackend`, `stopFrontend` 포트 kill 태스크
- `.vscode/launch.json`: "FastAPI Debug", "Frontend (Chrome)", "Next.js: server-side debug" + "Full Stack Run" 컴파운드 구성

## 변경 파일

| 타입 | 파일 | 설명 |
|------|------|------|
| Modified | `CLAUDE.md` | backend 개발 명령어 poetry → uv 업데이트 |
| Modified | `backend/pyproject.toml` | Poetry 형식 → PEP 517 표준, aiofiles 추가 |
| Deleted | `backend/poetry.lock` | uv.lock으로 대체 |
| Added | `backend/uv.lock` | uv sync로 생성된 lock 파일 |
| Added | `backend/.venv/` | uv sync로 생성된 가상환경 |
| Added | `.vscode/extensions.json` | 권장 VSCode 확장 목록 |
| Added | `.vscode/settings.json` | Python 인터프리터 및 포맷터 설정 |
| Added | `.vscode/tasks.json` | 프론트엔드 기동 및 포트 정리 태스크 |
| Added | `.vscode/launch.json` | 백엔드/프론트엔드/풀스택 디버그 구성 |

## Git 커밋

커밋 없음 (변경사항 미커밋)

## 남은 작업

- [ ] `.vscode/` 및 `uv.lock` git 커밋
- [ ] VSCode에서 "FastAPI Debug" F5 → `main.py` 브레이크포인트 적중 실제 검증
- [ ] "Full Stack Run" F5 → 백엔드 + Chrome 동시 기동 검증
