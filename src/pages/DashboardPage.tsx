import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Calendar, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DashboardStats, Meeting } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  meetings: Meeting[];
  onNewBriefing: () => void;
  onOpenMeeting: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  meetings,
  onNewBriefing,
  onOpenMeeting,
}) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Welcome & Quick Launch */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Meeting Preparation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            VerityMeet AI Intelligence Console
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Live web research powered by Tavily Search and LangGraph orchestration. Automatically extracts factual claims, detects outdated answers, calculates 4-factor freshness scores, and audits facts with source attribution.
          </p>
        </div>
        <button
          onClick={onNewBriefing}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Prepare Meeting Briefing</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Generated Briefings</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats?.total_briefings ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live research dossiers</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Verified Claims</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats?.total_claims ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Atomic factual statements</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Stale Claims Detected</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">
            {stats?.stale_claims ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Contradicted & corrected</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Fresh Facts Verified</span>
            <CheckCircle className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {stats?.fresh_claims ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Current web evidence backed</p>
        </div>
      </div>

      {/* Recent Briefings Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Briefings</h3>
            <p className="text-xs text-slate-500">Live operational records from local database</p>
          </div>
          <button
            onClick={onNewBriefing}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            <span>New Briefing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-slate-900">No meeting briefings generated yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Initiate your first pre-meeting intelligence briefing with live Tavily web research and stale-answer verification.
            </p>
            <button
              onClick={onNewBriefing}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Briefing</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {meetings.slice(0, 6).map((m) => (
              <div
                key={m.id}
                onClick={() => onOpenMeeting(m.id)}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {m.target_name}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{m.meeting_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Meeting: {m.meeting_date} at {m.meeting_time}</span>
                    <span aria-hidden="true">·</span>
                    <span>Created: {new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    m.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : m.status === 'failed'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
