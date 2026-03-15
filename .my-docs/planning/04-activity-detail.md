# 04. Activity Detail - 활동 상세

## Page: `/activity/[id]`

개별 러닝 활동의 상세 정보를 확인하는 페이지. 저장된 경량 TCX를 재파싱하여 랩 데이터를 표시한다.

**네비게이션:**
- "← 내 활동으로 돌아가기" 링크 → `/activities`

## Sections

### 1. 활동 요약 (ActivityStats)

주요 지표를 카드 형태로 표시.

| Metric | Label | Unit | Example |
|--------|-------|------|---------|
| Total Distance | Total Distance | km | 7.82 km |
| Total Time | Total Time | h:mm:ss | 44:09 |
| Avg Pace | Avg Pace | /km | 5:38 /km |
| Avg HR | Avg HR | bpm | 159 bpm |
| Avg Cadence | Avg Cadence | spm | 84 spm |
| Type | 유형 | - | 🏃 야외 / 🏃‍♂️ 트레드밀 |

- 트레드밀 활동은 "트레드밀" 뱃지/라벨을 표시한다

### 2. LLM 러닝 평가

활동 업로드 시 LLM이 자동으로 평가한 결과를 표시한다.

**UI 구성:**
- 평가 상태별 표시:
  - `pending` / `processing` → 스피너 + "AI 분석중..." 메시지
  - `completed` → 평가 텍스트 (300자 이내) 카드로 표시
  - `failed` → "분석 실패" 메시지 + 재시도 버튼
- 재시도 버튼 → `POST /activities/{id}/evaluate`

### 3. 랩 분석 (LapTable)

저장된 `tcx_data`를 프론트엔드에서 재파싱하여 표시한다.

| Column | Unit |
|--------|------|
| Lap (번호) | # |
| Distance | km |
| Time | mm:ss |
| Pace | /km |
| Avg HR | bpm |
| Max HR | bpm |
| Cadence | spm |

- 랩 데이터는 DB에 별도 테이블로 저장하지 않음
- API 응답에 `tcx_data`를 포함하고, 프론트엔드에서 파싱하여 렌더링
- 또는 백엔드에서 파싱한 결과를 응답에 포함 (선택)

### 4. 페이스 & 심박수 차트 (PaceHRChart)

Recharts 이중축 라인 차트.

**구성:**
- X축: 랩 번호
- 좌측 Y축: Pace (sec/km) — 파란색 라인, 값이 낮을수록 빠름 (역전 스케일)
- 우측 Y축: HR (bpm) — 빨간색 라인
- 툴팁: 랩 번호, 페이스, 심박수

### 5. 트레드밀 활동 특이사항

트레드밀 활동은 야외 러닝과 다른 점:
- GPS 좌표 없음 → 지도 표시 불가 (현재 지도 기능 없으므로 영향 없음)
- 거리 데이터가 워치 센서 기반이므로 정확도 차이 가능
- UI에서 "트레드밀" 뱃지로 명시

**트레드밀 판단 기준:**
- TCX `<Trackpoint>` 내 `<Position>` 태그(위도/경도) 존재 여부로 판단
- Position 없음 → `is_treadmill = true`

## Backend API

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/activities/{id}` | GET | Yes | `ActivityDetail` (tcx_data 포함) |
| `/activities/{id}/evaluate` | POST | Yes | `{message, status}` (재평가 트리거) |

**ActivityDetail 응답 구조:**
```json
{
  "id": 1,
  "user_id": 1,
  "start_time": "2025-11-16T00:00:00",
  "total_distance": 7820.0,
  "total_time": 2649.0,
  "avg_pace": 338.0,
  "avg_hr": 159.0,
  "avg_cadence": 84.0,
  "is_treadmill": false,
  "llm_evaluation": "페이스 분배가 잘 되어 있으며...",
  "llm_evaluation_status": "completed",
  "tcx_data": "<경량 TCX XML 문자열>"
}
```

## Data Units

| Field | Storage Unit | Display Unit |
|-------|-------------|-------------|
| distance | meters | km (÷1000) |
| time | seconds | h:mm:ss or mm:ss |
| pace | seconds/km | m:ss /km |
| hr | bpm | bpm |
| cadence | spm | spm |

## Implementation Status

| Feature | Status |
|---------|--------|
| 활동 요약 (5개 지표) | Implemented |
| 랩 분석 테이블 | Implemented |
| 페이스 & 심박수 차트 | Implemented |
| 트레드밀 판단 및 표시 | Implemented |
| LLM 러닝 평가 표시 | Implemented |
| 평가 재시도 | Implemented |
