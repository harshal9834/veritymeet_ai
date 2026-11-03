import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  ShieldCheck, 
  History, 
  Settings as SettingsIcon, 
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SystemHealth } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  health: SystemHealth | null;
  onOpenSettings: () => void;
  activeMeetingId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  health,
  onOpenSettings,
  activeMeetingId,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'New Briefing', icon: FilePlus },
    ...(activeMeetingId ? [
      { id: 'progress', label: 'Research Progress', icon: Activity },
      { id: 'briefing', label: 'Current Briefing', icon: ShieldCheck },
      { id: 'verification', label: 'Claim Audit', icon: ShieldCheck },
    ] : []),
    { id: 'history', label: 'Briefing History', icon: History },
  ];

  const isConfigured = health?.ready ?? false;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          VM
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">VerityMeet AI</h1>
          <p className="text-[11px] text-slate-400">Briefing & Verification</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* API Integration Health Status Indicator */}
      <div className="p-3 border-t border-slate-800">
        <div 
          onClick={onOpenSettings}
          className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              API Gateway
            </span>
            {isConfigured ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Setup Needed
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span>Tavily Search:</span>
              <span className={health?.has_tavily ? 'text-emerald-400' : 'text-slate-500'}>
                {health?.has_tavily ? 'Connected' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bifrost / Grok:</span>
              <span className={health?.has_bifrost ? 'text-emerald-400' : 'text-slate-500'}>
                {health?.has_bifrost ? 'Connected' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
