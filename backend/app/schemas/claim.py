from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ClaimCategory(str):
    PRICING = "pricing"
    LEADERSHIP = "leadership"
    PRODUCT = "product"
    PARTNERSHIP = "partnership"
    REGULATION = "regulation"
    API_VERSION = "api_version"
    STATISTICS = "statistics"
    COMPANY_ANNOUNCEMENT = "company_announcements"
    GENERAL = "general"
    OTHER = "other"

class FreshnessScoreBreakdown(BaseModel):
    source_reliability: float = Field(..., description="Weight 30%: Source domain authority and credibility")
    evidence_agreement: float = Field(..., description="Weight 30%: Degree of agreement across independent evidence")
    evidence_recency: float = Field(..., description="Weight 25%: Recency relative to 30-day research window")
    claim_matching: float = Field(..., description="Weight 15%: Exact entity/metric alignment")
    total_score: float = Field(..., description="Calculated 0-100 score")
    interpretation: str = Field(..., description="Fresh (90-100), Mostly Fresh (70-89), Uncertain (40-69), Stale (0-39), or Not time-sensitive")

class ExtractedClaim(BaseModel):
    claim_id: str
    claim_text: str
    category: str = "general"
    time_sensitive: bool = True
    original_source_ids: List[str] = Field(default_factory=list)
    verification_required: bool = True

class VerifiedClaim(BaseModel):
    claim_id: str
    claim_text: str
    category: str
    time_sensitive: bool
    verification_required: bool
    status: str = Field(..., description="FRESH, STALE, or UNCERTAIN")
    freshness_score: Optional[float] = None
    score_breakdown: Optional[Dict[str, Any]] = None
    evidence_summary: Optional[str] = None
    explanation: Optional[str] = None
    corrected_claim: Optional[str] = None
    supporting_source_ids: List[str] = Field(default_factory=list)
    contradicting_source_ids: List[str] = Field(default_factory=list)
