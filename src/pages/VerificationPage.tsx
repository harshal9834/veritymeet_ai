import React, { useEffect, useState, useMemo } from 'react';
import { 
  Claim, 
  Source, 
  Meeting 
} from '../types';
import { api } from '../services/api';
import { ClaimCard } from '../components/ClaimCard';
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Filter,
  BarChart2,
  PieChart as PieIcon,
  Loader2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface VerificationPageProps {
  meetingId: string;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ meetingId }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'FRESH' | 'STALE' | 'UNCERTAIN' | 'STABLE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [m, c, b] = await Promise.all([
          api.getMeeting(meetingId),
          api.getClaims(meetingId),
          api.getBriefing(meetingId).catch(() => ({ sources: [] }))
        ]);
        setMeeting(m);
        setClaims(c.claims);
        setSources(b.sources || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [meetingId]);

  const sourcesMap = useMemo(() => {
    return sources.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, Source>);
  }, [sources]);

  // Counts
  const freshCount = useMemo(() => claims.filter(c => c.status === 'FRESH').length, [claims]);
  const staleCount = useMemo(() => claims.filter(c => c.status === 'STALE').length, [claims]);
  const uncertainCount = useMemo(() => claims.filter(c => c.status === 'UNCERTAIN').length, [claims]);
  const stableCount = useMemo(() => claims.filter(c => !c.time_sensitive).length, [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    if (filter === 'ALL') return claims;
    if (filter === 'STABLE') return claims.filter(c => !c.time_sensitive);
    return claims.filter(c => c.status === filter);
  }, [claims, filter]);

  // Chart data
  const pieData = [
    { name: 'Fresh Facts', value: freshCount, color: '#10B981' },
    { name: 'Stale (Corrected)', value: staleCount, color: '#F43F5E' },
    { name: 'Uncertain', value: uncertainCount, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    claims.forEach(c => {
      const cat = c.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [claims]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Loading Claim Verification Audit...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Claim Verification & Stale-Answer Audit
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed inspection of atomic factual claims extracted for <span className="font-semibold text-slate-800">{meeting?.target_name}</span>. Audited against live Tavily web proof with 4-factor scoring.
        </p>
      </div>

      {/* Verification Overview Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Claims Audited</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{claims.length}</span>
          <span className="text-[10px] text-slate-400">Atomic factual statements</span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-medium text-emerald-800 block">Fresh Facts</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">{freshCount}</span>
          <span className="text-[10px] text-emerald-600">Supported by current web proof</span>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs bg-rose-50/20">
          <span className="text-[11px] font-medium text-rose-800 block">Stale Claims (Corrected)</span>
          <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">{staleCount}</span>
          <span className="text-[10px] text-rose-600">Disproven & updated</span>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-medium text-amber-800 block">Uncertain / Unverified</span>
          <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">{uncertainCount}</span>
          <span className="text-[10px] text-amber-600">Conflicting or insufficient proof</span>
        </div>
      </div>

      {/* Freshness Distribution Visual Chart */}
      {claims.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Evidence Freshness Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Live web proof distribution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Claims ({claims.length})
          </button>
          <button
            onClick={() => setFilter('FRESH')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'FRESH'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fresh ({freshCount})
          </button>
          <button
            onClick={() => setFilter('STALE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'STALE'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stale / Corrected ({staleCount})
          </button>
          <button
            onClick={() => setFilter('UNCERTAIN')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'UNCERTAIN'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uncertain ({uncertainCount})
          </button>
          <button
            onClick={() => setFilter('STABLE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'STABLE'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stable ({stableCount})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredClaims.length} of {claims.length} claims
        </span>
      </div>

      {/* Claim Cards List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500">No claims match the selected filter.</p>
          </div>
        ) : (
          filteredClaims.map(c => (
            <ClaimCard
              key={c.claim_id}
              claim={c}
              sourcesMap={sourcesMap}
            />
          ))
        )}
      </div>
    </div>
  );
};
