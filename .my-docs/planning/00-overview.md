# Running Manager - Feature Overview

## Product Summary

GPS 워치에서 추출한 TCX 파일을 업로드하여 러닝 활동을 기록하고, 대회를 관리하며, 대시보드에서 통계를 확인하는 러닝 관리 앱.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Material-UI v5, Recharts |
| Backend | FastAPI (Python 3.11), SQLAlchemy ORM |
| Database | MySQL (PyMySQL driver) |
| LLM | LangChain + LangGraph, Anthropic/OpenAI, Langfuse |
| Infra | Docker Compose, OCI ARM (Terraform), Nginx |

## Menu Structure

```
┌─────────────────────────────────────────────────┐
│  Running Manager                                │
├─────────────────────────────────────────────────┤
│  [Public Pages - No Auth]                       │
│  ├─ /login              로그인                   │
│  ├─ /register           회원가입                 │
│  ├─ /forgot-password    비밀번호 찾기            │
│  └─ /reset-password     비밀번호 재설정          │
│                                                 │
│  [Protected Pages - Auth Required]              │
│  ├─ /dashboard      대시보드        (sidebar)    │
│  ├─ /activities     내 활동          (sidebar)    │
│  │   └─ /activity/[id]  활동 상세                │
│  ├─ /races          대회 관리        (sidebar)    │
│      ├─ /races/new         새 대회 등록          │
│      ├─ /races/[id]        대회 상세             │
│      └─ /races/[id]/result 결과 입력             │
│  ├─ /plans         러닝 계획        (sidebar)    │
│  │   ├─ /plans/new        계획 만들기              │
│  │   └─ /plans/[id]       계획 상세                │
│  └─ /profile        내 정보          (sidebar)    │
└─────────────────────────────────────────────────┘
```

## Feature Matrix

| Menu | Feature | Status |
|------|---------|--------|
| **Auth** | Email/Password 로그인 | Implemented |
| **Auth** | 회원가입 (기본) | Implemented |
| **Auth** | 회원가입 - 닉네임 필드 | Implemented |
| **Auth** | 회원가입 - 비밀번호 확인 입력 | Implemented |
| **Auth** | 회원가입 - 비밀번호 강도 검증 | Implemented |
| **Auth** | 회원가입 - 이메일 형식 검증 | Implemented |
| **Auth** | 회원가입 - 가입 후 자동 로그인 | Implemented |
| **Auth** | Google SSO 로그인/가입 | Implemented |
| **Auth** | 비밀번호 찾기 (이메일 링크) | Implemented |
| **Auth** | 비밀번호 재설정 | Implemented |
| **Auth** | 회원가입 - 생년월/성별 입력 | Implemented |
| **Auth** | JWT 토큰 인증 (30분 만료) | Implemented |
| **Profile** | 내 정보 조회/수정 (닉네임, 생년월, 성별) | Implemented |
| **Profile** | 비밀번호 변경 | Implemented |
| **Auth** | 세션 만료 모달 + 자동 로그아웃 | Implemented |
| **Dashboard** | 다가오는 대회 (D-Day 카운트다운) | Implemented |
| **Dashboard** | 이번 달 러닝 차트 (일별 거리 바 차트) | Implemented |
| **Dashboard** | 최근 활동 목록 (최근 5개) | Implemented |
| **Activities** | TCX 파일 업로드 (드래그앤드롭) | Implemented |
| **Activities** | 활동 목록 (연/월 필터) | Implemented |
| **Activities** | 활동 삭제 (확인 다이얼로그) | Implemented |
| **Activities** | 중복 업로드 감지 (409 Conflict) | Implemented |
| **Activity Detail** | 활동 요약 (거리, 시간, 페이스, HR, 케이던스) | Implemented |
| **Activity Detail** | 랩 분석 테이블 | Implemented |
| **Activity Detail** | 페이스 & 심박수 이중축 차트 | Implemented |
| **Races** | 대회 목록 (상태 필터: 전체/예정/완주/DNS/DNF) | Implemented |
| **Races** | 새 대회 등록 | Implemented |
| **Race Detail** | 대회 정보 조회/수정/삭제 | Implemented |
| **Race Detail** | 연결된 활동 표시 | Implemented |
| **Race Result** | 결과 입력 (상태, 완주 시간) | Implemented |
| **Race Result** | 활동 연결 (TCX 업로드 / 기존 활동 선택) | Implemented |
| **Race Result** | 사진 업로드 (최대 5장, 5MB) | Implemented |
| **Race Result** | 후기 작성 | Implemented |
| **Activity Detail** | 트레드밀 판단 및 표시 | Implemented |
| **Activity Detail** | LLM 러닝 평가 표시 | Implemented |
| **Activities** | 업로드 시 LLM 평가 상태 표시 | Implemented |
| **LLM Coaching** | 경량 TCX 생성 및 저장 | Implemented |
| **LLM Coaching** | LangGraph 평가 파이프라인 | Implemented |
| **LLM Coaching** | Langfuse 추적 연동 | Implemented |
| **LLM Coaching** | Lap 테이블 제거 → TCX 재파싱 | Implemented |
| **LLM Coaching** | 러닝 계획 추천 | Not Implemented |
| **Plans** | 계획 목록 페이지 | Not Implemented |
| **Plans** | 계획 생성 (사용자 Prompt → LLM High) | Not Implemented |
| **Plans** | 계획 상세 (세션 리스트, 활동 연결 상태) | Not Implemented |
| **Dashboard** | 활성 계획 요약 카드 | Not Implemented |
| **Activities** | 업로드 시 계획 세션 선택 | Not Implemented |
| **LLM Coaching** | 계획 세션 연결 시 평가에 반영 | Not Implemented |

## Detail Documents

| Document | Description |
|----------|-------------|
| [01-auth.md](./01-auth.md) | 인증 (로그인/회원가입) |
| [02-dashboard.md](./02-dashboard.md) | 대시보드 |
| [03-activities.md](./03-activities.md) | 내 활동 (목록/업로드) |
| [04-activity-detail.md](./04-activity-detail.md) | 활동 상세 |
| [05-races.md](./05-races.md) | 대회 관리 (목록/등록) |
| [06-race-detail.md](./06-race-detail.md) | 대회 상세/결과 입력 |
| [07-profile.md](./07-profile.md) | 내 정보 (프로필 조회/수정, 비밀번호 변경) |
| [08-llm-coaching.md](./08-llm-coaching.md) | AI 러닝 코칭 (LLM 평가, 계획 추천) |
