import json
from typing import Dict, Any

def get_claim_extraction_prompt(draft_briefing: Dict[str, Any]) -> str:
    draft_str = json.dumps(draft_briefing, indent=2)

    return f"""You are the Claim Extraction Engine for VerityMeet AI.
Your job is to extract independently verifiable factual statements from this draft meeting briefing.

Draft Briefing:
{draft_str}

RULES:
1. Split compound sentences into separate, distinct atomic factual claims.
2. Filter out pure opinions, generic sentiments, or subjective suggestions. Only extract testable facts.
3. For each claim, determine:
   - claim_id: dynamically generated unique string (e.g. "claim_01", "claim_02")
   - claim_text: clean, standalone factual statement
   - category: one of ["pricing", "leadership", "product", "partnership", "regulation", "api_version", "statistics", "company_announcements", "general", "other"]
   - time_sensitive: boolean. (True if facts change frequently like leadership, pricing, active product versions, numbers, deals; False for historical founding dates or immutable background)
   - original_source_ids: list of source IDs cited in the sentence
   - verification_required: boolean (True if time_sensitive or critical business fact)

Extract between 5 and 10 of the most impactful factual claims.

Respond ONLY with a valid JSON object matching this schema:
{{
  "claims": [
    {{
      "claim_id": "claim_01",
      "claim_text": "Atomic factual statement",
      "category": "leadership",
      "time_sensitive": true,
      "original_source_ids": ["src_xxx"],
      "verification_required": true
    }}
  ]
}}
"""

def get_time_sensitivity_prompt(claims: list) -> str:
    claims_str = json.dumps(claims, indent=2)
    return f"""You are the Stale-Answer Detection Classifier for VerityMeet AI.
Review the following extracted claims and evaluate whether each claim is subject to becoming stale over time or is stable.

Claims:
{claims_str}

Categories prone to staleness:
- Pricing and plan limits
- Executive leadership and titles
- Product versions, release status, and feature availability
- Mergers, acquisitions, and partnerships
- Financial metrics, headcount, and growth figures
- Regulatory compliance and legal standings

Categories that are stable:
- Founding year and original founders
- Architectural foundations that have not changed
- General historical background

For each claim, output its classification ("stable", "time-sensitive", "potentially-stale") and whether it requires live Tavily re-verification.

Respond ONLY with a valid JSON object matching this schema:
{{
  "evaluated_claims": [
    {{
      "claim_id": "claim_01",
      "time_sensitive": true,
      "classification": "time-sensitive",
      "verification_required": true,
      "staleness_risk_rationale": "Reason why this claim could be outdated"
    }}
  ]
}}
"""
