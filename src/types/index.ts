export interface Meeting {
  id: string;
  target_name: string;
  meeting_title?: string;
  meeting_date: string;
  meeting_time: string;
  timezone?: string;
  duration?: number;
  meeting_type: string;
  meeting_mode?: string;
  meeting_location?: string;
  target_type?: 'Company' | 'Person' | 'Individual' | 'Both';
  company_name?: string;
  company_website?: string;
  person_name?: string;
  person_designation?: string;
  person_linkedin?: string;
  target_industry?: string;
  target_market?: string;
  user_name?: string;
  user_company?: string;
  user_role?: string;
  user_website?: string;
  user_company_description?: string;
  user_offering?: string;
  context?: string;
  objective?: string;
  desired_outcome?: string;
  discussion_topics?: string[];
  existing_questions?: string[];
  previous_relationship?: string;
  research_focus?: string[];
  custom_research_instructions?: string;
  research_period?: string;
  geographic_focus?: string;
  preferred_sources?: string[];
  excluded_topics?: string;
  briefing_depth?: string;
  output_language?: string;
  writing_style?: string;
  meeting_priority?: string;
  include_swot?: boolean;
  include_questions?: boolean;
  include_talking_points?: boolean;
  include_risk_analysis?: boolean;
  include_source_references?: boolean;
  include_fact_verification?: boolean;
  uploaded_documents?: Array<{
    name: string;
    size: number;
    type: string;
    textPreview?: string;
  }>;
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
  target_name?: string;
  meeting_type?: string;
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

export interface SWOTItem {
  point: string;
  evidence: string;
}

export interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

export interface Opportunity {
  title: string;
  why_it_exists: string;
  relevance: string;
  suggested_action: string;
  supporting_source_ids?: string[];
}

export interface Risk {
  title: string;
  issue: string;
  impact: string;
  clarification_question: string;
  supporting_source_ids?: string[];
}

export interface SmartQuestion {
  category: string;
  question: string;
  rationale: string;
}

export interface TalkingPoint {
  stage: string;
  point: string;
  notes?: string;
}

export interface MeetingStrategy {
  main_objective: string;
  recommended_approach: string;
  key_message: string;
  negotiation_considerations: string;
  desired_outcome: string;
  preparation_priorities: string[];
}

export interface FinalRecommendations {
  top_three_takeaways: string[];
  must_discuss: string;
  avoid_assuming: string;
  first_question_to_ask: string;
  next_immediate_step: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface Briefing {
  id?: string;
  meeting_id: string;
  overview: string;
  executive_summary: string;
  target_intelligence?: {
    background?: string;
    business_model?: string;
    main_products?: string;
    target_market?: string;
    competitive_landscape?: string;
  };
  recent_developments: Array<{
    title: string;
    date?: string;
    summary: string;
    impact?: string;
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
  swot?: SWOTData;
  opportunities?: Opportunity[];
  risks?: Risk[];
  smart_questions?: SmartQuestion[];
  talking_points?: TalkingPoint[];
  meeting_strategy?: MeetingStrategy;
  final_recommendations?: FinalRecommendations;
  preparation_checklist?: ChecklistItem[];
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

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

