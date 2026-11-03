import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { SystemHealth } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: SystemHealth | null;
  onHealthUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  health,
  onHealthUpdate,
}) => {
  const [tavilyKey, setTavilyKey] = useState('');
  const [bifrostKey, setBifrostKey] = useState('');
  const [bifrostUrl, setBifrostUrl] = useState('https://api.bifrost.maxim.ai/v1');
  const [grokModel, setGrokModel] = useState('grok-2-latest');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (health) {
      if (health.bifrost_base_url) setBifrostUrl(health.bifrost_base_url);
      if (health.grok_model) setGrokModel(health.grok_model);
    }
  }, [health]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
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
      setStatusMessage({ type: 'success', text: 'API Configuration updated successfully!' });
      setTavilyKey('');
      setBifrostKey('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">API Credentials & Integrations</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="px-6 pt-4">
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            health?.ready 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {health?.ready ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {health?.ready ? 'All External APIs Configured' : 'Credentials Required'}
              </p>
              <p className="mt-0.5 opacity-90">
                {health?.ready 
                  ? 'Tavily Search and Bifrost Grok Gateway are ready for live research.'
                  : `Missing: ${health?.missing_keys.join(', ') || 'API keys'}. Please provide keys below or in .env.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {statusMessage && (
            <div className={`p-2.5 rounded-lg text-xs font-medium ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-700">Tavily API Key (Live Web Research)</label>
              <span className={`text-[11px] ${health?.has_tavily ? 'text-emerald-600' : 'text-slate-400'}`}>
                {health?.has_tavily ? '✓ Set on server' : 'Not set'}
              </span>
            </div>
            <input
              type="password"
              placeholder={health?.has_tavily ? '•••••••••••••••••••• (Leave blank to keep)' : 'tvly-...'}
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-700">Bifrost API Key (Maxim AI Gateway)</label>
              <span className={`text-[11px] ${health?.has_bifrost ? 'text-emerald-600' : 'text-slate-400'}`}>
                {health?.has_bifrost ? '✓ Set on server' : 'Not set'}
              </span>
            </div>
            <input
              type="password"
              placeholder={health?.has_bifrost ? '•••••••••••••••••••• (Leave blank to keep)' : 'maxim_...'}
              value={bifrostKey}
              onChange={(e) => setBifrostKey(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bifrost Gateway Base URL</label>
              <input
                type="text"
                value={bifrostUrl}
                onChange={(e) => setBifrostUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Grok Model Identifier</label>
              <input
                type="text"
                value={grokModel}
                onChange={(e) => setGrokModel(e.target.value)}
                placeholder="grok-2-latest"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
