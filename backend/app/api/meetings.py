import uuid
import threading
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from pydantic import BaseModel

from backend.app.config import settings, env_path
from backend.app.schemas.meeting import MeetingCreateRequest, MeetingResponse
from backend.app.schemas.briefing import FinalBriefingResponse
from backend.app.database.db import (
    create_meeting, get_meeting, list_meetings, update_meeting_status,
    get_workflow_events, get_briefing_for_meeting, get_claims_for_meeting,
    get_sources_for_meeting, get_stats
)
from backend.app.agent.graph import execute_meeting_workflow
from backend.app.api.reports import generate_meeting_pdf

logger = logging.getLogger(__name__)
router = APIRouter()

class ConfigUpdateRequest(BaseModel):
    TAVILY_API_KEY: Optional[str] = None
    BIFROST_BASE_URL: Optional[str] = None
    BIFROST_API_KEY: Optional[str] = None
    GROK_MODEL: Optional[str] = None

@router.get("/health")
def get_health():
    cred_status = settings.validate_credentials()
    return {
        "status": "healthy",
        "ready": cred_status["ready"],
        "has_tavily": cred_status["has_tavily"],
        "has_bifrost": cred_status["has_bifrost"],
        "bifrost_base_url": cred_status["bifrost_base_url"],
        "grok_model": cred_status["grok_model"],
        "missing_keys": cred_status["missing_keys"],
        "engine": "LangGraph + Tavily + Grok (via Bifrost)"
    }

@router.post("/config")
def update_config(payload: ConfigUpdateRequest):
    # Update in memory
    updated = {}
    env_lines = []
    if env_path.exists():
        with open(env_path, "r") as f:
            env_lines = f.readlines()

    def set_env_var(key: str, val: str):
        found = False
        for i, line in enumerate(env_lines):
            if line.strip().startswith(f"{key}=") or line.strip().startswith(f"{key} ="):
                env_lines[i] = f'{key}="{val}"\n'
                found = True
                break
        if not found:
            env_lines.append(f'{key}="{val}"\n')

    if payload.TAVILY_API_KEY is not None:
        settings.TAVILY_API_KEY = payload.TAVILY_API_KEY.strip()
        set_env_var("TAVILY_API_KEY", settings.TAVILY_API_KEY)
        updated["TAVILY_API_KEY"] = bool(settings.TAVILY_API_KEY)

    if payload.BIFROST_API_KEY is not None:
        settings.BIFROST_API_KEY = payload.BIFROST_API_KEY.strip()
        set_env_var("BIFROST_API_KEY", settings.BIFROST_API_KEY)
        updated["BIFROST_API_KEY"] = bool(settings.BIFROST_API_KEY)

    if payload.BIFROST_BASE_URL is not None:
        settings.BIFROST_BASE_URL = payload.BIFROST_BASE_URL.strip()
        set_env_var("BIFROST_BASE_URL", settings.BIFROST_BASE_URL)
        updated["BIFROST_BASE_URL"] = settings.BIFROST_BASE_URL

    if payload.GROK_MODEL is not None:
        settings.GROK_MODEL = payload.GROK_MODEL.strip()
        set_env_var("GROK_MODEL", settings.GROK_MODEL)
        updated["GROK_MODEL"] = settings.GROK_MODEL

    try:
        with open(env_path, "w") as f:
            f.writelines(env_lines)
    except Exception as e:
        logger.warning(f"Could not persist to .env: {e}")

    return {
        "status": "updated",
        "updated": updated,
        "credentials": settings.validate_credentials()
    }

@router.get("/stats")
def get_dashboard_stats():
    return get_stats()

@router.get("/meetings")
def list_all_meetings():
    meetings = list_meetings()
    return {"meetings": meetings}

@router.post("/meetings", status_code=201)
def create_meeting_endpoint(req: MeetingCreateRequest, background_tasks: BackgroundTasks):
    cred_status = settings.validate_credentials()
    if not cred_status["ready"]:
        missing = ", ".join(cred_status["missing_keys"])
        raise HTTPException(
            status_code=400,
            detail=f"Missing required API credentials: {missing}. Please configure TAVILY_API_KEY and BIFROST_API_KEY in the Settings panel or .env file before initiating live research."
        )

    meeting_id = str(uuid.uuid4())
    meeting_data = {
        "id": meeting_id,
        "target_name": req.target_name.strip(),
        "meeting_date": req.meeting_date.strip(),
        "meeting_time": req.meeting_time.strip(),
        "meeting_type": req.meeting_type.strip(),
        "context": req.context or "",
        "objective": req.objective or "",
        "interests": req.interests or [],
        "status": "processing",
        "current_step": "input_validation"
    }

    create_meeting(meeting_data)

    # Launch LangGraph workflow in background thread
    def run_graph():
        try:
            execute_meeting_workflow(meeting_data)
        except Exception as e:
            logger.error(f"Error executing meeting workflow {meeting_id}: {e}")

    thread = threading.Thread(target=run_graph, daemon=True)
    thread.start()

    created = get_meeting(meeting_id)
    return created

@router.get("/meetings/{meeting_id}")
def get_meeting_endpoint(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting briefing not found")
    return meeting

@router.get("/meetings/{meeting_id}/progress")
def get_meeting_progress_endpoint(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    events = get_workflow_events(meeting_id)
    return {
        "meeting_id": meeting_id,
        "status": meeting["status"],
        "current_step": meeting["current_step"],
        "error_message": meeting.get("error_message"),
        "events": events
    }

@router.get("/meetings/{meeting_id}/briefing")
def get_meeting_briefing_endpoint(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    briefing = get_briefing_for_meeting(meeting_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing is still processing or has not been generated.")

    sources = get_sources_for_meeting(meeting_id)
    briefing["sources"] = sources
    return briefing

@router.get("/meetings/{meeting_id}/claims")
def get_meeting_claims_endpoint(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    claims = get_claims_for_meeting(meeting_id)
    return {"meeting_id": meeting_id, "claims": claims}

@router.get("/meetings/{meeting_id}/pdf")
def export_briefing_pdf(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    briefing = get_briefing_for_meeting(meeting_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not ready for export.")

    claims = get_claims_for_meeting(meeting_id)
    sources = get_sources_for_meeting(meeting_id)

    pdf_bytes = generate_meeting_pdf(meeting, briefing, claims, sources)

    filename = f"VerityMeet_{meeting['target_name'].replace(' ', '_')}_{meeting['meeting_date']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
