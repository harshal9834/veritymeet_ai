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
  XCircle
} from 'lucide-react';

interface BriefingPageProps {
  meetingId: string;
  onOpenVerification: () => void;
}

export const BriefingPage: React.FC<BriefingPageProps> = ({ meetingId, onOpenVerification }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setClaims(c.claims);
        setSources(b.sources || []);
      } catch (err: any) {
        setErrorMessage(err.message || 'Briefing is still preparing or could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Compiling Verified Intelligence Briefing...</h3>
        <p className="text-xs text-slate-500">Retrieving source attributions, freshness scores, and corrections.</p>
      </div>
    );
  }

  if (errorMessage || !briefing || !meeting) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-900">Briefing Not Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMessage}</p>
      </div>
    );
  }

  const sourcesMap = sources.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<string, Source>);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(api.getExportPdfUrl(meetingId), '_blank');
  };

  const staleCount = claims.filter(c => c.status === 'STALE').length;
  const freshCount = claims.filter(c => c.status === 'FRESH').length;
  const uncertainCount = claims.filter(c => c.status === 'UNCERTAIN').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Action Header Strip */}
      <div className="flex items-center justify-between no-print bg-white rounded-xl border border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-800">
            Dossier Ready · {claims.length} Claims Audited
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-emerald-700 font-medium">{freshCount} Fresh</span>
          {staleCount > 0 && (
            <span className="text-xs text-rose-700 font-medium">· {staleCount} Stale Corrected</span>
          )}
          {uncertainCount > 0 && (
            <span className="text-xs text-amber-700 font-medium">· {uncertainCount} Uncertain</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVerification}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Inspect Claims ({claims.length})</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Briefing Paper Document */}
      <article className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-8 text-slate-900">
        {/* Document Header */}
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                Verified Intelligence Dossier
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {meeting.target_name}
              </h1>
            </div>

            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <div className="font-semibold text-slate-800">{meeting.meeting_type}</div>
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{meeting.meeting_date} at {meeting.meeting_time}</span>
              </div>
            </div>
          </div>

          {/* Zero-Pill Metadata Header */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Live Web Search: Tavily Engine</span>
            <span aria-hidden="true">·</span>
            <span>LLM Gateway: Bifrost / Grok</span>
            <span aria-hidden="true">·</span>
            <span>Coverage Window: 30 Calendar Days</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 font-medium">Stale-Answer Engine Active</span>
          </div>
        </header>

        {/* Section 1: Overview */}
        {briefing.overview && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Meeting Overview & Profile
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {briefing.overview}
            </p>
          </section>
        )}

        {/* Section 2: Executive Summary */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            2. Executive Summary
          </h2>
          <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 text-sm text-slate-800 leading-relaxed font-normal">
            {briefing.executive_summary}
          </div>
        </section>

        {/* Section 3: Strategic Context & Why It Matters */}
        {briefing.why_it_matters && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Strategic Significance & Why This Matters
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {briefing.why_it_matters}
            </p>
          </section>
        )}

        {/* Section 4: Stale Claims Audit & Verified Corrections (Mandatory) */}
        {briefing.corrections && briefing.corrections.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                4. Stale Claims Detected & Verified Corrections
              </h2>
              <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                Audit Active
              </span>
            </div>

            <div className="space-y-2.5">
              {briefing.corrections.map((cor, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-1.5 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-rose-800 shrink-0">[Outdated Claim]:</span>
                    <span className="text-slate-600 line-through">"{cor.original_claim}"</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-emerald-800 shrink-0">[Verified Current]:</span>
                    <span className="text-slate-900 font-medium">{cor.corrected_claim}</span>
                  </div>
                  {cor.reason && (
                    <p className="text-[11px] text-slate-500 italic pl-4">
                      Evidence basis: {cor.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Recent Developments */}
        {briefing.recent_developments && briefing.recent_developments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              5. Recent Developments (30-Day Research Window)
            </h2>
            <div className="space-y-3">
              {briefing.recent_developments.map((dev, idx) => (
                <div key={idx} className="border-l-2 border-indigo-500 pl-3.5 py-0.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-slate-900">{dev.title}</h3>
                    {dev.date && (
                      <span className="text-[10px] text-slate-400 font-mono">({dev.date})</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{dev.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Leadership & Key People */}
        {briefing.leadership_updates && briefing.leadership_updates.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              6. Leadership & Key Decision-Makers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {briefing.leadership_updates.map((person, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{person.name}</span>
                    <span className="text-[11px] font-medium text-indigo-600">{person.role}</span>
                  </div>
                  {person.background && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{person.background}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 7: Product & Partnerships */}
        {((briefing.product_launches && briefing.product_launches.length > 0) || 
          (briefing.partnerships && briefing.partnerships.length > 0)) && (
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              7. Product Launches & Commercial Partnerships
            </h2>

            {briefing.product_launches && briefing.product_launches.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Product Announcements:
                </span>
                <div className="space-y-2">
                  {briefing.product_launches.map((prod, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{prod.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{prod.status}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{prod.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {briefing.partnerships && briefing.partnerships.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Partnerships & Strategic Alliances:
                </span>
                <div className="space-y-2">
                  {briefing.partnerships.map((part, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{part.partner}</span>
                        {part.date && <span className="text-[10px] text-slate-400 font-mono">{part.date}</span>}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{part.nature}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Section 8: Uncertain or Conflicting Findings */}
        {briefing.uncertain_information && briefing.uncertain_information.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>8. Uncertain Information (Requires Verification)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 bg-amber-50/40 p-3 rounded-lg border border-amber-200/60">
              {briefing.uncertain_information.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 9: Strategic Discussion Questions */}
        {briefing.open_questions && briefing.open_questions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                9. Recommended Discussion Questions for Meeting
              </h2>
            </div>
            <div className="space-y-2">
              {briefing.open_questions.map((q, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5 text-xs text-slate-800">
                  <span className="font-bold text-indigo-600 font-mono shrink-0">Q{idx + 1}:</span>
                  <p className="leading-relaxed font-medium">{q}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 10: Sources Attribution */}
        {sources && sources.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              10. Source Attribution & Provenance ({sources.length} Indexed)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {sources.map(s => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-900 group-hover:text-indigo-600 truncate text-[11px]">
                      {s.title || s.url}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{s.domain}</span>
                      {s.published_date && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{s.published_date}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};
