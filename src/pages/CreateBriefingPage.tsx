import React, { useState, useMemo } from 'react';
import { 
  Building, 
  User, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Globe
} from 'lucide-react';
import { SystemHealth } from '../types';
import { api } from '../services/api';

interface CreateBriefingPageProps {
  health: SystemHealth | null;
  onOpenSettings: () => void;
  onBriefingCreated: (meetingId: string) => void;
}

export const CreateBriefingPage: React.FC<CreateBriefingPageProps> = ({
  health,
  onOpenSettings,
  onBriefingCreated,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Section A - Meeting Info
  const [meetingDate, setMeetingDate] = useState(todayStr);
  const [meetingTime, setMeetingTime] = useState('14:00');

  // Section B - Target Entity
  const [targetType, setTargetType] = useState<'Company' | 'Individual'>('Company');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [personName, setPersonName] = useState('');
  const [personProfileUrl, setPersonProfileUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Computed Target Name
  const targetName = useMemo(() => {
    if (targetType === 'Company') return companyName.trim();
    return personName.trim();
  }, [targetType, companyName, personName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate target type
    if (targetType !== 'Company' && targetType !== 'Individual') {
      setErrorMessage('Please select a valid target type (Company or Individual).');
      return;
    }

    // 2. Validate company or person's name
    if (!targetName) {
      setErrorMessage(
        targetType === 'Company'
          ? 'Please enter the target company name.'
          : "Please enter the target person's full name."
      );
      return;
    }

    // 3. Validate meeting date
    if (!meetingDate || !meetingDate.trim()) {
      setErrorMessage('Please select the scheduled meeting date.');
      return;
    }

    // 4. Validate meeting time
    if (!meetingTime || !meetingTime.trim()) {
      setErrorMessage('Please select the scheduled meeting time.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const meetingType = 'Executive Briefing';

      // 5. Submit existing compatible request to backend
      const payload = {
        target_name: targetName,
        meeting_title: `${targetType === 'Company' ? 'Briefing' : 'Meeting'} with ${targetName}`,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        timezone,
        duration: 45,
        meeting_type: meetingType,
        meeting_mode: 'Video Conference',
        meeting_location: '',
        target_type: targetType,
        company_name: targetType === 'Company' ? companyName.trim() : '',
        company_website: targetType === 'Company' ? companyWebsite.trim() : personProfileUrl.trim(),
        person_name: targetType === 'Individual' ? personName.trim() : '',
        person_designation: '',
        person_linkedin: targetType === 'Individual' ? personProfileUrl.trim() : '',
        target_industry: 'Technology',
        target_market: 'Global',
        user_name: '',
        user_company: '',
        user_role: '',
        user_website: '',
        user_company_description: '',
        user_offering: '',
        context: '',
        objective: `Comprehensive pre-meeting intelligence briefing and strategic alignment for meeting with ${targetName}`,
        desired_outcome: '',
        discussion_topics: [
          'Recent announcements & company overview',
          'Product updates & roadmaps',
          'Leadership changes & strategic initiatives'
        ],
        existing_questions: [],
        previous_relationship: 'First Meeting',
        research_focus: [
          'Company Overview',
          'Latest News',
          'Leadership and Management',
          'Product and Service Updates',
          'Partnerships and Acquisitions'
        ],
        custom_research_instructions: '',
        research_period: 'Last 30 days',
        geographic_focus: 'Global',
        preferred_sources: ['Official company websites', 'Reputable news publishers'],
        excluded_topics: '',
        briefing_depth: 'Standard Briefing',
        output_language: 'English',
        writing_style: 'Executive',
        meeting_priority: 'General Preparation',
        include_swot: true,
        include_questions: true,
        include_talking_points: true,
        include_risk_analysis: true,
        include_source_references: true,
        include_fact_verification: true,
        uploaded_documents: [],
        interests: [
          'Company Overview',
          'Latest News',
          'Leadership and Management',
          'Product and Service Updates',
          'Partnerships and Acquisitions'
        ]
      };

      const res = await api.createMeeting(payload);
      onBriefingCreated(res.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate briefing research.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Prepare a New Meeting Intelligence Briefing
        </h1>
        <p className="text-sm text-slate-500">
          Provide the scheduled meeting date, time, and target entity. VerityMeet AI will orchestrate 13-node live web verification across the previous 30 days and generate your executive briefing.
        </p>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Unable to Start Briefing</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form Canvas */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* SECTION A — MEETING INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                A
              </span>
              <h2 className="text-base font-bold text-slate-900">Meeting Information</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Specify the scheduled date and time for your upcoming meeting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Meeting Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Meeting Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B — TARGET COMPANY OR INDIVIDUAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <h2 className="text-base font-bold text-slate-900">Who Are You Meeting?</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Specify whether you are meeting an organization or an individual.</p>
            </div>

            {/* Segmented Control */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {(['Company', 'Individual'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setTargetType(mode)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    targetType === mode 
                      ? 'bg-white text-indigo-600 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {targetType === 'Company' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stripe, OpenAI, Siemens"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Person's Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satya Nadella, Sam Altman"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Professional Profile URL (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username or personal website"
                      value={personProfileUrl}
                      onChange={(e) => setPersonProfileUrl(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* REVIEW & SUBMIT */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-left">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Ready to Orchestrate Meeting Intelligence</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              VerityMeet AI will automatically calculate a 30-day temporal research window, query live web indices via Tavily, audit stale facts with Grok, and assemble your verified one-page briefing.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Workflow...</span>
                </>
              ) : (
                <>
                  <span>Generate Briefing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
