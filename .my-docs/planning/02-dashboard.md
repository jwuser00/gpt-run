# 02. Dashboard - 대시보드

## Screenshots

| Screen | File |
|--------|------|
| 대시보드 (메인) | ![](../images/04-dashboard.png) |
| 대시보드 (메인, 동일) | ![](../images/11-main-page.png) |

## Page: `/dashboard`

로그인 후 메인 화면. 러닝 활동과 대회 현황을 한눈에 확인.

## Sections

### 1. 다가오는 대회 (Upcoming Races)

대회 일정이 다가오는 상위 2개를 D-Day 카운트다운과 함께 표시.

**UI 구성:**
- "전체 보기" 링크 → `/races`
- `UpcomingRaceCard` 컴포넌트 (최대 2개)
  - 대회명
  - D-Day 카운트다운 (예: D-15)
  - 장소
  - 거리
  - 목표 시간
- 예정된 대회가 없을 경우: "예정된 대회가 없습니다" + "대회 등록하기" 버튼

**데이터:**
- status=예정인 대회를 race_date ASC 정렬, 상위 2개

### 2. 이번 달 러닝 (Monthly Running Chart)

현재 월의 일별 러닝 거리를 막대 차트로 표시.

**UI 구성:**
- "내 활동 보기" 링크 → `/activities`
- Recharts BarChart (X축: 일, Y축: 거리 km)
- 툴팁: 날짜, 거리(km)
- 데이터 없을 경우: "아직 이번 달 러닝 기록이 없습니다. 달려볼까요?" 메시지

**데이터:**
- 현재 월의 모든 날짜 (1일~말일)
- 각 날짜별: 총 거리(km), 평균 페이스
- 활동이 없는 날은 distance=0, pace=null

### 3. 최근 활동 (Recent Activities)

최근 러닝 활동 5개를 리스트로 표시.

**UI 구성:**
- "전체 보기" 링크 → `/activities`
- 각 항목: 러닝 아이콘 + 날짜(요일) + 거리·시간·페이스 + 심박수(bpm)
- 클릭 시 `/activity/[id]`로 이동

**데이터:**
- 최근 5개 활동 (start_time DESC)
- 필드: id, start_time, total_distance, total_time, avg_pace, avg_hr

### 4. 러닝 계획 요약 (Active Plan Card)

현재 활성 계획이 있으면 요약 표시.

**UI 구성:**
- 활성 계획이 있는 경우:
  - 계획 기간 (시작일 ~ 종료일)
  - 이번 주 세션 요약 (오늘/다가오는 세션 강조)
  - "상세 보기" 링크 → `/plans/[id]`
- 활성 계획이 없는 경우:
  - "러닝 계획을 세워보세요" 메시지 + "계획 만들기" 버튼 → `/plans/new`

**데이터:**
- status=active인 Plan 1개 + 해당 PlanSession 목록

## Backend API

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/dashboard/` | GET | Yes | `DashboardData` |

**DashboardData 구조:**
```json
{
  "upcoming_races": [Race, ...],       // 최대 2개, status=예정
  "monthly_running": [                 // 현재 월 전체 날짜
    {"date": "2026-03-01", "distance_km": 5.2, "avg_pace": 330},
    {"date": "2026-03-02", "distance_km": 0, "avg_pace": null},
    ...
  ],
  "recent_activities": [RecentActivity, ...]  // 최대 5개
}
```
