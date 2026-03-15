from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
import database
import auth
import tcx_parser
from services.llm.graph import evaluate_activity

router = APIRouter(
    prefix="/activities",
    tags=["activities"],
)


@router.post("/upload", response_model=List[schemas.Activity])
async def upload_tcx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    plan_session_id: Optional[int] = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    content = await file.read()
    try:
        parsed_activities = tcx_parser.parse_tcx(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid TCX file: {str(e)}")

    is_treadmill = tcx_parser.detect_treadmill(content)
    lightweight_tcx = tcx_parser.create_lightweight_tcx(content)

    saved_activities = []
    for activity_data in parsed_activities:
        start = activity_data['start_time']
        duplicate = db.query(models.Activity).filter(
            models.Activity.user_id == current_user.id,
            models.Activity.start_time >= start - timedelta(minutes=5),
            models.Activity.start_time <= start + timedelta(minutes=5),
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"이미 업로드된 활동입니다 ({start.isoformat()})"
            )

        db_activity = models.Activity(
            user_id=current_user.id,
            start_time=activity_data['start_time'],
            total_distance=activity_data['total_distance'],
            total_time=activity_data['total_time'],
            avg_pace=activity_data['avg_pace'],
            avg_hr=activity_data['avg_hr'],
            avg_cadence=activity_data['avg_cadence'],
            tcx_data=lightweight_tcx,
            is_treadmill=is_treadmill,
            llm_evaluation_status=models.LLMEvaluationStatus.pending,
            plan_session_id=plan_session_id,
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)

        background_tasks.add_task(evaluate_activity, db_activity.id)
        saved_activities.append(db_activity)

    return saved_activities


@router.get("/", response_model=List[schemas.Activity])
def read_activities(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    activities = (
        db.query(models.Activity)
        .filter(models.Activity.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return activities


@router.get("/{activity_id}", response_model=schemas.ActivityDetail)
def read_activity(
    activity_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id,
    ).first()
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    laps = tcx_parser.parse_laps_from_tcx(activity.tcx_data)

    activity_dict = schemas.Activity.model_validate(activity).model_dump()
    return schemas.ActivityDetail(**activity_dict, laps=laps)


@router.post("/{activity_id}/evaluate", response_model=schemas.MessageResponse)
def re_evaluate_activity(
    activity_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id,
    ).first()
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.llm_evaluation = None
    activity.llm_evaluation_status = models.LLMEvaluationStatus.pending
    db.commit()

    background_tasks.add_task(evaluate_activity, activity_id)
    return {"message": "평가를 다시 요청했습니다"}


@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id,
    ).first()
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted successfully"}
