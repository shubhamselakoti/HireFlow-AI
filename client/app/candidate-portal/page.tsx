'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search, MapPin, Clock, Briefcase, Upload, X, Sparkles,
  Loader2, ArrowRight, ChevronDown, ChevronUp,
  CheckCircle, Calendar, AlertCircle, LogOut, User, RefreshCw,
} from 'lucide-react';
import api from '@/lib/axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time',
  contract: 'Contract', intern: 'Internship',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  applied:             { label: 'Applied',             color: 'badge-lavender', icon: '📨', desc: 'Your application has been received and is pending review.' },
  screened:            { label: 'AI Screened',         color: 'badge-sky',      icon: '🤖', desc: 'Our AI has reviewed your resume and scored your fit for the role.' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'badge-yellow',   icon: '📅', desc: 'An interview has been scheduled for you — check below for details.' },
  interviewed:         { label: 'Interviewed',         color: 'badge-peach',    icon: '🎙️', desc: 'Your interview is complete. The team is reviewing your feedback.' },
  offered:             { label: 'Offer Extended',      color: 'badge-mint',     icon: '🎁', desc: 'Congratulations! An offer has been extended to you.' },
  hired:               { label: 'Hired! 🎉',           color: 'badge-mint',     icon: '🎉', desc: 'You have been hired! Check your email for login credentials to the employee portal.' },
  rejected:            { label: 'Not Selected',        color: 'badge-rose',     icon: '❌', desc: 'Unfortunately you were not selected for this role. Keep applying!' },
};

const PIPELINE_STAGES = ['applied', 'screened', 'interview_scheduled', 'interviewed', 'offered', 'hired'];
const stageProgress = (status: string) => {
  const idx = PIPELINE_STAGES.indexOf(status === 'interviewed' ? 'interview_scheduled' : status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
};

const applySchema = z.object({
  name:  z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});
type ApplyForm = z.infer<typeof applySchema>;

export default function CandidatePortalPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn  = sessionStatus === 'authenticated';
  const isLoading   = sessionStatus === 'loading';
  const userName    = session?.user?.name;
  const userEmail   = session?.user?.email;

  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs');

  // ── Jobs state ──────────────────────────────────────────────────────────
  const [jobs, setJobs]               = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [resumeFile, setResumeFile]   = useState<File | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [appliedJobIds, setAppliedJobIds]   = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Applications state ──────────────────────────────────────────────────
  const [myApps, setMyApps]       = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { email: userEmail || '' },
  });

  const userId = (session?.user as any)?.id;

  // ── localStorage helpers keyed by userId ────────────────────────────────
  const lsKey = userId ? `hireflow_applied_jobs_${userId}` : null;

  const saveApplied = (ids: Set<string>) => {
    if (!lsKey) return;
    try { localStorage.setItem(lsKey, JSON.stringify([...ids])); } catch {}
  };

  // Load applied IDs from localStorage — keyed by this specific user
  useEffect(() => {
    if (!lsKey) {
      // Not logged in or no userId yet — clear any stale state
      setAppliedJobIds(new Set());
      return;
    }
    try {
      const stored = localStorage.getItem(lsKey);
      if (stored) setAppliedJobIds(new Set(JSON.parse(stored)));
      else setAppliedJobIds(new Set()); // fresh user, no applied jobs
    } catch {
      setAppliedJobIds(new Set());
    }
  }, [lsKey]); // re-run when userId changes (login/logout)

  // Clean up the old un-keyed localStorage entry once (migration)
  useEffect(() => {
    try { localStorage.removeItem('hireflow_applied_jobs'); } catch {}
  }, []);

  useEffect(() => { fetchJobs(); }, [search, typeFilter]);

  // Auto-load applications when logged in
  useEffect(() => {
    if (isLoggedIn) fetchMyApplications();
  }, [isLoggedIn]);

  // Auto-switch to applications tab if they have applications and switch to it
  useEffect(() => {
    if (tab === 'applications' && isLoggedIn) fetchMyApplications();
  }, [tab]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({ status: 'open', limit: '100' });
      if (search) params.set('search', search);
      const r = await fetch(`${API}/api/jobs?${params}`);
      const data = await r.json();
      if (data.success) setJobs(data.data);
    } catch { toast.error('Failed to load jobs'); }
    finally { setJobsLoading(false); }
  };

  const fetchMyApplications = async () => {
    setAppsLoading(true);
    try {
      const r = await api.get('/api/applications/my');
      const apps = r.data.data || [];
      setMyApps(apps);

      // REPLACE applied job IDs with ONLY what the server says
      // Never merge with localStorage — that would carry over other users' data
      const serverIds = new Set<string>(
        apps.map((a: any) => a.jobId?._id || a.jobId).filter(Boolean)
      );
      setAppliedJobIds(serverIds);
      saveApplied(serverIds);
    } catch {
      // On error keep existing state — don't clear
    } finally {
      setAppsLoading(false);
    }
  };

  const openApply = (job: any) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to apply');
      signIn(undefined, { callbackUrl: '/candidate-portal' });
      return;
    }
    setApplyingJob(job);
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeApply = () => { setApplyingJob(null); setResumeFile(null); setSubmitProgress(0); };

  const onApply = async (data: ApplyForm) => {
    if (!applyingJob || !resumeFile) { toast.error('Please upload your resume (PDF)'); return; }
    setSubmitting(true);
    setSubmitProgress(20);

    try {
      const formData = new FormData();
      formData.append('resumes', resumeFile);
      formData.append('jobId', applyingJob._id);
      // Link the new Candidate record to the logged-in user's account
      const userId = (session?.user as any)?.id;
      if (userId) formData.append('userId', userId);

      const interval = setInterval(() => {
        setSubmitProgress((p) => Math.min(p + 8, 85));
      }, 350);

      const r = await fetch(`${API}/api/candidates/bulk-upload`, { method: 'POST', body: formData });
      const result = await r.json();
      clearInterval(interval);
      if (!result.success) throw new Error(result.message || 'Submission failed');

      setSubmitProgress(100);

      // Mark as applied locally — functional update avoids stale closure
      setAppliedJobIds((prev) => {
        const next = new Set([...prev, applyingJob._id]);
        saveApplied(next);
        return next;
      });

      toast.success(`🎉 Applied for "${applyingJob.title}"! Check My Applications to track progress.`);

      // Wait for 100% animation then close + refresh applications
      setTimeout(async () => {
        closeApply();
        // Link newly created candidate to logged-in user via /my endpoint
        await fetchMyApplications();
      }, 800);
    } catch (err: any) {
      toast.error(err.message || 'Application failed');
      setSubmitProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => !typeFilter || j.jobType === typeFilter);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-clay-bg font-sans">

      {/* ── Navbar ── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-clay-lavender/40 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#9F7AEA] flex items-center justify-center shadow-clay-btn flex-shrink-0">
              <Sparkles size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-900 text-xl text-clay-text hidden sm:block">HireFlow</span>
          </a>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-clay-lavender/30 rounded-pill p-1">
            <button
              onClick={() => setTab('jobs')}
              className={`px-4 py-1.5 rounded-pill text-xs font-700 transition-all ${tab === 'jobs' ? 'bg-white text-clay-purple shadow-clay-sm' : 'text-clay-muted hover:text-clay-text'}`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setTab('applications')}
              className={`px-4 py-1.5 rounded-pill text-xs font-700 transition-all flex items-center gap-1.5 ${tab === 'applications' ? 'bg-white text-clay-purple shadow-clay-sm' : 'text-clay-muted hover:text-clay-text'}`}
            >
              My Applications
              {myApps.length > 0 && (
                <span className="bg-clay-purple text-white text-[10px] font-800 rounded-full w-4 h-4 flex items-center justify-center">
                  {myApps.length}
                </span>
              )}
            </button>
          </div>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-clay-muted" />
            ) : isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-clay-lavender/40 rounded-pill px-3 py-1.5">
                  <User size={12} className="text-clay-purple" strokeWidth={2.5} />
                  <span className="text-xs font-700 text-clay-text">{userName?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/candidate-portal' })}
                  className="flex items-center gap-1.5 text-xs text-clay-muted hover:text-red-500 transition-colors font-600 px-2 py-1.5"
                >
                  <LogOut size={13} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn(undefined, { callbackUrl: '/candidate-portal' })}
                  className="text-sm text-clay-muted font-700 hover:text-clay-text transition-colors"
                >
                  Sign In
                </button>
                <a href="/register" className="clay-btn clay-btn-primary px-4 py-2 text-sm font-700 text-white">
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* ════ TAB 1: BROWSE JOBS ════ */}
        {tab === 'jobs' && (
          <>
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-clay-lavender rounded-pill px-4 py-2 text-sm font-700 text-clay-purple mb-4">
                <Briefcase size={14} strokeWidth={2.5} /> {filteredJobs.length} Open Position{filteredJobs.length !== 1 ? 's' : ''}
              </div>
              <h1 className="text-3xl md:text-4xl font-900 text-clay-text mb-3 leading-tight">
                Find Your Next{' '}
                <span style={{ background: 'linear-gradient(135deg,#6D4AFF,#9F7AEA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Opportunity
                </span>
              </h1>
              <p className="text-clay-muted font-500 max-w-xl mx-auto text-sm leading-relaxed">
                {isLoggedIn
                  ? `Welcome back, ${userName?.split(' ')[0]}! Apply for jobs and track progress in My Applications.`
                  : 'Sign in to apply for jobs and track your application status in real time.'}
              </p>
            </div>

            {/* Search + filter */}
            <div className="clay-card p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search job title or keyword..."
                  className="clay-input w-full pl-10 pr-4 py-3 text-sm" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="clay-input px-4 py-3 text-sm min-w-40">
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Internship</option>
              </select>
            </div>

            {/* Job cards */}
            {jobsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="clay-skeleton h-44 rounded-3xl" />)}</div>
            ) : filteredJobs.length === 0 ? (
              <div className="clay-card p-16 text-center">
                <div className="text-5xl mb-4">💼</div>
                <p className="font-800 text-clay-text text-xl">No open positions right now</p>
                <p className="text-clay-muted text-sm mt-2 font-500">Check back soon — new roles are posted regularly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const dept = job.department as any;
                  const isExpanded = expandedJob === job._id;
                  const applied = appliedJobIds.has(job._id);

                  return (
                    <div key={job._id} className={`clay-card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-clay-purple/30' : ''}`}>
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-clay-lavender flex items-center justify-center flex-shrink-0 shadow-clay-sm">
                            <Briefcase size={18} className="text-clay-purple" strokeWidth={2.2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="font-900 text-clay-text text-lg leading-tight">{job.title}</h3>
                                <p className="text-sm text-clay-muted font-600 mt-0.5">{dept?.name || 'General'}</p>
                              </div>
                              {applied
                                ? <span className="badge-mint text-xs font-700 px-3 py-1 rounded-pill flex items-center gap-1 flex-shrink-0"><CheckCircle size={11} strokeWidth={2.5} /> Applied</span>
                                : <span className="badge-lavender text-xs font-700 px-3 py-1 rounded-pill flex-shrink-0">Now Hiring</span>
                              }
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2.5">
                              {job.location && (
                                <span className="flex items-center gap-1.5 text-xs text-clay-muted font-500"><MapPin size={11} strokeWidth={2.2} /> {job.location}</span>
                              )}
                              <span className="flex items-center gap-1.5 text-xs text-clay-muted font-500"><Clock size={11} strokeWidth={2.2} /> {TYPE_LABELS[job.jobType] || job.jobType}</span>
                              {job.experience > 0 && <span className="text-xs text-clay-muted font-500">{job.experience}+ yrs</span>}
                            </div>
                            {job.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {job.skills.map((s: string) => (
                                  <span key={s} className="badge-lavender text-xs font-600 px-2 py-0.5 rounded-pill">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-clay-lavender/30">
                          <button onClick={() => setExpandedJob(isExpanded ? null : job._id)}
                            className="clay-btn clay-btn-outline px-4 py-2 text-sm font-700 flex items-center gap-2">
                            {isExpanded ? <><ChevronUp size={14} strokeWidth={2.5} /> Hide</> : <><ChevronDown size={14} strokeWidth={2.5} /> Full Description</>}
                          </button>

                          {applied ? (
                            <button onClick={() => setTab('applications')}
                              className="flex items-center gap-2 px-4 py-2 bg-clay-mint border border-green-200 text-green-700 rounded-pill text-sm font-700 hover:bg-green-100 transition-colors">
                              <CheckCircle size={13} strokeWidth={2.5} /> Track Progress →
                            </button>
                          ) : (
                            <button onClick={() => openApply(job)}
                              className="clay-btn clay-btn-primary px-5 py-2 text-sm font-800 text-white flex items-center gap-2">
                              Apply Now <ArrowRight size={13} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-clay-lavender/20 px-6 pb-6 pt-5 bg-clay-bg/40">
                          <h4 className="font-800 text-clay-text mb-3">Job Description</h4>
                          {job.description
                            ? <div className="text-sm text-clay-text leading-relaxed" style={{ whiteSpace: 'pre-wrap', fontFamily: 'Nunito, sans-serif' }}>{job.description}</div>
                            : <p className="text-clay-muted text-sm italic">No description provided.</p>
                          }
                          {!applied && (
                            <button onClick={() => openApply(job)}
                              className="clay-btn clay-btn-primary mt-5 px-7 py-2.5 text-sm font-800 text-white flex items-center gap-2">
                              Apply for this Role <ArrowRight size={13} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ════ TAB 2: MY APPLICATIONS ════ */}
        {tab === 'applications' && (
          <div className="space-y-6">
            {/* Not logged in */}
            {!isLoggedIn && !isLoading && (
              <div className="clay-card p-12 text-center max-w-lg mx-auto">
                <div className="text-5xl mb-5">🔒</div>
                <h2 className="font-900 text-clay-text text-xl mb-2">Sign in to view your applications</h2>
                <p className="text-clay-muted text-sm font-500 mb-6 leading-relaxed">
                  Your application history is linked to your account.
                  Sign in with the same account you used to apply.
                </p>
                <button
                  onClick={() => signIn(undefined, { callbackUrl: '/candidate-portal' })}
                  className="clay-btn clay-btn-primary px-8 py-3 text-sm font-800 text-white inline-flex items-center gap-2"
                >
                  Sign In to Continue <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                <p className="text-xs text-clay-muted mt-4 font-500">
                  Don't have an account?{' '}
                  <a href="/register" className="text-clay-purple font-700 hover:underline">Sign up free</a>
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="animate-spin text-clay-purple" />
              </div>
            )}

            {/* Logged in — show applications */}
            {isLoggedIn && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-900 text-clay-text">My Applications</h2>
                    <p className="text-sm text-clay-muted font-500">
                      {appsLoading ? 'Loading...' : `${myApps.length} application${myApps.length !== 1 ? 's' : ''} · ${userEmail}`}
                    </p>
                  </div>
                  <button onClick={fetchMyApplications} disabled={appsLoading}
                    className="flex items-center gap-1.5 text-xs text-clay-purple font-700 hover:underline disabled:opacity-50">
                    <RefreshCw size={12} className={appsLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
                    Refresh
                  </button>
                </div>

                {appsLoading ? (
                  <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="clay-skeleton h-40 rounded-2xl" />)}</div>
                ) : myApps.length === 0 ? (
                  <div className="clay-card p-12 text-center">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="font-800 text-clay-text text-lg">No applications yet</p>
                    <p className="text-clay-muted text-sm mt-2 font-500">
                      Apply for jobs in the Browse tab and your applications will appear here.
                    </p>
                    <button onClick={() => setTab('jobs')}
                      className="clay-btn clay-btn-primary px-6 py-2.5 text-sm font-700 text-white mt-5 inline-flex items-center gap-2">
                      <Briefcase size={14} strokeWidth={2.5} /> Browse Open Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myApps.map((app) => {
                      const job  = app.jobId as any;
                      const dept = job?.department as any;
                      const sc   = STATUS_CONFIG[app.status] || { label: app.status, color: 'badge-lavender', icon: '📋', desc: '' };
                      const prog = stageProgress(app.status);

                      return (
                        <div key={app._id} className="clay-card p-6 space-y-4">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-800 text-clay-text text-lg">{job?.title || 'Position'}</h3>
                              <p className="text-sm text-clay-muted font-500 mt-0.5">
                                {dept?.name || 'Department'}
                                {job?.location ? ` · ${job.location}` : ''}
                                {job?.jobType ? ` · ${TYPE_LABELS[job.jobType] || job.jobType}` : ''}
                              </p>
                              <p className="text-xs text-clay-muted mt-1 font-500">
                                Applied {app.appliedAt ? format(new Date(app.appliedAt), 'dd MMM yyyy') : '—'}
                              </p>
                            </div>
                            <span className={`text-xs font-700 px-3 py-1.5 rounded-pill flex-shrink-0 ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </span>
                          </div>

                          {/* Status description */}
                          <div className="flex items-start gap-2 p-3 bg-clay-bg rounded-xl">
                            <AlertCircle size={14} className="text-clay-muted flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                            <p className="text-xs text-clay-muted font-500">{sc.desc}</p>
                          </div>

                          {/* Progress bar (not for rejected) */}
                          {app.status !== 'rejected' && (
                            <div>
                              <div className="flex justify-between text-[10px] text-clay-muted font-700 mb-1.5">
                                {['Applied', 'Screened', 'Interview', 'Interviewed', 'Offered', 'Hired'].map((s, i) => {
                                  const isActive = i < PIPELINE_STAGES.indexOf(
                                    app.status === 'interviewed' ? 'interview_scheduled' : app.status
                                  ) + 1;
                                  return <span key={s} className={isActive ? 'text-clay-purple font-800' : ''}>{s}</span>;
                                })}
                              </div>
                              <div className="h-2 bg-clay-lavender rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all duration-700"
                                  style={{ width: `${prog}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* AI Score */}
                          {app.aiScore > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-clay-lavender/20 rounded-xl">
                              <span className="text-xl">🤖</span>
                              <div>
                                <p className="text-xs font-700 text-clay-text">AI Resume Score</p>
                                <p className="text-xs text-clay-muted font-500">
                                  Your resume scored{' '}
                                  <strong className={app.aiScore >= 70 ? 'text-green-600' : app.aiScore >= 40 ? 'text-yellow-600' : 'text-red-500'}>
                                    {app.aiScore}/100
                                  </strong>{' '}
                                  for this role
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Interview block */}
                          {app.interview && (
                            <div className={`p-4 rounded-xl border ${
                              app.interview.status === 'scheduled' ? 'bg-clay-yellow/30 border-yellow-200' :
                              app.interview.status === 'completed' ? 'bg-clay-mint/30 border-green-200' :
                              'bg-clay-rose/20 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar size={14} className="text-clay-text" strokeWidth={2.2} />
                                <p className="text-sm font-800 text-clay-text capitalize">
                                  {app.interview.type} Interview — {app.interview.status}
                                </p>
                              </div>

                              {app.interview.scheduledAt && (
                                <p className="text-sm font-600 text-clay-text">
                                  📅 {format(new Date(app.interview.scheduledAt), 'EEEE, dd MMMM yyyy')} at{' '}
                                  {format(new Date(app.interview.scheduledAt), 'hh:mm a')}
                                </p>
                              )}

                              {app.interview.status === 'scheduled' && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-yellow-800 font-600">
                                    Your interview is ready. Click below when you want to start.
                                  </p>
                                  <a
                                    href={`/interview/${app.interview._id}`}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-clay-purple text-white rounded-pill text-sm font-800 hover:bg-clay-purple/90 transition-colors"
                                  >
                                    🎙️ Take Interview Now →
                                  </a>
                                </div>
                              )}

                              {app.interview.status === 'completed' && (
                                <div className="flex gap-4 mt-3 flex-wrap">
                                  {[
                                    { label: 'Communication', val: app.interview.communicationScore },
                                    { label: 'Clarity',       val: app.interview.clarityScore       },
                                    { label: 'Confidence',    val: app.interview.confidenceScore    },
                                  ].filter(({ val }) => val > 0).map(({ label, val }) => (
                                    <div key={label} className="text-center bg-white/60 rounded-xl px-4 py-2">
                                      <p className="text-[10px] text-clay-muted font-700 uppercase">{label}</p>
                                      <p className="font-900 text-clay-purple text-lg">{val}<span className="text-xs text-clay-muted">/10</span></p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hired CTA */}
                          {app.status === 'hired' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                              <p className="text-sm font-800 text-green-700">🎉 Congratulations — you've been hired!</p>
                              <p className="text-xs text-green-600 font-500 mt-1">
                                Check your email for your employee login credentials. Your login email will be in the format <strong>firstname.lastname@hireflow.com</strong> along with a temporary password.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Apply Modal ── */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(45,34,80,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={closeApply}>
          <div className="clay-card-lg w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-b-none sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 sm:hidden"><div className="w-12 h-1 rounded-full bg-clay-lavender" /></div>

            <div className="p-6 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-700 text-clay-purple uppercase tracking-wide mb-1">Applying for</p>
                  <h3 className="font-900 text-clay-text text-xl leading-tight">{applyingJob.title}</h3>
                  <p className="text-clay-muted text-sm font-500 mt-0.5">
                    {applyingJob.department?.name || 'General'} · {TYPE_LABELS[applyingJob.jobType] || applyingJob.jobType}
                  </p>
                </div>
                <button onClick={closeApply} className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center text-clay-muted hover:text-clay-text flex-shrink-0">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onApply)} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-700 text-clay-text mb-1.5">Full Name *</label>
                  <input {...register('name')} placeholder="Jane Smith" autoComplete="name" className="clay-input w-full px-4 py-3 text-sm" />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-700 text-clay-text mb-1.5">Phone</label>
                  <input {...register('phone')} placeholder="+91 98765 43210" className="clay-input w-full px-4 py-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Email on Resume *</label>
                <input {...register('email')} type="email" placeholder="email@example.com" autoComplete="email" className="clay-input w-full px-4 py-3 text-sm" />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-600">{errors.email.message}</p>}
                <p className="text-xs text-clay-muted mt-1 font-500">
                  Your application will be linked to your account <strong>{userEmail}</strong> automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Resume (PDF) *</label>
                {resumeFile ? (
                  <div className="flex items-center gap-3 p-3.5 bg-clay-mint/50 border border-green-200 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-lg flex-shrink-0">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-700 text-green-700 truncate">{resumeFile.name}</p>
                      <p className="text-xs text-green-600">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-green-600 hover:text-red-500 p-1"><X size={14} strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-3 p-7 bg-clay-bg rounded-xl border-2 border-dashed border-clay-lavender/60 cursor-pointer hover:border-clay-purple/50 hover:bg-clay-lavender/10 transition-all">
                    <Upload size={22} className="text-clay-muted" strokeWidth={1.8} />
                    <div className="text-center">
                      <p className="text-sm font-700 text-clay-text">Drop PDF here or click to browse</p>
                      <p className="text-xs text-clay-muted mt-1">PDF only · Max 10MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type !== 'application/pdf') { toast.error('PDF only'); return; }
                        if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
                        setResumeFile(file);
                      }} />
                  </label>
                )}
              </div>

              {submitting && (
                <div>
                  <div className="flex justify-between text-xs text-clay-muted font-600 mb-1.5">
                    <span>AI screening your resume...</span><span>{submitProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-clay-lavender rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all duration-500"
                      style={{ width: `${submitProgress}%` }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting || !resumeFile}
                className="clay-btn clay-btn-primary w-full py-4 text-sm font-800 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight size={14} strokeWidth={2.5} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
