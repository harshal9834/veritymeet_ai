import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Loader2,
  Calendar,
  Building
} from 'lucide-react';
import { Claim } from '../types';
import { api } from '../services/api';
import { FreshnessGauge } from '../components/FreshnessGauge';

interface VerificationPageProps {
  meetingId?: string;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ meetingId }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      try {
        if (meetingId) {
          const res = await api.getClaims(meetingId);
          setClaims(res.claims || []);
        } else {
          const res = await api.listAllClaims();
          setClaims(res.claims || []);
        }
      } catch (err) {
        console.error('Failed to load claims', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [meetingId]);

  const filteredClaims = claims.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch = c.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.target_name && c.target_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const freshCount = claims.filter(c => c.status === 'FRESH').length;
  const staleCount = claims.filter(c => c.status === 'STALE').length;
  const uncertainCount = claims.filter(c => c.status === 'UNCERTAIN').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Deterministic Verification & Freshness Audit Log
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time audit records extracted from Tavily live search results. Evaluated by our 4-factor scoring model.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{freshCount} Fresh</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{staleCount} Stale</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{uncertainCount} Uncertain</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claims, entities, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'FRESH', 'STALE', 'UNCERTAIN'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === status 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading claim verification data...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No verified claims matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div key={claim.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      claim.status === 'FRESH'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : claim.status === 'STALE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {claim.status}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {claim.category}
                    </span>
                    {claim.target_name && (
                      <span className="text-xs text-indigo-600 font-bold">
                        • {claim.target_name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{claim.claim_text}</h3>
                </div>

                {claim.freshness_score !== undefined && (
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-slate-800">
                      {Math.round(claim.freshness_score)}<span className="text-xs text-slate-400">/100</span>
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Freshness</span>
                  </div>
                )}
              </div>

              {/* Evidence & Explanation */}
              {claim.evidence_summary && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase mb-0.5">Live Evidence Summary:</span>
                  {claim.evidence_summary}
                </div>
              )}

              {/* Corrected Claim if Stale */}
              {claim.status === 'STALE' && claim.corrected_claim && (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                  <span className="font-bold text-emerald-800 text-[10px] uppercase block mb-0.5">Verified Correction:</span>
                  {claim.corrected_claim}
                </div>
              )}

              {/* 4-Factor Breakdown Chips */}
              {claim.score_breakdown && (
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    Source Reliability: <strong>{claim.score_breakdown.source_reliability}%</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    Agreement: <strong>{claim.score_breakdown.evidence_agreement}%</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    Recency: <strong>{claim.score_breakdown.evidence_recency}%</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    Match: <strong>{claim.score_breakdown.claim_matching}%</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
