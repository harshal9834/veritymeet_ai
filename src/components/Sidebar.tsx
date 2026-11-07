import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Globe, 
  Settings, 
  Activity, 
  Radio,
  X
} from 'lucide-react';
import { SystemHealth, User } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  health: SystemHealth | null;
  onOpenSettings?: () => void;
  activeMeetingId: string | null;
  onGoLanding?: () => void;
  user: User | null;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  health,
  onOpenSettings,
  activeMeetingId,
  onGoLanding,
  user,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'progress', label: 'Research Orchestration', icon: Activity },
    { id: 'history', label: 'Briefings', icon: FileText },
    { id: 'verification', label: 'Sources', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'progress' && !activeMeetingId) {
      setCurrentTab('create');
    } else {
      setCurrentTab(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 select-none border-r border-slate-800">
      {/* 1. Logo & Brand Title */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div 
          onClick={() => {
            onGoLanding?.();
            onCloseMobile?.();
          }}
          className="flex items-center gap-3 cursor-pointer group"
          title="VerityMeet AI"
        >
          {/* Logo icon box with violet / purple gradient */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-purple-900/30 group-hover:scale-105 transition-transform">
            <span className="font-black text-sm tracking-tighter">VM</span>
          </div>

          <div className="text-left">
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight flex items-center gap-1">
              <span>VerityMeet</span>
              <span className="text-[#A78BFA]">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-normal mt-0.5">
              Intelligent Meeting Research
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            currentTab === item.id || 
            (item.id === 'progress' && (currentTab === 'progress' || currentTab === 'create')) ||
            (item.id === 'history' && currentTab === 'briefing');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-[#6D28D9] text-white shadow-md shadow-purple-900/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Status Card matching Screenshot */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#1e1b4b]/60 to-[#0F172A] border border-purple-900/40 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#6D28D9]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#C4B5FD]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white tracking-tight">Live Research</h4>
                <p className="text-[10px] text-slate-400">AI Agents Working...</p>
              </div>
            </div>

            {/* Glowing Green Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 no-print flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Sliding Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
