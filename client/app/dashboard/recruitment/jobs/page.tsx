'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Briefcase, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import type { Job } from '@/types';

const STATUS_COLORS: Record<string, string> = { open: 'badge-mint', closed: 'badge-rose', draft: 'badge-yellow' };
const TYPE_LABELS: Record<string, string> = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', intern: 'Intern' };

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50', ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
    api.get(`/api/jobs/all?${params}`)
      .then((r) => { setJobs(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const handleToggleStatus = async (job: Job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await api.patch(`/api/jobs/${job._id}`, { status: newStatus });
      setJobs((prev) => prev.map((j) => j._id === job._id ? { ...j, status: newStatus as any } : j));
      toast.success(`Job ${newStatus}`);
    } catch { toast.error('Failed to update job'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Job Listings</h1>
          <p className="text-clay-muted text-sm font-500">{total} jobs total</p>
        </div>
        <button onClick={() => router.push('/dashboard/recruitment/jobs/new')}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2">
          <Plus size={15} strokeWidth={2.5} /> Post New Job
        </button>
      </div>

      {/* Filters */}
      <div className="clay-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..."
            className="clay-input w-full pl-10 pr-4 py-2.5 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="clay-input px-3 py-2.5 text-sm">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Job cards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="clay-skeleton h-48 rounded-3xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No jobs found" description="Post your first job opening to start hiring."
          action={{ label: '+ Post a Job', onClick: () => router.push('/dashboard/recruitment/jobs/new') }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const dept = job.department as any;
            return (
              <div key={job._id} className="clay-card p-5 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center">
                    <Briefcase size={18} className="text-clay-purple" strokeWidth={2.2} />
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-1 rounded-pill ${STATUS_COLORS[job.status]}`}>
                    {job.status}
                  </span>
                </div>
                <h3 className="font-800 text-clay-text mb-1">{job.title}</h3>
                <p className="text-xs text-clay-muted font-600 mb-3">{dept?.name || 'No department'}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs text-clay-muted font-600">
                      <MapPin size={11} strokeWidth={2.2} /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-clay-muted font-600">
                    <Clock size={11} strokeWidth={2.2} /> {TYPE_LABELS[job.jobType] || job.jobType}
                  </span>
                  {job.experience > 0 && (
                    <span className="text-xs text-clay-muted font-600">{job.experience}+ yrs exp</span>
                  )}
                </div>
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.skills.slice(0, 3).map((s) => (
                      <span key={s} className="badge-lavender text-xs font-600 px-2 py-0.5 rounded-pill">{s}</span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-xs text-clay-muted font-600">+{job.skills.length - 3} more</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-clay-lavender/30">
                  <span className="text-xs text-clay-muted font-500">{format(new Date(job.createdAt), 'dd MMM yyyy')}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleStatus(job)}
                      className={`text-xs font-700 px-3 py-1 rounded-pill transition-colors ${job.status === 'open' ? 'bg-clay-rose text-red-600 hover:bg-red-100' : 'bg-clay-mint text-green-700 hover:bg-green-100'}`}>
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
