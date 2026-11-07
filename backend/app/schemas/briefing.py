from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class DevelopmentItem(BaseModel):
    title: str
    date: Optional[str] = None
    summary: str
    impact: Optional[str] = None
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

class SWOTAnalysis(BaseModel):
    strengths: List[Dict[str, Any]] = Field(default_factory=list)
    weaknesses: List[Dict[str, Any]] = Field(default_factory=list)
    opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    threats: List[Dict[str, Any]] = Field(default_factory=list)

class OpportunityItem(BaseModel):
    title: str
    why_it_exists: str
    relevance: str
    suggested_action: str
    supporting_source_ids: List[str] = Field(default_factory=list)

class RiskItem(BaseModel):
    title: str
    issue: str
    impact: str
    clarification_question: str
    supporting_source_ids: List[str] = Field(default_factory=list)

class SmartQuestionItem(BaseModel):
    category: str
    question: str
    rationale: str

class TalkingPointItem(BaseModel):
    stage: str
    point: str
    notes: Optional[str] = None

class MeetingStrategy(BaseModel):
    main_objective: str
    recommended_approach: str
    key_message: str
    negotiation_considerations: str
    desired_outcome: str
    preparation_priorities: List[str] = Field(default_factory=list)

class FinalRecommendations(BaseModel):
    top_three_takeaways: List[str] = Field(default_factory=list)
    must_discuss: str
    avoid_assuming: str
    first_question_to_ask: str
    next_immediate_step: str

class FinalBriefingResponse(BaseModel):
    meeting_id: str
    overview: str
    executive_summary: str
    target_intelligence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    recent_developments: List[Dict[str, Any]] = Field(default_factory=list)
    leadership_updates: List[Dict[str, Any]] = Field(default_factory=list)
    product_launches: List[Dict[str, Any]] = Field(default_factory=list)
    partnerships: List[Dict[str, Any]] = Field(default_factory=list)
    swot: Optional[Dict[str, Any]] = Field(default_factory=dict)
    opportunities: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    risks: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    smart_questions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    talking_points: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    meeting_strategy: Optional[Dict[str, Any]] = Field(default_factory=dict)
    final_recommendations: Optional[Dict[str, Any]] = Field(default_factory=dict)
    preparation_checklist: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    why_it_matters: str
    verification_overview: str
    corrections: List[Dict[str, Any]] = Field(default_factory=list)
    uncertain_information: List[str] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    raw_briefing: Optional[str] = None
    created_at: str
