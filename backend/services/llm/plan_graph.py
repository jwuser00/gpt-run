import json
import logging
import os
from datetime import date, datetime, timedelta
from typing import TypedDict

from langgraph.graph import StateGraph, END

from database import SessionLocal
import models
from services.llm.models import get_llm
from services.llm.prompts import load_prompt

logger = logging.getLogger(__name__)


class PlanState(TypedDict):
    plan_id: int
    user_id: int
    prompt: str
    raw_response: str
    plan_text: str
    sessions: list


def _format_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _format_pace(seconds_per_km: float) -> str:
    m = int(seconds_per_km // 60)
    s = int(seconds_per_km % 60)
    return f"{m}:{s:02d}"


def _build_plan_prompt(
    user_prompt: str,
    recent_activities: list[models.Activity],
    upcoming_races: list[models.Race],
    user: models.User,
) -> str:
    template = load_prompt("plan")

    activities_text = "없음"
    if recent_activities:
        lines = []
        for a in recent_activities:
            eval_text = f" | 평가: {a.llm_evaluation}" if a.llm_evaluation else ""
            lines.append(
                f"- {a.start_time.strftime('%m/%d')} "
                f"거리: {a.total_distance / 1000:.1f}km, "
                f"시간: {_format_time(a.total_time)}, "
                f"페이스: {_format_pace(a.avg_pace)}/km, "
                f"심박수: {a.avg_hr or '-'}bpm"
                f"{eval_text}"
            )
        activities_text = "\n".join(lines)

    races_text = "없음"
    if upcoming_races:
        lines = []
        for r in upcoming_races:
            target = f", 목표: {_format_time(r.target_time)}" if r.target_time else ""
            lines.append(
                f"- {r.race_date.strftime('%m/%d')} {r.race_name} "
                f"({r.distance_type.value}{target})"
            )
        races_text = "\n".join(lines)

    today = date.today()
    return template.format(
        user_prompt=user_prompt,
        recent_activities=activities_text,
        upcoming_races=races_text,
        gender=user.gender or "미입력",
        birth_year=user.birth_year or "미입력",
        birth_month=user.birth_month or "",
        today=today.isoformat(),
    )


def _call_llm_node(state: PlanState) -> dict:
    llm = get_llm("high")

    callbacks = []
    if os.getenv("LANGFUSE_PUBLIC_KEY"):
        try:
            from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler
            callbacks.append(LangfuseCallbackHandler())
        except Exception as e:
            logger.warning("Langfuse 콜백 초기화 실패: %s", e)

    result = llm.invoke(state["prompt"], config={"callbacks": callbacks})
    content = result.content
    logger.info("LLM 응답 type=%s, len=%s", type(content).__name__, len(content) if isinstance(content, str) else "N/A")
    logger.info("LLM 응답 처음 500자: %s", content[:500] if isinstance(content, str) else repr(content)[:500])
    return {"raw_response": content}


def _parse_response_node(state: PlanState) -> dict:
    raw = state["raw_response"]

    # content가 list인 경우 (Claude 등) 텍스트 추출
    if isinstance(raw, list):
        logger.info("raw_response가 list 타입 — 텍스트 블록 추출")
        text_parts = []
        for block in raw:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block["text"])
            elif isinstance(block, str):
                text_parts.append(block)
        raw = "\n".join(text_parts)

    if not isinstance(raw, str):
        logger.warning("raw_response 타입 비정상: %s", type(raw).__name__)
        return {"plan_text": str(raw), "sessions": []}

    logger.info("파싱 시작 — raw 길이: %d", len(raw))

    # 1) ```json 블록 추출
    json_str = raw
    if "```json" in raw:
        start = raw.index("```json") + 7
        end = raw.find("```", start)
        json_str = raw[start:end].strip() if end != -1 else raw[start:].strip()
        logger.info("```json 블록 추출 완료 — json_str 길이: %d", len(json_str))
    elif "```" in raw:
        start = raw.index("```") + 3
        end = raw.find("```", start)
        json_str = raw[start:end].strip() if end != -1 else raw[start:].strip()
        logger.info("``` 블록 추출 완료 — json_str 길이: %d", len(json_str))
    else:
        logger.info("코드 블록 없음 — raw 전체를 json_str로 사용")

    # 2) JSON 파싱 시도, 실패 시 { } 범위로 재시도
    data = None
    try:
        data = json.loads(json_str)
        logger.info("json_str 파싱 성공")
    except json.JSONDecodeError as e1:
        logger.info("json_str 파싱 실패: %s — fallback 시도", e1)
        first = raw.find("{")
        last = raw.rfind("}")
        if first != -1 and last > first:
            fallback_str = raw[first:last + 1]
            try:
                data = json.loads(fallback_str)
                logger.info("fallback 파싱 성공")
            except json.JSONDecodeError as e2:
                logger.warning("Plan JSON 파싱 최종 실패: json_str=%s, error=%s", json_str[:200], e2)
        else:
            logger.warning("fallback 불가 — { } 범위 없음")

    if data is None:
        logger.warning("data=None — 세션 0개 반환")
        return {"plan_text": raw, "sessions": []}

    plan_text = data.get("plan_text", raw)
    sessions = data.get("sessions", [])
    logger.info("파싱 완료 — plan_text 길이: %d, sessions 수: %d", len(plan_text), len(sessions))

    valid_types = {"Easy", "Long", "Interval", "Fast", "Recovery", "Rest", "Race"}
    validated = []
    for s in sessions:
        session_type = s.get("session_type", "Easy")
        if session_type not in valid_types:
            session_type = "Easy"
        validated.append({
            "date": s.get("date"),
            "session_type": session_type,
            "title": s.get("title", ""),
            "description": s.get("description"),
            "target_distance": s.get("target_distance"),
            "target_pace": s.get("target_pace"),
        })

    return {"plan_text": plan_text, "sessions": validated}


def _build_graph():
    builder = StateGraph(PlanState)
    builder.add_node("call_llm", _call_llm_node)
    builder.add_node("parse_response", _parse_response_node)
    builder.set_entry_point("call_llm")
    builder.add_edge("call_llm", "parse_response")
    builder.add_edge("parse_response", END)
    return builder.compile()


_graph = _build_graph()


def generate_plan(plan_id: int) -> None:
    """BackgroundTasks에서 호출되는 계획 생성 진입점."""
    db = SessionLocal()
    try:
        plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
        if not plan:
            logger.error("Plan %d not found", plan_id)
            return

        plan.generation_status = models.LLMEvaluationStatus.processing
        db.commit()

        user = db.query(models.User).filter(models.User.id == plan.user_id).first()

        recent = (
            db.query(models.Activity)
            .filter(models.Activity.user_id == plan.user_id)
            .order_by(models.Activity.start_time.desc())
            .limit(3)
            .all()
        )

        upcoming_races = (
            db.query(models.Race)
            .filter(
                models.Race.user_id == plan.user_id,
                models.Race.status == models.RaceStatus.upcoming,
            )
            .order_by(models.Race.race_date.asc())
            .limit(5)
            .all()
        )

        prompt = _build_plan_prompt(plan.user_prompt, recent, upcoming_races, user)

        result = _graph.invoke({
            "plan_id": plan_id,
            "user_id": plan.user_id,
            "prompt": prompt,
            "raw_response": "",
            "plan_text": "",
            "sessions": [],
        })

        logger.info("Plan %d graph 결과: plan_text 길이=%d, sessions 수=%d",
                    plan_id, len(result.get("plan_text", "")), len(result.get("sessions", [])))

        plan.llm_plan_text = result["plan_text"]

        # 세션에서 날짜 범위 결정
        sessions = result["sessions"]
        if sessions:
            dates = []
            for s in sessions:
                if s.get("date"):
                    try:
                        dates.append(date.fromisoformat(s["date"]))
                    except (ValueError, TypeError):
                        pass
            if dates:
                plan.start_date = min(dates)
                plan.end_date = max(dates)
            else:
                plan.start_date = date.today()
                plan.end_date = date.today() + timedelta(days=6)
        else:
            plan.start_date = date.today()
            plan.end_date = date.today() + timedelta(days=6)

        # PlanSession 생성
        for s in sessions:
            try:
                session_date = date.fromisoformat(s["date"]) if s.get("date") else date.today()
            except (ValueError, TypeError):
                session_date = date.today()

            db_session = models.PlanSession(
                plan_id=plan_id,
                date=session_date,
                session_type=models.SessionType(s["session_type"]),
                title=s.get("title", "")[:100],
                description=s.get("description"),
                target_distance=s.get("target_distance"),
                target_pace=s.get("target_pace"),
            )
            db.add(db_session)

        plan.generation_status = models.LLMEvaluationStatus.completed
        db.commit()

        logger.info("Plan %d 생성 완료 (%d sessions)", plan_id, len(sessions))

    except Exception:
        logger.exception("Plan %d 생성 실패", plan_id)
        try:
            plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
            if plan:
                plan.generation_status = models.LLMEvaluationStatus.failed
                db.commit()
        except Exception:
            logger.exception("계획 실패 상태 업데이트 실패")
    finally:
        db.close()
