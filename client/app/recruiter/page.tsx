'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Briefcase, Users, GitMerge, CalendarCheck, Brain, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { CardGridSkeleton } from '@/components/shared/SkeletonLoader';

export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    openJobs: 0,
    totalCandidates: 0,
    scheduledInterviews: 0,
    pendingApplications: 0,
  });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/jobs/all?status=open&limit=1'),
      api.get('/api/candidates?limit=5'),
      api.get('/api/interviews?status=scheduled&limit=3'),
      api.get('/api/applications?status=applied&limit=1'),
    ])
      .then(([jobs, cands, interviews, apps]) => {
        setStats({
          openJobs:            jobs.data.total,
          totalCandidates:     cands.data.total,
          scheduledInterviews: interviews.data.total,
          pendingApplications: apps.data.total,
        });
        setRecentCandidates(cands.data.data);
        setUpcomingInterviews(interviews.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      href: '/recruiter/jobs',
      icon: Briefcase,
      label: 'Post a Job',
      desc: 'Create job listing with AI JD Generator',
      tint: 'bg-clay-lavender',
      color: 'text-clay-purple',
    },
    {
      href: '/recruiter/candidates',
      icon: Brain,
      label: 'Screen Resumes',
      desc: 'Bulk upload PDFs — AI ranks by fit score',
      tint: 'bg-clay-peach',
      color: 'text-orange-600',
    },
    {
      href: '/recruiter/pipeline',
      icon: GitMerge,
      label: 'Application Pipeline',
      desc: 'Advance candidates → Hire → Employee created',
      tint: 'bg-clay-mint',
      color: 'text-green-600',
    },
    {
      href: '/recruiter/interviews',
      icon: CalendarCheck,
      label: 'Schedule Interview',
      desc: 'Book interviews and track completion',
      tint: 'bg-clay-sky',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-900 text-clay-text">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-clay-muted text-sm font-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · HR Recruiter Portal
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Open Jobs"            value={stats.openJobs}            icon="💼" tint="lavender" />
          <StatCard title="Total Candidates"     value={stats.totalCandidates}     icon="👥" tint="peach"    />
          <StatCard title="Pending Applications" value={stats.pendingApplications} icon="📋" tint="yellow"   />
          <StatCard title="Scheduled Interviews" value={stats.scheduledInterviews} icon="🎙️" tint="sky"      />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(({ href, icon: Icon, label, desc, tint, color }) => (
          <Link key={href} href={href}>
            <div className={`clay-card p-5 ${tint} hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full`}>
              <Icon size={22} strokeWidth={2.2} className={`${color} mb-3`} />
              <p className="font-800 text-clay-text">{label}</p>
              <p className="text-xs text-clay-muted font-500 mt-1 leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Workflow guide */}
      <div className="clay-card p-5 bg-clay-lavender/20">
        <h3 className="font-800 text-clay-text mb-3">Your Hiring Workflow</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { step: 'Post Job',       href: '/recruiter/jobs'       },
            { step: 'Screen Resumes', href: '/recruiter/candidates' },
            { step: 'Pipeline',       href: '/recruiter/pipeline'   },
            { step: 'Interview',      href: '/recruiter/interviews' },
            { step: '🎉 Hire',        href: '/recruiter/pipeline'   },
          ].map((s, i, arr) => (
            <span key={s.step} className="flex items-center gap-2">
              <Link href={s.href}
                className="font-700 text-clay-purple hover:underline bg-clay-lavender/60 px-3 py-1.5 rounded-pill text-xs">
                {s.step}
              </Link>
              {i < arr.length - 1 && (
                <ArrowRight size={14} className="text-clay-muted/60" />
              )}
            </span>
          ))}
          <span className="text-xs text-clay-muted ml-2 font-500">→ Employee auto-created</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent candidates */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-800 text-clay-text">Top Candidates</h3>
            <Link href="/recruiter/candidates" className="text-xs text-clay-purple font-700 hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="clay-skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : recentCandidates.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No candidates yet"
              description="Upload resumes to start AI screening."
              action={{ label: 'Screen Resumes', onClick: () => {} }}
            />
          ) : (
            <div className="space-y-2.5">
              {recentCandidates.map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-3 bg-clay-bg rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-xs flex-shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-clay-text text-sm truncate">{c.name}</p>
                    <p className="text-xs text-clay-muted">
                      {c.yearsExperience > 0 ? `${c.yearsExperience} yrs exp` : 'Fresher'}
                    </p>
                  </div>
                  <span className={`text-xs font-800 px-2 py-0.5 rounded-pill ${
                    c.aiScore >= 70 ? 'badge-mint' :
                    c.aiScore >= 40 ? 'badge-yellow' : 'badge-rose'
                  }`}>
                    {c.aiScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming interviews */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-800 text-clay-text">Upcoming Interviews</h3>
            <Link href="/recruiter/interviews" className="text-xs text-clay-purple font-700 hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="clay-skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : upcomingInterviews.length === 0 ? (
            <EmptyState
              icon="🎙️"
              title="No interviews scheduled"
              description="Schedule interviews for shortlisted candidates."
              action={{ label: 'Schedule', onClick: () => {} }}
            />
          ) : (
            <div className="space-y-2.5">
              {upcomingInterviews.map((iv) => {
                const app  = iv.applicationId as any;
                const cand = app?.candidateId as any;
                const job  = app?.jobId as any;
                return (
                  <div key={iv._id} className="flex items-center gap-3 p-3 bg-clay-bg rounded-2xl">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                      iv.type === 'video' ? 'bg-clay-sky' :
                      iv.type === 'voice' ? 'bg-clay-lavender' : 'bg-clay-peach'
                    }`}>
                      {iv.type === 'video' ? '📹' : iv.type === 'voice' ? '🎤' : '👥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-clay-text text-sm truncate">
                        {cand?.name || 'Candidate'}
                      </p>
                      <p className="text-xs text-clay-muted">
                        {job?.title || 'Position'} ·{' '}
                        {iv.scheduledAt
                          ? format(new Date(iv.scheduledAt), 'dd MMM, hh:mm a')
                          : 'Time TBD'}
                      </p>
                    </div>
                    <span className="badge-sky text-xs font-700 px-2 py-0.5 rounded-pill">
                      {iv.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
