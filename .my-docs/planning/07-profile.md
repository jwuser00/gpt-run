# 07. Profile - 내 정보

## Page: `/profile`

로그인한 사용자의 프로필 정보를 조회하고 수정하는 페이지. 사이드바 메뉴에서 "내 정보"로 접근.

## Sections

### 1. 프로필 정보 조회/수정

**UI 구성:**
- 이메일 표시 (읽기 전용, 수정 불가 — ID 역할)
- 닉네임 입력 (수정 가능, 2~20자)
- 생년월 선택 (수정 가능) — 연도 Select + 월 Select
- 성별 표시 (수정 가능) — 라디오 버튼 (남성 / 여성)
- Google 연동 상태 표시 (연동됨 / 미연동)
- "저장" 버튼

**동작:**
1. 페이지 진입 시 `GET /users/me`로 현재 프로필 로드
2. 닉네임, 생년월, 성별 수정 후 "저장" 클릭
3. `PUT /users/me` (JSON: nickname, birth_year, birth_month, gender)
4. 성공 → "프로필이 수정되었습니다." 알림
5. 실패 → 에러 메시지 표시

**유효성 검증:**
- 닉네임: 회원가입과 동일 규칙 (2~20자)
- 생년월: 필수 선택
- 성별: 필수 선택

### 2. 비밀번호 변경

프로필 페이지 하단에 별도 섹션으로 구성. Google 전용 계정(비밀번호 없음)에서는 이 섹션을 숨긴다.

**UI 구성:**
- 현재 비밀번호 입력
- 새 비밀번호 입력
- 새 비밀번호 확인 입력
- 비밀번호 강도 표시 (회원가입과 동일 PasswordStrengthBar 컴포넌트 재사용)
- "비밀번호 변경" 버튼

**동작:**
1. 현재 비밀번호 + 새 비밀번호 + 확인 입력
2. 프론트엔드 유효성 검증 (회원가입과 동일 규칙)
3. `PUT /users/me/password` (JSON: current_password, new_password)
4. 성공 → "비밀번호가 변경되었습니다." 알림
5. 실패 (현재 비밀번호 불일치) → "현재 비밀번호가 올바르지 않습니다." 에러

**유효성 검증:**
- 새 비밀번호: 8자 이상, 영문 + 숫자 조합 필수
- 새 비밀번호 확인: 일치 여부

## Backend API

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/users/me` | GET | Yes | — | User profile (email, nickname, birth_year, birth_month, gender, google_id 유무) |
| `/users/me` | PUT | Yes | `{nickname, birth_year, birth_month, gender}` | Updated user profile |
| `/users/me/password` | PUT | Yes | `{current_password, new_password}` | `{message}` |

## Implementation Status

| Feature | Status |
|---------|--------|
| 프로필 조회 (GET /users/me) | Not Implemented |
| 프로필 수정 (닉네임, 생년월, 성별) | Not Implemented |
| 비밀번호 변경 | Not Implemented |
| Google 연동 상태 표시 | Not Implemented |
