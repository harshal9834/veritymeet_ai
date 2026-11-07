import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Plus, 
  FileText, 
  Activity, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Radio
} from 'lucide-react';
import { Meeting, WorkflowEvent } from '../types';
import { api } from '../services/api';

interface ProgressPageProps {
  meetingId: string;
  onComplete: () => void;
  onNewBriefing?: () => void;
}

export const WORKFLOW_STEPS = [
  { id: 'input_validation', label: 'Input Validation', desc: 'Verify target entity & 30-day temporal research window' },
  { id: 'research_planner', label: 'Research Planning', desc: 'Generate multi-category search queries via the configured LLM' },
  { id: 'tavily_research', label: 'Live Web Research', desc: 'Execute live web queries via Tavily Search API' },
  { id: 'source_processing', label: 'Source Processing', desc: 'Deduplicate URLs, filter dates & rank domain credibility' },
  { id: 'research_analysis', label: 'AI Intelligence Analysis', desc: 'Synthesize raw developments, leaders & milestones' },
  { id: 'draft_briefing', label: 'Draft Briefing Generation', desc: 'Draft initial briefing with source attributions' },
  { id: 'claim_extraction', label: 'Claim Extraction', desc: 'Extract atomic, testable factual statements' },
  { id: 'time_sensitive_detection', label: 'Stale-Answer Detection', desc: 'Identify claims subject to temporal decay' },
  { id: 'claim_verification', label: 'Claim Re-Verification', desc: 'Targeted live web searches for candidate claims' },
  { id: 'evidence_evaluation', label: 'Evidence Evaluation', desc: 'Compare claims against live web evidence' },
  { id: 'freshness_scoring', label: 'Freshness Scoring', desc: 'Calculate transparent 4-factor freshness scores (0–100)' },
  { id: 'correction', label: 'Correction Engine', desc: 'Replace stale facts with verified current evidence' },
  { id: 'final_briefing', label: 'Final Briefing Compilation', desc: 'Assemble executive-ready briefing with open questions' },
];

export const ProgressPage: React.FC<ProgressPageProps> = ({ meetingId, onComplete, onNewBriefing }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('input_validation');
  const [status, setStatus] = useState<string>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourcesCount, setSourcesCount] = useState<number>(0);
  const [claimsCount, setClaimsCount] = useState<number>(0);
  const [startTime] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Timer update for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time backend progress polling
  useEffect(() => {
    let isMounted = true;

    const fetchProgress = async () => {
      try {
        const m = await api.getMeeting(meetingId);
        if (!isMounted) return;
        setMeeting(m);
        setStatus(m.status);
        if (m.current_step) setCurrentStep(m.current_step);
        if (m.error_message) setErrorMessage(m.error_message);

        const prog = await api.getProgress(meetingId);
        if (!isMounted) return;
        setEvents(prog.events || []);
        if (typeof prog.sources_count === 'number') setSourcesCount(prog.sources_count);
        if (typeof prog.claims_count === 'number') setClaimsCount(prog.claims_count);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Error fetching progress');
        }
      }
    };

    fetchProgress();
    const interval = setInterval(() => {
      if (status !== 'completed' && status !== 'failed') {
        fetchProgress();
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [meetingId, status]);

  // Determine step status based strictly on backend state & event log
  const getStepStatus = (stepId: string) => {
    const stepIdx = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
    const currIdx = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

    if (status === 'completed') return 'completed';
    if (status === 'failed' && currentStep === stepId) return 'failed';

    const completedEvent = events.find(e => e.step === stepId && e.status === 'completed');
    if (completedEvent) return 'completed';

    const inProgressEvent = events.find(e => e.step === stepId && e.status === 'in_progress');
    if (inProgressEvent || currentStep === stepId) return 'in_progress';

    if (stepIdx < currIdx) return 'completed';
    return 'pending';
  };

  // Compute completed count and progress percentage
  const completedCount = useMemo(() => {
    if (status === 'completed') return WORKFLOW_STEPS.length;
    return WORKFLOW_STEPS.filter(s => getStepStatus(s.id) === 'completed').length;
  }, [events, currentStep, status]);

  const progressPercent = useMemo(() => {
    if (status === 'completed') return 100;
    const pct = Math.round((completedCount / WORKFLOW_STEPS.length) * 100);
    return Math.max(8, Math.min(100, pct));
  }, [completedCount, status]);

  // Elapsed time formatting
  const elapsedTimeStr = useMemo(() => {
    const diffSec = Math.floor((now - startTime) / 1000);
    if (diffSec < 60) return '< 1 min';
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  }, [now, startTime]);

  // Current active activity message
  const currentActivityMsg = useMemo(() => {
    if (status === 'completed') {
      return 'Meeting intelligence briefing successfully compiled with verified evidence.';
    }
    if (status === 'failed') {
      return errorMessage || 'Workflow halted due to execution error.';
    }
    const latestEvent = events.slice(-1)[0];
    if (latestEvent?.message) {
      return latestEvent.message;
    }
    const currentStepObj = WORKFLOW_STEPS.find(s => s.id === currentStep);
    return currentStepObj ? `${currentStepObj.desc}...` : 'Orchestrating research nodes...';
  }, [events, currentStep, status, errorMessage]);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const targetName = meeting?.target_name || 'Target Entity';

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800">
      
      {/* 1. RESEARCH HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#7C3AED] tracking-wide">
              Live LangGraph Orchestration
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight break-words">
            Researching: <span className="text-[#6D28D9]">{targetName}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[12px] text-slate-500 mt-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Meeting Type: <strong className="text-slate-700">{meeting?.meeting_type || 'Executive Briefing'}</strong></span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Date: <strong className="text-slate-700">{meeting?.meeting_date || '2026-11-10'} at {meeting?.meeting_time || '14:00'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Header Status & Action */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {status === 'completed' ? (
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all transform active:scale-95"
            >
              <span>View Verified Briefing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : status === 'failed' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Workflow Failed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E9D5FF] text-[#6D28D9] font-semibold text-xs shadow-xs max-w-full truncate">
              <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin shrink-0" />
              <span className="truncate">Executing: <code className="font-mono text-[11px] font-bold bg-[#FAF5FF] px-1.5 py-0.5 rounded">{currentStep}</code></span>
            </div>
          )}

          {onNewBriefing && (
            <button
              onClick={onNewBriefing}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Briefing</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Callout if Failed */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Workflow Execution Notice</h4>
            <p className="mt-0.5 font-mono text-[11px]">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2. TWO-COLUMN MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: 13-Node LangGraph Execution Pipeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7C3AED]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">
                13-Node LangGraph Execution Pipeline
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{status === 'completed' ? 'Completed' : 'Live Execution'}</span>
            </div>
          </div>

          {/* Vertical Pipeline Nodes List */}
          <div className="mt-6 relative">
            {/* Background connecting vertical line */}
            <div className="absolute left-[17px] top-4 bottom-6 w-0.5 bg-slate-100 -z-0" />

            <div className="space-y-3 relative z-10">
              {WORKFLOW_STEPS.map((step, idx) => {
                const stepState = getStepStatus(step.id);
                const isRunning = stepState === 'in_progress';
                const isDone = stepState === 'completed';
                const isFailed = stepState === 'failed';

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isRunning
                        ? 'bg-[#FAF5FF] border-[#DDD6FE] shadow-xs ring-1 ring-[#7C3AED]/20'
                        : isDone
                        ? 'bg-white border-slate-100 hover:border-slate-200'
                        : 'bg-white border-transparent opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      {/* Node Status Indicator Icon */}
                      <div className="shrink-0 flex items-center justify-center">
                        {isDone ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          </div>
                        ) : isRunning ? (
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#7C3AED] text-[#7C3AED] flex items-center justify-center shadow-xs">
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-[#7C3AED]" />
                          </div>
                        ) : isFailed ? (
                          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center">
                            <AlertCircle className="w-4.5 h-4.5" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center text-[12px] font-bold font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Node Labels */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-[13px] font-bold truncate ${
                            isRunning ? 'text-[#6D28D9]' : isDone ? 'text-slate-900' : 'text-slate-800'
                          }`}>
                            {idx + 1}. {step.label}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {/* Node Right Status Pill */}
                    <div className="shrink-0">
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      )}
                      {isRunning && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7C3AED] text-white text-[11px] font-bold shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Running...</span>
                        </span>
                      )}
                      {!isDone && !isRunning && !isFailed && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200/60">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pending</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Structured SaaS Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* A. Research Progress Card (Purple Gradient Header) */}
          <div className="rounded-2xl bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#6D28D9] text-white p-6 shadow-md shadow-purple-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base tracking-tight">Research Progress</h3>
              </div>
              <span className="text-xs font-bold font-mono text-purple-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                {completedCount} / {WORKFLOW_STEPS.length} Nodes
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-black/25 rounded-full h-3 p-0.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-300 to-white h-2 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-end">
                <span className="font-extrabold text-sm text-purple-100 font-mono">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* B. Research Metrics (3 Compact Cards) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Metric 1: Sources */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {sourcesCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Sources Found
              </div>
            </div>

            {/* Metric 2: Claims */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {claimsCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Claims Verified
              </div>
            </div>

            {/* Metric 3: Elapsed Time */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-center">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {elapsedTimeStr}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Elapsed Time
              </div>
            </div>
          </div>

          {/* C. Current Activity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Activity
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center gap-3 text-xs text-[#6D28D9] font-medium leading-relaxed">
              {status !== 'completed' && status !== 'failed' && (
                <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED] shrink-0" />
              )}
              {status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="flex-1">
                {currentActivityMsg}
              </span>
            </div>
          </div>

          {/* D. Execution Logs (Terminal-Style Inside White Card) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Execution Logs
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Live</span>
              </span>
            </div>

            {/* Dark Terminal Window */}
            <div className="rounded-xl bg-[#0F172A] p-4 font-mono text-[11px] leading-relaxed text-slate-300 max-h-72 overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
              {events.length === 0 ? (
                <div className="text-slate-500 italic">Initializing live execution stream...</div>
              ) : (
                events.map((ev, i) => {
                  const timeStr = ev.created_at ? ev.created_at.split('T')[1]?.slice(0, 8) || '00:00:00' : '00:00:00';
                  const isSuccess = ev.status === 'completed';
                  const isRun = ev.status === 'in_progress';
                  const isErr = ev.status === 'failed';

                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0">[{timeStr}]</span>
                      <span className="flex-1">
                        {ev.message || `Node: ${ev.step}`}
                        {isSuccess && (
                          <span className="ml-2 text-emerald-400 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 inline" /> Completed
                          </span>
                        )}
                        {isRun && (
                          <span className="ml-2 text-purple-400 font-bold inline-flex items-center gap-1">
                            <Loader2 className="w-3 h-3 inline animate-spin" /> Running
                          </span>
                        )}
                        {isErr && (
                          <span className="ml-2 text-rose-400 font-bold inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 inline" /> Failed
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
