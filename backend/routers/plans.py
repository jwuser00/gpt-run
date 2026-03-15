from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import database
import auth
from services.llm.plan_graph import generate_plan

router = APIRouter(
    prefix="/plans",
    tags=["plans"],
)


@router.post("/", response_model=schemas.PlanOut)
def create_plan(
    plan_data: schemas.PlanCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    db_plan = models.Plan(
        user_id=current_user.id,
        created_at=datetime.utcnow(),
        user_prompt=plan_data.user_prompt,
        status=models.PlanStatus.active,
        generation_status=models.LLMEvaluationStatus.pending,
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    background_tasks.add_task(generate_plan, db_plan.id)

    result = schemas.PlanOut.model_validate(db_plan)
    result.session_count = 0
    return result


@router.get("/", response_model=List[schemas.PlanOut])
def list_plans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    plans = (
        db.query(models.Plan)
        .filter(models.Plan.user_id == current_user.id)
        .order_by(models.Plan.created_at.desc())
        .all()
    )
    result = []
    for plan in plans:
        out = schemas.PlanOut.model_validate(plan)
        out.session_count = len(plan.sessions)
        result.append(out)
    return result


@router.get("/active", response_model=schemas.PlanDetail | None)
def get_active_plan(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    plan = (
        db.query(models.Plan)
        .filter(
            models.Plan.user_id == current_user.id,
            models.Plan.status == models.PlanStatus.active,
        )
        .order_by(models.Plan.created_at.desc())
        .first()
    )
    if not plan:
        return None
    result = schemas.PlanDetail.model_validate(plan)
    result.session_count = len(plan.sessions)
    return result


@router.get("/{plan_id}", response_model=schemas.PlanDetail)
def get_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    plan = db.query(models.Plan).filter(
        models.Plan.id == plan_id,
        models.Plan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="계획을 찾을 수 없습니다")
    result = schemas.PlanDetail.model_validate(plan)
    result.session_count = len(plan.sessions)
    return result


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    plan = db.query(models.Plan).filter(
        models.Plan.id == plan_id,
        models.Plan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="계획을 찾을 수 없습니다")
    db.delete(plan)
    db.commit()
    return {"message": "계획이 삭제되었습니다"}


@router.get("/{plan_id}/sessions", response_model=List[schemas.PlanSessionBrief])
def get_plan_sessions(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    plan = db.query(models.Plan).filter(
        models.Plan.id == plan_id,
        models.Plan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="계획을 찾을 수 없습니다")
    return plan.sessions
