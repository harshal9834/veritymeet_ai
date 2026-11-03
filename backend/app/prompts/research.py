def get_research_planner_prompt(
    target_name: str,
    meeting_type: str,
    meeting_date: str,
    context: str = "",
    objective: str = "",
    interests: list = None
) -> str:
    interests_str = ", ".join(interests) if interests else "General strategic, business, and leadership developments"
    return f"""You are a research planning intelligence agent for VerityMeet AI.
Your task is to plan targeted live web search queries for an upcoming {meeting_type} with "{target_name}" scheduled for {meeting_date}.

Meeting Context: {context or 'None provided'}
Meeting Objective: {objective or 'Comprehensive pre-meeting intelligence briefing'}
Specific Research Interests: {interests_str}

Important Guidelines:
1. Target the past 30 days of recent developments relative to {meeting_date}.
2. Generate 4-6 diverse, highly specific search queries covering:
   - Recent news and business announcements
   - Leadership, executive changes, or board updates
   - Product launches, pricing shifts, or tech milestones
   - Key partnerships, acquisitions, or client deals
   - Any controversies, regulatory inquiries, or recent pivots
3. Do not hardcode query results or assume facts. Format search queries to find real web evidence.
4. If the target name is ambiguous (e.g., common generic name), formulate disambiguation queries.

Respond ONLY with a valid JSON object matching this schema:
{{
  "target_summary": "Brief 1-2 sentence identification of the target entity",
  "is_ambiguous": false,
  "ambiguity_notes": "",
  "search_queries": [
    {{
      "category": "recent_news",
      "query": "search query string",
      "priority": 1,
      "relevance_rationale": "why this is crucial for the meeting"
    }}
  ]
}}
"""
