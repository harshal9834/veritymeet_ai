import { Meeting, Briefing, Claim, WorkflowEvent, SystemHealth, DashboardStats } from '../types';

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async updateConfig(config: {
    TAVILY_API_KEY?: string;
    BIFROST_BASE_URL?: string;
    BIFROST_API_KEY?: string;
    GROK_MODEL?: string;
  }): Promise<any> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update credentials');
    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async listMeetings(): Promise<{ meetings: Meeting[] }> {
    const res = await fetch('/api/meetings');
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  },

  async createMeeting(data: {
    target_name: string;
    meeting_date: string;
    meeting_time: string;
    meeting_type: string;
    context?: string;
    objective?: string;
    interests?: string[];
  }): Promise<Meeting> {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create meeting research request');
    }
    return res.json();
  },

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`/api/meetings/${id}`);
    if (!res.ok) throw new Error('Meeting not found');
    return res.json();
  },

  async getProgress(id: string): Promise<{
    meeting_id: string;
    status: string;
    current_step: string;
    error_message?: string;
    events: WorkflowEvent[];
  }> {
    const res = await fetch(`/api/meetings/${id}/progress`);
    if (!res.ok) throw new Error('Failed to fetch workflow progress');
    return res.json();
  },

  async getBriefing(id: string): Promise<Briefing> {
    const res = await fetch(`/api/meetings/${id}/briefing`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Briefing not ready');
    }
    return res.json();
  },

  async getClaims(id: string): Promise<{ meeting_id: string; claims: Claim[] }> {
    const res = await fetch(`/api/meetings/${id}/claims`);
    if (!res.ok) throw new Error('Failed to fetch claims');
    return res.json();
  },

  getExportPdfUrl(id: string): string {
    return `/api/meetings/${id}/pdf`;
  }
};
