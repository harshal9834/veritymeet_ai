from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    # Input parameters
    meeting_id: str
    target_name: str
    meeting_date: str
    meeting_time: str
    meeting_type: str
    context: str
    objective: str
    interests: List[str]
    cutoff_date: str

    # Workflow tracking
    current_step: str
    step_logs: List[Dict[str, Any]]
    error: Optional[str]

    # Research Planning
    research_plan: Dict[str, Any]
    search_queries: List[Dict[str, Any]]

    # Search and Sources
    raw_search_results: List[Dict[str, Any]]
    processed_sources: List[Dict[str, Any]]

    # Analysis & Draft Briefing
    analysis_findings: Dict[str, Any]
    draft_briefing: Dict[str, Any]

    # Claims & Verification
    extracted_claims: List[Dict[str, Any]]
    claims_to_verify: List[Dict[str, Any]]
    stable_claims: List[Dict[str, Any]]
    claim_evidence_map: Dict[str, List[Dict[str, Any]]]
    verification_evaluations: List[Dict[str, Any]]
    scored_claims: List[Dict[str, Any]]
    corrections: List[Dict[str, Any]]

    # Final Output
    final_briefing: Dict[str, Any]
    completed: bool
