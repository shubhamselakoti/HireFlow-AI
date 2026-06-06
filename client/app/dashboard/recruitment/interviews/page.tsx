'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Video, Mic, Users, Loader2, X, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';

const scheduleSchema = z.object({
  applicationId: z.string().min(1, 'Select an application'),
  type: z.enum(['video', 'voice', 'panel']),
  scheduledAt: z.string().min(1, 'Schedule date & time is required'),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video, voice: Mic, panel: Users,
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'badge-sky',
  completed: 'badge-mint',
  cancelled: 'badge-rose',
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { type: 'video' },
  });

  useEffect(() => {
    fetchInterviews();
    // Load screened/applied applications that don't have an interview yet
    api.get('/api/applications?limit=200')
      .then((r) => setApplications(r.data.data))
      .catch(() => {});
  }, [statusFilter]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/api/interviews?${params}`);
      setInterviews(r.data.data);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const onSchedule = async (data: ScheduleForm) => {
    try {
      const res = await api.post('/api/interviews', {
        applicationId: data.applicationId,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
      setInterviews((prev) => [res.data.data, ...prev]);
      setShowForm(false);
      reset();
      toast.success('Interview scheduled! Candidate will be notified by email.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule interview');
    }
  };

  const handleCancel = async (interviewId: string) => {
    if (!confirm('Cancel this interview?')) return;
    setCancelling(interviewId);
    try {
      await api.patch(`/api/interviews/${interviewId}`, { status: 'cancelled' });
      setInterviews((prev) =>
        prev.map((i) => i._id === interviewId ? { ...i, status: 'cancelled' } : i)
      );
      toast.success('Interview cancelled');
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const scheduled  = interviews.filter((i) => i.status === 'scheduled').length;
  const completed  = interviews.filter((i) => i.status === 'completed').length;
  const cancelled  = interviews.filter((i) => i.status === 'cancelled').length;

  // Only show applications that are candidates for interview
  // (not already hired/rejected, and not already having a scheduled interview)
  const scheduledAppIds = new Set(
    interviews.filter((i) => i.status === 'scheduled').map((i) => i.applicationId?._id || i.applicationId)
  );
  const eligibleApps = applications.filter(
    (a) => !['hired', 'rejected'].includes(a.status) && !scheduledAppIds.has(a._id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Interviews</h1>
          <p className="text-clay-muted text-sm font-500">
            Schedule and manage candidate interviews
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2"
        >
          <Plus size={15} strokeWidth={2.5} /> Schedule Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Scheduled"  value={scheduled} icon="📅" tint="sky"      loading={loading} />
        <StatCard title="Completed"  value={completed}  icon="✅" tint="mint"     loading={loading} />
        <StatCard title="Cancelled"  value={cancelled}  icon="❌" tint="rose"     loading={loading} />
      </div>

      {/* Schedule Interview Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(45,34,80,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="clay-card-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-clay-lavender/30 flex items-center justify-between">
              <div>
                <h3 className="font-900 text-clay-text text-lg">Schedule Interview</h3>
                <p className="text-xs text-clay-muted font-500 mt-0.5">
                  Candidate will receive an email notification automatically
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center text-clay-muted hover:text-clay-text"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSchedule)} className="p-6 space-y-5">
              {/* Application / Candidate selector */}
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">
                  Candidate / Application *
                </label>
                <select
                  {...register('applicationId')}
                  className="clay-input w-full px-4 py-3 text-sm"
                >
                  <option value="">Select a candidate...</option>
                  {eligibleApps.length === 0 ? (
                    <option disabled>No eligible candidates (all hired, rejected, or already scheduled)</option>
                  ) : (
                    eligibleApps.map((app) => {
                      const cand = app.candidateId as any;
                      const job  = app.jobId as any;
                      return (
                        <option key={app._id} value={app._id}>
                          {cand?.name || 'Unknown'} — {job?.title || 'No job'} ({app.status})
                        </option>
                      );
                    })
                  )}
                </select>
                {errors.applicationId && (
                  <p className="text-red-500 text-xs mt-1 font-600">{errors.applicationId.message}</p>
                )}
                <p className="text-xs text-clay-muted font-500 mt-1">
                  Only shows candidates not yet hired/rejected and without a scheduled interview.
                </p>
              </div>

              {/* Interview type */}
              <div>
                <label className="block text-sm font-700 text-clay-text mb-2">Interview Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'video', label: 'Video', icon: Video,  desc: 'Browser camera' },
                    { val: 'voice', label: 'Voice', icon: Mic,    desc: 'Audio only'     },
                    { val: 'panel', label: 'Panel', icon: Users,  desc: 'Multiple reviewers' },
                  ].map(({ val, label, icon: Icon, desc }) => {
                    const selected = watch('type') === val;
                    return (
                      <label
                        key={val}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-clay-purple bg-clay-lavender/40'
                            : 'border-clay-lavender/50 bg-clay-bg hover:border-clay-purple/40'
                        }`}
                      >
                        <input
                          {...register('type')}
                          type="radio"
                          value={val}
                          className="hidden"
                        />
                        <Icon
                          size={20}
                          strokeWidth={2.2}
                          className={selected ? 'text-clay-purple' : 'text-clay-muted'}
                        />
                        <span className={`text-sm font-700 ${selected ? 'text-clay-purple' : 'text-clay-muted'}`}>
                          {label}
                        </span>
                        <span className="text-[10px] text-clay-muted font-500">{desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">
                  Date & Time *
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
                  <input
                    {...register('scheduledAt')}
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="clay-input w-full pl-10 pr-4 py-3 text-sm"
                  />
                </div>
                {errors.scheduledAt && (
                  <p className="text-red-500 text-xs mt-1 font-600">{errors.scheduledAt.message}</p>
                )}
              </div>

              {/* Info */}
              <div className="bg-clay-sky/30 border border-blue-200/60 rounded-xl p-4">
                <p className="text-xs text-blue-700 font-600 leading-relaxed">
                  <strong>What happens next:</strong> The application status moves to "Interview Scheduled"
                  and the candidate receives an email with the interview details.
                  After the interview, mark it as completed from this page.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn clay-btn-primary flex-1 py-3 text-sm font-800 text-white flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Scheduling...</>
                  ) : (
                    <><Calendar size={15} strokeWidth={2.5} /> Schedule Interview</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="clay-btn clay-btn-outline px-5 py-3 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: '',           label: 'All'       },
          { val: 'scheduled',  label: 'Scheduled' },
          { val: 'completed',  label: 'Completed' },
          { val: 'cancelled',  label: 'Cancelled' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-4 py-2 rounded-pill text-sm font-700 transition-all ${
              statusFilter === val
                ? 'bg-clay-purple text-white shadow-clay-btn'
                : 'bg-white text-clay-muted shadow-clay-sm hover:text-clay-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interviews list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="clay-skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title="No interviews yet"
          description="Schedule your first interview using the button above."
          action={{ label: '+ Schedule Interview', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const app  = interview.applicationId as any;
            const cand = app?.candidateId as any;
            const job  = app?.jobId as any;
            const Icon = TYPE_ICONS[interview.type] || Video;
            const isScheduled = interview.status === 'scheduled';

            return (
              <div key={interview._id} className="clay-card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  {/* Type icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    interview.type === 'video' ? 'bg-clay-sky'
                    : interview.type === 'voice' ? 'bg-clay-lavender'
                    : 'bg-clay-peach'
                  }`}>
                    <Icon
                      size={20}
                      strokeWidth={2.2}
                      className={
                        interview.type === 'video' ? 'text-blue-600'
                        : interview.type === 'voice' ? 'text-clay-purple'
                        : 'text-orange-600'
                      }
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-800 text-clay-text text-base">
                        {cand?.name || 'Unknown Candidate'}
                      </p>
                      <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${STATUS_COLORS[interview.status] || 'badge-lavender'}`}>
                        {interview.status}
                      </span>
                      <span className="text-xs badge-lavender px-2 py-0.5 rounded-pill font-600 capitalize">
                        {interview.type}
                      </span>
                    </div>

                    <p className="text-sm text-clay-muted font-500">
                      {job?.title || 'No job'} · {cand?.email || ''}
                    </p>

                    {interview.scheduledAt && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-sm font-700 text-clay-text">
                          <Calendar size={13} strokeWidth={2.2} className="text-clay-purple" />
                          {format(new Date(interview.scheduledAt), 'EEEE, dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-700 text-clay-text">
                          <Clock size={13} strokeWidth={2.2} className="text-clay-purple" />
                          {format(new Date(interview.scheduledAt), 'hh:mm a')}
                        </span>
                      </div>
                    )}

                    {/* Scores if completed */}
                    {interview.status === 'completed' && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {[
                          { label: 'Communication', val: interview.communicationScore },
                          { label: 'Clarity',        val: interview.clarityScore       },
                          { label: 'Confidence',     val: interview.confidenceScore    },
                        ].map(({ label, val }) => val > 0 && (
                          <div key={label} className="text-center bg-clay-bg rounded-xl px-3 py-1.5">
                            <p className="text-xs text-clay-muted font-600">{label}</p>
                            <p className="font-900 text-clay-purple">{val}<span className="text-xs font-500">/10</span></p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {isScheduled && (
                      <>
                        <button
                          onClick={() => {
                            api.patch(`/api/interviews/${interview._id}`, { status: 'completed' })
                              .then(() => {
                                setInterviews((prev) =>
                                  prev.map((i) => i._id === interview._id ? { ...i, status: 'completed' } : i)
                                );
                                // Also advance application status
                                if (app?._id) {
                                  api.patch(`/api/applications/${app._id}/status`, { status: 'interviewed' }).catch(() => {});
                                }
                                toast.success('Interview marked as completed');
                              })
                              .catch(() => toast.error('Failed to update'));
                          }}
                          className="text-xs font-700 px-4 py-2 rounded-pill bg-clay-mint text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                        >
                          ✅ Mark Complete
                        </button>
                        <button
                          onClick={() => handleCancel(interview._id)}
                          disabled={cancelling === interview._id}
                          className="text-xs font-700 px-4 py-2 rounded-pill bg-clay-rose text-red-600 hover:bg-red-100 transition-colors"
                        >
                          {cancelling === interview._id ? '...' : 'Cancel'}
                        </button>
                      </>
                    )}

                    {interview.status === 'completed' && interview.videoUrl && (
                      <a
                        href={interview.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-700 px-4 py-2 rounded-pill bg-clay-sky text-blue-700 hover:bg-blue-100 transition-colors text-center"
                      >
                        ▶ View Recording
                      </a>
                    )}
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
