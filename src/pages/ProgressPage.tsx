import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  FileSearch,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Meeting, WorkflowEvent } from '../types';
import { api } from '../services/api';

interface ProgressPageProps {
  meetingId: string;
  onComplete: () => void;
}

const WORKFLOW_STEPS = [
  { id: 'input_validation', label: 'Input Validation', desc: 'Verify target entity & 30-day temporal research window' },
  { id: 'research_planner', label: 'Research Planning', desc: 'Generate multi-category search queries via Grok' },
  { id: 'tavily_research', label: 'Live Web Research', desc: 'Execute live web queries via Tavily Search API' },
  { id: 'source_processing', label: 'Source Processing', desc: 'Deduplicate URLs, filter dates & rank domain credibility' },
  { id: 'research_analysis', label: 'AI Intelligence Analysis', desc: 'Synthesize raw developments, leaders & milestones' },
  { id: 'draft_briefing', label: 'Draft Briefing Generation', desc: 'Draft initial briefing with source attributions' },
  { id: 'claim_extraction', label: 'Claim Extraction', desc: 'Extract atomic, testable factual statements' },
  { id: 'time_sensitive_detection', label: 'Stale-Answer Detection', desc: 'Identify claims subject to temporal decay' },
  { id: 'claim_verification', label: 'Claim Re-Verification', desc: 'Targeted live web searches for candidate claims' },
  { id: 'evidence_evaluation', label: 'Evidence Evaluation', desc: 'Compare claims against live web evidence' },
  { id: 'freshness_scoring', label: 'Freshness Scoring', desc: 'Calculate transparent 4-factor freshness scores (0-100)' },
  { id: 'correction', label: 'Correction Engine', desc: 'Replace stale facts with verified current evidence' },
  { id: 'final_briefing', label: 'Final Briefing Compilation', desc: 'Assemble executive-ready briefing with open questions' },
];

export const ProgressPage: React.FC<ProgressPageProps> = ({ meetingId, onComplete }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('input_validation');
  const [status, setStatus] = useState<string>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setEvents(prog.events);

        if (m.status === 'completed') {
          // Keep showing complete briefly or allow user to jump
        }
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
    }, 1800);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [meetingId, status]);

  // Determine step status
  const getStepStatus = (stepId: string) => {
    const stepIdx = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
    const currIdx = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

    if (status === 'completed') return 'completed';
    if (status === 'failed' && currentStep === stepId) return 'failed';

    // Check specific event logs
    const completedEvent = events.find(e => e.step === stepId && e.status === 'completed');
    if (completedEvent) return 'completed';

    const inProgressEvent = events.find(e => e.step === stepId && e.status === 'in_progress');
    if (inProgressEvent || currentStep === stepId) return 'in_progress';

    if (stepIdx < currIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>Live LangGraph Orchestration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Researching: {meeting?.target_name || 'Target Entity'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Meeting Type: {meeting?.meeting_type} · Date: {meeting?.meeting_date} at {meeting?.meeting_time}
          </p>
        </div>

        <div>
          {status === 'completed' ? (
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <span>View Verified Briefing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : status === 'failed' ? (
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
              Workflow Failed
            </span>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Executing Node: {currentStep}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Callout if failed */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Workflow Execution Error</span>
          </div>
          <p className="pl-6 font-mono text-[11px]">{errorMessage}</p>
        </div>
      )}

      {/* Real-time Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-5">
          13-Node LangGraph Execution Pipeline
        </h3>

        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step, idx) => {
            const stepState = getStepStatus(step.id);
            const latestEvent = events.filter(e => e.step === step.id).slice(-1)[0];

            return (
              <div key={step.id} className="flex items-start gap-3.5">
                {/* Step indicator icon */}
                <div className="mt-0.5 shrink-0">
                  {stepState === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {stepState === 'in_progress' && (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  )}
                  {stepState === 'failed' && (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  {stepState === 'pending' && (
                    <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[9px] font-mono text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      stepState === 'in_progress' ? 'text-indigo-600 font-semibold' :
                      stepState === 'completed' ? 'text-slate-900' :
                      stepState === 'failed' ? 'text-rose-700 font-semibold' : 'text-slate-400'
                    }`}>
                      {idx + 1}. {step.label}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {stepState === 'completed' ? 'Done' : stepState === 'in_progress' ? 'Running...' : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>

                  {/* Real Live Message from Backend */}
                  {latestEvent?.message && (
                    <div className="mt-1 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/60 inline-block">
                      ↳ {latestEvent.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
