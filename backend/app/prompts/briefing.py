import json
from typing import List, Dict, Any

def get_draft_briefing_prompt(
    target_name: str,
    meeting_type: str,
    meeting_date: str,
    context: str,
    objective: str,
    sources: List[Dict[str, Any]]
) -> str:
    # Format sources for prompt
    sources_summary = []
    for s in sources[:12]:
        sources_summary.append({
            "source_id": s["id"],
            "title": s["title"],
            "url": s["url"],
            "domain": s.get("domain", ""),
            "published_date": s.get("published_date") or "Unknown date",
            "snippet": s.get("snippet", "")[:350]
        })

    sources_json = json.dumps(sources_summary, indent=2)

    return f"""You are the senior briefing analyst for VerityMeet AI.
Your objective is to generate an initial draft meeting intelligence briefing for an upcoming {meeting_type} with "{target_name}" on {meeting_date}.

Meeting Context: {context or 'None provided'}
Meeting Objective: {objective or 'Executive preparation'}

Here are the retrieved real web sources from live search:
{sources_json}

CRITICAL RULES:
1. Every factual statement MUST cite the supporting `source_id` in brackets, like [src_12345678].
2. DO NOT invent events, executive names, numbers, products, or dates not supported by the sources.
3. If information is uncertain or speculation, explicitly state that it is unconfirmed.
4. Structure the draft briefing into clear thematic sections.

Respond ONLY with a valid JSON object matching this schema:
{{
  "overview": "High-level background on {target_name} and meeting alignment",
  "executive_summary": "Crisp 3-4 bullet executive summary highlighting recent trajectory and focal points",
  "recent_developments": [
    {{
      "title": "Development title",
      "date": "YYYY-MM-DD or recent timeframe",
      "summary": "Detailed explanation with source citations",
      "source_ids": ["src_xxx"]
    }}
  ],
  "leadership_updates": [
    {{
      "name": "Person name",
      "role": "Current or newly appointed title",
      "background": "Brief context",
      "source_ids": ["src_xxx"]
    }}
  ],
  "product_launches": [
    {{
      "name": "Product or feature name",
      "status": "Launched / Announced / In Beta",
      "summary": "Key capabilities or pricing updates",
      "source_ids": ["src_xxx"]
    }}
  ],
  "partnerships": [
    {{
      "partner": "Partner name or organization",
      "nature": "Scope of agreement or deal",
      "date": "Timeline",
      "source_ids": ["src_xxx"]
    }}
  ],
  "why_it_matters": "Strategic synthesis explaining why these developments matter for this specific meeting",
  "potential_risks_or_uncertainties": [
    "Uncertain points or conflicting claims discovered in research"
  ]
}}
"""

def get_final_briefing_prompt(
    target_name: str,
    meeting_type: str,
    meeting_date: str,
    draft_briefing: Dict[str, Any],
    verified_claims: List[Dict[str, Any]],
    sources: List[Dict[str, Any]]
) -> str:
    draft_str = json.dumps(draft_briefing, indent=2)
    claims_str = json.dumps([{
        "claim_id": c["claim_id"],
        "claim_text": c["claim_text"],
        "status": c["status"],
        "freshness_score": c.get("freshness_score"),
        "interpretation": c.get("score_breakdown", {}).get("interpretation", c["status"]),
        "corrected_claim": c.get("corrected_claim"),
        "evidence_summary": c.get("evidence_summary"),
        "supporting_sources": c.get("supporting_source_ids", [])
    } for c in verified_claims], indent=2)

    return f"""You are the final editorial briefing director for VerityMeet AI.
Your task is to compile the final verified meeting intelligence briefing for the {meeting_type} with "{target_name}" scheduled on {meeting_date}.

You have:
1. Initial Draft Briefing:
{draft_str}

2. Rigorously Verified Factual Claims (with freshness scores & corrections):
{claims_str}

EDITORIAL MANDATES:
1. Apply all corrections: If any claim was marked STALE and has a `corrected_claim`, REPLACE the outdated text with the corrected, evidence-backed fact. Clearly document this in the corrections audit section.
2. Label uncertain claims: If a claim was marked UNCERTAIN, do NOT present it as confirmed fact. Place it in the uncertain information section.
3. Keep verified fresh facts prominent with their supporting source IDs.
4. Generate 4-6 high-impact, strategic open questions tailored for the meeting that directly leverage the verified findings. Do NOT ask questions implying unsupported facts.
5. Create a cohesive, executive-ready briefing suitable for a one-page review.

Respond ONLY with a valid JSON object matching this schema:
{{
  "overview": "Concise verified profile and meeting alignment",
  "executive_summary": "Executive summary with all stale facts corrected and verified sources attributed",
  "recent_developments": [
    {{
      "title": "Development headline",
      "date": "Date",
      "summary": "Verified description",
      "source_ids": ["src_xxx"]
    }}
  ],
  "leadership_updates": [
    {{
      "name": "Person name",
      "role": "Role",
      "background": "Background",
      "source_ids": ["src_xxx"]
    }}
  ],
  "product_launches": [
    {{
      "name": "Product name",
      "status": "Status",
      "summary": "Summary",
      "source_ids": ["src_xxx"]
    }}
  ],
  "partnerships": [
    {{
      "partner": "Partner name",
      "nature": "Scope",
      "date": "Date",
      "source_ids": ["src_xxx"]
    }}
  ],
  "why_it_matters": "Strategic synthesis for the meeting participants",
  "verification_overview": "Summary of the factual audit (number of fresh, stale, and uncertain claims detected)",
  "corrections": [
    {{
      "original_claim": "The outdated claim",
      "corrected_claim": "The verified updated claim",
      "reason": "Why the original was stale according to evidence",
      "supporting_source_ids": ["src_xxx"]
    }}
  ],
  "uncertain_information": [
    "Unconfirmed items that require caution"
  ],
  "open_questions": [
    "Thoughtful, strategic discussion questions for the meeting"
  ]
}}
"""
