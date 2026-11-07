import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Play,
  Globe,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  HelpCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  Link2,
  Bot,
  FileText,
  Search,
  Check,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onNavigateSignIn?: () => void;
  onNavigateSignUp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnterApp, 
  onNavigateSignIn, 
  onNavigateSignUp 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignInClick = () => {
    if (onNavigateSignIn) {
      onNavigateSignIn();
    } else {
      onEnterApp();
    }
  };

  const handleSignUpClick = () => {
    if (onNavigateSignUp) {
      onNavigateSignUp();
    } else {
      onEnterApp();
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#101B3A] selection:bg-[#2855F5] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F5]">
        <div className="max-w-[1340px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Left: Shield logo with blue and purple gradient + Brand */}
          <div 
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2855F5] via-[#4840EC] to-[#713BFA] flex items-center justify-center text-white shadow-md shadow-[#2855F5]/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <span className="font-extrabold text-xl text-[#101B3A] tracking-tight">
              VerityMeet <span className="text-[#101B3A]">AI</span>
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#52617D]">
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-[#2855F5] hover:text-[#2855F5] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2855F5] after:rounded-full"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="hover:text-[#2855F5] transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="hover:text-[#2855F5] transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('why-veritymeet')} 
              className="hover:text-[#2855F5] transition-colors"
            >
              Why VerityMeet
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-[#2855F5] transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right Side: Sign In + Get Started buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={handleSignInClick}
              className="px-5 py-2 text-sm font-semibold text-[#101B3A] hover:text-[#2855F5] bg-white border border-[#E2E8F5] hover:border-[#2855F5]/30 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUpClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 text-white text-sm font-bold shadow-md shadow-[#2855F5]/25 hover:shadow-lg hover:shadow-[#2855F5]/35 transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-[#52617D] hover:text-[#101B3A]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F5] px-6 py-4 space-y-3">
            <button onClick={() => scrollToSection('home')} className="block w-full text-left font-semibold text-[#2855F5]">Home</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left font-semibold text-[#52617D]">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left font-semibold text-[#52617D]">How It Works</button>
            <button onClick={() => scrollToSection('why-veritymeet')} className="block w-full text-left font-semibold text-[#52617D]">Why VerityMeet</button>
            <button onClick={() => scrollToSection('about')} className="block w-full text-left font-semibold text-[#52617D]">About</button>
            <div className="pt-3 border-t border-[#E2E8F5] flex flex-col gap-2">
              <button onClick={onEnterApp} className="w-full py-2 font-semibold text-center border border-[#E2E8F5] rounded-xl">Sign In</button>
              <button onClick={onEnterApp} className="w-full py-2.5 font-bold text-center bg-gradient-to-r from-[#2855F5] to-[#713BFA] text-white rounded-xl">Get Started</button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section id="home" className="relative pt-10 pb-20 overflow-hidden">
        
        {/* Soft light blue and purple ambient background gradient glow matching reference */}
        <div className="absolute top-0 left-0 right-0 h-[650px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-10 -left-20 w-[550px] h-[550px] bg-gradient-to-tr from-[#EFF5FF] via-[#F4F0FF] to-transparent rounded-full blur-3xl opacity-80" />
          <div className="absolute top-10 -right-20 w-[600px] h-[600px] bg-gradient-to-bl from-[#F4F0FF] via-[#EFF5FF] to-transparent rounded-full blur-3xl opacity-80" />
        </div>

        <div className="max-w-[1340px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF5FF] border border-[#2855F5]/20 text-[#2855F5] text-[11px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#2855F5]" />
                <span>AI-POWERED MEETING INTELLIGENCE</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#101B3A] tracking-tight leading-[1.08]">
                Walk Into Every Meeting{' '}
                <span className="bg-gradient-to-r from-[#2855F5] to-[#713BFA] bg-clip-text text-transparent">
                  Prepared.
                </span>
              </h1>

              {/* Supporting paragraph */}
              <p className="text-base sm:text-lg text-[#52617D] leading-relaxed max-w-lg">
                Research smarter. Verify every important fact. Discover what changed. Get AI-powered meeting briefings backed by real-time evidence.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={onEnterApp}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#2855F5]/30 transition-all active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#E2E8F5] hover:border-[#2855F5]/40 bg-white/90 hover:bg-white text-[#101B3A] font-semibold text-sm shadow-xs transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-[#101B3A] text-[#101B3A]" />
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Feature indicators below buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-6 text-xs font-bold text-[#101B3A]">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#2855F5] stroke-[2.2]" />
                  <span>Research</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#2855F5] stroke-[2.2]" />
                  <span>Intelligence</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2855F5] stroke-[2.2]" />
                  <span>Real-Time Verification</span>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Product Dashboard Mockup */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[660px]">
                {/* 3D bezel outer card with soft elevation & electric glow border */}
                <div className="rounded-[28px] p-2.5 bg-gradient-to-br from-[#2855F5]/40 via-[#101B3A] to-[#713BFA]/40 shadow-[0_30px_70px_-15px_rgba(40,85,245,0.30)] border border-[#2855F5]/30">
                  <div className="rounded-[20px] bg-[#101B3A] overflow-hidden flex flex-row border border-slate-800">
                    
                    {/* Dashboard Sidebar */}
                    <div className="w-[180px] bg-[#0b1329] p-4 text-left border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
                      <div className="space-y-4">
                        {/* VerityMeet Logo */}
                        <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#2855F5] to-[#713BFA] flex items-center justify-center text-white">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <span>VerityMeet AI</span>
                        </div>

                        {/* Sidebar Navigation */}
                        <div className="space-y-1 text-[11px] font-semibold text-slate-400">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition-colors cursor-pointer">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Dashboard</span>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#2855F5] text-white shadow-xs cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Create Briefing</span>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition-colors cursor-pointer">
                            <Clock className="w-3.5 h-3.5" />
                            <span>My Briefings</span>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition-colors cursor-pointer">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verification History</span>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition-colors cursor-pointer">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Settings</span>
                          </div>
                        </div>
                      </div>

                      {/* User Profile Area */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2855F5] to-[#713BFA] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                          HM
                        </div>
                        <div className="text-left leading-tight">
                          <div className="text-white text-[11px] font-bold">Harshal Mahajan</div>
                          <div className="text-slate-400 text-[9px]">Pro Plan</div>
                        </div>
                      </div>
                    </div>

                    {/* Main Dashboard Content Area */}
                    <div className="flex-1 bg-white p-5 text-left text-[#101B3A] overflow-hidden flex flex-col justify-between">
                      {/* Top Bar inside mockup */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F5]">
                        <div className="flex items-center gap-3">
                          {/* Microsoft Logo 4-grid */}
                          <div className="w-9 h-9 grid grid-cols-2 gap-0.5 p-1 bg-slate-50 rounded-lg border border-[#E2E8F5]">
                            <div className="bg-[#f25022] rounded-xs" />
                            <div className="bg-[#7fba00] rounded-xs" />
                            <div className="bg-[#00a4ef] rounded-xs" />
                            <div className="bg-[#ffb900] rounded-xs" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-[#101B3A] tracking-tight">Microsoft</h3>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EFF5FF] text-[#2855F5] border border-[#2855F5]/20">
                                Partnership Meeting
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#52617D] mt-0.5 font-semibold">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Mar 10, 2026
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                11:00 AM
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Circular Freshness Score Indicator: 92% */}
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[9px] font-bold text-[#52617D] uppercase tracking-tight block mb-1">
                            Freshness Score
                          </span>
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-100"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-[#10B981]"
                                strokeDasharray="92, 100"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute text-[11px] font-extrabold text-[#101B3A]">
                              92%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Briefing Tabs inside Mockup */}
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#52617D] py-2 border-b border-[#E2E8F5]">
                        <span className="text-[#2855F5] border-b-2 border-[#2855F5] pb-1">Overview</span>
                        <span className="hover:text-[#101B3A] cursor-pointer">Developments</span>
                        <span className="hover:text-[#101B3A] cursor-pointer">Verification</span>
                        <span className="hover:text-[#101B3A] cursor-pointer">Insights</span>
                        <span className="hover:text-[#101B3A] cursor-pointer">Sources</span>
                      </div>

                      {/* Two Cards: Executive Summary & Fact Verification */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {/* Card 1: Executive Summary */}
                        <div className="p-3 rounded-xl border border-[#E2E8F5] bg-slate-50/70 space-y-2">
                          <h4 className="text-[11px] font-bold text-[#101B3A]">Executive Summary</h4>
                          <p className="text-[10px] text-[#52617D] leading-relaxed">
                            Microsoft continues to strengthen its AI and cloud portfolio with new Copilot features and strategic partnerships.
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <div className="h-1.5 bg-[#E2E8F5] rounded-full w-full" />
                            <div className="h-1.5 bg-[#E2E8F5] rounded-full w-4/5" />
                          </div>
                        </div>

                        {/* Card 2: Fact & Freshness Verification */}
                        <div className="p-3 rounded-xl border border-[#E2E8F5] bg-white shadow-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#101B3A]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Fact & Freshness Verification</span>
                          </div>

                          <div className="space-y-1.5 text-[10px]">
                            {/* 10 Fresh */}
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/90 border border-emerald-100">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                                <span className="font-extrabold text-[#101B3A]">10</span>
                                <span className="text-emerald-800 font-semibold">Fresh</span>
                              </div>
                            </div>

                            {/* 1 Stale */}
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/90 border border-amber-100">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3 text-[#F59E0B] shrink-0" />
                                <span className="font-extrabold text-[#101B3A]">1</span>
                                <span className="text-amber-800 font-semibold">Stale</span>
                              </div>
                            </div>

                            {/* ? Uncertain */}
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-purple-50/90 border border-purple-100">
                              <div className="flex items-center gap-1.5">
                                <HelpCircle className="w-3 h-3 text-[#713BFA] shrink-0" />
                                <span className="font-extrabold text-[#101B3A]">?</span>
                                <span className="text-purple-800 font-semibold">Uncertain</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PROBLEM SECTION */}
      {/* ========================================================= */}
      <section className="py-16 bg-white border-t border-[#E2E8F5]">
        <div className="max-w-[1340px] mx-auto px-6 text-center space-y-10">
          <div>
            <span className="text-[11px] font-extrabold text-[#2855F5] tracking-wider uppercase">
              THE PROBLEM
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B3A] tracking-tight mt-1">
              Outdated Information Can Cost You Opportunities.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Card 1: Information Overload */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs hover:border-[#2855F5]/30 hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center shrink-0 border border-rose-100">
                <Layers className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#101B3A] text-base">Information Overload</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Finding relevant company updates across multiple websites takes time.
                </p>
              </div>
            </div>

            {/* Card 2: Outdated Facts */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs hover:border-[#2855F5]/30 hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0 border border-amber-100">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#101B3A] text-base">Outdated Facts</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Old leadership details, pricing, and product information can lead to incorrect assumptions.
                </p>
              </div>
            </div>

            {/* Card 3: Unprepared Meetings */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs hover:border-[#2855F5]/30 hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EFF5FF] text-[#2855F5] flex items-center justify-center shrink-0 border border-blue-100">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#101B3A] text-base">Unprepared Meetings</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Important developments and talking points can easily be missed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FEATURES SECTION */}
      {/* ========================================================= */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-[1340px] mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold text-[#2855F5] tracking-wider uppercase">
              FEATURES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#101B3A] tracking-tight">
              Everything You Need Before the Meeting.
            </h2>
          </div>

          {/* 6 Feature cards in 1 row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            
            {/* Feature 1: AI-Powered Research */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-[#EFF5FF]/40 hover:bg-[#EFF5FF]/70 shadow-xs hover:border-[#2855F5]/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF5FF] text-[#2855F5] flex items-center justify-center border border-[#2855F5]/20">
                  <Bot className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">AI-Powered Research</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Automatically research companies, people, products, and recent developments.
                </p>
              </div>
            </div>

            {/* Feature 2: Intelligent Briefings */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-[#F4F0FF]/40 hover:bg-[#F4F0FF]/70 shadow-xs hover:border-[#713BFA]/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F0FF] text-[#713BFA] flex items-center justify-center border border-[#713BFA]/20">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">Intelligent Briefings</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Generate concise, structured briefings based on context and research.
                </p>
              </div>
            </div>

            {/* Feature 3: Real-Time Fact Verification */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-emerald-50/30 hover:bg-emerald-50/60 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">Real-Time Fact Verification</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Recheck important claims against live web evidence.
                </p>
              </div>
            </div>

            {/* Feature 4: Stale Information Detection */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-rose-50/30 hover:bg-rose-50/60 shadow-xs hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-200">
                  <RefreshCw className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">Stale Information Detection</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Identify potentially outdated information and flag it.
                </p>
              </div>
            </div>

            {/* Feature 5: Evidence-Backed Corrections */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-[#F4F0FF]/40 hover:bg-[#F4F0FF]/70 shadow-xs hover:border-[#713BFA]/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F0FF] text-[#713BFA] flex items-center justify-center border border-[#713BFA]/20">
                  <Layers className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">Evidence-Backed Corrections</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Suggest updated facts only when supporting evidence is available.
                </p>
              </div>
            </div>

            {/* Feature 6: Source Transparency */}
            <div className="p-5 rounded-2xl border border-[#E2E8F5] bg-[#EFF5FF]/40 hover:bg-[#EFF5FF]/70 shadow-xs hover:border-[#2855F5]/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF5FF] text-[#2855F5] flex items-center justify-center border border-[#2855F5]/20">
                  <Link2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="font-extrabold text-[#101B3A] text-sm leading-snug">Source Transparency</h3>
                <p className="text-xs text-[#52617D] leading-relaxed">
                  Provide clickable source links for all important claims and updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HOW IT WORKS SECTION */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-20 bg-slate-50/60 border-t border-[#E2E8F5]">
        <div className="max-w-[1340px] mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold text-[#2855F5] tracking-wider uppercase">
              WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B3A] tracking-tight">
              From Research to Meeting-Ready in Minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F5] shadow-xs space-y-3 relative group hover:border-[#2855F5]/40 transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#EFF5FF] text-[#2855F5] font-extrabold text-sm flex items-center justify-center border border-[#2855F5]/20">
                1
              </div>
              <h3 className="font-bold text-[#101B3A] text-base">Enter Meeting Details</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Add a company or person's name and scheduled meeting date and time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F5] shadow-xs space-y-3 relative group hover:border-[#2855F5]/40 transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#EFF5FF] text-[#2855F5] font-extrabold text-sm flex items-center justify-center border border-[#2855F5]/20">
                2
              </div>
              <h3 className="font-bold text-[#101B3A] text-base">AI Researches the Target</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Search relevant developments from the 30 days preceding the meeting.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F5] shadow-xs space-y-3 relative group hover:border-[#2855F5]/40 transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#EFF5FF] text-[#2855F5] font-extrabold text-sm flex items-center justify-center border border-[#2855F5]/20">
                3
              </div>
              <h3 className="font-bold text-[#101B3A] text-base">Verify Important Information</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Check supporting evidence, source quality, freshness and uncertainty.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F5] shadow-xs space-y-3 relative group hover:border-[#2855F5]/40 transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#EFF5FF] text-[#2855F5] font-extrabold text-sm flex items-center justify-center border border-[#2855F5]/20">
                4
              </div>
              <h3 className="font-bold text-[#101B3A] text-base">Get Your Meeting Briefing</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Receive a concise one-page report with key developments, sources and useful questions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. WHY VERITYMEET SECTION */}
      {/* ========================================================= */}
      <section id="why-veritymeet" className="py-20 bg-white border-t border-[#E2E8F5]">
        <div className="max-w-[1340px] mx-auto px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-extrabold text-[#2855F5] tracking-wider uppercase">
              WHY VERITYMEET
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#101B3A] tracking-tight">
              Prepare With Confidence. Not Assumptions.
            </h2>
            <p className="text-sm text-[#52617D] leading-relaxed">
              Equip yourself with verified, source-backed facts before every critical conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs space-y-3 hover:border-[#2855F5]/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EFF5FF] text-[#2855F5] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[#101B3A] text-lg">Save Research Time</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Condense hours of multi-source web investigations, earnings transcripts, and news releases into a comprehensive 30-day dossier within seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs space-y-3 hover:border-[#713BFA]/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0FF] text-[#713BFA] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[#101B3A] text-lg">Stay Informed About Recent Changes</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Spot leadership changes, product updates, partnership expansions, and regulatory shifts before your counterpart brings them up.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F5] shadow-xs space-y-3 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[#101B3A] text-lg">Verified Facts & Smart Questions</h3>
              <p className="text-xs text-[#52617D] leading-relaxed">
                Enter meetings with verified information, deterministic freshness confidence scores, and strategic probing questions crafted for your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FINAL CALL TO ACTION */}
      {/* ========================================================= */}
      <section className="py-20 bg-gradient-to-r from-[#EFF5FF] via-[#F4F0FF] to-[#EFF5FF] border-y border-[#E2E8F5] text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#2855F5]/20 text-[#2855F5] text-[11px] font-bold tracking-wider uppercase shadow-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>EXECUTIVE MEETING PREPARATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101B3A] tracking-tight">
            Make Every Meeting Count.
          </h2>

          <p className="text-base text-[#52617D] leading-relaxed max-w-xl mx-auto">
            Get the information you need before the conversation begins.
          </p>

          <div className="pt-2">
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 text-white font-bold text-base shadow-xl shadow-[#2855F5]/30 hover:shadow-2xl hover:shadow-[#2855F5]/40 transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. FOOTER */}
      {/* ========================================================= */}
      <footer id="about" className="bg-white border-t border-[#E2E8F5] py-14 text-sm text-[#52617D]">
        <div className="max-w-[1340px] mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-left">
            
            {/* Col 1: Brand & Desc */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2855F5] via-[#4840EC] to-[#713BFA] flex items-center justify-center text-white shadow-md shadow-[#2855F5]/25">
                  <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="font-extrabold text-xl text-[#101B3A] tracking-tight">
                  VerityMeet <span className="text-[#101B3A]">AI</span>
                </span>
              </div>
              <p className="text-xs text-[#52617D] leading-relaxed max-w-sm">
                AI-Powered Pre-Meeting Briefing Agent. Discovers recent company developments, verifies important facts with live web evidence, and equips you with actionable meeting strategy.
              </p>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-2.5 text-xs">
              <span className="font-bold text-[#101B3A] uppercase tracking-wider block">Product</span>
              <button onClick={() => scrollToSection('features')} className="block hover:text-[#2855F5] text-left">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block hover:text-[#2855F5] text-left">How It Works</button>
              <button onClick={() => scrollToSection('why-veritymeet')} className="block hover:text-[#2855F5] text-left">Why VerityMeet</button>
              <button onClick={onEnterApp} className="block hover:text-[#2855F5] text-left">Launch App</button>
            </div>

            {/* Col 3: Company */}
            <div className="space-y-2.5 text-xs">
              <span className="font-bold text-[#101B3A] uppercase tracking-wider block">Company</span>
              <button onClick={() => scrollToSection('about')} className="block hover:text-[#2855F5] text-left">About</button>
              <a href="mailto:contact@veritymeet.ai" className="block hover:text-[#2855F5]">Contact</a>
              <button onClick={onEnterApp} className="block hover:text-[#2855F5] text-left">Sign In</button>
            </div>

            {/* Col 4: Legal */}
            <div className="space-y-2.5 text-xs">
              <span className="font-bold text-[#101B3A] uppercase tracking-wider block">Legal</span>
              <span className="block hover:text-[#2855F5] cursor-pointer">Privacy Policy</span>
              <span className="block hover:text-[#2855F5] cursor-pointer">Terms of Service</span>
              <span className="block hover:text-[#2855F5] cursor-pointer">Security & Audit</span>
            </div>

          </div>

          <div className="pt-8 border-t border-[#E2E8F5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52617D]">
            <span>© 2026 VerityMeet AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Powered by Tavily & LangGraph</span>
              <span>•</span>
              <button onClick={onEnterApp} className="text-[#2855F5] font-semibold hover:underline">
                Enter App →
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
