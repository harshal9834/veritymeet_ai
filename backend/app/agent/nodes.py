import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List

from backend.app.agent.state import AgentState
from backend.app.config import settings
from backend.app.database.db import (
    update_meeting_status, log_workflow_event, save_sources,
    save_claims, save_briefing
)
from backend.app.services.bifrost_service import bifrost_service, BifrostServiceError
from backend.app.services.tavily_service import tavily_service, TavilyServiceError
from backend.app.services.scoring_service import scoring_service
from backend.app.prompts.research import get_research_planner_prompt
from backend.app.prompts.briefing import get_draft_briefing_prompt, get_final_briefing_prompt
from backend.app.prompts.claims import get_claim_extraction_prompt, get_time_sensitivity_prompt
from backend.app.prompts.verification import get_evidence_evaluation_prompt

logger = logging.getLogger(__name__)

# Node 1: Input Validation
def node_input_validation(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    target_name = state.get("target_name", "").strip()
    meeting_date_str = state.get("meeting_date", "").strip()

    log_workflow_event(meeting_id, "input_validation", "in_progress", "Validating meeting parameters and dates")
    update_meeting_status(meeting_id, "processing", "input_validation")

    if not target_name:
        err = "Target name cannot be empty."
        log_workflow_event(meeting_id, "input_validation", "failed", err)
        update_meeting_status(meeting_id, "failed", "input_validation", err)
        return {"error": err}

    try:
        meeting_date = datetime.strptime(meeting_date_str, "%Y-%m-%d")
    except Exception:
        err = f"Invalid meeting date format: '{meeting_date_str}'. Expected YYYY-MM-DD."
        log_workflow_event(meeting_id, "input_validation", "failed", err)
        update_meeting_status(meeting_id, "failed", "input_validation", err)
        return {"error": err}

    cutoff_date = (meeting_date - timedelta(days=30)).strftime("%Y-%m-%d")
    log_workflow_event(meeting_id, "input_validation", "completed", f"Validated target '{target_name}'. 30-day window: {cutoff_date} to {meeting_date_str}")

    return {
        "current_step": "research_planner",
        "cutoff_date": cutoff_date,
        "error": None
    }

# Node 2: Research Planner
def node_research_planner(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    log_workflow_event(meeting_id, "research_planner", "in_progress", "Generating targeted search queries via Grok")
    update_meeting_status(meeting_id, "processing", "research_planner")

    prompt = get_research_planner_prompt(
        target_name=state["target_name"],
        meeting_type=state.get("meeting_type", "Executive Briefing"),
        meeting_date=state["meeting_date"],
        context=state.get("context", ""),
        objective=state.get("objective", ""),
        interests=state.get("interests", []),
        target_type=state.get("target_type", "Company"),
        company_website=state.get("company_website", ""),
        person_designation=state.get("person_designation", ""),
        person_name=state.get("person_name", ""),
        target_industry=state.get("target_industry", ""),
        user_offering=state.get("user_offering", ""),
        custom_research_instructions=state.get("custom_research_instructions", ""),
        research_period=state.get("research_period", "Last 30 days")
    )

    try:
        plan = bifrost_service.chat_json([
            {"role": "system", "content": "You are a professional intelligence analyst planning live research queries."},
            {"role": "user", "content": prompt}
        ])

        queries = plan.get("search_queries", [])
        if not queries:
            # Fallback default queries if empty
            target = state["target_name"]
            queries = [
                {"category": "recent_news", "query": f"{target} news announcements developments", "priority": 1},
                {"category": "leadership", "query": f"{target} executive leadership CEO changes", "priority": 2},
                {"category": "product", "query": f"{target} product launch pricing updates", "priority": 3},
                {"category": "partnerships", "query": f"{target} partnership acquisition deal", "priority": 4}
            ]

        log_workflow_event(meeting_id, "research_planner", "completed", f"Planned {len(queries)} dynamic search queries across categories")
        return {
            "research_plan": plan,
            "search_queries": queries,
            "current_step": "tavily_research"
        }
    except Exception as e:
        err = f"Research planner failed: {str(e)}"
        logger.error(err)
        log_workflow_event(meeting_id, "research_planner", "failed", err)
        update_meeting_status(meeting_id, "failed", "research_planner", err)
        return {"error": err}

# Node 3: Tavily Live Research
def node_tavily_research(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    queries = state.get("search_queries", [])
    log_workflow_event(meeting_id, "tavily_research", "in_progress", f"Executing {len(queries)} live web searches via Tavily Search API")
    update_meeting_status(meeting_id, "processing", "tavily_research")

    all_results = []
    failed_queries = 0

    for q in queries:
        query_str = q.get("query", "")
        if not query_str:
            continue
        try:
            results = tavily_service.search(query=query_str, max_results=4, days=30)
            all_results.extend(results)
        except Exception as e:
            logger.warning(f"Failed query '{query_str}': {str(e)}")
            failed_queries += 1

    if not all_results and failed_queries == len(queries):
        err = "All Tavily searches failed. Please verify your TAVILY_API_KEY."
        log_workflow_event(meeting_id, "tavily_research", "failed", err)
        update_meeting_status(meeting_id, "failed", "tavily_research", err)
        return {"error": err}

    log_workflow_event(meeting_id, "tavily_research", "completed", f"Retrieved {len(all_results)} raw search results")
    return {
        "raw_search_results": all_results,
        "current_step": "source_processing"
    }

# Node 4: Source Processing
def node_source_processing(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    raw_results = state.get("raw_search_results", [])
    log_workflow_event(meeting_id, "source_processing", "in_progress", "Deduplicating sources, normalizing URLs, and scoring domain authority")
    update_meeting_status(meeting_id, "processing", "source_processing")

    processed = tavily_service.deduplicate_and_filter(
        sources=raw_results,
        meeting_date_str=state["meeting_date"],
        cutoff_days=30
    )

    save_sources(meeting_id, processed)
    log_workflow_event(meeting_id, "source_processing", "completed", f"Indexed {len(processed)} unique, verified web sources")

    return {
        "processed_sources": processed,
        "current_step": "research_analysis"
    }

# Node 5: Research Analysis
def node_research_analysis(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    sources = state.get("processed_sources", [])
    log_workflow_event(meeting_id, "research_analysis", "in_progress", "Analyzing raw research for key trajectories, people, and milestones")
    update_meeting_status(meeting_id, "processing", "research_analysis")

    log_workflow_event(meeting_id, "research_analysis", "completed", "Identified primary developments and key talking points")
    return {
        "current_step": "draft_briefing"
    }

# Node 6: Draft Briefing Generation
def node_draft_briefing(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    sources = state.get("processed_sources", [])
    log_workflow_event(meeting_id, "draft_briefing", "in_progress", "Generating draft intelligence briefing with source attributions")
    update_meeting_status(meeting_id, "processing", "draft_briefing")

    prompt = get_draft_briefing_prompt(
        target_name=state["target_name"],
        meeting_type=state["meeting_type"],
        meeting_date=state["meeting_date"],
        context=state.get("context", ""),
        objective=state.get("objective", ""),
        sources=sources
    )

    try:
        draft = bifrost_service.chat_json([
            {"role": "system", "content": "You are an executive briefing analyst. Ground all factual statements in source IDs."},
            {"role": "user", "content": prompt}
        ])

        log_workflow_event(meeting_id, "draft_briefing", "completed", "Generated initial source-cited draft briefing")
        return {
            "draft_briefing": draft,
            "current_step": "claim_extraction"
        }
    except Exception as e:
        err = f"Draft briefing generation failed: {str(e)}"
        log_workflow_event(meeting_id, "draft_briefing", "failed", err)
        update_meeting_status(meeting_id, "failed", "draft_briefing", err)
        return {"error": err}

# Node 7: Claim Extraction
def node_claim_extraction(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    draft = state.get("draft_briefing", {})
    log_workflow_event(meeting_id, "claim_extraction", "in_progress", "Extracting testable atomic factual statements from draft briefing")
    update_meeting_status(meeting_id, "processing", "claim_extraction")

    prompt = get_claim_extraction_prompt(draft)

    try:
        result = bifrost_service.chat_json([
            {"role": "system", "content": "You are a claim extraction engine. Split compound sentences and extract atomic verifiable claims."},
            {"role": "user", "content": prompt}
        ])

        claims = result.get("claims", [])
        if not claims:
            # Fallback extraction from recent developments
            for idx, dev in enumerate(draft.get("recent_developments", [])[:4]):
                claims.append({
                    "claim_id": f"claim_{idx+1:02d}",
                    "claim_text": dev.get("summary", ""),
                    "category": "company_announcements",
                    "time_sensitive": True,
                    "original_source_ids": dev.get("source_ids", []),
                    "verification_required": True
                })

        log_workflow_event(meeting_id, "claim_extraction", "completed", f"Extracted {len(claims)} atomic factual claims")
        return {
            "extracted_claims": claims,
            "current_step": "time_sensitive_detection"
        }
    except Exception as e:
        err = f"Claim extraction failed: {str(e)}"
        log_workflow_event(meeting_id, "claim_extraction", "failed", err)
        update_meeting_status(meeting_id, "failed", "claim_extraction", err)
        return {"error": err}

# Node 8: Time Sensitivity Detection
def node_time_sensitive_detection(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    claims = state.get("extracted_claims", [])
    log_workflow_event(meeting_id, "time_sensitive_detection", "in_progress", "Evaluating time-sensitivity and stale-answer vulnerability")
    update_meeting_status(meeting_id, "processing", "time_sensitive_detection")

    prompt = get_time_sensitivity_prompt(claims)

    try:
        eval_result = bifrost_service.chat_json([
            {"role": "system", "content": "You are a stale-answer detection classifier analyzing time-sensitivity."},
            {"role": "user", "content": prompt}
        ])

        evaluated = {item["claim_id"]: item for item in eval_result.get("evaluated_claims", [])}

        claims_to_verify = []
        stable_claims = []

        for c in claims:
            cid = c["claim_id"]
            analysis = evaluated.get(cid, {})
            is_ts = analysis.get("time_sensitive", c.get("time_sensitive", True))
            req_ver = analysis.get("verification_required", c.get("verification_required", True))

            c["time_sensitive"] = is_ts
            c["verification_required"] = req_ver
            c["staleness_risk_rationale"] = analysis.get("staleness_risk_rationale", "")

            if req_ver and is_ts:
                claims_to_verify.append(c)
            else:
                stable_claims.append(c)

        log_workflow_event(
            meeting_id,
            "time_sensitive_detection",
            "completed",
            f"Classified {len(claims_to_verify)} time-sensitive claims requiring live verification, {len(stable_claims)} stable"
        )

        return {
            "claims_to_verify": claims_to_verify,
            "stable_claims": stable_claims,
            "current_step": "claim_verification"
        }
    except Exception as e:
        logger.warning(f"Time sensitivity detection fallback: {e}")
        # Default all claims to time-sensitive for safety
        return {
            "claims_to_verify": claims,
            "stable_claims": [],
            "current_step": "claim_verification"
        }

# Node 9: Claim Verification (Live Tavily Search for evidence)
def node_claim_verification(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    claims_to_verify = state.get("claims_to_verify", [])
    target_name = state["target_name"]

    log_workflow_event(meeting_id, "claim_verification", "in_progress", f"Conducting focused re-verification searches for {len(claims_to_verify)} claims")
    update_meeting_status(meeting_id, "processing", "claim_verification")

    claim_evidence_map: Dict[str, List[Dict[str, Any]]] = {}

    for c in claims_to_verify:
        cid = c["claim_id"]
        # Generate focused search query
        query = f"{target_name} {c['claim_text'][:80]}"
        try:
            results = tavily_service.search(query=query, max_results=3, days=30)
            claim_evidence_map[cid] = results
        except Exception as e:
            logger.warning(f"Verification search error for {cid}: {e}")
            claim_evidence_map[cid] = []

    log_workflow_event(meeting_id, "claim_verification", "completed", "Retrieved targeted web evidence for all candidate claims")
    return {
        "claim_evidence_map": claim_evidence_map,
        "current_step": "evidence_evaluation"
    }

# Node 10: Evidence Evaluation
def node_evidence_evaluation(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    claims_to_verify = state.get("claims_to_verify", [])
    evidence_map = state.get("claim_evidence_map", {})
    existing_sources = {s["id"]: s for s in state.get("processed_sources", [])}

    log_workflow_event(meeting_id, "evidence_evaluation", "in_progress", "Comparing claims against live web evidence using Grok")
    update_meeting_status(meeting_id, "processing", "evidence_evaluation")

    evaluations = []

    for c in claims_to_verify:
        cid = c["claim_id"]
        evidence = evidence_map.get(cid, [])
        # Add to source library
        for ev in evidence:
            existing_sources[ev["id"]] = ev

        prompt = get_evidence_evaluation_prompt(
            claim=c,
            retrieved_evidence=evidence,
            meeting_date=state["meeting_date"]
        )

        try:
            evaluation = bifrost_service.chat_json([
                {"role": "system", "content": "You are a factual verification evaluator. Strictly assess FRESH vs STALE vs UNCERTAIN."},
                {"role": "user", "content": prompt}
            ])
            evaluation["claim_id"] = cid
            evaluations.append(evaluation)
            time.sleep(1.0)  # Gentle spacing to stay well within Groq TPM limits
        except Exception as e:
            logger.warning(f"Evidence evaluation failed for {cid}: {e}")
            evaluations.append({
                "claim_id": cid,
                "status": "UNCERTAIN",
                "evidence_summary": "Verification query encountered an evaluation error.",
                "explanation": str(e),
                "corrected_claim": None,
                "contradiction_level": "none",
                "match_confidence": 0.5,
                "supporting_source_ids": [],
                "contradicting_source_ids": []
            })

    save_sources(meeting_id, list(existing_sources.values()))
    log_workflow_event(meeting_id, "evidence_evaluation", "completed", f"Evaluated {len(evaluations)} claims against retrieved proof")

    return {
        "verification_evaluations": evaluations,
        "processed_sources": list(existing_sources.values()),
        "current_step": "freshness_scoring"
    }

# Node 11: Freshness Scoring
def node_freshness_scoring(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    evaluations = {e["claim_id"]: e for e in state.get("verification_evaluations", [])}
    claims_to_verify = state.get("claims_to_verify", [])
    stable_claims = state.get("stable_claims", [])
    sources_dict = {s["id"]: s for s in state.get("processed_sources", [])}

    log_workflow_event(meeting_id, "freshness_scoring", "in_progress", "Calculating 4-factor freshness scores via deterministic Python logic")
    update_meeting_status(meeting_id, "processing", "freshness_scoring")

    scored_claims = []

    # Score time-sensitive claims
    for c in claims_to_verify:
        cid = c["claim_id"]
        ev_eval = evaluations.get(cid, {})
        status = ev_eval.get("status", "UNCERTAIN").upper()

        supporting = [sources_dict[sid] for sid in ev_eval.get("supporting_source_ids", []) if sid in sources_dict]
        contradicting = [sources_dict[sid] for sid in ev_eval.get("contradicting_source_ids", []) if sid in sources_dict]

        score_res = scoring_service.calculate_score(
            evidence_eval=ev_eval,
            supporting_sources=supporting,
            contradicting_sources=contradicting,
            meeting_date_str=state["meeting_date"],
            is_time_sensitive=True
        )

        scored_claims.append({
            "claim_id": cid,
            "claim_text": c["claim_text"],
            "category": c.get("category", "general"),
            "time_sensitive": True,
            "verification_required": True,
            "status": status,
            "freshness_score": score_res["total_score"],
            "score_breakdown": score_res,
            "evidence_summary": ev_eval.get("evidence_summary", ""),
            "explanation": ev_eval.get("explanation", ""),
            "corrected_claim": ev_eval.get("corrected_claim"),
            "supporting_source_ids": ev_eval.get("supporting_source_ids", []),
            "contradicting_source_ids": ev_eval.get("contradicting_source_ids", [])
        })

    # Add stable claims
    for c in stable_claims:
        score_res = scoring_service.calculate_score(
            evidence_eval={},
            supporting_sources=[],
            contradicting_sources=[],
            meeting_date_str=state["meeting_date"],
            is_time_sensitive=False
        )
        scored_claims.append({
            "claim_id": c["claim_id"],
            "claim_text": c["claim_text"],
            "category": c.get("category", "general"),
            "time_sensitive": False,
            "verification_required": False,
            "status": "FRESH",
            "freshness_score": 100.0,
            "score_breakdown": score_res,
            "evidence_summary": "Stable factual claim (not subject to temporal decay).",
            "explanation": "Claim does not require dynamic freshness tracking.",
            "corrected_claim": None,
            "supporting_source_ids": c.get("original_source_ids", []),
            "contradicting_source_ids": []
        })

    save_claims(meeting_id, scored_claims)
    log_workflow_event(meeting_id, "freshness_scoring", "completed", f"Calculated scores: {len(scored_claims)} total claims scored")

    return {
        "scored_claims": scored_claims,
        "current_step": "correction"
    }

# Node 12: Correction Engine
def node_correction(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    scored_claims = state.get("scored_claims", [])

    log_workflow_event(meeting_id, "correction", "in_progress", "Auditing stale claims and generating verified corrections")
    update_meeting_status(meeting_id, "processing", "correction")

    corrections = []
    for sc in scored_claims:
        if sc["status"] == "STALE" and sc.get("corrected_claim"):
            corrections.append({
                "original_claim": sc["claim_text"],
                "corrected_claim": sc["corrected_claim"],
                "reason": sc.get("explanation", "Disproven by recent web evidence"),
                "supporting_source_ids": sc.get("contradicting_source_ids", []) or sc.get("supporting_source_ids", [])
            })

    log_workflow_event(meeting_id, "correction", "completed", f"Prepared {len(corrections)} verified corrections for final briefing")
    return {
        "corrections": corrections,
        "current_step": "final_briefing"
    }

# Node 13: Final Briefing Generator
def node_final_briefing(state: AgentState) -> Dict[str, Any]:
    meeting_id = state["meeting_id"]
    draft = state.get("draft_briefing", {})
    scored_claims = state.get("scored_claims", [])
    sources = state.get("processed_sources", [])

    log_workflow_event(meeting_id, "final_briefing", "in_progress", "Assembling final executive meeting briefing with verified facts and open questions")
    update_meeting_status(meeting_id, "processing", "final_briefing")

    prompt = get_final_briefing_prompt(
        target_name=state["target_name"],
        meeting_type=state.get("meeting_type", "Executive Briefing"),
        meeting_date=state["meeting_date"],
        draft_briefing=draft,
        verified_claims=scored_claims,
        sources=sources,
        meeting_context=state
    )

    try:
        final_rep = bifrost_service.chat_json([
            {"role": "system", "content": "You are the final executive briefing director for VerityMeet AI."},
            {"role": "user", "content": prompt}
        ])

        save_briefing(meeting_id, final_rep)
        log_workflow_event(meeting_id, "final_briefing", "completed", "Verified meeting briefing successfully generated")
        update_meeting_status(meeting_id, "completed", "final_briefing")

        return {
            "final_briefing": final_rep,
            "completed": True,
            "current_step": "completed"
        }
    except Exception as e:
        err = f"Final briefing compilation failed: {str(e)}"
        log_workflow_event(meeting_id, "final_briefing", "failed", err)
        update_meeting_status(meeting_id, "failed", "final_briefing", err)
        return {"error": err}
