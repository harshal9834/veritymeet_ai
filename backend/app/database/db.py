import sqlite3
import json
import os
from datetime import datetime
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
        meeting_date TEXT NOT NULL,
        meeting_time TEXT NOT NULL,
        meeting_type TEXT NOT NULL,
        context TEXT,
        objective TEXT,
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
        recent_developments TEXT,
        leadership_updates TEXT,
        product_launches TEXT,
        partnerships TEXT,
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

    conn.commit()
    conn.close()

# Initialize on import
init_db()

# Database helper operations

def create_meeting(meeting_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO meetings (id, target_name, meeting_date, meeting_time, meeting_type, context, objective, interests, status, current_step, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        meeting_data["id"],
        meeting_data["target_name"],
        meeting_data["meeting_date"],
        meeting_data["meeting_time"],
        meeting_data["meeting_type"],
        meeting_data.get("context", ""),
        meeting_data.get("objective", ""),
        json.dumps(meeting_data.get("interests", [])),
        meeting_data.get("status", "pending"),
        meeting_data.get("current_step", "queued"),
        now,
        now
    ))
    conn.commit()
    conn.close()
    return meeting_data["id"]

def update_meeting_status(meeting_id: str, status: str, current_step: Optional[str] = None, error_message: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    if error_message is not None:
        cursor.execute("""
            UPDATE meetings SET status = ?, current_step = ?, error_message = ?, updated_at = ? WHERE id = ?
        """, (status, current_step, error_message, now, meeting_id))
    else:
        cursor.execute("""
            UPDATE meetings SET status = ?, current_step = ?, updated_at = ? WHERE id = ?
        """, (status, current_step, now, meeting_id))
    conn.commit()
    conn.close()

def log_workflow_event(meeting_id: str, step: str, status: str, message: str = ""):
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
    cursor.execute("SELECT * FROM workflow_events WHERE meeting_id = ? ORDER BY id ASC", (meeting_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_meeting(meeting_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["interests"] = json.loads(d["interests"]) if d["interests"] else []
    except Exception:
        d["interests"] = []
    return d

def list_meetings() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        try:
            d["interests"] = json.loads(d["interests"]) if d["interests"] else []
        except Exception:
            d["interests"] = []
        results.append(d)
    return results

def save_sources(meeting_id: str, sources: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    for s in sources:
        cursor.execute("""
            INSERT OR REPLACE INTO sources (id, meeting_id, title, url, domain, snippet, published_date, reliability_score, reliability_tier, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s.get("id"),
            meeting_id,
            s.get("title", "Untitled"),
            s.get("url", ""),
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
        cursor.execute("""
            INSERT OR REPLACE INTO claims (
                id, meeting_id, claim_id, claim_text, category, time_sensitive, 
                verification_required, status, freshness_score, score_breakdown, 
                evidence_summary, explanation, corrected_claim, 
                supporting_source_ids, contradicting_source_ids, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"{meeting_id}_{c.get('claim_id')}",
            meeting_id,
            c.get("claim_id"),
            c.get("claim_text"),
            c.get("category", "General"),
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
    cursor.execute("SELECT * FROM claims WHERE meeting_id = ? ORDER BY claim_id ASC", (meeting_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["time_sensitive"] = bool(d["time_sensitive"])
        d["verification_required"] = bool(d["verification_required"])
        try:
            d["score_breakdown"] = json.loads(d["score_breakdown"]) if d["score_breakdown"] else {}
        except Exception:
            d["score_breakdown"] = {}
        try:
            d["supporting_source_ids"] = json.loads(d["supporting_source_ids"]) if d["supporting_source_ids"] else []
        except Exception:
            d["supporting_source_ids"] = []
        try:
            d["contradicting_source_ids"] = json.loads(d["contradicting_source_ids"]) if d["contradicting_source_ids"] else []
        except Exception:
            d["contradicting_source_ids"] = []
        results.append(d)
    return results

def save_briefing(meeting_id: str, briefing_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT OR REPLACE INTO briefings (
            id, meeting_id, overview, executive_summary, recent_developments,
            leadership_updates, product_launches, partnerships, why_it_matters,
            verification_overview, corrections, uncertain_information, open_questions,
            raw_briefing, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"briefing_{meeting_id}",
        meeting_id,
        briefing_data.get("overview", ""),
        briefing_data.get("executive_summary", ""),
        json.dumps(briefing_data.get("recent_developments", [])),
        json.dumps(briefing_data.get("leadership_updates", [])),
        json.dumps(briefing_data.get("product_launches", [])),
        json.dumps(briefing_data.get("partnerships", [])),
        briefing_data.get("why_it_matters", ""),
        briefing_data.get("verification_overview", ""),
        json.dumps(briefing_data.get("corrections", [])),
        json.dumps(briefing_data.get("uncertain_information", [])),
        json.dumps(briefing_data.get("open_questions", [])),
        briefing_data.get("raw_briefing", ""),
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
    for field in ["recent_developments", "leadership_updates", "product_launches", "partnerships", "corrections", "uncertain_information", "open_questions"]:
        try:
            d[field] = json.loads(d[field]) if d[field] else []
        except Exception:
            d[field] = []
    return d

def get_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM meetings")
    total_meetings = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM claims")
    total_claims = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'STALE'")
    stale_claims = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'FRESH'")
    fresh_claims = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM claims WHERE status = 'UNCERTAIN'")
    uncertain_claims = cursor.fetchone()[0]
    conn.close()
    return {
        "total_briefings": total_meetings,
        "total_claims": total_claims,
        "stale_claims": stale_claims,
        "fresh_claims": fresh_claims,
        "uncertain_claims": uncertain_claims
    }
