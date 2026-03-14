"""User authentication and account management endpoints."""

import logging
import os
import uuid
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import auth
import database
import email_service
import models
import schemas

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.post(
    "/",
    response_model=schemas.User,
    status_code=status.HTTP_201_CREATED,
    summary="회원 가입",
)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """새 사용자를 등록합니다."""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        nickname=user.nickname,
        birth_year=user.birth_year,
        birth_month=user.birth_month,
        gender=user.gender,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post(
    "/token",
    response_model=schemas.Token,
    summary="로그인 (JWT 발급)",
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    """이메일/비밀번호로 로그인하여 JWT 액세스 토큰을 발급받습니다."""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/auth/google",
    summary="Google OAuth 로그인 시작",
    description="Google 동의 화면으로 리다이렉트합니다.",
)
def google_login():
    """Google OAuth 인증 흐름을 시작합니다."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google 로그인이 설정되지 않았습니다.",
        )
    redirect_uri = f"{BACKEND_URL}/users/auth/google/callback"
    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{params}")


@router.get(
    "/auth/google/callback",
    summary="Google OAuth 콜백 처리",
    description="Google에서 전달된 인증 코드를 처리하고 JWT를 발급합니다.",
)
async def google_callback(code: str, db: Session = Depends(database.get_db)):
    """Google OAuth 콜백을 처리하고 프론트엔드로 JWT와 함께 리다이렉트합니다."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google 로그인이 설정되지 않았습니다.",
        )

    redirect_uri = f"{BACKEND_URL}/users/auth/google/callback"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            userinfo_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
    except httpx.HTTPError as exc:
        logger.error("Google OAuth 요청 실패: %s", exc)
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=google_auth_failed"
        )

    google_id: str = userinfo.get("sub", "")
    email: str = userinfo.get("email", "")
    name: str = userinfo.get("name", "") or email.split("@")[0]

    if not google_id or not email:
        logger.error("Google userinfo에서 필수 필드 누락: %s", userinfo)
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=google_auth_failed"
        )

    # 기존 google_id로 조회 → 없으면 이메일로 조회 → 없으면 신규 생성
    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if user is None:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is not None:
            # 기존 이메일 계정에 Google ID 연결
            user.google_id = google_id
            db.commit()
        else:
            user = models.User(
                email=email,
                nickname=name,
                google_id=google_id,
                hashed_password=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return RedirectResponse(
        url=f"{FRONTEND_URL}/auth/google/callback?token={jwt_token}"
    )


@router.get(
    "/me",
    response_model=schemas.UserProfile,
    summary="내 프로필 조회",
)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
):
    """현재 로그인한 사용자의 프로필 정보를 반환합니다."""
    return schemas.UserProfile(
        email=current_user.email,
        nickname=current_user.nickname,
        birth_year=current_user.birth_year,
        birth_month=current_user.birth_month,
        gender=current_user.gender,
        has_google=bool(current_user.google_id),
        has_password=bool(current_user.hashed_password),
    )


@router.put(
    "/me",
    response_model=schemas.UserProfile,
    summary="내 프로필 수정",
)
def update_my_profile(
    profile_update: schemas.UserProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    """닉네임, 생년월일, 성별을 수정합니다."""
    current_user.nickname = profile_update.nickname
    current_user.birth_year = profile_update.birth_year
    current_user.birth_month = profile_update.birth_month
    current_user.gender = profile_update.gender
    db.commit()
    db.refresh(current_user)
    return schemas.UserProfile(
        email=current_user.email,
        nickname=current_user.nickname,
        birth_year=current_user.birth_year,
        birth_month=current_user.birth_month,
        gender=current_user.gender,
        has_google=bool(current_user.google_id),
        has_password=bool(current_user.hashed_password),
    )


@router.put(
    "/me/password",
    response_model=schemas.MessageResponse,
    summary="비밀번호 변경",
)
def change_password(
    request: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    """현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다."""
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 설정되지 않은 계정입니다.",
        )
    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )
    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}


@router.post(
    "/forgot-password",
    response_model=schemas.MessageResponse,
    summary="비밀번호 재설정 요청",
)
def forgot_password(
    request: schemas.ForgotPasswordRequest,
    db: Session = Depends(database.get_db),
):
    """비밀번호 재설정 이메일을 전송합니다.

    이메일이 등록되지 않은 경우에도 동일한 메시지를 반환합니다.
    """
    _GENERIC_RESPONSE = {"message": "입력하신 이메일로 비밀번호 재설정 링크를 전송했습니다. 이메일을 확인해 주세요."}

    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user is None:
        # 이메일 존재 여부를 노출하지 않기 위해 동일한 응답 반환
        return _GENERIC_RESPONSE

    reset_token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    db_token = models.PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at,
        used=False,
    )
    db.add(db_token)
    db.commit()

    email_service.send_password_reset_email(
        to_email=user.email,
        reset_token=reset_token,
    )

    return _GENERIC_RESPONSE


@router.post(
    "/reset-password",
    response_model=schemas.MessageResponse,
    summary="비밀번호 재설정",
)
def reset_password(
    request: schemas.ResetPasswordRequest,
    db: Session = Depends(database.get_db),
):
    """재설정 토큰을 검증하고 새 비밀번호로 변경합니다."""
    db_token = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token == request.token)
        .first()
    )

    if db_token is None or db_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 이미 사용된 재설정 링크입니다.",
        )

    if datetime.utcnow() > db_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="재설정 링크가 만료되었습니다. 다시 요청해 주세요.",
        )

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자를 찾을 수 없습니다.",
        )

    user.hashed_password = auth.get_password_hash(request.new_password)
    db_token.used = True
    db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}
