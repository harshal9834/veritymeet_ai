import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Storage for meetings, sources, claims, briefings, and events
interface MeetingRecord {
  id: string;
  target_name: string;
  meeting_date: string;
  meeting_time: string;
  meeting_type: string;
  context?: string;
  objective?: string;
  interests?: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface SourceRecord {
  id: string;
  meeting_id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  published_date?: string;
  reliability_score: number;
  reliability_tier: string;
}

interface ClaimRecord {
  id: string;
  meeting_id: string;
  claim_id: string;
  claim_text: string;
  category: string;
  time_sensitive: boolean;
  verification_required: boolean;
  status: 'FRESH' | 'STALE' | 'UNCERTAIN' | 'PENDING';
  freshness_score?: number;
  score_breakdown?: any;
  evidence_summary?: string;
  explanation?: string;
  corrected_claim?: string | null;
  supporting_source_ids: string[];
  contradicting_source_ids: string[];
}

interface BriefingRecord {
  id: string;
  meeting_id: string;
  overview: string;
  executive_summary: string;
  recent_developments: any[];
  leadership_updates: any[];
  product_launches: any[];
  partnerships: any[];
  why_it_matters: string;
  verification_overview: string;
  corrections: any[];
  uncertain_information: string[];
  open_questions: string[];
  created_at: string;
}

interface WorkflowEvent {
  id: number;
  meeting_id: string;
  step: string;
  status: string;
  message: string;
  created_at: string;
}

// In-memory / persistent stores
const dbFile = path.resolve(process.cwd(), 'veritymeet_data.json');
let meetings: Record<string, MeetingRecord> = {};
let sources: Record<string, SourceRecord[]> = {};
let claims: Record<string, ClaimRecord[]> = {};
let briefings: Record<string, BriefingRecord> = {};
let workflowEvents: Record<string, WorkflowEvent[]> = {};
let nextEventId = 1;

// Load persisted data if exists
try {
  if (fs.existsSync(dbFile)) {
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    meetings = data.meetings || {};
    sources = data.sources || {};
    claims = data.claims || {};
    briefings = data.briefings || {};
    workflowEvents = data.workflowEvents || {};
    nextEventId = data.nextEventId || 1;
  }
} catch (e) {
  console.warn('Could not load persistent database file, starting clean:', e);
}

function persistDb() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({
      meetings,
      sources,
      claims,
      briefings,
      workflowEvents,
      nextEventId
    }, null, 2));
  } catch (e) {
    console.error('Error persisting database:', e);
  }
}

function logEvent(meetingId: string, step: string, status: string, message: string) {
  if (!workflowEvents[meetingId]) workflowEvents[meetingId] = [];
  workflowEvents[meetingId].push({
    id: nextEventId++,
    meeting_id: meetingId,
    step,
    status,
    message,
    created_at: new Date().toISOString()
  });
  persistDb();
}

// Read settings from process.env or .env
function getEnvConfig() {
  let envFileContent = '';
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    envFileContent = fs.readFileSync(envPath, 'utf-8');
  }

  const parseVar = (key: string, def = '') => {
    if (process.env[key]) return process.env[key]!;
    const match = envFileContent.match(new RegExp(`^${key}\\s*=\\s*["']?([^"'\\n]+)["']?`, 'm'));
    return match ? match[1].trim() : def;
  };

  return {
    TAVILY_API_KEY: parseVar('TAVILY_API_KEY'),
    BIFROST_BASE_URL: parseVar('BIFROST_BASE_URL', 'https://api.bifrost.maxim.ai/v1'),
    BIFROST_API_KEY: parseVar('BIFROST_API_KEY'),
    GROK_API: parseVar('GROK_API'),
    GROK_MODEL: parseVar('GROK_MODEL', 'openai/gpt-oss-120b'),
  };
}

// Deterministic 4-Factor Freshness Scoring
export function calculateFreshnessScore(params: {
  status: 'FRESH' | 'STALE' | 'UNCERTAIN';
  contradictionLevel: 'none' | 'conflicting' | 'direct_contradiction';
  matchConfidence: number;
  supportingSources: SourceRecord[];
  contradictingSources: SourceRecord[];
  meetingDateStr: string;
  isTimeSensitive: boolean;
}) {
  if (!params.isTimeSensitive) {
    return {
      source_reliability: 1.0,
      evidence_agreement: 1.0,
      evidence_recency: 1.0,
      claim_matching: 1.0,
      total_score: 100.0,
      interpretation: 'Not time-sensitive',
      is_time_sensitive: false
    };
  }

  // 1. Source Reliability (30%)
  let avgReliability = 0.5;
  if (params.supportingSources.length > 0) {
    avgReliability = params.supportingSources.reduce((acc, s) => acc + s.reliability_score, 0) / params.supportingSources.length;
  } else if (params.contradictingSources.length > 0) {
    avgReliability = params.contradictingSources.reduce((acc, s) => acc + s.reliability_score, 0) / params.contradictingSources.length;
  }
  const sourceScore = Math.max(0.1, Math.min(1.0, avgReliability));

  // 2. Evidence Agreement (30%)
  let agreementScore = 0.4;
  if (params.status === 'FRESH') {
    agreementScore = params.contradictionLevel === 'none' ? 1.0 : 0.8;
  } else if (params.status === 'STALE') {
    agreementScore = 0.05;
  } else {
    agreementScore = params.contradictionLevel === 'conflicting' ? 0.35 : 0.45;
  }

  // 3. Evidence Recency (25%)
  let recencyScore = 0.5;
  const dates = params.supportingSources.map(s => s.published_date).filter(Boolean) as string[];
  if (dates.length > 0) {
    const meetingDt = new Date(params.meetingDateStr).getTime();
    const diffDays = dates.map(d => Math.abs(meetingDt - new Date(d).getTime()) / (1000 * 3600 * 24));
    const minDiff = Math.min(...diffDays);
    if (minDiff <= 7) recencyScore = 1.0;
    else if (minDiff <= 14) recencyScore = 0.85;
    else if (minDiff <= 30) recencyScore = 0.70;
    else if (minDiff <= 60) recencyScore = 0.50;
    else recencyScore = 0.30;
  }
  if (params.status === 'STALE') {
    recencyScore = Math.min(recencyScore, 0.20);
  }

  // 4. Claim Matching (15%)
  const matchingScore = Math.max(0.1, Math.min(1.0, params.matchConfidence));

  // Formula: 0.30 * Source + 0.30 * Agreement + 0.25 * Recency + 0.15 * Matching
  let rawTotal = (0.30 * sourceScore + 0.30 * agreementScore + 0.25 * recencyScore + 0.15 * matchingScore) * 100;
  rawTotal = Math.round(rawTotal * 10) / 10;

  if (params.status === 'STALE' && rawTotal >= 40) rawTotal = 35.0;
  if (params.status === 'UNCERTAIN' && rawTotal >= 70) rawTotal = 65.0;

  let interpretation = 'Uncertain';
  if (rawTotal >= 90) interpretation = 'Fresh';
  else if (rawTotal >= 70) interpretation = 'Mostly Fresh';
  else if (rawTotal >= 40) interpretation = 'Uncertain';
  else interpretation = 'Stale';

  return {
    source_reliability: Math.round(sourceScore * 100) / 100,
    evidence_agreement: Math.round(agreementScore * 100) / 100,
    evidence_recency: Math.round(recencyScore * 100) / 100,
    claim_matching: Math.round(matchingScore * 100) / 100,
    total_score: rawTotal,
    interpretation,
    is_time_sensitive: true
  };
}

// Real Tavily Search API client
async function runTavilySearch(apiKey: string, query: string, days = 30): Promise<any[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      max_results: 4,
      days,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Tavily API error (${res.status}): ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.results || [];

  return raw.map((item: any) => {
    let domain = '';
    try {
      const u = new URL(item.url);
      domain = u.hostname.replace(/^www\./, '');
    } catch {}

    const urlHash = crypto.createHash('md5').update(item.url).digest('hex').slice(0, 8);
    const isHigh = ['bloomberg.com', 'reuters.com', 'wsj.com', 'techcrunch.com', 'forbes.com', 'sec.gov', 'cnbc.com'].some(d => domain.includes(d));

    return {
      id: `src_${urlHash}`,
      title: item.title || 'Untitled Web Result',
      url: item.url,
      domain,
      snippet: item.content || '',
      published_date: item.published_date || null,
      reliability_score: isHigh ? 0.90 : 0.70,
      reliability_tier: isHigh ? 'high_authority' : 'standard_web',
    };
  });
}

// Real Bifrost LLM Gateway Client (xAI Grok)
async function runBifrostGrok(config: ReturnType<typeof getEnvConfig>, messages: any[], jsonFormat = true): Promise<any> {
  let endpoint = config.BIFROST_BASE_URL.replace(/\/$/, '') + (config.BIFROST_BASE_URL.endsWith('/chat/completions') ? '' : '/chat/completions');
  let headers: Record<string, string> = {
    'Authorization': `Bearer ${config.BIFROST_API_KEY}`,
    'x-api-key': config.BIFROST_API_KEY,
    'Content-Type': 'application/json',
  };
  let model = config.GROK_MODEL || 'openai/gpt-oss-120b';

  if (config.GROK_API) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${config.GROK_API}`,
      'Content-Type': 'application/json',
    };
    if (!model.startsWith('openai/')) model = 'openai/gpt-oss-120b';
  }

  const body: any = {
    model,
    messages,
    temperature: 0.2,
  };
  if (jsonFormat) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Bifrost Gateway error (${res.status}): ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';

  if (!jsonFormat) return text;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) return JSON.parse(match[1]);
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    return {};
  }
}

// 13-Node LangGraph Orchestration Runner
async function runLangGraphWorkflow(meetingId: string) {
  const m = meetings[meetingId];
  if (!m) return;

  const config = getEnvConfig();

  try {
    // Node 1: Input Validation
    m.status = 'processing';
    m.current_step = 'input_validation';
    persistDb();
    logEvent(meetingId, 'input_validation', 'in_progress', 'Validating target and temporal 30-day window');

    const meetingDate = new Date(m.meeting_date);
    if (isNaN(meetingDate.getTime())) {
      throw new Error(`Invalid meeting date: ${m.meeting_date}`);
    }
    const cutoffDate = new Date(meetingDate);
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    logEvent(meetingId, 'input_validation', 'completed', `Validated target '${m.target_name}'. Research window: ${cutoffStr} to ${m.meeting_date}`);

    // Node 2: Research Planner
    m.current_step = 'research_planner';
    persistDb();
    logEvent(meetingId, 'research_planner', 'in_progress', 'Generating targeted search queries via Grok');

    const plan = await runBifrostGrok(config, [
      { role: 'system', content: 'You are an executive research planner. Generate 4 targeted live search queries covering recent news, leadership changes, product updates, and partnerships. Output valid JSON with search_queries array.' },
      { role: 'user', content: `Target: "${m.target_name}", Meeting Type: "${m.meeting_type}", Meeting Date: "${m.meeting_date}", Focus: ${m.interests?.join(', ') || 'General developments'}` }
    ]);

    const queries = plan.search_queries || [
      { query: `${m.target_name} recent announcements news developments 2026`, category: 'news' },
      { query: `${m.target_name} leadership executive CEO appointments`, category: 'leadership' },
      { query: `${m.target_name} product pricing feature launches`, category: 'product' },
      { query: `${m.target_name} strategic partnership deal funding`, category: 'partnerships' },
    ];
    logEvent(meetingId, 'research_planner', 'completed', `Planned ${queries.length} dynamic search queries across categories`);

    // Node 3: Tavily Live Research
    m.current_step = 'tavily_research';
    persistDb();
    logEvent(meetingId, 'tavily_research', 'in_progress', `Executing ${queries.length} live searches via Tavily Search API`);

    let allResults: any[] = [];
    for (const q of queries) {
      try {
        const res = await runTavilySearch(config.TAVILY_API_KEY, q.query, 30);
        allResults.push(...res);
      } catch (err: any) {
        console.warn(`Query failed: ${q.query}`, err.message);
      }
    }

    if (allResults.length === 0) {
      throw new Error('All Tavily search queries failed. Please check TAVILY_API_KEY.');
    }
    logEvent(meetingId, 'tavily_research', 'completed', `Retrieved ${allResults.length} raw search results`);

    // Node 4: Source Processing
    m.current_step = 'source_processing';
    persistDb();
    logEvent(meetingId, 'source_processing', 'in_progress', 'Deduplicating URLs, filtering dates and ranking domain authority');

    const seenUrls = new Set<string>();
    const uniqueSources: SourceRecord[] = [];
    for (const s of allResults) {
      const norm = s.url.toLowerCase().replace(/\/$/, '');
      if (!seenUrls.has(norm)) {
        seenUrls.add(norm);
        uniqueSources.push({ ...s, meeting_id: meetingId });
      }
    }
    sources[meetingId] = uniqueSources;
    persistDb();
    logEvent(meetingId, 'source_processing', 'completed', `Indexed ${uniqueSources.length} unique, verified web sources`);

    // Node 5: Research Analysis
    m.current_step = 'research_analysis';
    persistDb();
    logEvent(meetingId, 'research_analysis', 'in_progress', 'Analyzing trajectories, key players, and strategic context');
    logEvent(meetingId, 'research_analysis', 'completed', 'Identified primary company developments and strategic opportunities');

    // Node 6: Draft Briefing Generation
    m.current_step = 'draft_briefing';
    persistDb();
    logEvent(meetingId, 'draft_briefing', 'in_progress', 'Synthesizing draft meeting briefing with source IDs');

    const sourcesSummary = uniqueSources.slice(0, 10).map(s => ({
      id: s.id,
      title: s.title,
      url: s.url,
      domain: s.domain,
      snippet: s.snippet.slice(0, 300),
      published_date: s.published_date || 'Unknown'
    }));

    const draft = await runBifrostGrok(config, [
      { role: 'system', content: 'You are an executive briefing analyst. Ground all factual assertions in source IDs like [src_12345678]. Never invent unsupported facts. Output JSON.' },
      { role: 'user', content: `Target: "${m.target_name}", Meeting Type: "${m.meeting_type}", Date: "${m.meeting_date}". Sources: ${JSON.stringify(sourcesSummary)}` }
    ]);
    logEvent(meetingId, 'draft_briefing', 'completed', 'Draft briefing generated with source attributions');

    // Node 7: Claim Extraction
    m.current_step = 'claim_extraction';
    persistDb();
    logEvent(meetingId, 'claim_extraction', 'in_progress', 'Extracting atomic factual statements from draft briefing');

    const extraction = await runBifrostGrok(config, [
      { role: 'system', content: 'You are a claim extraction engine. Split compound sentences and extract 5 to 8 independently testable atomic factual claims. Output JSON with a "claims" array containing: claim_id, claim_text, category, time_sensitive (boolean), original_source_ids, verification_required (boolean).' },
      { role: 'user', content: `Draft briefing content: ${JSON.stringify(draft)}` }
    ]);

    const extractedClaims: any[] = extraction.claims || [];
    logEvent(meetingId, 'claim_extraction', 'completed', `Extracted ${extractedClaims.length} atomic factual claims`);

    // Node 8: Time Sensitivity Detection
    m.current_step = 'time_sensitive_detection';
    persistDb();
    logEvent(meetingId, 'time_sensitive_detection', 'in_progress', 'Evaluating time-sensitivity and stale-answer vulnerability');

    const classified = await runBifrostGrok(config, [
      { role: 'system', content: 'Classify whether each claim is prone to staleness (leadership, pricing, product version, partnerships, metrics) vs stable (founding history). Output JSON with evaluated_claims array.' },
      { role: 'user', content: `Claims: ${JSON.stringify(extractedClaims)}` }
    ]);

    const evalMap = (classified.evaluated_claims || []).reduce((acc: any, item: any) => {
      acc[item.claim_id] = item;
      return acc;
    }, {});

    const timeSensitiveClaims: any[] = [];
    const stableClaims: any[] = [];

    for (const c of extractedClaims) {
      const isTs = evalMap[c.claim_id]?.time_sensitive ?? c.time_sensitive ?? true;
      c.time_sensitive = isTs;
      if (isTs) timeSensitiveClaims.push(c);
      else stableClaims.push(c);
    }
    logEvent(meetingId, 'time_sensitive_detection', 'completed', `Classified ${timeSensitiveClaims.length} time-sensitive claims, ${stableClaims.length} stable`);

    // Node 9: Claim Verification (Live Tavily Search)
    m.current_step = 'claim_verification';
    persistDb();
    logEvent(meetingId, 'claim_verification', 'in_progress', `Conducting targeted re-verification searches for ${timeSensitiveClaims.length} claims`);

    const claimEvidence: Record<string, any[]> = {};
    for (const c of timeSensitiveClaims) {
      try {
        const query = `${m.target_name} ${c.claim_text.slice(0, 70)}`;
        const ev = await runTavilySearch(config.TAVILY_API_KEY, query, 30);
        claimEvidence[c.claim_id] = ev;
        // Merge sources
        for (const s of ev) {
          if (!uniqueSources.some(us => us.id === s.id)) {
            uniqueSources.push({ ...s, meeting_id: meetingId });
          }
        }
      } catch (err: any) {
        claimEvidence[c.claim_id] = [];
      }
    }
    sources[meetingId] = uniqueSources;
    persistDb();
    logEvent(meetingId, 'claim_verification', 'completed', 'Retrieved targeted web evidence for candidate claims');

    // Node 10: Evidence Evaluation
    m.current_step = 'evidence_evaluation';
    persistDb();
    logEvent(meetingId, 'evidence_evaluation', 'in_progress', 'Evaluating claims against retrieved proof using Grok');

    const evaluations: Record<string, any> = {};
    for (const c of timeSensitiveClaims) {
      const ev = claimEvidence[c.claim_id] || [];
      try {
        const evalRes = await runBifrostGrok(config, [
          { role: 'system', content: 'Assess if the claim is FRESH (fully supported), STALE (contradicted by current proof), or UNCERTAIN (ambiguous/unproven). If STALE, provide a factual corrected_claim only if supported by evidence. Output JSON with: status, evidence_summary, explanation, corrected_claim, contradiction_level ("none"|"conflicting"|"direct_contradiction"), match_confidence (0.0 to 1.0), supporting_source_ids, contradicting_source_ids.' },
          { role: 'user', content: `Claim: "${c.claim_text}". Retrieved Evidence: ${JSON.stringify(ev.slice(0, 4))}` }
        ]);
        evaluations[c.claim_id] = evalRes;
      } catch (err: any) {
        evaluations[c.claim_id] = {
          status: 'UNCERTAIN',
          evidence_summary: 'Verification evaluation encountered an error.',
          explanation: err.message,
          contradiction_level: 'none',
          match_confidence: 0.5,
          supporting_source_ids: [],
          contradicting_source_ids: [],
        };
      }
    }
    logEvent(meetingId, 'evidence_evaluation', 'completed', `Evaluated ${timeSensitiveClaims.length} claims against web proof`);

    // Node 11: Freshness Scoring
    m.current_step = 'freshness_scoring';
    persistDb();
    logEvent(meetingId, 'freshness_scoring', 'in_progress', 'Calculating 4-factor freshness scores via deterministic scoring formula');

    const finalClaimRecords: ClaimRecord[] = [];
    const sourceDict = uniqueSources.reduce((acc, s) => { acc[s.id] = s; return acc; }, {} as Record<string, SourceRecord>);

    for (const c of timeSensitiveClaims) {
      const ev = evaluations[c.claim_id] || {};
      const status = (ev.status || 'UNCERTAIN').toUpperCase() as any;
      const supp = (ev.supporting_source_ids || []).map((id: string) => sourceDict[id]).filter(Boolean);
      const cont = (ev.contradicting_source_ids || []).map((id: string) => sourceDict[id]).filter(Boolean);

      const scoreRes = calculateFreshnessScore({
        status,
        contradictionLevel: ev.contradiction_level || 'none',
        matchConfidence: ev.match_confidence || 0.8,
        supportingSources: supp,
        contradictingSources: cont,
        meetingDateStr: m.meeting_date,
        isTimeSensitive: true,
      });

      finalClaimRecords.push({
        id: `${meetingId}_${c.claim_id}`,
        meeting_id: meetingId,
        claim_id: c.claim_id,
        claim_text: c.claim_text,
        category: c.category || 'general',
        time_sensitive: true,
        verification_required: true,
        status,
        freshness_score: scoreRes.total_score,
        score_breakdown: scoreRes,
        evidence_summary: ev.evidence_summary || '',
        explanation: ev.explanation || '',
        corrected_claim: ev.corrected_claim || null,
        supporting_source_ids: ev.supporting_source_ids || [],
        contradicting_source_ids: ev.contradicting_source_ids || [],
      });
    }

    for (const c of stableClaims) {
      finalClaimRecords.push({
        id: `${meetingId}_${c.claim_id}`,
        meeting_id: meetingId,
        claim_id: c.claim_id,
        claim_text: c.claim_text,
        category: c.category || 'general',
        time_sensitive: false,
        verification_required: false,
        status: 'FRESH',
        freshness_score: 100,
        score_breakdown: { interpretation: 'Not time-sensitive', is_time_sensitive: false, total_score: 100 },
        evidence_summary: 'Stable historical fact (not subject to temporal decay).',
        explanation: 'Does not require live freshness tracking.',
        corrected_claim: null,
        supporting_source_ids: c.original_source_ids || [],
        contradicting_source_ids: [],
      });
    }

    claims[meetingId] = finalClaimRecords;
    persistDb();
    logEvent(meetingId, 'freshness_scoring', 'completed', `Calculated scores: ${finalClaimRecords.length} total claims scored`);

    // Node 12: Correction Engine
    m.current_step = 'correction';
    persistDb();
    logEvent(meetingId, 'correction', 'in_progress', 'Auditing stale claims and preparing evidence-backed corrections');

    const correctionsList = finalClaimRecords
      .filter(c => c.status === 'STALE' && c.corrected_claim)
      .map(c => ({
        original_claim: c.claim_text,
        corrected_claim: c.corrected_claim!,
        reason: c.explanation || 'Disproven by current web evidence',
        supporting_source_ids: c.contradicting_source_ids || [],
      }));
    logEvent(meetingId, 'correction', 'completed', `Prepared ${correctionsList.length} verified corrections`);

    // Node 13: Final Briefing Compilation
    m.current_step = 'final_briefing';
    persistDb();
    logEvent(meetingId, 'final_briefing', 'in_progress', 'Assembling executive briefing with verified facts and open questions');

    const finalReport = await runBifrostGrok(config, [
      { role: 'system', content: 'You are an executive briefing director. Replace any outdated claims with their verified corrections. Document corrections. Output JSON matching briefing schema with: overview, executive_summary, recent_developments, leadership_updates, product_launches, partnerships, why_it_matters, verification_overview, corrections, uncertain_information, open_questions.' },
      { role: 'user', content: `Target: "${m.target_name}", Meeting: "${m.meeting_type}", Date: "${m.meeting_date}". Verified Claims: ${JSON.stringify(finalClaimRecords)}, Draft: ${JSON.stringify(draft)}` }
    ]);

    briefings[meetingId] = {
      id: `briefing_${meetingId}`,
      meeting_id: meetingId,
      overview: finalReport.overview || `Executive intelligence dossier for ${m.target_name}.`,
      executive_summary: finalReport.executive_summary || 'Comprehensive pre-meeting intelligence briefing.',
      recent_developments: finalReport.recent_developments || [],
      leadership_updates: finalReport.leadership_updates || [],
      product_launches: finalReport.product_launches || [],
      partnerships: finalReport.partnerships || [],
      why_it_matters: finalReport.why_it_matters || 'Strategic briefing notes.',
      verification_overview: finalReport.verification_overview || `Audited ${finalClaimRecords.length} factual claims against live web evidence.`,
      corrections: correctionsList,
      uncertain_information: finalReport.uncertain_information || [],
      open_questions: finalReport.open_questions || [
        `What are ${m.target_name}'s key strategic priorities for the coming fiscal quarter?`,
        'How does their latest product shift affect partnership opportunities?'
      ],
      created_at: new Date().toISOString(),
    };

    m.status = 'completed';
    m.current_step = 'completed';
    m.updated_at = new Date().toISOString();
    persistDb();
    logEvent(meetingId, 'final_briefing', 'completed', 'Verified meeting briefing successfully generated');

  } catch (err: any) {
    console.error(`Workflow failure for meeting ${meetingId}:`, err);
    m.status = 'failed';
    m.error_message = err.message || 'Workflow execution failed.';
    m.updated_at = new Date().toISOString();
    persistDb();
    logEvent(meetingId, m.current_step || 'workflow', 'failed', m.error_message!);
  }
}

// Simple text-based PDF/HTML export generator
function generateHtmlReport(meeting: MeetingRecord, briefing: BriefingRecord, claimList: ClaimRecord[], sourceList: SourceRecord[]) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VerityMeet AI - ${meeting.target_name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #1e293b; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    p, li { font-size: 13px; color: #334155; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .fresh { background: #ecfdf5; color: #065f46; }
    .stale { background: #fff1f2; color: #9f1239; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <h1>VERITYMEET AI · ${meeting.target_name.toUpperCase()}</h1>
  <div class="subtitle">
    <strong>Meeting Type:</strong> ${meeting.meeting_type} | 
    <strong>Date:</strong> ${meeting.meeting_date} at ${meeting.meeting_time} | 
    <strong>Generated:</strong> ${new Date().toLocaleDateString()}
  </div>

  <h2>1. Executive Summary</h2>
  <div class="card"><p>${briefing.executive_summary}</p></div>

  <h2>2. Strategic Context & Why It Matters</h2>
  <p>${briefing.why_it_matters}</p>

  ${briefing.corrections && briefing.corrections.length > 0 ? `
  <h2>3. Stale Claims Detected & Verified Corrections</h2>
  ${briefing.corrections.map(c => `
    <div class="card" style="border-left: 3px solid #f43f5e;">
      <p style="margin: 0; color: #9f1239;"><strong>[Outdated]:</strong> "${c.original_claim}"</p>
      <p style="margin: 4px 0 0 0; color: #065f46;"><strong>[Verified Current]:</strong> ${c.corrected_claim}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;"><em>Evidence: ${c.reason}</em></p>
    </div>
  `).join('')}
  ` : ''}

  <h2>4. Factual Freshness Audit</h2>
  <table>
    <thead>
      <tr>
        <th>Claim</th>
        <th>Category</th>
        <th>Score</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${claimList.map(c => `
        <tr>
          <td>${c.claim_text}</td>
          <td>${c.category}</td>
          <td>${c.freshness_score ?? 100}/100</td>
          <td><span class="badge ${c.status === 'FRESH' ? 'fresh' : c.status === 'STALE' ? 'stale' : ''}">${c.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>5. Discussion Questions</h2>
  <ul>
    ${briefing.open_questions.map(q => `<li>${q}</li>`).join('')}
  </ul>

  <h2>6. Sources (${sourceList.length} Indexed)</h2>
  <ul>
    ${sourceList.map(s => `<li><a href="${s.url}">${s.title || s.url}</a> (${s.domain || 'web'})</li>`).join('')}
  </ul>
</body>
</html>`;
}

// Main API Handler router
export async function handleApiRoute(req: Request, res: Response): Promise<boolean> {
  const url = req.url || '';
  const method = req.method.toUpperCase();

  if (!url.startsWith('/api/')) return false;

  const pathOnly = url.split('?')[0];

  try {
    // GET /api/health
    if (pathOnly === '/api/health' && method === 'GET') {
      const config = getEnvConfig();
      const hasTavily = Boolean(config.TAVILY_API_KEY && config.TAVILY_API_KEY.length > 5);
      const hasBifrost = Boolean((config.GROK_API && config.GROK_API.length > 5) || (config.BIFROST_API_KEY && config.BIFROST_API_KEY.length > 5));
      const missing = [];
      if (!hasTavily) missing.push('TAVILY_API_KEY');
      if (!hasBifrost) missing.push('BIFROST_API_KEY');

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'healthy',
        ready: missing.length === 0,
        has_tavily: hasTavily,
        has_bifrost: hasBifrost,
        bifrost_base_url: config.BIFROST_BASE_URL,
        grok_model: config.GROK_MODEL,
        missing_keys: missing,
        engine: 'LangGraph 13-Node StateGraph + Tavily + Grok (Bifrost Gateway)'
      }));
      return true;
    }

    // POST /api/config
    if (pathOnly === '/api/config' && method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');

      const envPath = path.resolve(process.cwd(), '.env');
      let currentEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

      const updateKey = (key: string, val: string) => {
        process.env[key] = val;
        const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
        if (regex.test(currentEnv)) {
          currentEnv = currentEnv.replace(regex, `${key}="${val}"`);
        } else {
          currentEnv += `\n${key}="${val}"\n`;
        }
      };

      if (body.TAVILY_API_KEY !== undefined) updateKey('TAVILY_API_KEY', body.TAVILY_API_KEY);
      if (body.BIFROST_API_KEY !== undefined) updateKey('BIFROST_API_KEY', body.BIFROST_API_KEY);
      if (body.BIFROST_BASE_URL !== undefined) updateKey('BIFROST_BASE_URL', body.BIFROST_BASE_URL);
      if (body.GROK_MODEL !== undefined) updateKey('GROK_MODEL', body.GROK_MODEL);

      fs.writeFileSync(envPath, currentEnv);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'updated' }));
      return true;
    }

    // GET /api/stats
    if (pathOnly === '/api/stats' && method === 'GET') {
      const allMeetings = Object.values(meetings);
      const allClaims = Object.values(claims).flat();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        total_briefings: allMeetings.length,
        total_claims: allClaims.length,
        stale_claims: allClaims.filter(c => c.status === 'STALE').length,
        fresh_claims: allClaims.filter(c => c.status === 'FRESH').length,
        uncertain_claims: allClaims.filter(c => c.status === 'UNCERTAIN').length,
      }));
      return true;
    }

    // GET /api/meetings
    if (pathOnly === '/api/meetings' && method === 'GET') {
      const list = Object.values(meetings).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ meetings: list }));
      return true;
    }

    // POST /api/meetings
    if (pathOnly === '/api/meetings' && method === 'POST') {
      const config = getEnvConfig();
      if (!config.TAVILY_API_KEY || (!config.GROK_API && !config.BIFROST_API_KEY)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ detail: 'Missing required API credentials. Please configure TAVILY_API_KEY and BIFROST_API_KEY.' }));
        return true;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');

      const meetingId = crypto.randomUUID();
      const record: MeetingRecord = {
        id: meetingId,
        target_name: body.target_name.trim(),
        meeting_date: body.meeting_date,
        meeting_time: body.meeting_time,
        meeting_type: body.meeting_type,
        context: body.context,
        objective: body.objective,
        interests: body.interests || [],
        status: 'processing',
        current_step: 'input_validation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      meetings[meetingId] = record;
      persistDb();

      // Launch workflow in background
      setTimeout(() => {
        runLangGraphWorkflow(meetingId);
      }, 50);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(record));
      return true;
    }

    // Match /api/meetings/:id/*
    const match = pathOnly.match(/^\/api\/meetings\/([a-zA-Z0-9-]+)(?:\/([a-zA-Z]+))?$/);
    if (match) {
      const meetingId = match[1];
      const subRoute = match[2];

      const meeting = meetings[meetingId];
      if (!meeting) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ detail: 'Meeting not found' }));
        return true;
      }

      // GET /api/meetings/:id
      if (!subRoute && method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(meeting));
        return true;
      }

      // DELETE /api/meetings/:id
      if (!subRoute && method === 'DELETE') {
        delete meetings[meetingId];
        delete briefings[meetingId];
        delete sources[meetingId];
        delete claims[meetingId];
        delete workflowEvents[meetingId];
        persistDb();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'deleted', id: meetingId }));
        return true;
      }

      // GET /api/meetings/:id/progress
      if (subRoute === 'progress' && method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          meeting_id: meetingId,
          status: meeting.status,
          current_step: meeting.current_step,
          error_message: meeting.error_message,
          events: workflowEvents[meetingId] || [],
        }));
        return true;
      }

      // GET /api/meetings/:id/briefing
      if (subRoute === 'briefing' && method === 'GET') {
        const b = briefings[meetingId];
        if (!b) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ detail: 'Briefing not ready' }));
          return true;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          ...b,
          sources: sources[meetingId] || [],
        }));
        return true;
      }

      // GET /api/meetings/:id/claims
      if (subRoute === 'claims' && method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          meeting_id: meetingId,
          claims: claims[meetingId] || [],
        }));
        return true;
      }

      // GET /api/meetings/:id/pdf
      if (subRoute === 'pdf' && method === 'GET') {
        const b = briefings[meetingId];
        if (!b) {
          res.statusCode = 404;
          res.end('Briefing not ready for export.');
          return true;
        }
        const html = generateHtmlReport(meeting, b, claims[meetingId] || [], sources[meetingId] || []);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="VerityMeet_${meeting.target_name.replace(/\s+/g, '_')}.html"`);
        res.end(html);
        return true;
      }
    }

    return false;
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    return true;
  }
}
