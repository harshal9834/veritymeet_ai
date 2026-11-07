from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MeetingCreateRequest(BaseModel):
    # Section A - Meeting Information
    target_name: str = Field(..., min_length=1, description="Company or person's name")
    meeting_title: Optional[str] = Field(None, description="e.g. Strategic Partnership Discussion with Microsoft")
    meeting_date: str = Field(..., description="Meeting date in YYYY-MM-DD format")
    meeting_time: str = Field("14:00", description="Meeting time in HH:MM format")
    timezone: Optional[str] = Field("UTC", description="Meeting timezone")
    duration: Optional[int] = Field(45, description="Duration in minutes")
    meeting_type: str = Field("Executive Briefing", description="Type of meeting e.g. Sales Meeting, Client Meeting, Investor Pitch")
    meeting_mode: Optional[str] = Field("Video Conference", description="In Person, Video Conference, Phone Call, Other")
    meeting_location: Optional[str] = Field(None, description="Meeting location or link")

    # Section B - Target Entity
    target_type: Optional[str] = Field("Company", description="Company, Individual, or Both")
    company_name: Optional[str] = Field(None, description="Target company name")
    company_website: Optional[str] = Field(None, description="Target company website URL")
    person_name: Optional[str] = Field(None, description="Target person's name")
    person_designation: Optional[str] = Field(None, description="Target person's title/designation")
    person_linkedin: Optional[str] = Field(None, description="Public LinkedIn URL")
    target_industry: Optional[str] = Field(None, description="Target industry")
    target_market: Optional[str] = Field(None, description="Geographic market / country")

    # Section C - User Profile & Offering
    user_name: Optional[str] = Field(None, description="User's full name")
    user_company: Optional[str] = Field(None, description="User's company name")
    user_role: Optional[str] = Field(None, description="User's job title")
    user_website: Optional[str] = Field(None, description="User's website URL")
    user_company_description: Optional[str] = Field(None, description="What the user's company does")
    user_offering: Optional[str] = Field(None, description="What the user is proposing/offering")

    # Section D - Objectives & Context
    context: Optional[str] = Field(None, description="Internal context or background notes")
    objective: Optional[str] = Field(None, description="Primary meeting objective")
    desired_outcome: Optional[str] = Field(None, description="What success looks like")
    discussion_topics: Optional[List[str]] = Field(default_factory=list, description="Key topics to discuss")
    existing_questions: Optional[List[str]] = Field(default_factory=list, description="Questions already in mind")
    previous_relationship: Optional[str] = Field("First Meeting", description="First Meeting, Existing Client, etc.")

    # Section E - Research Preferences
    research_focus: Optional[List[str]] = Field(default_factory=list, description="Selected focus areas")
    custom_research_instructions: Optional[str] = Field(None, description="Custom investigative instructions")
    research_period: Optional[str] = Field("Last 30 days", description="Research time window preset")
    geographic_focus: Optional[str] = Field(None, description="Geographic research focus")
    preferred_sources: Optional[List[str]] = Field(default_factory=list, description="Preferred source domains or types")
    excluded_topics: Optional[str] = Field(None, description="Excluded topics or sources")

    # Section F - Briefing Preferences
    briefing_depth: Optional[str] = Field("Standard Briefing", description="Quick Overview, Standard Briefing, Detailed Intelligence Report")
    output_language: Optional[str] = Field("English", description="Output language")
    writing_style: Optional[str] = Field("Executive", description="Executive, Professional, Analytical, etc.")
    meeting_priority: Optional[str] = Field("General Preparation", description="General Preparation, High-Stakes Meeting, Sales Opportunity, etc.")
    include_swot: bool = Field(True, description="Include SWOT analysis")
    include_questions: bool = Field(True, description="Include smart questions")
    include_talking_points: bool = Field(True, description="Include conversation guide / talking points")
    include_risk_analysis: bool = Field(True, description="Include risks and red flags")
    include_source_references: bool = Field(True, description="Include source provenance")
    include_fact_verification: bool = Field(True, description="Run fact verification engine")

    # Section G - Supporting Documents
    uploaded_documents: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Metadata and extracted text of uploaded docs")

    # Backward compatibility
    interests: Optional[List[str]] = Field(default_factory=list, description="Specific research interests")

class MeetingResponse(BaseModel):
    id: str
    target_name: str
    meeting_title: Optional[str] = None
    meeting_date: str
    meeting_time: str
    timezone: Optional[str] = "UTC"
    duration: Optional[int] = 45
    meeting_type: str
    meeting_mode: Optional[str] = "Video Conference"
    meeting_location: Optional[str] = None
    target_type: Optional[str] = "Company"
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    person_name: Optional[str] = None
    person_designation: Optional[str] = None
    person_linkedin: Optional[str] = None
    target_industry: Optional[str] = None
    target_market: Optional[str] = None
    user_name: Optional[str] = None
    user_company: Optional[str] = None
    user_role: Optional[str] = None
    user_website: Optional[str] = None
    user_company_description: Optional[str] = None
    user_offering: Optional[str] = None
    context: Optional[str] = None
    objective: Optional[str] = None
    desired_outcome: Optional[str] = None
    discussion_topics: List[str] = []
    existing_questions: List[str] = []
    previous_relationship: Optional[str] = "First Meeting"
    research_focus: List[str] = []
    custom_research_instructions: Optional[str] = None
    research_period: Optional[str] = "Last 30 days"
    geographic_focus: Optional[str] = None
    preferred_sources: List[str] = []
    excluded_topics: Optional[str] = None
    briefing_depth: Optional[str] = "Standard Briefing"
    output_language: Optional[str] = "English"
    writing_style: Optional[str] = "Executive"
    meeting_priority: Optional[str] = "General Preparation"
    include_swot: bool = True
    include_questions: bool = True
    include_talking_points: bool = True
    include_risk_analysis: bool = True
    include_source_references: bool = True
    include_fact_verification: bool = True
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
