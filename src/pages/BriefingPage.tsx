import React, { useEffect, useState } from 'react';
import { 
  Briefing, 
  Meeting, 
  Source, 
  Claim 
} from '../types';
import { api } from '../services/api';
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Building, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  HelpCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  Award,
  Zap,
  ListTodo,
  FileText,
  Compass,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { ClaimCard } from '../components/ClaimCard';
import { FreshnessGauge } from '../components/FreshnessGauge';

interface BriefingPageProps {
  meetingId: string;
  onOpenVerification: () => void;
  onDeleteMeeting?: (meetingId: string) => void;
}

export const BriefingPage: React.FC<BriefingPageProps> = ({ meetingId, onOpenVerification, onDeleteMeeting }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [checklist, setChecklist] = useState<Array<{ id: string; task: string; completed: boolean }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [m, b, c] = await Promise.all([
          api.getMeeting(meetingId),
          api.getBriefing(meetingId),
          api.getClaims(meetingId)
        ]);
        setMeeting(m);
        setBriefing(b);
        setClaims(c.claims || []);
        setSources(b.sources || []);
        if (b.preparation_checklist && b.preparation_checklist.length > 0) {
          setChecklist(b.preparation_checklist);
        } else {
          setChecklist([
            { id: '1', task: 'Review Executive Summary & Target Trajectory', completed: false },
            { id: '2', task: 'Internalize the 3 Key Takeaways and Must-Discuss Topic', completed: false },
            { id: '3', task: 'Check Stale and Uncertain Claim Corrections', completed: false },
            { id: '4', task: 'Rehearse Conversation Opening and Talking Points', completed: false },
            { id: '5', task: 'Align team on desired outcome and follow-up milestones', completed: false },
          ]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load executive briefing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [meetingId]);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(api.getExportPdfUrl(meetingId), '_blank');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this briefing for ${meeting?.target_name || 'this meeting'}?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.deleteMeeting(meetingId);
      if (onDeleteMeeting) {
        onDeleteMeeting(meetingId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete meeting');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading verified meeting intelligence...</p>
      </div>
    );
  }

  if (errorMessage || !briefing) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Briefing Not Available</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {errorMessage || 'The intelligence briefing for this meeting is still being processed or could not be found.'}
        </p>
      </div>
    );
  }

  const freshCount = claims.filter(c => c.status === 'FRESH').length;
  const staleCount = claims.filter(c => c.status === 'STALE').length;
  const uncertainCount = claims.filter(c => c.status === 'UNCERTAIN').length;

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'summary', label: 'Executive Summary' },
    { id: 'intelligence', label: 'Target Intelligence' },
    { id: 'developments', label: 'Latest Developments' },
    { id: 'swot', label: 'SWOT Analysis' },
    { id: 'verification', label: 'Fact & Freshness Audit' },
    { id: 'opportunities', label: 'Strategic Opportunities' },
    { id: 'risks', label: 'Risks & Red Flags' },
    { id: 'questions', label: 'Smart Questions' },
    { id: 'talking-points', label: 'Talking Points' },
    { id: 'strategy', label: 'Meeting Strategy' },
    { id: 'recommendations', label: 'Final Recommendations' },
    { id: 'checklist', label: 'Preparation Checklist' },
    { id: 'sources', label: 'Sources & Provenance' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 text-slate-900">
      
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {meeting?.meeting_type || 'Executive Briefing'}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">{meeting?.meeting_date} at {meeting?.meeting_time} ({meeting?.timezone || 'UTC'})</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {meeting?.meeting_title || `Pre-Meeting Intelligence: ${meeting?.target_name}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Objective: {meeting?.objective || 'High-stakes executive preparation with deterministic fact verification'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete this briefing"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Nav + Report Body + Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sticky Navigation */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">
            Report Sections
          </span>
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                  activeSection === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{s.label}</span>
                {s.id === 'verification' && staleCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-700 font-bold">
                    {staleCount} Stale
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Center Report Content */}
        <main className="lg:col-span-9 space-y-10">

          {/* Section 1: Overview & Executive Summary */}
          <section id="summary" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Executive Summary</h2>
            </div>
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-3">
              <p className="font-medium text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {briefing.overview}
              </p>
              <p className="whitespace-pre-line">
                {briefing.executive_summary}
              </p>
            </div>
          </section>

          {/* Section 2: Target Intelligence */}
          {briefing.target_intelligence && (
            <section id="intelligence" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Target Intelligence Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {briefing.target_intelligence.background && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Origins & Profile</span>
                    <p className="text-slate-700 leading-relaxed">{briefing.target_intelligence.background}</p>
                  </div>
                )}
                {briefing.target_intelligence.business_model && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Business Model</span>
                    <p className="text-slate-700 leading-relaxed">{briefing.target_intelligence.business_model}</p>
                  </div>
                )}
                {briefing.target_intelligence.main_products && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Core Offerings</span>
                    <p className="text-slate-700 leading-relaxed">{briefing.target_intelligence.main_products}</p>
                  </div>
                )}
                {briefing.target_intelligence.competitive_landscape && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Competitive Landscape</span>
                    <p className="text-slate-700 leading-relaxed">{briefing.target_intelligence.competitive_landscape}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Latest Developments */}
          <section id="developments" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Recent Developments (Past 30 Days)</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Source Verified</span>
            </div>

            <div className="space-y-3">
              {briefing.recent_developments.map((dev, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">{dev.title}</h3>
                    {dev.date && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                        {dev.date}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{dev.summary}</p>
                  {dev.impact && (
                    <div className="mt-2 text-[11px] font-medium text-indigo-700 bg-indigo-50/60 p-2 rounded-lg">
                      <span className="font-bold">Business Impact:</span> {dev.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: SWOT Analysis */}
          {briefing.swot && (
            <section id="swot" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">SWOT Strategic Analysis</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Strengths</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {briefing.swot.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span><strong>{s.point}:</strong> {s.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Weaknesses</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {briefing.swot.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span><strong>{w.point}:</strong> {w.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Opportunities</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {briefing.swot.opportunities?.map((o, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span><strong>{o.point}:</strong> {o.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Threats */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Threats</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {briefing.swot.threats?.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span><strong>{t.point}:</strong> {t.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section 5: Fact & Freshness Audit */}
          <section id="verification" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Fact & Freshness Verification Engine</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audited across {claims.length} atomic factual statements via Tavily live searches and deterministic Python scoring.
                </p>
              </div>
              <button
                onClick={onOpenVerification}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <span>Deep Audit Log</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Score Counts Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-lg font-black text-emerald-700">{freshCount}</span>
                <span className="block text-[10px] font-bold uppercase text-emerald-800">Fresh Claims</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-lg font-black text-rose-700">{staleCount}</span>
                <span className="block text-[10px] font-bold uppercase text-rose-800">Stale Detected</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-lg font-black text-amber-700">{uncertainCount}</span>
                <span className="block text-[10px] font-bold uppercase text-amber-800">Uncertain</span>
              </div>
            </div>

            {/* Stale Corrections Audit Highlight */}
            {briefing.corrections && briefing.corrections.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Verified Corrections (Stale Answers Replaced)
                </h4>
                {briefing.corrections.map((corr, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-[11px]">
                      <XCircle className="w-4 h-4" />
                      <span>Outdated Fact:</span>
                      <span className="line-through font-normal text-slate-700">{corr.original_claim}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] pl-6">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Current:</span>
                      <span className="font-semibold text-slate-900">{corr.corrected_claim}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-6 italic">Reason: {corr.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Claims Preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Audited Factual Statements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {claims.slice(0, 4).map((c) => (
                  <ClaimCard key={c.id} claim={c} />
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Strategic Opportunities */}
          {briefing.opportunities && briefing.opportunities.length > 0 && (
            <section id="opportunities" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Strategic Meeting Opportunities</h2>
              </div>
              <div className="space-y-3">
                {briefing.opportunities.map((opp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">{opp.title}</h4>
                    <p className="text-slate-600"><strong className="text-slate-800">Why it exists:</strong> {opp.why_it_exists}</p>
                    <p className="text-slate-600"><strong className="text-slate-800">Your alignment:</strong> {opp.relevance}</p>
                    <p className="text-indigo-800 font-semibold bg-indigo-50 p-2 rounded-lg mt-2">
                      Suggested Action: {opp.suggested_action}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 7: Risks and Red Flags */}
          {briefing.risks && briefing.risks.length > 0 && (
            <section id="risks" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-bold text-slate-900">Risks & Commercial Red Flags</h2>
              </div>
              <div className="space-y-3">
                {briefing.risks.map((risk, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 space-y-1.5 text-xs">
                    <h4 className="font-bold text-rose-900 text-sm">{risk.title}</h4>
                    <p className="text-slate-700">{risk.issue}</p>
                    <div className="mt-2 bg-white/80 p-2.5 rounded-lg border border-rose-200/80">
                      <span className="font-bold text-rose-800 text-[11px] block">De-Risking Question to Ask:</span>
                      <span className="text-slate-800 italic">"{risk.clarification_question}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 8: Smart Questions */}
          <section id="questions" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Smart High-Impact Questions</h2>
            </div>
            <div className="space-y-3">
              {(briefing.smart_questions && briefing.smart_questions.length > 0
                ? briefing.smart_questions
                : briefing.open_questions.map((q) => ({ category: 'Strategic', question: q, rationale: 'Leverages recent developments' }))
              ).map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-indigo-600">{q.category}</span>
                    <span className="text-[10px] text-slate-400">Question #{idx + 1}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">"{q.question}"</p>
                  {q.rationale && (
                    <p className="text-[11px] text-slate-500 italic mt-1">Why ask this: {q.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 9: Talking Points */}
          {briefing.talking_points && briefing.talking_points.length > 0 && (
            <section id="talking-points" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Conversation Roadmap & Talking Points</h2>
              </div>
              <div className="space-y-3">
                {briefing.talking_points.map((tp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tp.stage}
                    </span>
                    <p className="font-medium text-slate-800 mt-1">{tp.point}</p>
                    {tp.notes && <p className="text-[11px] text-slate-400 italic">{tp.notes}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 10: Meeting Strategy */}
          {briefing.meeting_strategy && (
            <section id="strategy" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Strategic Meeting Playbook</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-[10px] uppercase block mb-1">Recommended Approach</span>
                  <p className="text-slate-800 leading-relaxed">{briefing.meeting_strategy.recommended_approach}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-[10px] uppercase block mb-1">Single Core Takeaway</span>
                  <p className="text-slate-800 leading-relaxed">{briefing.meeting_strategy.key_message}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="font-bold text-indigo-700 text-[10px] uppercase block mb-1">Negotiation & Discussion Dynamics</span>
                  <p className="text-slate-800 leading-relaxed">{briefing.meeting_strategy.negotiation_considerations}</p>
                </div>
              </div>
            </section>
          )}

          {/* Section 11: Final Recommendations */}
          {briefing.final_recommendations && (
            <section id="recommendations" className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-indigo-900 pb-3">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Action-Oriented Conclusions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                  <span className="text-indigo-300 font-bold block mb-1">3 Things to Know</span>
                  <ul className="space-y-1 text-slate-200">
                    {briefing.final_recommendations.top_three_takeaways?.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                  <span className="text-indigo-300 font-bold block mb-1">Must Discuss</span>
                  <p className="text-slate-200">{briefing.final_recommendations.must_discuss}</p>
                </div>
                <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                  <span className="text-indigo-300 font-bold block mb-1">Avoid Assuming</span>
                  <p className="text-slate-200">{briefing.final_recommendations.avoid_assuming}</p>
                </div>
              </div>
            </section>
          )}

          {/* Section 12: Checklist */}
          <section id="checklist" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ListTodo className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Pre-Meeting Preparation Checklist</h2>
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    item.completed 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 line-through' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">{item.task}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 13: Sources & Provenance */}
          <section id="sources" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Verified Sources & Evidence Citations</h2>
            </div>
            <div className="space-y-2.5">
              {sources.map((src) => (
                <div key={src.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold block mb-0.5">{src.id}</span>
                    <h5 className="font-semibold text-slate-900 truncate">{src.title}</h5>
                    <p className="text-[11px] text-slate-500 truncate">{src.url}</p>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};
