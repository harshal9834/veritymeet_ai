import json
from typing import List, Dict, Any

def get_draft_briefing_prompt(
    target_name: str,
    meeting_type: str,
    meeting_date: str,
    context: str,
    objective: str,
    sources: List[Dict[str, Any]],
    user_context: str = ""
) -> str:
    sources_summary = []
    for s in sources[:15]:
        sources_summary.append({
            "source_id": s["id"],
            "title": s["title"],
            "url": s["url"],
            "domain": s.get("domain", ""),
            "published_date": s.get("published_date") or "Recent",
            "snippet": s.get("snippet", "")[:400]
        })

    sources_json = json.dumps(sources_summary, indent=2)

    return f"""You are the senior intelligence analyst for VerityMeet AI.
Your objective is to generate an initial draft meeting intelligence briefing for an upcoming {meeting_type} with "{target_name}" on {meeting_date}.

Meeting Context: {context or 'None provided'}
Meeting Objective: {objective or 'Executive preparation'}
User Perspective / Context: {user_context or 'None provided'}

Live Retrieved Web Sources:
{sources_json}

RULES:
1. Every factual assertion MUST cite the supporting `source_id` in brackets, e.g. [src_xxxxxx].
2. Do not invent facts, executive names, or metrics not grounded in the sources.
3. Structure your response into clear, comprehensive analytical sections.

Respond ONLY with a valid JSON object matching this schema:
{{
  "overview": "High-level background on {target_name} and meeting alignment",
  "executive_summary": "Crisp executive summary highlighting recent trajectory and focal points",
  "recent_developments": [
    {{
      "title": "Development title",
      "date": "Date or recent timeframe",
      "summary": "Detailed explanation with source citations [src_xxx]",
      "impact": "Potential business impact",
      "source_ids": ["src_xxx"]
    }}
  ],
  "leadership_updates": [
    {{
      "name": "Person name",
      "role": "Role",
      "background": "Background summary [src_xxx]",
      "source_ids": ["src_xxx"]
    }}
  ],
  "product_launches": [
    {{
      "name": "Product name",
      "status": "Launched / Announced / In Beta",
      "summary": "Details [src_xxx]",
      "source_ids": ["src_xxx"]
    }}
  ],
  "partnerships": [
    {{
      "partner": "Partner name",
      "nature": "Scope / Deal details",
      "date": "Date",
      "source_ids": ["src_xxx"]
    }}
  ],
  "why_it_matters": "Strategic synthesis for the meeting participants"
}}
"""

def get_final_briefing_prompt(
    target_name: str,
    meeting_type: str,
    meeting_date: str,
    draft_briefing: Dict[str, Any],
    verified_claims: List[Dict[str, Any]],
    sources: List[Dict[str, Any]],
    meeting_context: Dict[str, Any] = None
) -> str:
    meeting_context = meeting_context or {}
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

    user_info = f"""
- User Name/Role: {meeting_context.get('user_name', '')} ({meeting_context.get('user_role', '')})
- User Company: {meeting_context.get('user_company', '')} - {meeting_context.get('user_company_description', '')}
- User Offering: {meeting_context.get('user_offering', '')}
- Primary Objective: {meeting_context.get('objective', '')}
- Desired Outcome: {meeting_context.get('desired_outcome', '')}
- Previous Relationship: {meeting_context.get('previous_relationship', 'First Meeting')}
- Target Industry: {meeting_context.get('target_industry', '')}
- Target Person: {meeting_context.get('person_name', '')} ({meeting_context.get('person_designation', '')})
- Specific Topics to Discuss: {', '.join(meeting_context.get('discussion_topics', []))}
"""

    return f"""You are the Executive Briefing Director and Chief Strategy Officer for VerityMeet AI.
Your mission is to compile the final verified meeting intelligence briefing and meeting strategy for the upcoming {meeting_type} with "{target_name}" on {meeting_date}.

USER AND MEETING PROFILE:
{user_info}

DRAFT RESEARCH FINDINGS:
{draft_str}

FACT AUDIT & VERIFICATION RESULTS (Live Web Checked):
{claims_str}

EDITORIAL & STRATEGIC MANDATES:
1. Apply All Corrections: For any claim marked STALE, prominently replace the stale assertion with the verified updated fact.
2. Label Uncertain Claims: Do not present UNCERTAIN facts as confirmed truths.
3. SWOT Analysis: Grounded in real market positioning, recent developments, and competitive realities.
4. Strategic Opportunities: Specifically connect the user's company/offering with the target's recent developments and initiatives.
5. Risks & Red Flags: Highlight authentic commercial risks, leadership transitions, market headwinds, or unverified claims to clarify.
6. Smart Questions to Ask: 5-8 sharp, high-conviction questions grouped by strategic themes with the rationale for asking each.
7. Talking Points: Practical conversational roadmap (Opening, Recent Development to cite, Value Proposition, Exploring Opportunities, Clarifying Uncertainties, Closing & Next Steps).
8. Meeting Strategy: Concrete executive posture, key message, and negotiation considerations.
9. Final Recommendations: Scannable 3 key takeaways, must-discuss items, what to avoid assuming, and immediate next step.
10. Preparation Checklist: 6-8 practical action items to review before stepping into the room.

Respond ONLY with a valid JSON object matching this schema:
{{
  "overview": "Comprehensive verified profile and meeting alignment",
  "executive_summary": "Executive briefing answering: Who is the target? What happened recently? Why does it matter? What should you focus on?",
  "target_intelligence": {{
    "background": "Company or executive profile and origins",
    "business_model": "How they generate revenue and operate",
    "main_products": "Core product lines and services",
    "target_market": "Customer segments and geographic footprint",
    "competitive_landscape": "Key rivals and market positioning"
  }},
  "recent_developments": [
    {{
      "title": "Development headline",
      "date": "Date",
      "summary": "Verified description",
      "impact": "Strategic business impact",
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
  "swot": {{
    "strengths": [
      {{"point": "Key strength", "evidence": "Documented proof or market leadership"}}
    ],
    "weaknesses": [
      {{"point": "Documented limitation", "evidence": "Publicly verified challenge"}}
    ],
    "opportunities": [
      {{"point": "Market or collaboration opening", "evidence": "Growth catalyst"}}
    ],
    "threats": [
      {{"point": "External headwind or competitive pressure", "evidence": "Market risk"}}
    ]
  }},
  "opportunities": [
    {{
      "title": "Opportunity title",
      "why_it_exists": "Why this is possible now based on research",
      "relevance": "Direct alignment with user's offering/objective",
      "suggested_action": "How to propose or explore this in the meeting",
      "supporting_source_ids": ["src_xxx"]
    }}
  ],
  "risks": [
    {{
      "title": "Risk / Red flag title",
      "issue": "Detailed risk description",
      "impact": "Potential meeting or commercial risk",
      "clarification_question": "What to ask to de-risk",
      "supporting_source_ids": ["src_xxx"]
    }}
  ],
  "smart_questions": [
    {{
      "category": "Strategic / Business / Product / Partnership / Closing",
      "question": "The exact question to ask",
      "rationale": "Why ask this and what it reveals"
    }}
  ],
  "talking_points": [
    {{
      "stage": "Opening / Recent News / Value Proposition / Opportunities / Risk Clarification / Next Steps",
      "point": "What to say or frame",
      "notes": "Contextual advice"
    }}
  ],
  "meeting_strategy": {{
    "main_objective": "Primary priority for the conversation",
    "recommended_approach": "Recommended tone and meeting posture",
    "key_message": "Single core takeaway the target must remember",
    "negotiation_considerations": "Leverage points or deal boundaries",
    "desired_outcome": "Clear definition of meeting success",
    "preparation_priorities": [
      "Item 1 to review", "Item 2 to review"
    ]
  }},
  "final_recommendations": {{
    "top_three_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    "must_discuss": "The one critical topic that cannot be skipped",
    "avoid_assuming": "Crucial assumption trap to avoid making",
    "first_question_to_ask": "Best opening question",
    "next_immediate_step": "Recommended post-meeting action"
  }},
  "preparation_checklist": [
    {{"id": "chk_1", "task": "Review executive summary and verified developments", "completed": false}},
    {{"id": "chk_2", "task": "Memorize the 3 key takeaways", "completed": false}},
    {{"id": "chk_3", "task": "Check stale and uncertain claim corrections", "completed": false}},
    {{"id": "chk_4", "task": "Prepare the suggested opening talking point", "completed": false}},
    {{"id": "chk_5", "task": "Align on desired meeting outcome and next steps", "completed": false}}
  ],
  "why_it_matters": "High-level synthesis for executive preparation",
  "verification_overview": "Summary of fact audit (number of fresh, stale, and uncertain claims)",
  "corrections": [
    {{
      "original_claim": "Outdated assertion",
      "corrected_claim": "Verified new proof",
      "reason": "Evidence-backed explanation",
      "supporting_source_ids": ["src_xxx"]
    }}
  ],
  "uncertain_information": [
    "Unverified items requiring caution"
  ],
  "open_questions": [
    "High-impact questions"
  ]
}}
"""
