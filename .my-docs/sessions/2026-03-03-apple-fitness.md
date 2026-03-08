# 세션 요약: Apple Fitness 연동 조사 및 설계

- **날짜**: 2026-03-03
- **프로젝트**: gpt-run (Running Management App)
- **브랜치**: main

## 수행 작업

### 1. Apple Fitness 연동 방식 조사
- Apple HealthKit API는 네이티브 iOS/watchOS 앱 전용이며, 웹앱에서 직접 호출 가능한 REST API 없음 확인
- 웹앱에서 가능한 방식: 사용자가 수동으로 파일(GPX, Apple Health XML)을 내보내서 업로드
- Apple Health 내보내기 시 `export.xml` + `workout-routes/` GPX 파일 생성됨

### 2. GPX + Apple Health XML 파서 설계
- 기존 TCX 파서와 동일한 dict 형식을 반환하는 GPX/Apple Health XML 파서 설계
- GPX: Haversine 거리계산, 1km 단위 랩 자동생성, HR 추출
- Apple Health XML: `lxml.etree.iterparse` 스트리밍 파싱 (100MB+ 대응), 2-pass 방식
- 파일 확장자 기반 디스패처 (`file_parser.py`) 설계
- 계획 파일 작성: `.claude/plans/vectorized-wishing-naur.md`

### 3. iOS 앱 프록시 방식 검토
- iOS 앱을 HealthKit ↔ 백엔드 간 프록시로 사용하는 구조 확인
- `HealthKit → iOS 앱 → FastAPI 백엔드 → 웹앱` 플로우 가능
- 백엔드에 JSON POST 엔드포인트 1개 추가 + iOS 앱(SwiftUI + HealthKit) 개발 필요
- 사용자 결론: iOS 앱 개발이 필요할 것으로 판단

## 변경 파일

커밋 없음 (리서치/설계 세션)

## Git 커밋

커밋 없음 (변경사항 미커밋)

## 남은 작업

- [ ] GPX 파서 구현 (`backend/gpx_parser.py`)
- [ ] Apple Health XML 파서 구현 (`backend/apple_health_parser.py`)
- [ ] 파일 디스패처 구현 (`backend/file_parser.py`)
- [ ] 업로드 엔드포인트 수정 (다중 포맷 지원)
- [ ] 프론트엔드 업로드 UI 수정 (.tcx/.gpx/.xml 지원)
- [ ] iOS 앱 개발 여부 및 범위 결정
