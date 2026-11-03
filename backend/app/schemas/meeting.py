from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MeetingCreateRequest(BaseModel):
    target_name: str = Field(..., min_length=1, description="Company or person's name")
    meeting_date: str = Field(..., description="Meeting date in YYYY-MM-DD format")
    meeting_time: str = Field(..., description="Meeting time in HH:MM format (24h or 12h)")
    meeting_type: str = Field(..., description="Type of meeting e.g. Executive Briefing, Sales Discovery, Investor Pitch, Partnership, Due Diligence")
    context: Optional[str] = Field(None, description="Optional meeting context or background")
    objective: Optional[str] = Field(None, description="Primary meeting objective")
    interests: Optional[List[str]] = Field(default_factory=list, description="Specific research topics or interest areas")

class MeetingResponse(BaseModel):
    id: str
    target_name: str
    meeting_date: str
    meeting_time: str
    meeting_type: str
    context: Optional[str] = None
    objective: Optional[str] = None
    interests: List[str] = []
    status: str
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

class SourceItem(BaseModel):
    id: str
    title: str
    url: str
    domain: Optional[str] = None
    snippet: Optional[str] = None
    published_date: Optional[str] = None
    reliability_score: float = 0.5
    reliability_tier: str = "standard"

class WorkflowProgress(BaseModel):
    meeting_id: str
    status: str
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    events: List[Dict[str, Any]] = []
