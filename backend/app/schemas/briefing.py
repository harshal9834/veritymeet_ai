from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class DevelopmentItem(BaseModel):
    title: str
    date: Optional[str] = None
    summary: str
    source_ids: List[str] = Field(default_factory=list)

class PersonItem(BaseModel):
    name: str
    role: str
    background: Optional[str] = None
    source_ids: List[str] = Field(default_factory=list)

class ProductLaunchItem(BaseModel):
    name: str
    status: str
    summary: str
    source_ids: List[str] = Field(default_factory=list)

class PartnershipItem(BaseModel):
    partner: str
    nature: str
    date: Optional[str] = None
    source_ids: List[str] = Field(default_factory=list)

class CorrectionItem(BaseModel):
    original_claim: str
    corrected_claim: str
    reason: str
    supporting_source_ids: List[str] = Field(default_factory=list)

class FinalBriefingResponse(BaseModel):
    meeting_id: str
    overview: str
    executive_summary: str
    recent_developments: List[Dict[str, Any]] = Field(default_factory=list)
    leadership_updates: List[Dict[str, Any]] = Field(default_factory=list)
    product_launches: List[Dict[str, Any]] = Field(default_factory=list)
    partnerships: List[Dict[str, Any]] = Field(default_factory=list)
    why_it_matters: str
    verification_overview: str
    corrections: List[Dict[str, Any]] = Field(default_factory=list)
    uncertain_information: List[str] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    raw_briefing: Optional[str] = None
    created_at: str
