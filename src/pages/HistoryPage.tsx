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
  FileText,
  Trash2,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface HistoryPageProps {
  onOpenMeeting: (id: string) => void;
  onNewBriefing: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onOpenMeeting, onNewBriefing }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await api.listMeetings();
      setMeetings(res.meetings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this briefing and its verification claims?')) {
      try {
        await api.deleteMeeting(id);
        setMeetings(prev => prev.filter(m => m.id !== id));
      } catch (err) {
        alert('Failed to delete briefing');
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    window.open(api.getExportPdfUrl(id), '_blank');
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.meeting_title && m.meeting_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          m.meeting_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || m.status === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Loading Briefings Archive...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Briefings Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access previous pre-meeting intelligence records, verified claims, and PDF exports.
          </p>
        </div>
        <button
          onClick={onNewBriefing}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Briefing</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search target or meeting title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'completed', 'processing', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterType(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === status 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Records' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredMeetings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No briefings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No records matched your search query.' : 'Launch a research dossier to preserve meeting intelligence here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => onOpenMeeting(meeting.id)}
                className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {meeting.meeting_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      meeting.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : meeting.status === 'processing'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {meeting.status}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {meeting.meeting_date}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {meeting.meeting_title || meeting.target_name}
                  </h3>

                  {meeting.objective && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Objective: {meeting.objective}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {meeting.status === 'completed' && (
                    <button
                      onClick={(e) => handleDownload(e, meeting.id)}
                      title="Download PDF"
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, meeting.id)}
                    title="Delete Meeting"
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
