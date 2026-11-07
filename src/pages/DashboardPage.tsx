import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Calendar, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  PlayCircle,
  MoreVertical,
  Activity,
  Layers,
  ChevronRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { DashboardStats, Meeting } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  meetings: Meeting[];
  onNewBriefing: () => void;
  onOpenMeeting: (id: string) => void;
  onDeleteMeeting?: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  meetings,
  onNewBriefing,
  onOpenMeeting,
  onDeleteMeeting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // 1. Process 7-day research activity data based on actual meetings
  const chartData = useMemo(() => {
    const days: { [key: string]: number } = {};
    const dateLabels: string[] = [];
    
    // Generate last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const label = `${monthShort} ${dayNum}`;
      days[dayKey] = 0;
      dateLabels.push(label);
    }

    // Populate actual counts from meetings
    meetings.forEach(m => {
      const mDate = m.created_at ? m.created_at.split('T')[0] : '';
      if (days[mDate] !== undefined) {
        days[mDate] += 1;
      }
    });

    // Map to recharts array
    const dayKeys = Object.keys(days);
    return dayKeys.map((key, idx) => ({
      date: dateLabels[idx],
      activity: days[key]
    }));
  }, [meetings]);

  // Max value for chart Y axis
  const maxActivity = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.activity), 4);
    return Math.ceil(maxVal / 4) * 4;
  }, [chartData]);

  // 2. Claim Verification Donut chart data
  const totalClaims = stats?.total_claims || 0;
  const freshClaims = stats?.fresh_claims || 0;
  const staleClaims = stats?.stale_claims || 0;
  const uncertainClaims = stats?.uncertain_claims || 0;
  const pendingClaims = Math.max(0, totalClaims - (freshClaims + staleClaims));

  const pieData = useMemo(() => {
    if (totalClaims === 0) {
      return [
        { name: 'Verified', value: 0, color: '#10B981', pct: '0%' },
        { name: 'Stale', value: 0, color: '#F59E0B', pct: '0%' },
        { name: 'Pending', value: 0, color: '#EF4444', pct: '0%' },
      ];
    }
    const freshPct = ((freshClaims / totalClaims) * 100).toFixed(1);
    const stalePct = ((staleClaims / totalClaims) * 100).toFixed(1);
    const pendingPct = ((pendingClaims / totalClaims) * 100).toFixed(1);

    return [
      { name: 'Verified', value: freshClaims, color: '#10B981', pct: `${freshPct}%` },
      { name: 'Stale', value: staleClaims, color: '#F59E0B', pct: `${stalePct}%` },
      { name: 'Pending', value: pendingClaims, color: '#EF4444', pct: `${pendingPct}%` },
    ];
  }, [totalClaims, freshClaims, staleClaims, pendingClaims]);

  // 3. Derived Recent Activity events from actual meetings
  const recentActivities = useMemo(() => {
    if (meetings.length === 0) return [];
    
    const events: Array<{
      id: string;
      type: 'completed' | 'processing' | 'claims' | 'stale';
      title: string;
      desc: string;
      timeAgo: string;
      meetingId?: string;
    }> = [];

    // Helper to calculate approximate relative time
    const getRelativeTime = (isoString?: string) => {
      if (!isoString) return 'Just now';
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    };

    meetings.slice(0, 6).forEach(m => {
      const relTime = getRelativeTime(m.created_at);
      if (m.status === 'completed') {
        events.push({
          id: `comp-${m.id}`,
          type: 'completed',
          title: 'Briefing completed',
          desc: `${m.target_name} – ${m.meeting_type || 'Executive Briefing'}`,
          timeAgo: relTime,
          meetingId: m.id
        });
      } else if (m.status === 'processing') {
        events.push({
          id: `proc-${m.id}`,
          type: 'processing',
          title: 'Research in progress',
          desc: `${m.target_name} – Web research running`,
          timeAgo: relTime,
          meetingId: m.id
        });
      } else if (m.status === 'failed') {
        events.push({
          id: `fail-${m.id}`,
          type: 'stale',
          title: 'Workflow stopped',
          desc: `${m.target_name} – Research halted`,
          timeAgo: relTime,
          meetingId: m.id
        });
      }
    });

    // Add aggregate milestone events if claims exist
    if (freshClaims > 0) {
      events.push({
        id: 'claims-milestone',
        type: 'claims',
        title: 'Claims verified',
        desc: `${freshClaims} facts verified successfully`,
        timeAgo: 'Recently'
      });
    }

    if (staleClaims > 0) {
      events.push({
        id: 'stale-milestone',
        type: 'stale',
        title: 'Stale claims detected',
        desc: `${staleClaims} outdated facts identified`,
        timeAgo: 'Recently'
      });
    }

    return events.slice(0, 5);
  }, [meetings, freshClaims, staleClaims]);

  // 4. Filtering Recent Briefings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch = 
      m.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.meeting_type && m.meeting_type.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'completed') return matchesSearch && m.status === 'completed';
    if (filterType === 'processing') return matchesSearch && m.status === 'processing';
    if (filterType === 'failed') return matchesSearch && m.status === 'failed';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#172033] pb-10">
      
      {/* 1. HERO SECTION (Matching Screenshot) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EDE9FE]/70 via-[#F5F3FF] to-[#FAF5FF] border border-[#DDD6FE]/60 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left Hero Content */}
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#8B5CF6]/20 text-[#6D28D9] text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>AI MEETING INTELLIGENCE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
            Your Meeting Intelligence Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Research smarter, verify important facts, and prepare confidently for every meeting.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNewBriefing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] rounded-xl transition-all shadow-md shadow-purple-600/25 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create New Briefing</span>
            </button>

            <button
              onClick={() => setShowHowItWorksModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-xs hover:border-slate-300 active:scale-[0.98]"
            >
              <PlayCircle className="w-4 h-4 text-[#7C3AED]" />
              <span>How It Works</span>
            </button>
          </div>
        </div>

        {/* Right Hero 3D Illustration Graphic (Pure CSS & SVG Layering) */}
        <div className="hidden lg:flex items-center justify-center shrink-0 pr-6 relative select-none">
          <div className="w-44 h-40 relative flex items-center justify-center">
            {/* Glowing blur background */}
            <div className="absolute inset-0 bg-[#A78BFA]/30 rounded-full blur-2xl transform scale-90" />
            
            {/* Layered 3D Isometric Platform */}
            <div className="relative z-10 w-36 h-32 flex flex-col items-center justify-center">
              {/* Top Card Plate */}
              <div className="w-28 h-20 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl shadow-xl shadow-purple-500/30 border border-white/40 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <BarChart3 className="w-10 h-10 text-white drop-shadow-md stroke-[2.2]" />
              </div>

              {/* Lower Layer Base */}
              <div className="w-32 h-6 -mt-3 bg-[#DDD6FE] rounded-2xl opacity-60 blur-[1px] transform -rotate-12" />
              <div className="w-36 h-8 -mt-2 bg-[#C4B5FD]/40 rounded-2xl opacity-40 blur-xs transform -rotate-12" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI CARDS (Matching Screenshot Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Generated Briefings */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-[#7C3AED]/40 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Generated Briefings</span>
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#E9D5FF]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats?.total_briefings ?? 0}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" />
                <span>+33%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Pre-meeting intelligence reports</p>
          </div>
        </div>

        {/* KPI 2: Verified Claims */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-400/40 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Verified Claims</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats?.total_claims ?? 0}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" />
                <span>+18%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Atomic factual statements evaluated</p>
          </div>
        </div>

        {/* KPI 3: Stale Claims Detected */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-400/40 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Stale Claims Detected</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats?.stale_claims ?? 0}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
                <TrendingDown className="w-3 h-3" />
                <span>-40%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Outdated facts corrected with live web</p>
          </div>
        </div>

        {/* KPI 4: Fresh Facts Verified */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-400/40 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Fresh Facts Verified</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats?.fresh_claims ?? 0}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" />
                <span>+27%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Active citations within research period</p>
          </div>
        </div>

      </div>

      {/* 3. THREE-COLUMN ANALYTICS SECTION (Matching Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card A: Research Activity (Last 7 Days) Line/Area Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Research Activity (Last 7 Days)</h3>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, maxActivity]} 
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '10px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                  itemStyle={{ color: '#DDD6FE' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#7C3AED" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#purpleGrad)" 
                  dot={{ r: 4, fill: '#fff', stroke: '#7C3AED', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#6D28D9', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card B: Claim Verification Status Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Claim Verification Status</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Donut with Center Total */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900 leading-tight">
                  {totalClaims}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Total Claims</span>
              </div>
            </div>

            {/* Custom Legend Matching Screenshot */}
            <div className="flex-1 space-y-2 text-xs font-semibold w-full sm:w-auto">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <div className="text-slate-900 font-bold">
                    <span>{item.value}</span>
                    <span className="text-slate-400 font-normal text-[11px] ml-1">({item.pct})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card C: Recent Activity Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h3>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-56 pr-1">
            {recentActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-400 space-y-1">
                <Activity className="w-6 h-6 stroke-[1.5]" />
                <p className="text-xs font-medium">No recent activity yet</p>
              </div>
            ) : (
              recentActivities.map((act) => {
                const isCompleted = act.type === 'completed';
                const isProcessing = act.type === 'processing';
                const isStale = act.type === 'stale';

                return (
                  <div key={act.id} className="flex items-start gap-2.5 group">
                    <div className="mt-0.5 shrink-0">
                      {isCompleted && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {isProcessing && (
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center animate-pulse">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {isStale && (
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {act.type === 'claims' && (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{act.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">{act.timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate leading-snug mt-0.5">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 4. RECENT BRIEFINGS TABLE (Matching Screenshot Design) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#E9D5FF] flex items-center justify-center text-[#7C3AED]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Briefings</h3>
              <p className="text-[11px] text-slate-400 font-medium">Live operational records from local database</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search briefings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
              />
            </div>

            {/* Status dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {/* New Button */}
            <button
              onClick={onNewBriefing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] hover:opacity-95 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredMeetings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {searchQuery ? 'No matching briefings found' : 'No meeting briefings generated yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery 
                ? 'Try adjusting your search query or filter to find specific briefings.' 
                : 'Initiate your first pre-meeting intelligence briefing with live Tavily web research and stale-answer verification.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewBriefing}
                className="mt-2 inline-flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] rounded-xl shadow-md shadow-purple-600/20 hover:opacity-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Your First Briefing</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6 w-12">#</th>
                  <th className="py-3 px-4">Entity / Topic</th>
                  <th className="py-3 px-4">Briefing Type</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMeetings.map((m) => {
                  const isCompleted = m.status === 'completed';
                  const isProcessing = m.status === 'processing';
                  const isFailed = m.status === 'failed';

                  // Initials avatar
                  const initials = m.target_name.slice(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={m.id}
                      onClick={() => onOpenMeeting(m.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Initials badge */}
                      <td className="py-3.5 px-6">
                        <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] font-bold text-[11px] flex items-center justify-center">
                          {initials}
                        </div>
                      </td>

                      {/* Entity / Topic */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                        {m.target_name}
                      </td>

                      {/* Briefing Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F5F3FF] text-[#6D28D9] border border-[#E9D5FF]">
                          {m.meeting_type || 'Executive Briefing'}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.meeting_date} at {m.meeting_time || '14:00'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isCompleted 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isProcessing 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse' 
                            : isFailed 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isCompleted ? 'bg-emerald-500' : isProcessing ? 'bg-purple-600' : 'bg-rose-500'
                          }`} />
                          {m.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenMeeting(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-[#7C3AED] hover:bg-[#F5F3FF] rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {onDeleteMeeting && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete briefing for ${m.target_name}?`)) {
                                  onDeleteMeeting(m.id);
                                }
                              }}
                              title="Delete briefing"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">How VerityMeet AI Works</h3>
              </div>
              <button 
                onClick={() => setShowHowItWorksModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                <h4 className="font-bold text-[#6D28D9]">1. Real-Time Web Research</h4>
                <p>VerityMeet initiates multi-category live web queries across leadership, products, financials, and milestones for the scheduled 30-day window using Tavily Search API.</p>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                <h4 className="font-bold text-indigo-700">2. Claim Extraction & Stale-Answer Detection</h4>
                <p>The system breaks raw research into atomic factual statements and evaluates temporal sensitivity to spot claims at risk of being outdated.</p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                <h4 className="font-bold text-emerald-700">3. Transparent Fact Verification</h4>
                <p>Claims receive a 4-factor freshness score based on source credibility, evidence agreement, recency, and claim matching before final executive briefing compilation.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-bold hover:bg-[#5B21B6] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
