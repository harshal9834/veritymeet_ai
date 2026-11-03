import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Building, Compass, Sparkles, AlertCircle, Key, ArrowRight, Loader2 } from 'lucide-react';
import { SystemHealth } from '../types';
import { api } from '../services/api';

interface CreateBriefingPageProps {
  health: SystemHealth | null;
  onOpenSettings: () => void;
  onBriefingCreated: (meetingId: string) => void;
}

export const CreateBriefingPage: React.FC<CreateBriefingPageProps> = ({
  health,
  onOpenSettings,
  onBriefingCreated,
}) => {
  // Today's date in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [targetName, setTargetName] = useState('');
  const [meetingDate, setMeetingDate] = useState(todayStr);
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingType, setMeetingType] = useState('Executive Briefing');
  const [context, setContext] = useState('');
  const [objective, setObjective] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([
    'Recent leadership changes',
    'Product and pricing shifts',
    'Major strategic partnerships'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate 30-day research window
  const researchWindow = useMemo(() => {
    try {
      const targetDate = new Date(meetingDate);
      if (isNaN(targetDate.getTime())) return null;
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 30);
      return {
        start: startDate.toISOString().split('T')[0],
        end: meetingDate,
        isFuture: targetDate > new Date()
      };
    } catch {
      return null;
    }
  }, [meetingDate]);

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetName.trim()) {
      setErrorMessage('Please enter a target company or executive name.');
      return;
    }

    if (!meetingDate) {
      setErrorMessage('Please select a valid meeting date.');
      return;
    }

    if (!health?.ready) {
      setErrorMessage('External API credentials (Tavily & Bifrost) are required. Please configure them in the Settings panel.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await api.createMeeting({
        target_name: targetName.trim(),
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        meeting_type: meetingType,
        context: context.trim() || undefined,
        objective: objective.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined
      });

      onBriefingCreated(created.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize briefing research.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Prepare Meeting Intelligence</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure meeting parameters to initiate live web research, stale-answer detection, and evidence-backed briefing generation.
        </p>
      </div>

      {/* Credentials Warning if missing */}
      {!health?.ready && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">API Credentials Missing ({health?.missing_keys.join(', ')})</p>
              <p className="mt-0.5 opacity-90">
                To perform live web research and Grok analysis, provide your Tavily Search and Bifrost Gateway keys.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure Keys</span>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        {/* Target Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Target Company or Executive Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              placeholder="e.g. Anthropic, Stripe, Jensen Huang, Snowflake..."
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>
        </div>

        {/* Meeting Type & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Meeting Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
            >
              <option value="Executive Briefing">Executive Briefing</option>
              <option value="Sales Discovery">Sales Discovery</option>
              <option value="Investor Pitch">Investor Pitch</option>
              <option value="Partnership Discussion">Partnership Discussion</option>
              <option value="Due Diligence">Due Diligence</option>
              <option value="Board Review">Board Review</option>
              <option value="Client Quarterly Review">Client Quarterly Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Meeting Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Meeting Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="time"
                required
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 30-Day Research Window Display */}
        {researchWindow && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium text-slate-700">Calculated 30-Day Research Coverage Window:</span>
            <span className="font-mono text-indigo-600 font-semibold">
              {researchWindow.start} → {researchWindow.end}
              {researchWindow.isFuture && ' (Future meeting cutoff: up to present live web)'}
            </span>
          </div>
        )}

        {/* Optional Meeting Objective */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Primary Meeting Objective (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Explore enterprise multi-year platform integration, evaluate pricing tiers..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
          />
        </div>

        {/* Optional Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Internal Meeting Context / Historical Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Met their VP of Engineering 6 months ago. They were previously considering an on-premise migration."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
          />
        </div>

        {/* Research Focus Topics */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Specific Focus Topics / Research Areas
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add specific area (e.g. Recent pricing updates, executive turnover, Series B status)..."
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); }}}
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {interests.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(item)}
                  className="text-slate-400 hover:text-rose-600 text-[10px] font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Form Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Executes 13-node LangGraph orchestration with live Tavily research & Grok analysis.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Orchestration...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Launch Briefing Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
