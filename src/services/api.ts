import { 
  Meeting, 
  Briefing, 
  Claim, 
  WorkflowEvent, 
  SystemHealth, 
  DashboardStats,
  User,
  AuthResponse
} from '../types';

let currentAccessToken: string | null = null;

export const authHeader = () => {
  if (currentAccessToken) {
    return { 'Authorization': `Bearer ${currentAccessToken}` };
  }
  return {};
};

export const setApiAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getApiAccessToken = () => currentAccessToken;

export const api = {
  // Authentication endpoints
  async register(data: { full_name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const result: AuthResponse = await res.json();
    setApiAccessToken(result.access_token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Sign in failed');
    }
    const result: AuthResponse = await res.json();
    setApiAccessToken(result.access_token);
    return result;
  },

  async getMe(): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error('Unauthenticated');
    }
    return res.json();
  },

  async refresh(): Promise<AuthResponse> {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error('Refresh failed');
    }
    const result: AuthResponse = await res.json();
    setApiAccessToken(result.access_token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { ...authHeader() },
        credentials: 'include'
      });
    } finally {
      setApiAccessToken(null);
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; dev_reset_token?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Password reset failed');
    }
    return res.json();
  },

  // System & Workspace endpoints
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
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(config),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to update credentials');
    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats', {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async listMeetings(): Promise<{ meetings: Meeting[] }> {
    const res = await fetch('/api/meetings', {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  },

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create meeting research request');
    }
    return res.json();
  },

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`/api/meetings/${id}`, {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Meeting not found');
    return res.json();
  },

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`/api/meetings/${id}`, { 
      method: 'DELETE',
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete meeting');
  },

  async getProgress(id: string): Promise<{
    meeting_id: string;
    status: string;
    current_step: string;
    error_message?: string;
    events: WorkflowEvent[];
    sources_count?: number;
    claims_count?: number;
  }> {
    const res = await fetch(`/api/meetings/${id}/progress`, {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch workflow progress');
    return res.json();
  },

  async getBriefing(id: string): Promise<Briefing> {
    const res = await fetch(`/api/meetings/${id}/briefing`, {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Briefing not ready');
    }
    return res.json();
  },

  async getClaims(id: string): Promise<{ meeting_id: string; claims: Claim[] }> {
    const res = await fetch(`/api/meetings/${id}/claims`, {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch verified claims');
    return res.json();
  },

  async listAllClaims(): Promise<{ claims: Claim[] }> {
    const res = await fetch('/api/claims', {
      headers: { ...authHeader() },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch claims list');
    return res.json();
  },

  getExportPdfUrl(meetingId: string): string {
    return `/api/meetings/${meetingId}/pdf`;
  }
};
