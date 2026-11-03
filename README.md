# VerityMeet AI

**AI-Powered Pre-Meeting Briefing Agent with Stale-Answer Detection & Verification Engine**

VerityMeet AI is an enterprise-grade pre-meeting intelligence platform that prepares professionals for meetings with companies, executives, investors, partners, and clients. Powered by live web research via **Tavily Search API**, structured LLM reasoning through **Bifrost Gateway (xAI Grok)**, and an end-to-end **13-node LangGraph orchestration workflow**, VerityMeet AI extracts factual claims, detects time-sensitive stale information, calculates evidence-based freshness scores, and audits every fact with clickable source provenance.

---

## Key Architecture & Capabilities

### 1. 13-Node LangGraph Orchestration Pipeline
```
USER INPUT
  → 1. Input Validation (30-day temporal research window)
  → 2. Research Planner (Dynamic category queries via Grok)
  → 3. Tavily Live Research (Web queries within research cutoff)
  → 4. Source Processing (URL normalization & domain authority scoring)
  → 5. Research Analysis (Trajectory, leadership & milestone synthesis)
  → 6. Draft Briefing Generation (Initial briefing with source IDs)
  → 7. Claim Extraction (Atomic factual statement decomposition)
  → 8. Time-Sensitivity Detection (Stale-answer vulnerability classifier)
  → 9. Claim Re-Verification (Targeted live search for candidate claims)
  → 10. Evidence Evaluation (Comparison of claims vs live web proof)
  → 11. Freshness Scoring (Transparent 4-factor mathematical scoring)
  → 12. Correction Engine (Replacement of stale facts with current proof)
  → 13. Final Briefing Compilation (Executive briefing with open questions)
```

### 2. Transparent 4-Factor Freshness Scoring
Calculated deterministically in Python (0–100 score):
- **Source Reliability (30%)**: Domain authority tiering (Official/gov/major financial news vs standard vs community).
- **Evidence Agreement (30%)**: Direct confirmation (100%), conflicting proof (35%), or direct contradiction (5%).
- **Evidence Recency (25%)**: Temporal delta relative to the meeting's 30-day coverage window.
- **Claim Matching (15%)**: Alignment of entities, metrics, and figures.

**Score Interpretation**:
- `90–100`: Fresh
- `70–89`: Mostly Fresh
- `40–69`: Uncertain
- `0–39`: Stale
- *Stable Claims*: Labeled as "Not time-sensitive" (e.g. founding history).

### 3. Verification & Correction Engine
- **Fresh Claims**: Confirmed with live web evidence and source attribution.
- **Stale Claims**: Disproven claims are retained in the audit log alongside verified corrections backed by current web evidence.
- **Uncertain Claims**: Labeled prominently as unconfirmed; never hallucinated as fact.

### 4. Executive Output & Export
- One-page executive summary layout.
- Print-friendly formatting (`window.print()`).
- ReportLab-powered PDF export (`/api/meetings/{id}/pdf`).

---

## Environment Configuration

Configure the following variables in `.env` (or via the interactive API Gateway panel in the UI):

```bash
# Tavily Search API key for live web search
TAVILY_API_KEY="your-tavily-api-key"

# Bifrost Gateway by Maxim AI (Grok LLM Gateway)
BIFROST_BASE_URL="https://api.bifrost.maxim.ai/v1"
BIFROST_API_KEY="your-bifrost-api-key"

# Grok model identifier through Bifrost
GROK_MODEL="grok-2-latest"

# SQLite Database persistence
DATABASE_URL="sqlite:///./veritymeet.db"

# Server port
PORT=8000
```

---

## Running the Application

### 1. Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Run the Full-Stack Application
```bash
npm run dev
```
The server runs on port 3000, serving both the React frontend and proxying `/api/*` to the Python FastAPI backend.

### 3. Run Automated Tests
```bash
python3 -m unittest backend/tests/test_verity.py
```
