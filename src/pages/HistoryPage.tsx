import React, { useEffect, useState } from 'react';
import { 
  Meeting 
} from '../types';
import { api } from '../services/api';
import { 
  History, 
  Calendar, 
  Clock, 
  Building, 
  ChevronRight, 
  ExternalLink,
  Plus,
  Loader2,
  FileText
} from 'lucide-react';

interface HistoryPageProps {
  onOpenMeeting: (id: string) => void;
  onNewBriefing: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onOpenMeeting, onNewBriefing }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listMeetings();
        setMeetings(res.meetings);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Loading Briefings Archive...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Briefings Archive</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search and reopen verified pre-meeting intelligence records stored in the local SQLite database.
          </p>
        </div>
        <button
          onClick={onNewBriefing}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Briefing</span>
        </button>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {meetings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Archive is currently empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No meeting research records exist yet. Once you launch a research dossier, it will be preserved here.
            </p>
            <button
              onClick={onNewBriefing}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Briefing</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => onOpenMeeting(m.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {m.target_name}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600 font-medium">{m.meeting_type}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {m.meeting_date} at {m.meeting_time}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Created: {new Date(m.created_at).toLocaleDateString()}</span>
                    {m.objective && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="italic text-slate-600">Objective: {m.objective}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    m.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : m.status === 'failed'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:text-indigo-800">
                    <span>Reopen Briefing</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
