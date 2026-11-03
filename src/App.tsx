import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { DashboardPage } from './pages/DashboardPage';
import { CreateBriefingPage } from './pages/CreateBriefingPage';
import { ProgressPage } from './pages/ProgressPage';
import { BriefingPage } from './pages/BriefingPage';
import { VerificationPage } from './pages/VerificationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SystemHealth, DashboardStats, Meeting } from './types';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (e) {
      console.error('Failed to load health status', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        api.getStats(),
        api.listMeetings()
      ]);
      setStats(s);
      setMeetings(m.meetings);
    } catch (e) {
      console.error('Failed to load initial data', e);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadData();
  }, [loadHealth, loadData]);

  // When active meeting ID changes, load its details
  useEffect(() => {
    if (activeMeetingId) {
      api.getMeeting(activeMeetingId)
        .then(m => setActiveMeeting(m))
        .catch(console.error);
    } else {
      setActiveMeeting(null);
    }
  }, [activeMeetingId]);

  const handleOpenMeeting = (id: string) => {
    setActiveMeetingId(id);
    // Find meeting status
    const target = meetings.find(m => m.id === id);
    if (target?.status === 'completed') {
      setCurrentTab('briefing');
    } else if (target?.status === 'processing') {
      setCurrentTab('progress');
    } else {
      setCurrentTab('briefing');
    }
  };

  const handleBriefingCreated = (id: string) => {
    setActiveMeetingId(id);
    setCurrentTab('progress');
    loadData();
  };

  const handleExportPdf = () => {
    if (activeMeetingId) {
      window.open(api.getExportPdfUrl(activeMeetingId), '_blank');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        health={health}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeMeetingId={activeMeetingId}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          activeMeetingTarget={activeMeeting?.target_name}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewBriefing={() => setCurrentTab('create')}
          onExportPdf={handleExportPdf}
          canExportPdf={Boolean(activeMeetingId && currentTab === 'briefing')}
        />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              meetings={meetings}
              onNewBriefing={() => setCurrentTab('create')}
              onOpenMeeting={handleOpenMeeting}
            />
          )}

          {currentTab === 'create' && (
            <CreateBriefingPage
              health={health}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onBriefingCreated={handleBriefingCreated}
            />
          )}

          {currentTab === 'progress' && activeMeetingId && (
            <ProgressPage
              meetingId={activeMeetingId}
              onComplete={() => {
                setCurrentTab('briefing');
                loadData();
              }}
            />
          )}

          {currentTab === 'briefing' && activeMeetingId && (
            <BriefingPage
              meetingId={activeMeetingId}
              onOpenVerification={() => setCurrentTab('verification')}
            />
          )}

          {currentTab === 'verification' && activeMeetingId && (
            <VerificationPage
              meetingId={activeMeetingId}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              onOpenMeeting={handleOpenMeeting}
              onNewBriefing={() => setCurrentTab('create')}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        onHealthUpdate={() => {
          loadHealth();
          loadData();
        }}
      />
    </div>
  );
}
