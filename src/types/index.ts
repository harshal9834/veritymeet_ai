export interface Meeting {
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

export interface Source {
  id: string;
  meeting_id?: string;
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
  published_date?: string;
  reliability_score?: number;
  reliability_tier?: string;
}

export interface ScoreBreakdown {
  source_reliability: number;
  evidence_agreement: number;
  evidence_recency: number;
  claim_matching: number;
  total_score: number;
  interpretation: string;
  is_time_sensitive: boolean;
}

export interface Claim {
  id: string;
  meeting_id: string;
  claim_id: string;
  claim_text: string;
  category: string;
  time_sensitive: boolean;
  verification_required: boolean;
  status: 'FRESH' | 'STALE' | 'UNCERTAIN' | 'PENDING';
  freshness_score?: number;
  score_breakdown?: ScoreBreakdown;
  evidence_summary?: string;
  explanation?: string;
  corrected_claim?: string | null;
  supporting_source_ids?: string[];
  contradicting_source_ids?: string[];
  created_at?: string;
}

export interface Briefing {
  id?: string;
  meeting_id: string;
  overview: string;
  executive_summary: string;
  recent_developments: Array<{
    title: string;
    date?: string;
    summary: string;
    source_ids?: string[];
  }>;
  leadership_updates: Array<{
    name: string;
    role: string;
    background?: string;
    source_ids?: string[];
  }>;
  product_launches: Array<{
    name: string;
    status: string;
    summary: string;
    source_ids?: string[];
  }>;
  partnerships: Array<{
    partner: string;
    nature: string;
    date?: string;
    source_ids?: string[];
  }>;
  why_it_matters: string;
  verification_overview: string;
  corrections: Array<{
    original_claim: string;
    corrected_claim: string;
    reason: string;
    supporting_source_ids?: string[];
  }>;
  uncertain_information: string[];
  open_questions: string[];
  sources?: Source[];
  raw_briefing?: string;
  created_at: string;
}

export interface WorkflowEvent {
  id: number;
  meeting_id: string;
  step: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  ready: boolean;
  has_tavily: boolean;
  has_bifrost: boolean;
  bifrost_base_url: string;
  grok_model: string;
  missing_keys: string[];
  engine: string;
}

export interface DashboardStats {
  total_briefings: number;
  total_claims: number;
  stale_claims: number;
  fresh_claims: number;
  uncertain_claims: number;
}
