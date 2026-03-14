# 08. LLM Coaching - AI 러닝 코칭

## 개요

LLM을 활용하여 러닝 활동을 자동 평가하고, 향후 러닝 계획을 추천하는 핵심 기능.
이 프로젝트의 궁극적 목적은 LLM 기반 러닝 코칭이다.

**현재 범위 (25.3.14):**
- 러닝 평가 (Activity 업로드 시 자동 평가)

**향후 범위 (별도 요구사항으로 추가 예정):**
- 러닝 계획 추천 (1~2주 단위)
- 대회 목표 고려한 훈련 계획

## Tech Stack

| Component | Technology | 용도 |
|-----------|-----------|------|
| Orchestration | LangChain + LangGraph | LLM 파이프라인 구성 |
| LLM Provider | Anthropic (기본), OpenAI (확장) | 모델 호출 |
| Model Strategy | High / Low 전략 | 평가=Low(Haiku), 계획=High |
| 초기 구현 | Anthropic Haiku (High/Low 모두) | 테스트용 |
| Observability | Langfuse | LLM 호출 추적, 비용 모니터링 |
| Prompt 관리 | 파일 기반 (`backend/prompts/`) | 배포 시 포함, Langfuse 불필요 |

## Architecture

### 데이터 흐름: 러닝 평가

```
TCX 업로드
    │
    ├─ 동기: TCX 파싱 → Activity 저장 (요약 + 경량 TCX) → 응답 반환
    │
    └─ 비동기: LLM 평가 시작
         │
         ├─ 최근 3개 Activity의 tcx_data 조회
         ├─ 새 Activity의 tcx_data 포함
         ├─ Prompt 렌더링 (template + data)
         ├─ LLM 호출 (Haiku)
         ├─ 평가 결과 저장 (300자 이내)
         └─ evaluation_status → "completed"
```

### 비동기 처리

- 업로드 API는 Activity 저장 후 즉시 응답 (evaluation_status = "pending")
- LLM 평가는 `BackgroundTasks` (FastAPI) 또는 별도 비동기 태스크로 실행
- 프론트엔드는 폴링 또는 상태 체크로 평가 완료를 감지

### Backend 구조

```
backend/
├── services/
│   └── llm/
│       ├── __init__.py
│       ├── graph.py          # LangGraph 평가 파이프라인
│       ├── prompts.py        # Prompt 로딩 유틸리티
│       └── models.py         # LLM 모델 설정 (high/low 전략)
├── prompts/
│   └── evaluation.txt        # 러닝 평가 프롬프트 템플릿
└── ...
```

## 경량 TCX 생성

원본 TCX에서 LLM 분석 및 상세 표시에 필요한 최소 데이터만 추출하여 저장한다.

### 추출 규칙

- **Lap 태그**: 모든 Lap의 요약 정보 유지 (TotalTimeSeconds, DistanceMeters, AvgHR, MaxHR, Cadence)
- **Trackpoint**: 1분 간격으로 샘플링 (시간, 거리, 심박수, 케이던스, 속도)
- **제거 대상**: 중복 Trackpoint, Position 좌표 (트레드밀은 원래 없음, 야외도 LLM에 불필요), Watts

### 예상 데이터 크기

- 원본 TCX: 500KB ~ 2MB (1시간 러닝 기준)
- 경량 TCX: 5KB ~ 20KB

## Prompt 관리

### 파일 구조

```
backend/prompts/
├── evaluation.txt          # 러닝 평가 프롬프트
└── (향후) plan.txt         # 러닝 계획 프롬프트
```

### Prompt 설계 원칙

- 프롬프트 파일은 코드와 함께 버전 관리 (git)
- 로컬에서 튜닝 → 배포 시 함께 포함
- Langfuse는 추적/모니터링 용도만, 프롬프트 저장소로 사용하지 않음
- 템플릿 변수: `{recent_activities}`, `{new_activity}`, `{user_profile}` 등

### 평가 프롬프트 입력

| 데이터 | 출처 | 설명 |
|--------|------|------|
| 새 Activity tcx_data | Activity 테이블 | 이번 러닝의 경량 TCX |
| 최근 3개 Activity tcx_data | Activity 테이블 | 최근 러닝 이력 비교용 |
| 사용자 프로필 | User 테이블 | 생년월, 성별 (체력 수준 참고) |

### 평가 출력

- 300자 이내 한국어 텍스트
- 페이스 분배, 심박수 패턴, 케이던스, 이전 활동 대비 변화 등을 포함

## 환경 변수 (.env)

```
# LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
LLM_HIGH_MODEL=claude-haiku-4-5-20251001
LLM_LOW_MODEL=claude-haiku-4-5-20251001

# Langfuse
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Langfuse 운영 방침

- **Langfuse Cloud 무료 tier** 사용 (self-host 하지 않음)
- 환경별 Project 분리:
  - `running-manager-dev` — local 개발용
  - `running-manager-prd` — OCI 배포용
- 각 Project별 별도 API key 쌍 발급, `.env`로 환경 구분
- Langfuse는 추적/모니터링 전용, 프롬프트 저장소로 사용하지 않음
- **구현 순서**: LangGraph 파이프라인 먼저 구현 → 이후 Langfuse Cloud 가입 + callback 연결

## Data Model 변경

### Activity 테이블 변경

| Field | Type | 변경 | Description |
|-------|------|------|-------------|
| tcx_data | Text | **추가** | 경량 TCX XML 문자열 |
| is_treadmill | Boolean | **추가** | 트레드밀 여부 (Position 태그 유무로 판단) |
| llm_evaluation | Text(300) | **추가** | LLM 평가 결과 텍스트 |
| llm_evaluation_status | Enum | **추가** | pending / processing / completed / failed |

### Lap 테이블

- **삭제**. 기존 데이터 마이그레이션 불필요 (전체 삭제 가능).
- 랩 정보는 `tcx_data` 재파싱으로 대체.

## Backend API

| Endpoint | Method | Auth | Request | Response | 설명 |
|----------|--------|------|---------|----------|------|
| `/activities/upload` | POST | Yes | TCX file | `Activity` | 업로드 + 비동기 평가 시작 |
| `/activities/{id}` | GET | Yes | - | `ActivityDetail` | tcx_data 포함 상세 |
| `/activities/{id}/evaluate` | POST | Yes | - | `{message}` | 재평가 트리거 |

## Implementation Status

| Feature | Status |
|---------|--------|
| 경량 TCX 생성 및 저장 | Not Implemented |
| 트레드밀 판단 | Not Implemented |
| Lap 테이블 제거 | Not Implemented |
| LangGraph 평가 파이프라인 | Not Implemented |
| 비동기 LLM 평가 (업로드 시) | Not Implemented |
| 평가 결과 저장 (300자) | Not Implemented |
| Langfuse 추적 연동 | Not Implemented |
| Prompt 파일 관리 | Not Implemented |
| 평가 재시도 API | Not Implemented |
| 러닝 계획 추천 | Not Implemented (향후) |
