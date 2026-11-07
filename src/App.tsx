import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateBriefingPage } from './pages/CreateBriefingPage';
import { ProgressPage } from './pages/ProgressPage';
import { BriefingPage } from './pages/BriefingPage';
import { VerificationPage } from './pages/VerificationPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SystemHealth, DashboardStats, Meeting } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  // Navigation states: 'landing' | 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'dashboard' | 'create' | 'progress' | 'briefing' | 'verification' | 'history' | 'settings'
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [resetToken, setResetToken] = useState<string>('');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  }, [loadHealth]);

  // When user signs in, load their user-specific briefings & stats
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

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

  const handleDeleteMeeting = async (id: string) => {
    try {
      await api.deleteMeeting(id);
      if (activeMeetingId === id) {
        setActiveMeetingId(null);
        setCurrentTab('dashboard');
      }
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete meeting');
    }
  };

  const handleExportPdf = () => {
    if (activeMeetingId) {
      window.open(api.getExportPdfUrl(activeMeetingId), '_blank');
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentTab('landing');
  };

  // Route protection guard
  const protectedTabs = ['dashboard', 'create', 'progress', 'briefing', 'verification', 'history', 'settings'];

  // Handle protected route interception
  const navigateToTab = (tab: string) => {
    if (protectedTabs.includes(tab) && !isAuthenticated && !authLoading) {
      setCurrentTab('signin');
      return;
    }
    setCurrentTab(tab);
  };

  // 1. Public Landing Page
  if (currentTab === 'landing') {
    return (
      <LandingPage 
        onEnterApp={() => {
          if (isAuthenticated) {
            setCurrentTab('dashboard');
          } else {
            setCurrentTab('signin');
          }
        }}
        onNavigateSignIn={() => setCurrentTab('signin')}
        onNavigateSignUp={() => setCurrentTab('signup')}
      />
    );
  }

  // 2. Authentication Pages
  if (currentTab === 'signin') {
    return (
      <SignInPage
        onSuccess={() => {
          setCurrentTab('dashboard');
          loadData();
        }}
        onNavigateSignUp={() => setCurrentTab('signup')}
        onNavigateForgotPassword={() => setCurrentTab('forgot-password')}
        onGoHome={() => setCurrentTab('landing')}
      />
    );
  }

  if (currentTab === 'signup') {
    return (
      <SignUpPage
        onSuccess={() => {
          setCurrentTab('dashboard');
          loadData();
        }}
        onNavigateSignIn={() => setCurrentTab('signin')}
        onGoHome={() => setCurrentTab('landing')}
      />
    );
  }

  if (currentTab === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateSignIn={() => setCurrentTab('signin')}
        onNavigateResetPasswordWithToken={(tok) => {
          setResetToken(tok);
          setCurrentTab('reset-password');
        }}
        onGoHome={() => setCurrentTab('landing')}
      />
    );
  }

  if (currentTab === 'reset-password') {
    return (
      <ResetPasswordPage
        initialToken={resetToken}
        onSuccess={() => setCurrentTab('signin')}
        onNavigateSignIn={() => setCurrentTab('signin')}
        onGoHome={() => setCurrentTab('landing')}
      />
    );
  }

  // 3. Authenticated App Layout (Protected Routes)
  return (
    <div className="flex h-screen bg-[#F3F4F9] overflow-hidden font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        health={health}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeMeetingId={activeMeetingId}
        onGoLanding={() => setCurrentTab('landing')}
        user={user}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          activeMeetingTarget={activeMeeting?.target_name}
          user={user}
          onNewBriefing={() => navigateToTab('create')}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigateTab={navigateToTab}
        />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              meetings={meetings}
              onNewBriefing={() => navigateToTab('create')}
              onOpenMeeting={handleOpenMeeting}
              onDeleteMeeting={handleDeleteMeeting}
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
              onNewBriefing={() => navigateToTab('create')}
            />
          )}

          {currentTab === 'briefing' && activeMeetingId && (
            <BriefingPage
              meetingId={activeMeetingId}
              onOpenVerification={() => navigateToTab('verification')}
              onDeleteMeeting={handleDeleteMeeting}
            />
          )}

          {currentTab === 'verification' && (
            <VerificationPage
              meetingId={activeMeetingId || undefined}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              onOpenMeeting={handleOpenMeeting}
              onNewBriefing={() => navigateToTab('create')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              health={health}
              onHealthUpdate={loadHealth}
            />
          )}
        </main>
      </div>

      {/* Quick Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        onHealthUpdate={loadHealth}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
