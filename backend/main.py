import os
from pathlib import Path

import logging

from dotenv import load_dotenv
from sqlalchemy import inspect, text

# 환경변수 로드: 프로젝트 루트의 .env.local (로컬 개발용)
# Docker에서는 이 파일이 없으므로 docker-compose의 environment가 사용됨
_env_local = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(_env_local, override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import users, activities, races, dashboard

logger = logging.getLogger(__name__)


def _run_migrations() -> None:
    """기존 테이블에 누락된 컬럼을 추가하는 간이 마이그레이션."""
    inspector = inspect(engine)

    # users 테이블 컬럼 추가
    if "users" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("users")}
        alter_stmts: list[str] = []

        if "nickname" not in existing:
            alter_stmts.append(
                "ALTER TABLE users ADD COLUMN nickname VARCHAR(50) NOT NULL DEFAULT ''"
            )
        if "google_id" not in existing:
            alter_stmts.append(
                "ALTER TABLE users ADD COLUMN google_id VARCHAR(100) NULL UNIQUE"
            )
        if "birth_year" not in existing:
            alter_stmts.append(
                "ALTER TABLE users ADD COLUMN birth_year INTEGER NULL"
            )
        if "birth_month" not in existing:
            alter_stmts.append(
                "ALTER TABLE users ADD COLUMN birth_month INTEGER NULL"
            )
        if "gender" not in existing:
            alter_stmts.append(
                "ALTER TABLE users ADD COLUMN gender VARCHAR(10) NULL"
            )

        if alter_stmts:
            with engine.begin() as conn:
                for stmt in alter_stmts:
                    logger.info("Migration: %s", stmt)
                    conn.execute(text(stmt))

        # hashed_password를 nullable로 변경 (Google 전용 계정 지원)
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE users MODIFY COLUMN hashed_password VARCHAR(255) NULL")
            )

    # password_reset_tokens 테이블은 create_all로 생성됨

    # laps 테이블 삭제 (Activity.tcx_data 재파싱으로 대체)
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS laps"))

    # activities 테이블 컬럼 추가
    if "activities" in inspector.get_table_names():
        existing_act = {col["name"] for col in inspector.get_columns("activities")}
        act_stmts: list[str] = []

        if "tcx_data" not in existing_act:
            act_stmts.append(
                "ALTER TABLE activities ADD COLUMN tcx_data MEDIUMTEXT NULL"
            )
        if "is_treadmill" not in existing_act:
            act_stmts.append(
                "ALTER TABLE activities ADD COLUMN is_treadmill BOOLEAN NOT NULL DEFAULT FALSE"
            )
        if "llm_evaluation" not in existing_act:
            act_stmts.append(
                "ALTER TABLE activities ADD COLUMN llm_evaluation VARCHAR(500) NULL"
            )
        if "llm_evaluation_status" not in existing_act:
            act_stmts.append(
                "ALTER TABLE activities ADD COLUMN llm_evaluation_status "
                "ENUM('pending','processing','completed','failed') NULL"
            )

        if act_stmts:
            with engine.begin() as conn:
                for stmt in act_stmts:
                    logger.info("Migration: %s", stmt)
                    conn.execute(text(stmt))

    logger.info("Migration complete.")


Base.metadata.create_all(bind=engine)
_run_migrations()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "races"), exist_ok=True)

app = FastAPI(title="Running Manager")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    origins.extend([o.strip() for o in cors_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(activities.router)
app.include_router(races.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Running Manager API"}
