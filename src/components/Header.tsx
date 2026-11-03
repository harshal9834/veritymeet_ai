import React from 'react';
import { Settings as SettingsIcon, Download, Plus, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  activeMeetingTarget?: string;
  onOpenSettings: () => void;
  onNewBriefing: () => void;
  onExportPdf?: () => void;
  canExportPdf?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeMeetingTarget,
  onOpenSettings,
  onNewBriefing,
  onExportPdf,
  canExportPdf = false,
}) => {
  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Overview · Operational Intelligence';
      case 'create':
        return 'New Intelligence Request · Parameters';
      case 'progress':
        return activeMeetingTarget 
          ? `Live Research · ${activeMeetingTarget}` 
          : 'Live Workflow Orchestration';
      case 'briefing':
        return activeMeetingTarget 
          ? `Verified Briefing · ${activeMeetingTarget}` 
          : 'Verified Meeting Briefing';
      case 'verification':
        return activeMeetingTarget 
          ? `Claim Verification · ${activeMeetingTarget}` 
          : 'Claim Verification Audit';
      case 'history':
        return 'Archive · Previously Generated Briefings';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="h-16 px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0 no-print">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap shrink-0">
        <span className="font-semibold text-slate-900 tracking-tight">VerityMeet AI</span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">{getBreadcrumbs()}</span>
      </div>

      {/* Zone 2: Navigation / Info */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
        <span>Grok Model via Bifrost Gateway</span>
        <span aria-hidden="true">·</span>
        <span>Tavily Live Web Evidence</span>
      </div>

      {/* Zone 3: Primary Action Buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {canExportPdf && onExportPdf && (
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PDF</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>API Keys</span>
        </button>

        <button
          onClick={onNewBriefing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Briefing</span>
        </button>
      </div>
    </header>
  );
};
