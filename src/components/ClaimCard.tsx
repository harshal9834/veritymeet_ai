import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Claim, Source } from '../types';
import { FreshnessGauge } from './FreshnessGauge';

interface ClaimCardProps {
  claim: Claim;
  sourcesMap?: Record<string, Source>;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, sourcesMap = {} }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = () => {
    switch (claim.status) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Fresh
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Stale · Corrected
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Uncertain
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Auditing
          </span>
        );
    }
  };

  const supportingSources = (claim.supporting_source_ids || [])
    .map(id => sourcesMap[id])
    .filter(Boolean);

  const contradictingSources = (claim.contradicting_source_ids || [])
    .map(id => sourcesMap[id])
    .filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
      {/* Top Metadata Row: Zero-Pill text with bullet separators */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
            {claim.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>Claim ID: {claim.claim_id}</span>
          <span aria-hidden="true">·</span>
          <span>{claim.time_sensitive ? 'Time-sensitive' : 'Stable background'}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Claim Text */}
      <p className="text-sm font-medium text-slate-900 leading-relaxed mb-4">
        {claim.claim_text}
      </p>

      {/* Verified Correction Callout if STALE */}
      {claim.status === 'STALE' && claim.corrected_claim && (
        <div className="mb-4 p-3.5 rounded-lg bg-rose-50/70 border border-rose-200/80 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Verified Correction:</span>
          </div>
          <div className="flex items-start gap-2 text-slate-800">
            <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <p className="font-medium text-slate-900">{claim.corrected_claim}</p>
          </div>
          {claim.explanation && (
            <p className="text-[11px] text-slate-600 italic pl-5">
              Evidence reason: {claim.explanation}
            </p>
          )}
        </div>
      )}

      {/* Freshness Score & Gauge */}
      <div className="border-t border-slate-100 pt-3">
        <FreshnessGauge
          score={claim.freshness_score}
          breakdown={claim.score_breakdown}
          isTimeSensitive={claim.time_sensitive}
        />
      </div>

      {/* Collapsible Evidence Audit Trail */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <span>{expanded ? 'Hide Evidence & Audit Trail' : 'Inspect Evidence & Sources'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <span className="text-[11px] text-slate-400">
          {(claim.supporting_source_ids?.length || 0) + (claim.contradicting_source_ids?.length || 0)} sources evaluated
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs text-slate-600">
          {claim.evidence_summary && (
            <div>
              <span className="font-semibold text-slate-800 block mb-1">Evidence Summary:</span>
              <p className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-slate-700 leading-relaxed">
                {claim.evidence_summary}
              </p>
            </div>
          )}

          {claim.explanation && claim.status !== 'STALE' && (
            <div>
              <span className="font-semibold text-slate-800 block mb-1">Verification Reasoning:</span>
              <p className="text-slate-600 leading-relaxed">{claim.explanation}</p>
            </div>
          )}

          {/* Sources breakdown */}
          <div className="space-y-2 pt-1">
            {supportingSources.length > 0 && (
              <div>
                <span className="font-semibold text-emerald-800 block mb-1">Supporting Sources:</span>
                <div className="space-y-1">
                  {supportingSources.map(s => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-indigo-600 hover:underline hover:text-indigo-800 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.title || s.url}</span>
                      <span className="text-slate-400 text-[10px]">({s.domain || 'web'})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contradictingSources.length > 0 && (
              <div>
                <span className="font-semibold text-rose-800 block mb-1">Contradicting Sources:</span>
                <div className="space-y-1">
                  {contradictingSources.map(s => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-rose-600 hover:underline hover:text-rose-800 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.title || s.url}</span>
                      <span className="text-slate-400 text-[10px]">({s.domain || 'web'})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
