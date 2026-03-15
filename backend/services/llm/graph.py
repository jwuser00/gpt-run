import logging
import os
from typing import TypedDict

from langgraph.graph import StateGraph, END

from database import SessionLocal
import models
from services.llm.models import get_llm
from services.llm.prompts import load_prompt

logger = logging.getLogger(__name__)


class EvalState(TypedDict):
    activity_id: int
    user_id: int
    prompt: str
    result: str


def _format_time(seconds: float) -> str:
    """초를 h:mm:ss 형식으로 변환한다."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _format_pace(seconds_per_km: float) -> str:
    """초/km를 m:ss 형식으로 변환한다."""
    m = int(seconds_per_km // 60)
    s = int(seconds_per_km % 60)
    return f"{m}:{s:02d}"


def _format_activity_summary(activity: models.Activity) -> str:
    """Activity 모델을 프롬프트용 텍스트 요약으로 변환한다."""
    return (
        f"- 거리: {activity.total_distance / 1000:.2f}km, "
        f"시간: {_format_time(activity.total_time)}, "
        f"페이스: {_format_pace(activity.avg_pace)}/km, "
        f"심박수: {activity.avg_hr or '-'}bpm, "
        f"케이던스: {activity.avg_cadence or '-'}spm"
    )


def _format_plan_session(session: models.PlanSession) -> str:
    """PlanSession을 프롬프트용 텍스트로 변환한다."""
    parts = [f"- 유형: {session.session_type.value}, 제목: {session.title}"]
    if session.description:
        parts.append(f"  설명: {session.description}")
    if session.target_distance:
        parts.append(f"  목표 거리: {session.target_distance / 1000:.1f}km")
    if session.target_pace:
        parts.append(f"  목표 페이스: {_format_pace(session.target_pace)}/km")
    return "\n".join(parts)


def _build_prompt(
    activity: models.Activity,
    recent: list[models.Activity],
    user: models.User,
    plan_session: models.PlanSession | None = None,
) -> str:
    """평가 프롬프트를 렌더링한다."""
    template = load_prompt("evaluation")

    recent_text = "없음"
    if recent:
        lines = []
        for r in recent:
            lines.append(_format_activity_summary(r))
        recent_text = "\n".join(lines)

    plan_session_text = "없음"
    if plan_session:
        plan_session_text = _format_plan_session(plan_session)

    return template.format(
        distance_km=f"{activity.total_distance / 1000:.2f}",
        total_time=_format_time(activity.total_time),
        avg_pace=_format_pace(activity.avg_pace),
        avg_hr=activity.avg_hr or "-",
        avg_cadence=activity.avg_cadence or "-",
        activity_type="트레드밀" if activity.is_treadmill else "야외",
        recent_activities=recent_text,
        gender=user.gender or "미입력",
        birth_year=user.birth_year or "미입력",
        birth_month=user.birth_month or "",
        plan_session=plan_session_text,
    )


def _evaluate_node(state: EvalState) -> dict:
    """LLM을 호출하여 러닝 평가를 수행한다."""
    llm = get_llm("low")

    callbacks = []
    if os.getenv("LANGFUSE_PUBLIC_KEY"):
        try:
            from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler
            callbacks.append(LangfuseCallbackHandler())
        except Exception as e:
            logger.warning("Langfuse 콜백 초기화 실패, 추적 없이 진행: %s", e)

    result = llm.invoke(state["prompt"], config={"callbacks": callbacks})
    return {"result": result.content[:400]}


def _build_graph():
    """LangGraph 평가 파이프라인을 구성한다."""
    builder = StateGraph(EvalState)
    builder.add_node("evaluate", _evaluate_node)
    builder.set_entry_point("evaluate")
    builder.add_edge("evaluate", END)
    return builder.compile()


_graph = _build_graph()


def evaluate_activity(activity_id: int) -> None:
    """BackgroundTasks에서 호출되는 LLM 평가 진입점.

    별도 DB 세션을 생성하여 비동기 컨텍스트에서 안전하게 동작한다.
    """
    db = SessionLocal()
    try:
        activity = db.query(models.Activity).filter(
            models.Activity.id == activity_id
        ).first()
        if not activity:
            logger.error("Activity %d not found for evaluation", activity_id)
            return

        # 상태를 processing으로 업데이트
        activity.llm_evaluation_status = models.LLMEvaluationStatus.processing
        db.commit()

        # 사용자 정보 로드
        user = db.query(models.User).filter(
            models.User.id == activity.user_id
        ).first()

        # 최근 3개 활동 조회 (현재 활동 제외)
        recent = (
            db.query(models.Activity)
            .filter(
                models.Activity.user_id == activity.user_id,
                models.Activity.id != activity.id,
            )
            .order_by(models.Activity.start_time.desc())
            .limit(3)
            .all()
        )

        # 계획 세션 로드 (연결된 경우)
        plan_session = None
        if activity.plan_session_id:
            plan_session = db.query(models.PlanSession).filter(
                models.PlanSession.id == activity.plan_session_id
            ).first()

        prompt = _build_prompt(activity, recent, user, plan_session)

        # LangGraph 실행
        result = _graph.invoke({
            "activity_id": activity_id,
            "user_id": activity.user_id,
            "prompt": prompt,
            "result": "",
        })

        activity.llm_evaluation = result["result"]
        activity.llm_evaluation_status = models.LLMEvaluationStatus.completed
        db.commit()

        logger.info("Activity %d 평가 완료", activity_id)

    except Exception:
        logger.exception("Activity %d 평가 실패", activity_id)
        try:
            activity = db.query(models.Activity).filter(
                models.Activity.id == activity_id
            ).first()
            if activity:
                activity.llm_evaluation_status = models.LLMEvaluationStatus.failed
                db.commit()
        except Exception:
            logger.exception("평가 실패 상태 업데이트 실패")
    finally:
        db.close()
