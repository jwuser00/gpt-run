# 세션 요약: Claude-in-Chrome 디버거 연동 탐구

- **날짜**: 2026-02-20 16:00
- **프로젝트**: vibe-test (Running Management App)
- **브랜치**: main

## 수행 작업

### 1. launch.json `userDataDir: false` 추가 및 롤백
- Claude-in-Chrome 확장을 Cursor F5 디버거 Chrome에서 사용하기 위해 `userDataDir: false` 추가
- 결과적으로 브레이크포인트가 잡히지 않는 부작용 발생으로 해당 설정 제거 (결국 원상복구)
- 관련 파일: `.vscode/launch.json`

## 변경 파일

| 타입 | 파일 | 설명 |
|------|------|------|
| Modified | `.vscode/launch.json` | `userDataDir: false` 추가 후 롤백 — 최종적으로 변경 없음 |

## Git 커밋

커밋 없음 (변경사항 미커밋)

## 남은 작업

- [ ] F5 디버거 Chrome에서 Claude-in-Chrome 연동 방법 재검토 (userDataDir 변경 없이 브레이크포인트도 유지하는 방법)
- [ ] `preLaunchTask: "frontend: dev"` 실패 시 Chrome이 주소로 이동 안 하는 문제 원인 파악

## 참고 — 이번 세션에서 파악한 내용

- Claude-in-Chrome은 **Native Messaging** 기반으로 Claude Code CLI와 통신
- Native messaging host 설정 파일 위치: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
- Cursor F5 Chrome은 기본적으로 임시 `--user-data-dir` 사용 → native messaging 설정 없음
- `userDataDir: false`로 기본 프로파일 사용 시 확장은 연결되나 디버거 소스맵 연결 실패
- 두 기능(브레이크포인트 + Claude-in-Chrome)을 동시에 쓰는 방법은 미해결
