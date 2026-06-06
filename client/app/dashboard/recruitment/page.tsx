'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Briefcase, Users, GitMerge, CalendarCheck } from 'lucide-react';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';

export default function RecruitmentPage() {
  const [stats, setStats] = useState({ openJobs: 0, totalCandidates: 0, upcomingInterviews: 0, pendingApplications: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/jobs/all?limit=5'),
      api.get('/api/candidates?limit=1'),
      api.get('/api/interviews?status=scheduled&limit=1'),
      api.get('/api/applications?status=applied&limit=1'),
    ])
      .then(([jobs, cands, interviews, apps]) => {
        setRecentJobs(jobs.data.data);
        setStats({
          openJobs: jobs.data.data.filter((j: any) => j.status === 'open').length,
          totalCandidates: cands.data.total,
          upcomingInterviews: interviews.data.total,
          pendingApplications: apps.data.total,
        });
      })
      .catch(() => toast.error('Failed to load recruitment data'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = { open: 'badge-mint', closed: 'badge-rose', draft: 'badge-yellow' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Recruitment</h1>
          <p className="text-clay-muted text-sm font-500">Manage your full hiring pipeline</p>
        </div>
        <Link href="/candidate-portal" target="_blank"
          className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
          🔗 Candidate Portal
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Jobs"            value={stats.openJobs}            icon="💼" tint="lavender" loading={loading} />
        <StatCard title="Total Candidates"     value={stats.totalCandidates}     icon="👥" tint="peach"    loading={loading} />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon="📋" tint="yellow"   loading={loading} />
        <StatCard title="Interviews Scheduled" value={stats.upcomingInterviews}  icon="🎙️" tint="sky"      loading={loading} />
      </div>

      {/* Workflow guide */}
      <div className="clay-card p-5 bg-clay-lavender/20">
        <h3 className="font-800 text-clay-text mb-4">Hiring Workflow — How it Works</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { n: '1', title: 'Post a Job', desc: 'Use AI JD Generator. Set status to Open for candidates to see it.', color: 'bg-clay-lavender', href: '/dashboard/recruitment/jobs/new' },
            { n: '2', title: 'Screen Resumes', desc: 'Upload PDFs in bulk. AI ranks candidates 0–100 by match score.', color: 'bg-clay-peach', href: '/dashboard/recruitment/candidates' },
            { n: '3', title: 'Pipeline → Hire', desc: 'In Applications, advance through stages. Click "Hire" to convert.', color: 'bg-clay-mint', href: '/dashboard/recruitment/applications' },
            { n: '4', title: 'Employee Auto-Created', desc: 'Hiring creates Employee record + Onboarding checklist instantly.', color: 'bg-clay-sky', href: '/dashboard/employees' },
          ].map(({ n, title, desc, color, href }) => (
            <Link key={n} href={href}>
              <div className={`${color} rounded-2xl p-4 hover:-translate-y-0.5 transition-all cursor-pointer`}>
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center font-900 text-clay-text text-sm mb-2">{n}</div>
                <p className="font-800 text-clay-text text-sm">{title}</p>
                <p className="text-xs text-clay-muted font-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/recruitment/jobs/new',       icon: Plus,          label: 'Post New Job',         desc: 'AI JD Generator',               tint: 'bg-clay-lavender', color: 'text-clay-purple' },
          { href: '/dashboard/recruitment/candidates',     icon: Users,         label: 'Screen Resumes',       desc: 'Bulk upload + AI scoring',      tint: 'bg-clay-peach',    color: 'text-orange-600'  },
          { href: '/dashboard/recruitment/applications',   icon: GitMerge,      label: 'Application Pipeline', desc: 'Move stages → Hire → Employee', tint: 'bg-clay-mint',     color: 'text-green-600'   },
          { href: '/dashboard/recruitment/interviews',     icon: CalendarCheck, label: 'Interviews',           desc: 'Schedule & manage interviews',  tint: 'bg-clay-sky',      color: 'text-blue-600'    },
        ].map(({ href, icon: Icon, label, desc, tint, color }) => (
          <Link key={href} href={href}>
            <div className={`clay-card p-5 ${tint} hover:-translate-y-1 transition-all duration-200 cursor-pointer`}>
              <Icon size={22} strokeWidth={2.2} className={`${color} mb-3`} />
              <p className="font-800 text-clay-text">{label}</p>
              <p className="text-xs text-clay-muted font-500 mt-1">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent jobs with pipeline links */}
      <div className="clay-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-800 text-clay-text">Recent Job Postings</h3>
          <Link href="/dashboard/recruitment/jobs" className="text-sm text-clay-purple font-700 hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="clay-skeleton h-16 rounded-xl" />)}</div>
        ) : recentJobs.length === 0 ? (
          <EmptyState icon="💼" title="No jobs posted yet" description="Create your first job posting."
            action={{ label: '+ Post a Job', onClick: () => {} }} />
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job: any) => {
              const dept = job.department as any;
              return (
                <div key={job._id} className="flex items-center gap-4 p-4 bg-clay-bg rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center flex-shrink-0">
                    <Briefcase size={18} className="text-clay-purple" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-clay-text">{job.title}</p>
                    <p className="text-xs text-clay-muted font-500">
                      {dept?.name || 'No department'} · {job.jobType?.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${STATUS_COLORS[job.status]}`}>
                    {job.status}
                  </span>
                  <Link href={`/dashboard/recruitment/applications?jobId=${job._id}`}
                    className="text-xs text-clay-purple font-700 hover:underline flex-shrink-0">
                    Pipeline →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
