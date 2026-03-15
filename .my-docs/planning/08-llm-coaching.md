# 08. LLM Coaching - AI 러닝 코칭

## 개요

LLM을 활용하여 러닝 활동을 자동 평가하고, 향후 러닝 계획을 추천하는 핵심 기능.
이 프로젝트의 궁극적 목적은 LLM 기반 러닝 코칭이다.

## Tech Stack

| Component | Technology | 용도 |
|-----------|-----------|------|
| Orchestration | LangChain + LangGraph | LLM 파이프라인 구성 |
| LLM Provider | Anthropic (기본), OpenAI (확장) | 모델 호출 |
| Model Strategy | High / Low 전략 | 평가=Low(Haiku), 계획=High |
| 초기 구현 | Anthropic Haiku (High/Low 모두) | 테스트용 |
| Observability | Langfuse | LLM 호출 추적, 비용 모니터링 |
| Prompt 관리 | 파일 기반 (`backend/prompts/`) | 배포 시 포함, Langfuse 불필요 |

---

## Part 1: 러닝 평가

### 데이터 흐름

```
TCX 업로드
    │
    ├─ 동기: TCX 파싱 → Activity 저장 (요약 + 경량 TCX) → 응답 반환
    │
    └─ 비동기: LLM 평가 시작
         │
         ├─ 최근 3개 Activity 조회
         ├─ 계획 세션 정보 조회 (plan_session_id가 있는 경우)
         ├─ Prompt 렌더링 (template + data)
         ├─ LLM 호출 (Low model)
         ├─ 평가 결과 저장 (400자 이내)
         └─ evaluation_status → "completed"
```

### 비동기 처리

- 업로드 API는 Activity 저장 후 즉시 응답 (evaluation_status = "pending")
- LLM 평가는 `BackgroundTasks` (FastAPI)로 실행
- 프론트엔드는 폴링으로 평가 완료를 감지

### 평가 프롬프트 입력

| 데이터 | 출처 | 설명 |
|--------|------|------|
| 이번 Activity 요약 | Activity 테이블 | 거리, 시간, 페이스, HR, 케이던스 |
| 최근 3개 Activity 요약 | Activity 테이블 | 최근 러닝 이력 비교용 |
| 계획 세션 정보 | PlanSession 테이블 | 계획대로 뛰었는지 평가 (연결된 경우만) |
| 사용자 프로필 | User 테이블 | 생년월, 성별 |

### 평가 출력

- 400자 이내 한국어 텍스트
- 포함: 페이스 분배, 심박수 패턴, 이전 활동 대비 변화
- 계획 세션이 연결된 경우: 계획 준수도 평가 포함

---

## Part 2: 러닝 계획 추천

### 개요

사용자의 개인 스케줄과 러닝 이력을 기반으로 LLM(High model)이 러닝 계획을 생성한다.

### 데이터 흐름

```
사용자: "계획 만들기" 클릭
    │
    ├─ 최근 사용자 Prompt 표시 (수정 가능)
    ├─ 사용자 스케줄/요청 입력 후 제출
    │
    └─ 비동기: LLM 계획 생성 시작
         │
         ├─ 최근 3개 Activity + 평가 조회
         ├─ 다가오는 대회 일정 조회
         ├─ 사용자 프로필 조회
         ├─ Prompt 렌더링
         ├─ LLM 호출 (High model)
         ├─ 응답 파싱: 전체 텍스트 + 세션별 구조화 데이터 (JSON)
         ├─ Plan + PlanSession 저장
         └─ status → "active"
```

### 세션 유형

아마추어 러너 기준으로 심플하게 관리:

| Type | 설명 | 예시 |
|------|------|------|
| Easy | 이지런 (편한 페이스) | 5km, 6:30/km |
| Long | 롱런 | 15km, 6:00/km |
| Interval | 인터벌 (WU + 반복 + CD) | WU 1km + 400m×6 (rest 200m jog) + CD 1km |
| Fast | 빠른 페이스 / 템포런 | 8km, 5:30/km |
| Recovery | 회복 러닝 (매우 느린 페이스) | 3km, 7:00/km |
| Rest | 완전 휴식 | - |
| Race | 대회 | 하프마라톤 |

러닝 용어 참고: WU(warm-up), CD(cool-down), Interval, Fast, Recovery, Steady

### 계획 생성 프롬프트 입력

| 데이터 | 출처 | 설명 |
|--------|------|------|
| 사용자 Prompt | 사용자 입력 | 개인 스케줄, 요청사항 |
| 최근 3개 Activity + 평가 | Activity 테이블 | 현재 실력 수준 판단 |
| 다가오는 대회 일정 | Race 테이블 | status=예정, 대회 거리/목표시간 |
| 사용자 프로필 | User 테이블 | 생년월, 성별 |

### 계획 생성 프롬프트 출력

LLM에게 JSON + 텍스트 혼합 응답을 요청:

```json
{
  "plan_text": "전체 계획 설명 텍스트 (코칭 조언 포함)",
  "sessions": [
    {
      "date": "2026-03-17",
      "session_type": "Easy",
      "title": "이지런 5km",
      "description": "편한 페이스로 5km. 심박수 140 이하 유지.",
      "target_distance": 5000,
      "target_pace": 390
    },
    {
      "date": "2026-03-19",
      "session_type": "Interval",
      "title": "인터벌 400m×6",
      "description": "WU 1km + 400m×6 (rest 200m jog) + CD 1km",
      "target_distance": 6400,
      "target_pace": null
    }
  ]
}
```

### 계획 기간

- 기본값: 1주 (7일)
- 사용자가 Prompt에서 기간 지정 가능 ("다음 2주", "3월 말까지" 등)
- LLM이 사용자 요청에 맞게 기간 설정

### 사용자 Prompt 입력 UX

- "계획 만들기" 클릭 시 입력 화면 표시
- 최근 생성한 계획의 user_prompt를 기본값으로 표시 (수정 가능)
- 첫 생성 시 예시 문구 제공:

```
예시:
- 화목 저녁 7시 이후 러닝 가능
- 토요일 오전 롱런 가능
- 수요일은 회식이라 불가
- 다음 주말 하프마라톤 대회 있음
```

---

## 경량 TCX 생성

원본 TCX에서 LLM 분석 및 상세 표시에 필요한 최소 데이터만 추출하여 저장한다.

### 추출 규칙

- **Lap 태그**: 모든 Lap의 요약 정보 유지 (TotalTimeSeconds, DistanceMeters, AvgHR, MaxHR, Cadence)
- **Trackpoint**: 1분 간격으로 샘플링 (시간, 거리, 심박수, 케이던스, 속도)
- **제거 대상**: 중복 Trackpoint, Position 좌표, Watts, 인라인 xmlns 선언 (루트에만 유지)

### 예상 데이터 크기

- 원본 TCX: 500KB ~ 2MB (1시간 러닝 기준)
- 경량 TCX: 5KB ~ 20KB

## Prompt 관리

### 파일 구조

```
backend/prompts/
├── evaluation.txt          # 러닝 평가 프롬프트
└── plan.txt                # 러닝 계획 프롬프트
```

### Prompt 설계 원칙

- 프롬프트 파일은 코드와 함께 버전 관리 (git)
- 로컬에서 튜닝 → 배포 시 함께 포함
- Langfuse는 추적/모니터링 용도만, 프롬프트 저장소로 사용하지 않음

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

---

## Data Model

### Activity 테이블 변경

| Field | Type | 변경 | Description |
|-------|------|------|-------------|
| tcx_data | Text | **추가** | 경량 TCX XML 문자열 |
| is_treadmill | Boolean | **추가** | 트레드밀 여부 (Position 태그 유무로 판단) |
| llm_evaluation | Text(500) | **추가** | LLM 평가 결과 텍스트 |
| llm_evaluation_status | Enum | **추가** | pending / processing / completed / failed |
| plan_session_id | FK → PlanSession | **추가** | 연결된 계획 세션 (nullable) |

### Lap 테이블

- **삭제**. 기존 데이터 마이그레이션 불필요 (전체 삭제 가능).
- 랩 정보는 `tcx_data` 재파싱으로 대체.

### Plan 테이블 (신규)

| Field | Type | Description |
|-------|------|-------------|
| id | Integer PK | |
| user_id | FK → User | |
| created_at | DateTime | 생성 시간 |
| start_date | Date | 계획 시작일 |
| end_date | Date | 계획 종료일 |
| user_prompt | Text | 사용자가 입력한 스케줄/요청 |
| llm_plan_text | Text | LLM이 생성한 전체 계획 텍스트 |
| status | Enum | active / completed / archived |

### PlanSession 테이블 (신규)

| Field | Type | Description |
|-------|------|-------------|
| id | Integer PK | |
| plan_id | FK → Plan | |
| date | Date | 세션 날짜 |
| session_type | Enum | Easy / Long / Interval / Fast / Recovery / Rest / Race |
| title | String(100) | 한줄 요약 (예: "이지런 5km") |
| description | Text (nullable) | 상세 설명 (인터벌 구성 등) |
| target_distance | Float (nullable) | 목표 거리 (meters) |
| target_pace | Float (nullable) | 목표 페이스 (seconds/km) |

---

## Backend API

### 러닝 평가

| Endpoint | Method | Auth | Request | Response | 설명 |
|----------|--------|------|---------|----------|------|
| `/activities/upload` | POST | Yes | TCX file + plan_session_id (optional) | `Activity` | 업로드 + 비동기 평가 |
| `/activities/{id}` | GET | Yes | - | `ActivityDetail` | 상세 (tcx_data 재파싱) |
| `/activities/{id}/evaluate` | POST | Yes | - | `{message}` | 재평가 트리거 |

### 러닝 계획

| Endpoint | Method | Auth | Request | Response | 설명 |
|----------|--------|------|---------|----------|------|
| `/plans/` | POST | Yes | `{user_prompt}` | `Plan` | 계획 생성 (비동기 LLM) |
| `/plans/` | GET | Yes | - | `List[Plan]` | 계획 목록 |
| `/plans/{id}` | GET | Yes | - | `PlanDetail` (sessions 포함) | 계획 상세 |
| `/plans/{id}` | DELETE | Yes | - | `{message}` | 계획 삭제 |

---

## Backend 구조

```
backend/
├── services/
│   └── llm/
│       ├── __init__.py
│       ├── graph.py          # LangGraph 평가 파이프라인
│       ├── plan_graph.py     # LangGraph 계획 생성 파이프라인
│       ├── prompts.py        # Prompt 로딩 유틸리티
│       └── models.py         # LLM 모델 설정 (high/low 전략)
├── prompts/
│   ├── evaluation.txt        # 러닝 평가 프롬프트
│   └── plan.txt              # 러닝 계획 프롬프트
├── routers/
│   ├── activities.py
│   └── plans.py              # 계획 CRUD + 생성 트리거
└── ...
```

---

## Frontend 페이지

### `/plans` — 계획 목록

- 사이드바 메뉴: "러닝 계획"
- "계획 만들기" 버튼
- 계획 카드 리스트: 기간, 상태(active/completed/archived), 세션 수

### `/plans/new` — 계획 생성

- 사용자 Prompt 입력 (textarea)
- 최근 계획의 user_prompt를 기본값으로 표시
- 첫 생성 시 예시 문구 표시
- "생성" 버튼 → 비동기 LLM 호출 → 생성 완료 후 상세 페이지로 이동

### `/plans/[id]` — 계획 상세

- 계획 전체 텍스트 (LLM 원문)
- 세션 리스트 (날짜순):
  - 날짜, 유형 Chip, 제목, 설명
  - 연결된 Activity가 있으면 표시 (거리, 페이스)
  - 미완료 세션은 시각적으로 구분
- 삭제 버튼

### 대시보드 변경

- 현재 활성 계획 요약 카드 추가
  - 계획 기간, 이번 주 세션 요약
  - "계획 만들기" 버튼 (활성 계획 없을 때)
  - "상세 보기" 링크 → `/plans/[id]`

### Activity 업로드 변경

- 업로드 시 "계획 세션 선택" 드롭다운 추가
  - 활성 계획의 세션 목록 (날짜 + 유형 + 제목)
  - "Free Run" 옵션 (기본값, plan_session_id = null)
  - 오늘/근일 세션을 상단에 표시

---

## Implementation Status

| Feature | Status |
|---------|--------|
| 경량 TCX 생성 및 저장 | Implemented |
| 트레드밀 판단 | Implemented |
| Lap 테이블 제거 | Implemented |
| LangGraph 평가 파이프라인 | Implemented |
| 비동기 LLM 평가 (업로드 시) | Implemented |
| 평가 결과 저장 (400자) | Implemented |
| Langfuse 추적 연동 | Implemented |
| Prompt 파일 관리 | Implemented |
| 평가 재시도 API | Implemented |
| 계획 세션 연결 시 평가에 반영 | Not Implemented |
| Plan / PlanSession 테이블 | Not Implemented |
| 계획 생성 LLM 파이프라인 (High model) | Not Implemented |
| 계획 생성 프롬프트 (plan.txt) | Not Implemented |
| 계획 CRUD API | Not Implemented |
| /plans 페이지 (목록) | Not Implemented |
| /plans/new 페이지 (생성) | Not Implemented |
| /plans/[id] 페이지 (상세) | Not Implemented |
| 대시보드 계획 요약 카드 | Not Implemented |
| 업로드 시 계획 세션 선택 | Not Implemented |
