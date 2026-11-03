import React from 'react';
import { ScoreBreakdown } from '../types';

interface FreshnessGaugeProps {
  score?: number;
  breakdown?: ScoreBreakdown;
  isTimeSensitive?: boolean;
}

export const FreshnessGauge: React.FC<FreshnessGaugeProps> = ({
  score = 0,
  breakdown,
  isTimeSensitive = true,
}) => {
  if (!isTimeSensitive) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        <span>Not time-sensitive</span>
      </div>
    );
  }

  const getScoreColor = (val: number) => {
    if (val >= 90) return { text: 'text-emerald-700', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (val >= 70) return { text: 'text-teal-700', bg: 'bg-teal-500', light: 'bg-teal-50 text-teal-800 border-teal-200' };
    if (val >= 40) return { text: 'text-amber-700', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { text: 'text-rose-700', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-800 border-rose-200' };
  };

  const colors = getScoreColor(score);
  const interpretation = breakdown?.interpretation || (
    score >= 90 ? 'Fresh' : score >= 70 ? 'Mostly Fresh' : score >= 40 ? 'Uncertain' : 'Stale'
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold font-mono ${colors.text}`}>
            {score.toFixed(0)}<span className="text-[10px] text-slate-400 font-normal">/100</span>
          </span>
          <span className="text-xs font-semibold text-slate-700">· {interpretation}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {/* Factor Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-slate-500 font-mono">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Source (30%)</span>
            <span>{(breakdown.source_reliability * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Agree (30%)</span>
            <span>{(breakdown.evidence_agreement * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Recency (25%)</span>
            <span>{(breakdown.evidence_recency * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Match (15%)</span>
            <span>{(breakdown.claim_matching * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
