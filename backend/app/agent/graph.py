import logging
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END

from backend.app.agent.state import AgentState
from backend.app.agent.nodes import (
    node_input_validation,
    node_research_planner,
    node_tavily_research,
    node_source_processing,
    node_research_analysis,
    node_draft_briefing,
    node_claim_extraction,
    node_time_sensitive_detection,
    node_claim_verification,
    node_evidence_evaluation,
    node_freshness_scoring,
    node_correction,
    node_final_briefing
)

logger = logging.getLogger(__name__)

# Conditional routing functions
def route_after_validation(state: AgentState) -> Literal["research_planner", "__end__"]:
    if state.get("error"):
        return END
    return "research_planner"

def route_after_planner(state: AgentState) -> Literal["tavily_research", "__end__"]:
    if state.get("error"):
        return END
    return "tavily_research"

def route_after_tavily(state: AgentState) -> Literal["source_processing", "__end__"]:
    if state.get("error"):
        return END
    return "source_processing"

def route_after_draft(state: AgentState) -> Literal["claim_extraction", "__end__"]:
    if state.get("error"):
        return END
    return "claim_extraction"

def route_after_claim_extraction(state: AgentState) -> Literal["time_sensitive_detection", "__end__"]:
    if state.get("error"):
        return END
    return "time_sensitive_detection"

def route_after_time_sensitivity(state: AgentState) -> Literal["claim_verification", "freshness_scoring", "__end__"]:
    if state.get("error"):
        return END
    claims_to_verify = state.get("claims_to_verify", [])
    if not claims_to_verify:
        # All claims are stable; skip live re-search
        return "freshness_scoring"
    return "claim_verification"

def create_verity_graph():
    """Builds and compiles the full VerityMeet AI LangGraph StateGraph."""
    workflow = StateGraph(AgentState)

    # Register all 13 nodes
    workflow.add_node("input_validation", node_input_validation)
    workflow.add_node("research_planner", node_research_planner)
    workflow.add_node("tavily_research", node_tavily_research)
    workflow.add_node("source_processing", node_source_processing)
    workflow.add_node("research_analysis", node_research_analysis)
    workflow.add_node("draft_briefing", node_draft_briefing)
    workflow.add_node("claim_extraction", node_claim_extraction)
    workflow.add_node("time_sensitive_detection", node_time_sensitive_detection)
    workflow.add_node("claim_verification", node_claim_verification)
    workflow.add_node("evidence_evaluation", node_evidence_evaluation)
    workflow.add_node("freshness_scoring", node_freshness_scoring)
    workflow.add_node("correction", node_correction)
    workflow.add_node("final_briefing", node_final_briefing)

    # Define edges & conditional branches
    workflow.set_entry_point("input_validation")

    workflow.add_conditional_edges(
        "input_validation",
        route_after_validation,
        {"research_planner": "research_planner", END: END}
    )

    workflow.add_conditional_edges(
        "research_planner",
        route_after_planner,
        {"tavily_research": "tavily_research", END: END}
    )

    workflow.add_conditional_edges(
        "tavily_research",
        route_after_tavily,
        {"source_processing": "source_processing", END: END}
    )

    workflow.add_edge("source_processing", "research_analysis")
    workflow.add_edge("research_analysis", "draft_briefing")

    workflow.add_conditional_edges(
        "draft_briefing",
        route_after_draft,
        {"claim_extraction": "claim_extraction", END: END}
    )

    workflow.add_conditional_edges(
        "claim_extraction",
        route_after_claim_extraction,
        {"time_sensitive_detection": "time_sensitive_detection", END: END}
    )

    workflow.add_conditional_edges(
        "time_sensitive_detection",
        route_after_time_sensitivity,
        {
            "claim_verification": "claim_verification",
            "freshness_scoring": "freshness_scoring",
            END: END
        }
    )

    workflow.add_edge("claim_verification", "evidence_evaluation")
    workflow.add_edge("evidence_evaluation", "freshness_scoring")
    workflow.add_edge("freshness_scoring", "correction")
    workflow.add_edge("correction", "final_briefing")
    workflow.add_edge("final_briefing", END)

    return workflow.compile()

# Singleton graph instance
verity_graph = create_verity_graph()

def execute_meeting_workflow(meeting_data: Dict[str, Any]):
    """Executes the compiled LangGraph workflow asynchronously."""
    initial_state: AgentState = {
        "meeting_id": meeting_data["id"],
        "target_name": meeting_data["target_name"],
        "meeting_date": meeting_data["meeting_date"],
        "meeting_time": meeting_data["meeting_time"],
        "meeting_type": meeting_data["meeting_type"],
        "context": meeting_data.get("context", ""),
        "objective": meeting_data.get("objective", ""),
        "interests": meeting_data.get("interests", []),
        "cutoff_date": "",
        "current_step": "input_validation",
        "step_logs": [],
        "error": None,
        "research_plan": {},
        "search_queries": [],
        "raw_search_results": [],
        "processed_sources": [],
        "analysis_findings": {},
        "draft_briefing": {},
        "extracted_claims": [],
        "claims_to_verify": [],
        "stable_claims": [],
        "claim_evidence_map": {},
        "verification_evaluations": [],
        "scored_claims": [],
        "corrections": [],
        "final_briefing": {},
        "completed": False
    }

    try:
        final_state = verity_graph.invoke(initial_state)
        return final_state
    except Exception as e:
        logger.error(f"LangGraph execution error: {str(e)}")
        from backend.app.database.db import update_meeting_status, log_workflow_event
        update_meeting_status(meeting_data["id"], "failed", "execution", str(e))
        log_workflow_event(meeting_data["id"], "execution", "failed", str(e))
        raise
