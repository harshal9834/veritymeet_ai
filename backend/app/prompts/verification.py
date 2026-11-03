import json
from typing import List, Dict, Any

def get_evidence_evaluation_prompt(
    claim: Dict[str, Any],
    retrieved_evidence: List[Dict[str, Any]],
    meeting_date: str
) -> str:
    claim_str = json.dumps(claim, indent=2)
    evidence_str = json.dumps([{
        "id": e["id"],
        "title": e["title"],
        "url": e["url"],
        "domain": e.get("domain", ""),
        "snippet": e.get("snippet", "")[:400],
        "published_date": e.get("published_date") or "Unknown"
    } for e in retrieved_evidence], indent=2)

    return f"""You are the Evidence Evaluation Engine for VerityMeet AI.
Your objective is to determine if the following factual claim is supported, contradicted (stale), or uncertain based strictly on the retrieved live web evidence.

Claim under verification:
{claim_str}

Reference Meeting Date: {meeting_date}

Retrieved Web Evidence:
{evidence_str}

VERIFICATION PROTOCOL:
1. "FRESH": Current evidence directly supports the claim without contradiction.
2. "STALE": Current evidence directly contradicts the claim (e.g., leadership has changed, pricing was altered, product was discontinued or renamed, acquisition occurred).
3. "UNCERTAIN": Evidence is insufficient, conflicting, ambiguous, or no definitive proof was found.

CORRECTION RULES:
- If STALE: Only provide a `corrected_claim` if the evidence explicitly states the current factual state. Do NOT fabricate replacement facts.
- If FRESH: `corrected_claim` must be null.
- If UNCERTAIN: `corrected_claim` must be null.

EVALUATION FACTORS (for transparent scoring):
- contradiction_level: "none", "conflicting", or "direct_contradiction"
- match_confidence: float between 0.0 and 1.0 (how well the evidence addresses the exact subject and metric)
- supporting_source_ids: list of source IDs that confirm the claim or correction
- contradicting_source_ids: list of source IDs that disprove the original claim

Respond ONLY with a valid JSON object matching this schema:
{{
  "claim_id": "{claim.get('claim_id')}",
  "status": "FRESH | STALE | UNCERTAIN",
  "evidence_summary": "1-2 sentence synthesis of what the web evidence proves",
  "explanation": "Detailed explanation of why this claim is fresh, stale, or uncertain",
  "corrected_claim": null,
  "contradiction_level": "none | conflicting | direct_contradiction",
  "match_confidence": 0.95,
  "supporting_source_ids": ["src_xxx"],
  "contradicting_source_ids": ["src_yyy"]
}}
"""
