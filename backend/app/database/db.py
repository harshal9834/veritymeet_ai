import sqlite3
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path("./veritymeet.db").resolve()

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        target_name TEXT NOT NULL,
        meeting_title TEXT,
        meeting_date TEXT NOT NULL,
        meeting_time TEXT NOT NULL,
        timezone TEXT DEFAULT 'UTC',
        duration INTEGER DEFAULT 45,
        meeting_type TEXT NOT NULL,
        meeting_mode TEXT DEFAULT 'Video Conference',
        meeting_location TEXT,
        target_type TEXT DEFAULT 'Company',
        company_name TEXT,
        company_website TEXT,
        person_name TEXT,
        person_designation TEXT,
        person_linkedin TEXT,
        target_industry TEXT,
        target_market TEXT,
        user_name TEXT,
        user_company TEXT,
        user_role TEXT,
        user_website TEXT,
        user_company_description TEXT,
        user_offering TEXT,
        context TEXT,
        objective TEXT,
        desired_outcome TEXT,
        discussion_topics TEXT,
        existing_questions TEXT,
        previous_relationship TEXT,
        research_focus TEXT,
        custom_research_instructions TEXT,
        research_period TEXT,
        geographic_focus TEXT,
        preferred_sources TEXT,
        excluded_topics TEXT,
        briefing_depth TEXT,
        output_language TEXT,
        writing_style TEXT,
        meeting_priority TEXT,
        include_swot INTEGER DEFAULT 1,
        include_questions INTEGER DEFAULT 1,
        include_talking_points INTEGER DEFAULT 1,
        include_risk_analysis INTEGER DEFAULT 1,
        include_source_references INTEGER DEFAULT 1,
        include_fact_verification INTEGER DEFAULT 1,
        uploaded_documents TEXT,
        interests TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        current_step TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        domain TEXT,
        snippet TEXT,
        published_date TEXT,
        reliability_score REAL DEFAULT 0.5,
        reliability_tier TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        claim_id TEXT NOT NULL,
        claim_text TEXT NOT NULL,
        category TEXT NOT NULL,
        time_sensitive INTEGER NOT NULL DEFAULT 1,
        verification_required INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'PENDING',
        freshness_score REAL,
        score_breakdown TEXT,
        evidence_summary TEXT,
        explanation TEXT,
        corrected_claim TEXT,
        supporting_source_ids TEXT,
        contradicting_source_ids TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS briefings (
        id TEXT PRIMARY KEY,
        meeting_id TEXT UNIQUE NOT NULL,
        overview TEXT,
        executive_summary TEXT,
        target_intelligence TEXT,
        recent_developments TEXT,
        leadership_updates TEXT,
        product_launches TEXT,
        partnerships TEXT,
        swot TEXT,
        opportunities TEXT,
        risks TEXT,
        smart_questions TEXT,
        talking_points TEXT,
        meeting_strategy TEXT,
        final_recommendations TEXT,
        preparation_checklist TEXT,
        why_it_matters TEXT,
        verification_overview TEXT,
        corrections TEXT,
        uncertain_information TEXT,
        open_questions TEXT,
        raw_briefing TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflow_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id TEXT NOT NULL,
        step TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_verified INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refresh_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        created_at TEXT NOT NULL,
        replaced_by_session_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # Attempt migration if columns don't exist yet
    existing_meeting_cols = [r[1] for r in cursor.execute("PRAGMA table_info(meetings)").fetchall()]
    new_cols = [
        ("user_id", "TEXT"),
        ("meeting_title", "TEXT"),
        ("timezone", "TEXT DEFAULT 'UTC'"),
        ("duration", "INTEGER DEFAULT 45"),
        ("meeting_mode", "TEXT DEFAULT 'Video Conference'"),
        ("meeting_location", "TEXT"),
        ("target_type", "TEXT DEFAULT 'Company'"),
        ("company_name", "TEXT"),
        ("company_website", "TEXT"),
        ("person_name", "TEXT"),
        ("person_designation", "TEXT"),
        ("person_linkedin", "TEXT"),
        ("target_industry", "TEXT"),
        ("target_market", "TEXT"),
        ("user_name", "TEXT"),
        ("user_company", "TEXT"),
        ("user_role", "TEXT"),
        ("user_website", "TEXT"),
        ("user_company_description", "TEXT"),
        ("user_offering", "TEXT"),
        ("desired_outcome", "TEXT"),
        ("discussion_topics", "TEXT"),
        ("existing_questions", "TEXT"),
        ("previous_relationship", "TEXT DEFAULT 'First Meeting'"),
        ("research_focus", "TEXT"),
        ("custom_research_instructions", "TEXT"),
        ("research_period", "TEXT DEFAULT 'Last 30 days'"),
        ("geographic_focus", "TEXT"),
        ("preferred_sources", "TEXT"),
        ("excluded_topics", "TEXT"),
        ("briefing_depth", "TEXT DEFAULT 'Standard Briefing'"),
        ("output_language", "TEXT DEFAULT 'English'"),
        ("writing_style", "TEXT DEFAULT 'Executive'"),
        ("meeting_priority", "TEXT DEFAULT 'General Preparation'"),
        ("include_swot", "INTEGER DEFAULT 1"),
        ("include_questions", "INTEGER DEFAULT 1"),
        ("include_talking_points", "INTEGER DEFAULT 1"),
        ("include_risk_analysis", "INTEGER DEFAULT 1"),
        ("include_source_references", "INTEGER DEFAULT 1"),
        ("include_fact_verification", "INTEGER DEFAULT 1"),
        ("uploaded_documents", "TEXT")
    ]
    for col_name, col_type in new_cols:
        if col_name not in existing_meeting_cols:
            try:
                cursor.execute(f"ALTER TABLE meetings ADD COLUMN {col_name} {col_type};")
            except Exception:
                pass

    existing_briefing_cols = [r[1] for r in cursor.execute("PRAGMA table_info(briefings)").fetchall()]
    new_briefing_cols = [
        ("target_intelligence", "TEXT"),
        ("swot", "TEXT"),
        ("opportunities", "TEXT"),
        ("risks", "TEXT"),
        ("smart_questions", "TEXT"),
        ("talking_points", "TEXT"),
        ("meeting_strategy", "TEXT"),
        ("final_recommendations", "TEXT"),
        ("preparation_checklist", "TEXT")
    ]
    for col_name, col_type in new_briefing_cols:
        if col_name not in existing_briefing_cols:
            try:
                cursor.execute(f"ALTER TABLE briefings ADD COLUMN {col_name} {col_type};")
            except Exception:
                pass

    conn.commit()
    conn.close()

init_db()

def create_meeting(meeting_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO meetings (
            id, user_id, target_name, meeting_title, meeting_date, meeting_time, timezone, duration,
            meeting_type, meeting_mode, meeting_location, target_type, company_name, company_website,
            person_name, person_designation, person_linkedin, target_industry, target_market,
            user_name, user_company, user_role, user_website, user_company_description, user_offering,
            context, objective, desired_outcome, discussion_topics, existing_questions, previous_relationship,
            research_focus, custom_research_instructions, research_period, geographic_focus, preferred_sources,
            excluded_topics, briefing_depth, output_language, writing_style, meeting_priority,
            include_swot, include_questions, include_talking_points, include_risk_analysis,
            include_source_references, include_fact_verification, uploaded_documents, interests,
            status, current_step, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    """, (
        meeting_data["id"],
        meeting_data.get("user_id"),
        meeting_data["target_name"],
        meeting_data.get("meeting_title", ""),
        meeting_data["meeting_date"],
        meeting_data.get("meeting_time", "14:00"),
        meeting_data.get("timezone", "UTC"),
        meeting_data.get("duration", 45),
        meeting_data.get("meeting_type", "Executive Briefing"),
        meeting_data.get("meeting_mode", "Video Conference"),
        meeting_data.get("meeting_location", ""),
        meeting_data.get("target_type", "Company"),
        meeting_data.get("company_name", ""),
        meeting_data.get("company_website", ""),
        meeting_data.get("person_name", ""),
        meeting_data.get("person_designation", ""),
        meeting_data.get("person_linkedin", ""),
        meeting_data.get("target_industry", ""),
        meeting_data.get("target_market", ""),
        meeting_data.get("user_name", ""),
        meeting_data.get("user_company", ""),
        meeting_data.get("user_role", ""),
        meeting_data.get("user_website", ""),
        meeting_data.get("user_company_description", ""),
        meeting_data.get("user_offering", ""),
        meeting_data.get("context", ""),
        meeting_data.get("objective", ""),
        meeting_data.get("desired_outcome", ""),
        json.dumps(meeting_data.get("discussion_topics", [])),
        json.dumps(meeting_data.get("existing_questions", [])),
        meeting_data.get("previous_relationship", "First Meeting"),
        json.dumps(meeting_data.get("research_focus", [])),
        meeting_data.get("custom_research_instructions", ""),
        meeting_data.get("research_period", "Last 30 days"),
        meeting_data.get("geographic_focus", ""),
        json.dumps(meeting_data.get("preferred_sources", [])),
        meeting_data.get("excluded_topics", ""),
        meeting_data.get("briefing_depth", "Standard Briefing"),
        meeting_data.get("output_language", "English"),
        meeting_data.get("writing_style", "Executive"),
        meeting_data.get("meeting_priority", "General Preparation"),
        1 if meeting_data.get("include_swot", True) else 0,
        1 if meeting_data.get("include_questions", True) else 0,
        1 if meeting_data.get("include_talking_points", True) else 0,
        1 if meeting_data.get("include_risk_analysis", True) else 0,
        1 if meeting_data.get("include_source_references", True) else 0,
        1 if meeting_data.get("include_fact_verification", True) else 0,
        json.dumps(meeting_data.get("uploaded_documents", [])),
        json.dumps(meeting_data.get("interests", [])),
        meeting_data.get("status", "pending"),
        meeting_data.get("current_step", "queued"),
        now,
        now
    ))
    conn.commit()
    conn.close()
    return meeting_data["id"]

def get_meeting(meeting_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM meetings WHERE id = ? AND (user_id = ? OR user_id IS NULL)", (meeting_id, user_id))
    else:
        cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    for json_col in [
        "interests", "discussion_topics", "existing_questions",
        "research_focus", "preferred_sources", "uploaded_documents"
    ]:
        if d.get(json_col):
            try:
                d[json_col] = json.loads(d[json_col])
            except Exception:
                d[json_col] = []
        else:
            d[json_col] = []
    return d

def list_meetings(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM meetings WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM meetings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        for json_col in ["interests", "discussion_topics", "existing_questions", "research_focus", "preferred_sources"]:
            if d.get(json_col):
                try:
                    d[json_col] = json.loads(d[json_col])
                except Exception:
                    d[json_col] = []
            else:
                d[json_col] = []
        results.append(d)
    return results

def delete_meeting(meeting_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workflow_events WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM claims WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM sources WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM briefings WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    conn.commit()
    conn.close()
    return True

def update_meeting_status(meeting_id: str, status: str, current_step: Optional[str] = None, error_message: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE meetings
        SET status = ?, current_step = ?, error_message = ?, updated_at = ?
        WHERE id = ?
    """, (status, current_step, error_message, now, meeting_id))
    conn.commit()
    conn.close()

def log_workflow_event(meeting_id: str, step: str, status: str, message: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO workflow_events (meeting_id, step, status, message, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (meeting_id, step, status, message, now))
    conn.commit()
    conn.close()

def get_workflow_events(meeting_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM workflow_events
        WHERE meeting_id = ?
        ORDER BY id ASC
    """, (meeting_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_sources(meeting_id: str, sources: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    for s in sources:
        cursor.execute("""
            INSERT OR REPLACE INTO sources (id, meeting_id, title, url, domain, snippet, published_date, reliability_score, reliability_tier, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["id"],
            meeting_id,
            s["title"],
            s["url"],
            s.get("domain", ""),
            s.get("snippet", ""),
            s.get("published_date"),
            s.get("reliability_score", 0.5),
            s.get("reliability_tier", "standard"),
            now
        ))
    conn.commit()
    conn.close()

def get_sources_for_meeting(meeting_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sources WHERE meeting_id = ? ORDER BY reliability_score DESC", (meeting_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_claims(meeting_id: str, claims: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    for c in claims:
        cid = c.get("id") or f"clm_{c['claim_id']}_{meeting_id[:8]}"
        cursor.execute("""
            INSERT OR REPLACE INTO claims (
                id, meeting_id, claim_id, claim_text, category, time_sensitive,
                verification_required, status, freshness_score, score_breakdown,
                evidence_summary, explanation, corrected_claim, supporting_source_ids,
                contradicting_source_ids, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cid,
            meeting_id,
            c["claim_id"],
            c["claim_text"],
            c.get("category", "general"),
            1 if c.get("time_sensitive", True) else 0,
            1 if c.get("verification_required", True) else 0,
            c.get("status", "PENDING"),
            c.get("freshness_score"),
            json.dumps(c.get("score_breakdown", {})),
            c.get("evidence_summary", ""),
            c.get("explanation", ""),
            c.get("corrected_claim"),
            json.dumps(c.get("supporting_source_ids", [])),
            json.dumps(c.get("contradicting_source_ids", [])),
            now
        ))
    conn.commit()
    conn.close()

def get_claims_for_meeting(meeting_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE meeting_id = ?", (meeting_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["time_sensitive"] = bool(d["time_sensitive"])
        d["verification_required"] = bool(d["verification_required"])
        if d.get("score_breakdown"):
            try:
                d["score_breakdown"] = json.loads(d["score_breakdown"])
            except Exception:
                d["score_breakdown"] = {}
        if d.get("supporting_source_ids"):
            try:
                d["supporting_source_ids"] = json.loads(d["supporting_source_ids"])
            except Exception:
                d["supporting_source_ids"] = []
        if d.get("contradicting_source_ids"):
            try:
                d["contradicting_source_ids"] = json.loads(d["contradicting_source_ids"])
            except Exception:
                d["contradicting_source_ids"] = []
        results.append(d)
    return results

def list_all_claims(limit: int = 100, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("""
            SELECT c.*, m.target_name, m.meeting_type
            FROM claims c
            JOIN meetings m ON c.meeting_id = m.id
            WHERE m.user_id = ? OR m.user_id IS NULL
            ORDER BY c.created_at DESC
            LIMIT ?
        """, (user_id, limit))
    else:
        cursor.execute("""
            SELECT c.*, m.target_name, m.meeting_type
            FROM claims c
            JOIN meetings m ON c.meeting_id = m.id
            ORDER BY c.created_at DESC
            LIMIT ?
        """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["time_sensitive"] = bool(d["time_sensitive"])
        if d.get("score_breakdown"):
            try:
                d["score_breakdown"] = json.loads(d["score_breakdown"])
            except Exception:
                d["score_breakdown"] = {}
        results.append(d)
    return results

def save_briefing(meeting_id: str, briefing_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    bid = f"brf_{meeting_id}"

    cursor.execute("""
        INSERT OR REPLACE INTO briefings (
            id, meeting_id, overview, executive_summary, target_intelligence,
            recent_developments, leadership_updates, product_launches, partnerships,
            swot, opportunities, risks, smart_questions, talking_points,
            meeting_strategy, final_recommendations, preparation_checklist,
            why_it_matters, verification_overview, corrections, uncertain_information,
            open_questions, raw_briefing, created_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?
        )
    """, (
        bid,
        meeting_id,
        briefing_data.get("overview", ""),
        briefing_data.get("executive_summary", ""),
        json.dumps(briefing_data.get("target_intelligence", {})),
        json.dumps(briefing_data.get("recent_developments", [])),
        json.dumps(briefing_data.get("leadership_updates", [])),
        json.dumps(briefing_data.get("product_launches", [])),
        json.dumps(briefing_data.get("partnerships", [])),
        json.dumps(briefing_data.get("swot", {})),
        json.dumps(briefing_data.get("opportunities", [])),
        json.dumps(briefing_data.get("risks", [])),
        json.dumps(briefing_data.get("smart_questions", [])),
        json.dumps(briefing_data.get("talking_points", [])),
        json.dumps(briefing_data.get("meeting_strategy", {})),
        json.dumps(briefing_data.get("final_recommendations", {})),
        json.dumps(briefing_data.get("preparation_checklist", [])),
        briefing_data.get("why_it_matters", ""),
        briefing_data.get("verification_overview", ""),
        json.dumps(briefing_data.get("corrections", [])),
        json.dumps(briefing_data.get("uncertain_information", [])),
        json.dumps(briefing_data.get("open_questions", [])),
        json.dumps(briefing_data),
        now
    ))
    conn.commit()
    conn.close()

def get_briefing_for_meeting(meeting_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM briefings WHERE meeting_id = ?", (meeting_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    for col in [
        "target_intelligence", "recent_developments", "leadership_updates", "product_launches",
        "partnerships", "swot", "opportunities", "risks", "smart_questions", "talking_points",
        "meeting_strategy", "final_recommendations", "preparation_checklist", "corrections",
        "uncertain_information", "open_questions"
    ]:
        if d.get(col):
            try:
                d[col] = json.loads(d[col])
            except Exception:
                d[col] = [] if col in ["recent_developments", "leadership_updates", "product_launches", "partnerships", "opportunities", "risks", "smart_questions", "talking_points", "preparation_checklist", "corrections", "uncertain_information", "open_questions"] else {}
        else:
            d[col] = [] if col in ["recent_developments", "leadership_updates", "product_launches", "partnerships", "opportunities", "risks", "smart_questions", "talking_points", "preparation_checklist", "corrections", "uncertain_information", "open_questions"] else {}

    d["sources"] = get_sources_for_meeting(meeting_id)
    return d

def get_stats(user_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        total_briefings = cursor.execute("SELECT COUNT(*) FROM meetings WHERE user_id = ? OR user_id IS NULL", (user_id,)).fetchone()[0]
        total_claims = cursor.execute("SELECT COUNT(*) FROM claims c JOIN meetings m ON c.meeting_id = m.id WHERE m.user_id = ? OR m.user_id IS NULL", (user_id,)).fetchone()[0]
        stale_claims = cursor.execute("SELECT COUNT(*) FROM claims c JOIN meetings m ON c.meeting_id = m.id WHERE c.status = 'STALE' AND (m.user_id = ? OR m.user_id IS NULL)", (user_id,)).fetchone()[0]
        fresh_claims = cursor.execute("SELECT COUNT(*) FROM claims c JOIN meetings m ON c.meeting_id = m.id WHERE c.status = 'FRESH' AND (m.user_id = ? OR m.user_id IS NULL)", (user_id,)).fetchone()[0]
        uncertain_claims = cursor.execute("SELECT COUNT(*) FROM claims c JOIN meetings m ON c.meeting_id = m.id WHERE c.status = 'UNCERTAIN' AND (m.user_id = ? OR m.user_id IS NULL)", (user_id,)).fetchone()[0]
    else:
        total_briefings = cursor.execute("SELECT COUNT(*) FROM meetings").fetchone()[0]
        total_claims = cursor.execute("SELECT COUNT(*) FROM claims").fetchone()[0]
        stale_claims = cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'STALE'").fetchone()[0]
        fresh_claims = cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'FRESH'").fetchone()[0]
        uncertain_claims = cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'UNCERTAIN'").fetchone()[0]
    conn.close()
    return {
        "total_briefings": total_briefings,
        "total_claims": total_claims,
        "stale_claims": stale_claims,
        "fresh_claims": fresh_claims,
        "uncertain_claims": uncertain_claims
    }

# =========================================================================
# USER & AUTHENTICATION DATABASE OPERATIONS
# =========================================================================

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, is_active, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_data["id"],
        user_data["full_name"],
        user_data["email"].lower().strip(),
        user_data["password_hash"],
        1,
        1,
        now,
        now
    ))
    conn.commit()
    conn.close()
    return get_user_by_id(user_data["id"])

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, is_active, is_verified, created_at, updated_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_password(user_id: str, password_hash: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (password_hash, now, user_id))
    # Invalidate all existing refresh sessions
    cursor.execute("UPDATE refresh_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL", (now, user_id))
    conn.commit()
    conn.close()

def create_refresh_session(session_id: str, user_id: str, token_hash: str, expires_at: datetime) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        session_id,
        user_id,
        token_hash,
        expires_at.isoformat(),
        now
    ))
    conn.commit()
    conn.close()
    return session_id

def get_refresh_session(token_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM refresh_sessions
        WHERE token_hash = ? AND revoked_at IS NULL
    """, (token_hash,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    # Check expiry
    exp = datetime.fromisoformat(d["expires_at"])
    if exp.tzinfo is not None:
        now_dt = datetime.now(timezone.utc)
    else:
        now_dt = datetime.utcnow()
    if exp < now_dt:
        return None
    return d

def rotate_refresh_session(old_session_id: str, new_session_id: str, user_id: str, new_token_hash: str, new_expires_at: datetime):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    # Revoke old session and link replacement
    cursor.execute("""
        UPDATE refresh_sessions
        SET revoked_at = ?, replaced_by_session_id = ?
        WHERE id = ?
    """, (now, new_session_id, old_session_id))
    # Insert new session
    cursor.execute("""
        INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        new_session_id,
        user_id,
        new_token_hash,
        new_expires_at.isoformat(),
        now
    ))
    conn.commit()
    conn.close()

def revoke_refresh_session(token_hash: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE refresh_sessions SET revoked_at = ? WHERE token_hash = ?", (now, token_hash))
    conn.commit()
    conn.close()

def list_user_sessions(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, created_at, expires_at, revoked_at
        FROM refresh_sessions
        WHERE user_id = ? AND revoked_at IS NULL
        ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def revoke_user_session_by_id(user_id: str, session_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE refresh_sessions SET revoked_at = ? WHERE id = ? AND user_id = ?", (now, session_id, user_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def create_password_reset(reset_id: str, user_id: str, token_hash: str, expires_at: datetime):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        reset_id,
        user_id,
        token_hash,
        expires_at.isoformat(),
        now
    ))
    conn.commit()
    conn.close()

def get_password_reset(token_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM password_resets
        WHERE token_hash = ? AND used_at IS NULL
    """, (token_hash,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    exp = datetime.fromisoformat(d["expires_at"])
    if exp.tzinfo is not None:
        now_dt = datetime.now(timezone.utc)
    else:
        now_dt = datetime.utcnow()
    if exp < now_dt:
        return None
    return d

def mark_password_reset_used(reset_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE password_resets SET used_at = ? WHERE id = ?", (now, reset_id))
    conn.commit()
    conn.close()

