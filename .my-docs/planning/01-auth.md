# 01. Auth - 인증

## Screenshots

| Screen | File |
|--------|------|
| 로그인 (빈 폼) | ![](../images/01-login.png) |
| 로그인 (입력됨) | ![](../images/03-login-filled.png) |
| 회원가입 | ![](../images/02-register.png) |

## Pages

### Login (`/login`)

비인증 사용자의 진입점. 로그인 후 대시보드로 이동.

**UI 구성:**
- Email 입력 (필수)
- Password 입력 (필수)
- "Sign In" 버튼
- "Google로 로그인" 버튼 (Google 아이콘 + 텍스트)
- "비밀번호를 잊으셨나요?" 링크 → `/forgot-password`
- "Don't have an account? Register" 링크 → `/register`

**동작:**
1. 이메일/비밀번호 입력 후 Sign In 클릭
2. `POST /users/token` (form-urlencoded: username=email, password)
3. 성공 → JWT 토큰을 localStorage에 저장, `/dashboard`로 리다이렉트
4. 실패 → 에러 메시지 표시

### Register (`/register`)

신규 사용자 등록.

**UI 구성:**
- Email 입력 (필수)
- Nickname 입력 (필수)
- 생년월 선택 (필수) — 연도 Select + 월 Select
- 성별 선택 (필수) — 라디오 버튼 (남성 / 여성)
- Password 입력 (필수)
- Password 확인 입력 (필수)
- 비밀번호 강도 표시 (실시간)
- "Sign Up" 버튼
- "Google로 가입" 버튼 (Google 아이콘 + 텍스트)
- "Already have an account? Login" 링크 → `/login`

**동작:**
1. 이메일/닉네임/생년월/성별/비밀번호/비밀번호 확인 입력 후 Sign Up 클릭
2. 프론트엔드 유효성 검증 (아래 규칙 참조)
3. 검증 통과 시 `POST /users/` (JSON: email, nickname, birth_year, birth_month, gender, password)
4. 성공 → 자동 로그인 (`POST /users/token` 호출) → `/dashboard`로 리다이렉트
5. 실패 (이메일 중복 등) → 에러 알림 표시

#### 프론트엔드 유효성 검증 규칙

모든 검증은 프론트엔드에서 수행하며, 실시간 피드백을 제공한다.

**이메일:**
- 이메일 형식 검증 (RFC 5322 간소화 — `@` 및 도메인 부분 존재 확인)
- 유효하지 않을 시 helperText: "올바른 이메일 형식을 입력해주세요"

**닉네임:**
- 2~20자
- 빈 값 불가
- helperText: "닉네임은 2~20자로 입력해주세요"

**생년월:**
- 연도: 1920~현재연도 범위의 Select
- 월: 1~12 Select
- 둘 다 필수
- helperText: "생년월을 선택해주세요"

**성별:**
- 라디오 버튼: 남성 / 여성
- 필수 선택
- helperText: "성별을 선택해주세요"

**비밀번호:**
- 최소 8자 이상
- 영문 + 숫자 조합 필수 (특수문자는 선택)
- helperText: "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다"

**비밀번호 강도 표시:**
- 실시간으로 입력 중인 비밀번호 강도를 시각적으로 표시
- 단계: 약함(빨강) / 보통(주황) / 강함(초록)
- 판단 기준:
  - 약함: 8자 미만 또는 영문/숫자 중 하나만 포함
  - 보통: 8자 이상 + 영문 + 숫자
  - 강함: 12자 이상 + 영문 + 숫자 + 특수문자

**비밀번호 확인:**
- 비밀번호와 일치 여부 확인
- 불일치 시 helperText: "비밀번호가 일치하지 않습니다"

**Submit 버튼 상태:**
- 모든 필드가 유효하고 비밀번호가 일치할 때만 활성화

#### 가입 후 자동 로그인 흐름

```
[Sign Up 클릭]
    ↓
POST /users/ (email, nickname, birth_year, birth_month, gender, password)
    ↓ 성공
POST /users/token (username=email, password)
    ↓ 성공
localStorage에 JWT 저장
    ↓
/dashboard 리다이렉트
```

가입 성공 후 토큰 발급 요청이 실패할 경우, `/login`으로 리다이렉트하며 "회원가입이 완료되었습니다. 로그인해주세요." 메시지를 표시한다.

### Google SSO 로그인/가입

Login, Register 페이지 모두에서 Google 버튼을 통해 소셜 로그인 가능.

**동작 흐름:**

```
[Google 버튼 클릭]
    ↓
Google OAuth2 Consent Screen (redirect)
    ↓ 사용자 승인
GET /users/auth/google/callback?code={authorization_code}
    ↓ Backend에서 처리
Google에서 access_token 발급 → userinfo 조회 (email, name)
    ↓
DB에서 email로 사용자 조회
    ├─ 존재 → 기존 계정에 google_id 연결 (최초 1회)
    └─ 미존재 → 신규 가입 (email, nickname=Google name, google_id 저장, password 없음)
    ↓
JWT 발급 → 프론트엔드로 redirect (token query param)
    ↓
localStorage에 JWT 저장 → /dashboard 이동
```

**Google OAuth2 설정:**
- Google Cloud Console에서 OAuth 2.0 Client ID 생성
- Redirect URI: `{BACKEND_URL}/users/auth/google/callback`
- Scope: `openid email profile`
- 환경변수: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**계정 연결 규칙:**
- Google 로그인 시 이메일이 기존 계정과 동일하면 자동 연결 (google_id 저장)
- 연결 후에는 이메일/비밀번호 또는 Google 어느 쪽이든 로그인 가능
- Google 전용 계정 (비밀번호 없이 가입)도 허용
- 닉네임은 Google 프로필의 name을 자동으로 가져옴

### Forgot Password (`/forgot-password`)

비밀번호 재설정 이메일 요청 페이지.

**UI 구성:**
- Email 입력 (필수)
- "재설정 링크 발송" 버튼
- "로그인으로 돌아가기" 링크 → `/login`

**동작:**
1. 이메일 입력 후 발송 버튼 클릭
2. `POST /users/forgot-password` (JSON: email)
3. 성공/실패 무관하게 동일 메시지 표시: "해당 이메일로 비밀번호 재설정 링크를 발송했습니다."
   (보안상 이메일 존재 여부를 노출하지 않음)

**이메일 발송:**
- OCI Email Delivery SMTP 사용
- 발신 주소: `noreply@{도메인}`
- 제목: "[Running Manager] 비밀번호 재설정"
- 본문: 재설정 링크 포함 (`{FRONTEND_URL}/reset-password?token={reset_token}`)
- 링크 유효시간: 30분

### Reset Password (`/reset-password`)

이메일 링크를 통해 접근하는 비밀번호 재설정 페이지.

**UI 구성:**
- 새 비밀번호 입력 (필수)
- 새 비밀번호 확인 입력 (필수)
- 비밀번호 강도 표시 (회원가입과 동일)
- "비밀번호 변경" 버튼

**동작:**
1. URL query param에서 `token` 추출
2. 새 비밀번호 입력 + 유효성 검증 (회원가입과 동일 규칙)
3. `POST /users/reset-password` (JSON: token, new_password)
4. 성공 → "비밀번호가 변경되었습니다." + `/login` 리다이렉트
5. 실패 (토큰 만료/무효) → "링크가 만료되었거나 유효하지 않습니다." 에러 표시

## Auth Flow

```
[Login Form] → POST /users/token → JWT (access_token, 30min)
                                      ↓
                              localStorage('token')
                                      ↓
                         Axios interceptor: Authorization: Bearer {token}
                                      ↓
                              [401 Response]
                                      ↓
                         window event: 'auth-error'
                                      ↓
                         AuthErrorModal → 토큰 삭제 → /login 리다이렉트
```

## Backend API

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/users/` | POST | No | `{email, nickname, birth_year, birth_month, gender, password}` | User object |
| `/users/me` | GET | Yes | — | User profile object |
| `/users/me` | PUT | Yes | `{nickname, birth_year, birth_month, gender}` | User profile object |
| `/users/me/password` | PUT | Yes | `{current_password, new_password}` | `{message}` |
| `/users/token` | POST | No | form-urlencoded `{username, password}` | `{access_token, token_type}` |
| `/users/auth/google` | GET | No | — | Google OAuth2 redirect |
| `/users/auth/google/callback` | GET | No | query: `code` | JWT redirect to frontend |
| `/users/forgot-password` | POST | No | `{email}` | `{message}` |
| `/users/reset-password` | POST | No | `{token, new_password}` | `{message}` |

## Implementation Details

**Backend:**
- 비밀번호: bcrypt 해싱 (passlib)
- JWT: HS256 알고리즘, SECRET_KEY 환경변수 (미설정 시 자동생성 + 경고)
- 토큰 만료: 30분
- `get_current_user` dependency로 보호된 엔드포인트에서 사용자 주입

**Frontend:**
- `AuthProvider` (useAuth hook): token, isAuthenticated, setToken(), logout()
- `ProtectedRoute`: 인증되지 않은 사용자를 `/login`으로 리다이렉트
- `AuthErrorModal`: 401 응답 시 세션 만료 모달 표시 후 로그아웃
- Axios request interceptor: 모든 요청에 Bearer 헤더 자동 추가

## Data Model 변경

### User 모델 (컬럼 추가)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nickname | String(50) | Yes | 사용자 닉네임 (2~20자) |
| birth_year | Integer | Yes | 생년 (예: 1990) |
| birth_month | Integer | Yes | 생월 (1~12) |
| gender | String(10) | Yes | 성별 ("male" / "female") |
| google_id | String(100) | No | Google OAuth2 sub (고유 ID). Nullable, unique |
| hashed_password | String | No | Google 전용 가입 시 null 허용으로 변경 |

기존 User 모델에 컬럼 추가. `hashed_password`는 기존 NOT NULL에서 Nullable로 변경 (Google 전용 계정 지원).

### PasswordResetToken 모델 (신규)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | Integer (PK) | Yes | Auto increment |
| user_id | Integer (FK → User) | Yes | 대상 사용자 |
| token | String(100) | Yes | UUID 기반 토큰. Unique index |
| expires_at | DateTime | Yes | 만료 시각 (생성 시점 + 30분) |
| used | Boolean | Yes | 사용 여부 (default: false) |

## Implementation Status

| Feature | Status |
|---------|--------|
| Email/Password 로그인 | Implemented |
| JWT 토큰 발급 (30분 만료) | Implemented |
| 세션 만료 모달 + 자동 로그아웃 | Implemented |
| 회원가입 (email + password) | Implemented |
| 비밀번호 확인 입력 (2개 입력) | Implemented |
| 비밀번호 강도 검증 (프론트엔드) | Implemented |
| 이메일 형식 검증 (프론트엔드) | Implemented |
| 닉네임 필드 추가 | Implemented |
| 가입 후 자동 로그인 | Implemented |
| Google SSO 로그인/가입 | Implemented |
| Google 계정 자동 연결 (동일 이메일) | Implemented |
| 비밀번호 찾기 (이메일 링크 발송) | Implemented |
| 비밀번호 재설정 | Implemented |
| OCI Email Delivery 연동 | Implemented |
| 회원가입 - 생년월/성별 입력 | Implemented |
| 내 정보 조회/수정 | Implemented |
| 비밀번호 변경 | Implemented |
