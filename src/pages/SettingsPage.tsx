import React, { useState, useEffect } from 'react';
import { 
  Building, 
  User, 
  Key, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Trash2, 
  Database,
  Globe,
  Sparkles
} from 'lucide-react';
import { SystemHealth } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  health: SystemHealth | null;
  onHealthUpdate: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ health, onHealthUpdate }) => {
  // Profile settings
  const [name, setName] = useState(localStorage.getItem('vm_user_name') || '');
  const [role, setRole] = useState(localStorage.getItem('vm_user_role') || '');
  const [company, setCompany] = useState(localStorage.getItem('vm_user_company') || '');
  const [companyDesc, setCompanyDesc] = useState(localStorage.getItem('vm_user_desc') || '');
  const [offering, setOffering] = useState(localStorage.getItem('vm_user_offering') || '');

  // Research Defaults
  const [defaultPeriod, setDefaultPeriod] = useState(localStorage.getItem('vm_def_period') || 'Last 30 days');
  const [defaultDepth, setDefaultDepth] = useState(localStorage.getItem('vm_def_depth') || 'Standard Briefing');

  // API Config
  const [tavilyKey, setTavilyKey] = useState('');
  const [grokApi, setGrokApi] = useState('');
  const [bifrostKey, setBifrostKey] = useState('');
  const [bifrostUrl, setBifrostUrl] = useState(health?.bifrost_base_url || 'https://api.bifrost.maxim.ai/v1');
  const [grokModel, setGrokModel] = useState(health?.grok_model || 'openai/gpt-oss-120b');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (health) {
      if (health.bifrost_base_url) setBifrostUrl(health.bifrost_base_url);
      if (health.grok_model) setGrokModel(health.grok_model);
    }
  }, [health]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vm_user_name', name);
    localStorage.setItem('vm_user_role', role);
    localStorage.setItem('vm_user_company', company);
    localStorage.setItem('vm_user_desc', companyDesc);
    localStorage.setItem('vm_user_offering', offering);
    localStorage.setItem('vm_def_period', defaultPeriod);
    localStorage.setItem('vm_def_depth', defaultDepth);
    setStatusMessage({ type: 'success', text: 'User Profile & Preferences saved locally.' });
  };

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const payload: any = {};
      if (tavilyKey.trim()) payload.TAVILY_API_KEY = tavilyKey.trim();
      if (bifrostKey.trim()) payload.BIFROST_API_KEY = bifrostKey.trim();
      if (bifrostUrl.trim()) payload.BIFROST_BASE_URL = bifrostUrl.trim();
      if (grokModel.trim()) payload.GROK_MODEL = grokModel.trim();

      await api.updateConfig(payload);
      onHealthUpdate();
      setStatusMessage({ type: 'success', text: 'API Configuration synchronized with server.' });
      setTavilyKey('');
      setBifrostKey('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update API credentials.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-slate-900">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Integrations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure your executive profile for tailored briefing synthesis and manage your search/LLM credentials.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* User Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Personal & Executive Profile</h2>
          </div>
          <span className="text-[11px] text-slate-400">Used for meeting opportunity personalization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Job Role</label>
            <input
              type="text"
              placeholder="e.g. Chief Revenue Officer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Company</label>
            <input
              type="text"
              placeholder="e.g. Apex Global"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description</label>
          <textarea
            rows={2}
            placeholder="What does your company specialize in?"
            value={companyDesc}
            onChange={(e) => setCompanyDesc(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Default Value Proposition / Offering</label>
          <textarea
            rows={2}
            placeholder="Standard commercial or technical synergy you offer to prospective partners..."
            value={offering}
            onChange={(e) => setOffering(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* External API Integration */}
      <form onSubmit={handleSaveApi} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">API Gateway & Models</h2>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${health?.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {health?.ready ? '● Credentials Active' : '● Setup Required'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Tavily Search API Key</label>
              <span className="text-[11px] text-emerald-600">{health?.has_tavily ? '✓ Set on server' : 'Not configured'}</span>
            </div>
            <input
              type="password"
              placeholder={health?.has_tavily ? '•••••••••••••••••••• (Leave blank to keep current)' : 'tvly-...'}
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bifrost Gateway Base URL</label>
              <input
                type="text"
                value={bifrostUrl}
                onChange={(e) => setBifrostUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grok Model Identifier</label>
              <input
                type="text"
                value={grokModel}
                onChange={(e) => setGrokModel(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Update API Keys</span>
          </button>
        </div>
      </form>
    </div>
  );
};
