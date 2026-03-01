import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database, auth, tcx_parser

router = APIRouter(
    prefix="/races",
    tags=["races"],
)

UPLOAD_DIR = os.path.join(os.getenv("UPLOAD_DIR", "uploads"), "races")
MAX_IMAGES_PER_RACE = 5
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}


@router.post("/", response_model=schemas.RaceOut)
def create_race(
    race: schemas.RaceCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    db_race = models.Race(
        user_id=current_user.id,
        race_name=race.race_name,
        race_date=race.race_date,
        location=race.location,
        distance_type=race.distance_type,
        distance_custom=race.distance_custom,
        target_time=race.target_time,
        status=models.RaceStatus.upcoming,
    )
    db.add(db_race)
    db.commit()
    db.refresh(db_race)
    return db_race


@router.get("/", response_model=List[schemas.RaceOut])
def list_races(
    status: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Race).filter(models.Race.user_id == current_user.id)
    if status:
        query = query.filter(models.Race.status == status)
    races = query.order_by(models.Race.race_date.desc()).all()
    return races


@router.get("/{race_id}", response_model=schemas.RaceOut)
def get_race(
    race_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")
    return race


@router.put("/{race_id}", response_model=schemas.RaceOut)
def update_race(
    race_id: int,
    race_update: schemas.RaceUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    update_data = race_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(race, key, value)

    db.commit()
    db.refresh(race)
    return race


@router.put("/{race_id}/result", response_model=schemas.RaceOut)
def update_race_result(
    race_id: int,
    result: schemas.RaceResultUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    update_data = result.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(race, key, value)

    db.commit()
    db.refresh(race)
    return race


@router.post("/{race_id}/upload-tcx", response_model=schemas.RaceOut)
async def upload_race_tcx(
    race_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    """Upload TCX for a race: creates activity (or links existing), and links to race."""
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    content = await file.read()
    try:
        parsed_activities = tcx_parser.parse_tcx(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"TCX 파일을 읽을 수 없습니다: {str(e)}")

    if not parsed_activities:
        raise HTTPException(status_code=400, detail="TCX 파일에 활동 데이터가 없습니다")

    activity_data = parsed_activities[0]

    # Check if this activity already exists
    existing = db.query(models.Activity).filter(
        models.Activity.user_id == current_user.id,
        models.Activity.start_time == activity_data['start_time']
    ).first()

    if existing:
        # Link existing activity to race
        race.activity_id = existing.id
    else:
        # Create new activity
        db_activity = models.Activity(
            user_id=current_user.id,
            start_time=activity_data['start_time'],
            total_distance=activity_data['total_distance'],
            total_time=activity_data['total_time'],
            avg_pace=activity_data['avg_pace'],
            avg_hr=activity_data['avg_hr'],
            avg_cadence=activity_data['avg_cadence']
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)

        for lap_data in activity_data['laps']:
            db_lap = models.Lap(
                activity_id=db_activity.id,
                lap_number=lap_data['lap_number'],
                distance=lap_data['distance'],
                time=lap_data['time'],
                pace=lap_data['pace'],
                avg_hr=lap_data['avg_hr'],
                max_hr=lap_data['max_hr'],
                avg_cadence=lap_data['avg_cadence']
            )
            db.add(db_lap)

        db.commit()
        race.activity_id = db_activity.id

    db.commit()
    db.refresh(race)
    return race


@router.delete("/{race_id}")
def delete_race(
    race_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    # Delete image files
    race_dir = os.path.join(UPLOAD_DIR, str(race_id))
    if os.path.exists(race_dir):
        shutil.rmtree(race_dir)

    db.delete(race)
    db.commit()
    return {"message": "대회가 삭제되었습니다"}


@router.post("/{race_id}/images", response_model=schemas.RaceImageOut)
async def upload_race_image(
    race_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    image_count = db.query(models.RaceImage).filter(
        models.RaceImage.race_id == race_id
    ).count()
    if image_count >= MAX_IMAGES_PER_RACE:
        raise HTTPException(status_code=400, detail=f"이미지는 최대 {MAX_IMAGES_PER_RACE}장까지 업로드할 수 있습니다")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="PNG, JPG, JPEG 파일만 업로드할 수 있습니다")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다")

    filename = f"{uuid.uuid4()}{ext}"
    race_dir = os.path.join(UPLOAD_DIR, str(race_id))
    os.makedirs(race_dir, exist_ok=True)
    file_path = os.path.join(race_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    db_image = models.RaceImage(
        race_id=race_id,
        filename=filename,
        original_name=file.filename or "unknown",
        uploaded_at=datetime.utcnow(),
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@router.delete("/{race_id}/images/{image_id}")
def delete_race_image(
    race_id: int,
    image_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    race = db.query(models.Race).filter(
        models.Race.id == race_id,
        models.Race.user_id == current_user.id,
    ).first()
    if not race:
        raise HTTPException(status_code=404, detail="대회를 찾을 수 없습니다")

    image = db.query(models.RaceImage).filter(
        models.RaceImage.id == image_id,
        models.RaceImage.race_id == race_id,
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")

    file_path = os.path.join(UPLOAD_DIR, str(race_id), image.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(image)
    db.commit()
    return {"message": "이미지가 삭제되었습니다"}


@router.get("/{race_id}/images/{image_id}/file")
def get_race_image_file(
    race_id: int,
    image_id: int,
    db: Session = Depends(database.get_db),
):
    image = db.query(models.RaceImage).filter(
        models.RaceImage.id == image_id,
        models.RaceImage.race_id == race_id,
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")

    file_path = os.path.join(UPLOAD_DIR, str(race_id), image.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

    return FileResponse(file_path)
