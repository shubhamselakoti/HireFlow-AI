'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronRight, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const STATUSES = [
  { key: 'applied',             label: 'Applied',             color: 'badge-lavender', dot: '#9F7AEA' },
  { key: 'screened',            label: 'AI Screened',         color: 'badge-sky',      dot: '#3B82F6' },
  { key: 'interview_scheduled', label: 'Interview Scheduled', color: 'badge-yellow',   dot: '#F59E0B' },
  { key: 'interviewed',         label: 'Interviewed',         color: 'badge-peach',    dot: '#F97316' },
  { key: 'offered',             label: 'Offer Sent',          color: 'badge-mint',     dot: '#10B981' },
  { key: 'hired',               label: 'Hired ✅',            color: 'badge-mint',     dot: '#059669' },
  { key: 'rejected',            label: 'Rejected',            color: 'badge-rose',     dot: '#EF4444' },
];

const NEXT_STATUS: Record<string, string> = {
  applied:             'screened',
  screened:            'interview_scheduled',
  interview_scheduled: 'interviewed',
  interviewed:         'offered',
  offered:             'hired',
};

const getDownloadUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('cloudinary.com')) return url.replace('/upload/', '/upload/fl_attachment/');
  return url;
};

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState(jobIdParam || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/jobs/all?limit=100').then((r) => setJobs(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJob, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedJob) params.set('jobId', selectedJob);
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/api/applications?${params}`);
      setApplications(r.data.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: string, candidateName: string) => {
    setUpdating(appId);
    try {
      await api.patch(`/api/applications/${appId}/status`, { status: newStatus });
      setApplications((prev) => prev.map((a) => a._id === appId ? { ...a, status: newStatus } : a));

      if (newStatus === 'hired') {
        toast.success(`🎉 ${candidateName} hired! Employee record + onboarding created automatically.`);
      } else if (newStatus === 'rejected') {
        toast.info(`${candidateName} rejected.`);
      } else {
        const label = STATUSES.find((s) => s.key === newStatus)?.label || newStatus;
        toast.success(`Moved to "${label}"`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = (appId: string, name: string) => {
    if (!confirm(`Reject ${name}? This will notify the candidate.`)) return;
    updateStatus(appId, 'rejected', name);
  };

  // Group by status for section headers
  const groups: Record<string, any[]> = {};
  for (const s of STATUSES) groups[s.key] = [];
  for (const app of applications) {
    if (groups[app.status]) groups[app.status].push(app);
    else groups['applied'].push(app);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Application Pipeline</h1>
        <p className="text-clay-muted text-sm font-500">
          {applications.length} applications · Move candidates through stages · Hire → auto-creates Employee
        </p>
      </div>

      {/* Pipeline flow explanation */}
      <div className="clay-card p-4 bg-clay-lavender/20">
        <div className="flex flex-wrap items-center gap-2 text-xs font-600">
          <span className="font-800 text-clay-text mr-1">Flow:</span>
          {STATUSES.filter((s) => s.key !== 'rejected').map((s, i, arr) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
              <span className={s.key === 'hired' ? 'text-green-700 font-800' : 'text-clay-muted'}>{s.label}</span>
              {i < arr.length - 1 && <ChevronRight size={11} className="text-clay-muted/50" />}
            </span>
          ))}
          <span className="ml-2 text-clay-purple font-700">← Hiring auto-creates Employee + Onboarding</span>
        </div>
      </div>

      {/* Filters */}
      <div className="clay-card p-4 flex flex-wrap gap-3">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="clay-input px-4 py-2.5 text-sm flex-1 min-w-52"
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>{j.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-input px-4 py-2.5 text-sm min-w-48"
        >
          <option value="">All Stages</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Applications */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="clay-skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No applications yet"
          description="Applications appear here when candidates apply via the portal or resumes are bulk-uploaded."
          action={{ label: 'View Candidate Portal', onClick: () => window.open('/candidate-portal', '_blank') }}
        />
      ) : (
        <div className="space-y-6">
          {STATUSES.map(({ key, label, dot }) => {
            const group = statusFilter ? (groups[key] || []) : (groups[key] || []);
            if (group.length === 0) return null;

            return (
              <div key={key}>
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dot }} />
                  <span className="font-800 text-clay-text">{label}</span>
                  <span className="text-xs font-700 text-clay-muted bg-clay-lavender px-2.5 py-0.5 rounded-pill">
                    {group.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.map((app) => {
                    const cand = app.candidateId as any;
                    const job  = app.jobId as any;
                    const nextStatus = NEXT_STATUS[app.status];
                    const nextLabel  = STATUSES.find((s) => s.key === nextStatus)?.label;
                    const isUpdating = updating === app._id;

                    return (
                      <div key={app._id} className="clay-card-sm p-4 flex flex-wrap items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-sm flex-shrink-0">
                          {cand?.name?.[0]?.toUpperCase() || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-700 text-clay-text">{cand?.name || 'Unknown Candidate'}</p>
                            {cand?.yearsExperience > 0 && (
                              <span className="text-xs badge-sky px-2 py-0.5 rounded-pill">
                                {cand.yearsExperience} yrs exp
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-clay-muted mt-0.5">{cand?.email}</p>
                          <p className="text-xs text-clay-muted mt-0.5">
                            <span className="font-600 text-clay-text">{job?.title || 'No job linked'}</span>
                            {' · '}Applied {format(new Date(app.appliedAt || app.createdAt), 'dd MMM yyyy')}
                          </p>

                          {/* Skills */}
                          {cand?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cand.skills.slice(0, 4).map((s: string) => (
                                <span key={s} className="badge-lavender text-[10px] font-600 px-1.5 py-0.5 rounded-pill">
                                  {s}
                                </span>
                              ))}
                              {cand.skills.length > 4 && (
                                <span className="text-[10px] text-clay-muted">+{cand.skills.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* AI Score */}
                        {(app.aiScore > 0 || cand?.aiScore > 0) && (
                          <div className="text-center flex-shrink-0">
                            <p className="text-[10px] text-clay-muted font-700 uppercase tracking-wide">AI Score</p>
                            <p className={`text-2xl font-900 leading-none mt-0.5 ${
                              (app.aiScore || cand?.aiScore) >= 70 ? 'text-green-600' :
                              (app.aiScore || cand?.aiScore) >= 40 ? 'text-yellow-600' : 'text-red-500'
                            }`}>
                              {app.aiScore || cand?.aiScore || 0}
                            </p>
                          </div>
                        )}

                        {/* Resume download */}
                        {cand?.resumeUrl && (
                          <a
                            href={getDownloadUrl(cand.resumeUrl)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-clay-purple font-700 bg-clay-lavender/60 px-3 py-2 rounded-pill hover:bg-clay-lavender transition-colors flex-shrink-0"
                          >
                            <Download size={12} strokeWidth={2.5} /> Resume
                          </a>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          {/* Advance to next stage */}
                          {nextStatus && (
                            <button
                              onClick={() => updateStatus(app._id, nextStatus, cand?.name || 'Candidate')}
                              disabled={isUpdating}
                              className={`text-xs font-700 px-3 py-2 rounded-pill transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                                nextStatus === 'hired'
                                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                  : 'bg-clay-sky text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : nextStatus === 'hired' ? (
                                '🎉 Mark as Hired'
                              ) : (
                                `→ ${nextLabel}`
                              )}
                            </button>
                          )}

                          {/* Reject (for non-final states) */}
                          {app.status !== 'hired' && app.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(app._id, cand?.name || 'Candidate')}
                              disabled={isUpdating}
                              className="text-xs font-700 px-3 py-2 rounded-pill bg-clay-rose text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                            >
                              Reject
                            </button>
                          )}

                          {/* Terminal states */}
                          {app.status === 'hired' && (
                            <span className="text-xs font-700 px-3 py-2 rounded-pill badge-mint">
                              ✅ Employee Created
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-xs font-600 px-3 py-2 rounded-pill badge-rose">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
