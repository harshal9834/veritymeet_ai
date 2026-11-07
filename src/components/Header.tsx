import React from 'react';
import { Bell, ChevronRight, CheckCircle2, Menu } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentTab: string;
  activeMeetingTarget?: string;
  user: User | null;
  onNewBriefing?: () => void;
  onToggleSidebar?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeMeetingTarget,
  user,
  onToggleSidebar,
  onNavigateTab,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'HM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const targetLabel = activeMeetingTarget || 'Target Entity';

  // Format breadcrumbs intelligently based on active route
  const renderBreadcrumbs = () => {
    if (currentTab === 'dashboard') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span className="text-slate-800 font-bold">Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#6D28D9] font-bold">Executive Overview</span>
        </div>
      );
    }

    if (currentTab === 'history') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span 
            onClick={() => onNavigateTab?.('dashboard')} 
            className="hover:text-slate-800 cursor-pointer transition-colors"
          >
            Dashboard
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#6D28D9] font-bold">All Briefings</span>
        </div>
      );
    }

    if (currentTab === 'verification') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span 
            onClick={() => onNavigateTab?.('dashboard')} 
            className="hover:text-slate-800 cursor-pointer transition-colors"
          >
            Dashboard
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#6D28D9] font-bold">Sources & Fact Verifications</span>
        </div>
      );
    }

    if (currentTab === 'create') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span 
            onClick={() => onNavigateTab?.('dashboard')} 
            className="hover:text-slate-800 cursor-pointer transition-colors"
          >
            Dashboard
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#6D28D9] font-bold">New Briefing</span>
        </div>
      );
    }

    if (currentTab === 'briefing') {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span 
            onClick={() => onNavigateTab?.('history')} 
            className="hover:text-slate-800 cursor-pointer transition-colors hidden sm:inline"
          >
            Briefings
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Executive Briefing</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#6D28D9] font-bold truncate max-w-[120px] sm:max-w-[200px]">
            {targetLabel}
          </span>
        </div>
      );
    }

    // Default / Progress / Research Orchestration
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 truncate">
        <span 
          onClick={() => onNavigateTab?.('dashboard')}
          className="hover:text-slate-800 cursor-pointer transition-colors hidden sm:inline"
        >
          Research Orchestration
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
        <span className="hover:text-slate-800 cursor-pointer transition-colors">Live Web Research</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-[#6D28D9] font-bold truncate max-w-[110px] sm:max-w-[220px]">
          {targetLabel.toLowerCase()}
        </span>
      </div>
    );
  };

  return (
    <header className="h-16 px-4 sm:px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between gap-3 sm:gap-6 shrink-0 no-print sticky top-0 z-30 transition-all shadow-xs">
      {/* Left: Mobile Sidebar Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 truncate">
          {renderBreadcrumbs()}
        </div>
      </div>

      {/* Right: Environment indicator, Notification, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Environment Configured (.env) green pill */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Environment Configured (.env)</span>
        </div>

        {/* Compact pill for medium screens */}
        <div className="hidden sm:inline-flex lg:hidden items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Configured</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED] ring-2 ring-white"></span>
        </button>

        {/* User Avatar Circle */}
        <div 
          className="w-8 h-8 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-[#7C3AED]/40 hover:scale-105 transition-all"
          title={user?.full_name || 'Account'}
        >
          {getInitials(user?.full_name)}
        </div>
      </div>
    </header>
  );
};
