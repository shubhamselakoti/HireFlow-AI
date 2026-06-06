'use client';
import { getDownloadUrl } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Users, CheckCircle, XCircle, ChevronRight, Loader2, UserPlus, FileText } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const STAGES = [
  { key: 'applied',              label: 'Applied',          color: 'bg-clay-lavender', text: 'text-clay-purple',   dot: 'bg-clay-purple' },
  { key: 'screened',             label: 'AI Screened',      color: 'bg-clay-sky',      text: 'text-blue-600',      dot: 'bg-blue-500' },
  { key: 'interview_scheduled',  label: 'Interview Sched.', color: 'bg-clay-yellow',   text: 'text-yellow-700',    dot: 'bg-yellow-500' },
  { key: 'interviewed',          label: 'Interviewed',      color: 'bg-clay-peach',    text: 'text-orange-600',    dot: 'bg-orange-500' },
  { key: 'offered',              label: 'Offered',          color: 'bg-clay-mint',     text: 'text-green-700',     dot: 'bg-green-500' },
  { key: 'hired',                label: 'Hired ✅',         color: 'bg-green-50',      text: 'text-green-800',     dot: 'bg-green-600' },
  { key: 'rejected',             label: 'Rejected',         color: 'bg-clay-rose',     text: 'text-red-600',       dot: 'bg-red-400' },
];

const NEXT_STAGE: Record<string, string> = {
  applied: 'screened',
  screened: 'interview_scheduled',
  interview_scheduled: 'interviewed',
  interviewed: 'offered',
  offered: 'hired',
};

const SCORE_COLOR = (score: number) =>
  score >= 70 ? 'badge-mint' : score >= 40 ? 'badge-yellow' : 'badge-rose';

export default function PipelinePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const jobTitle = searchParams.get('title') || 'Job';

  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState('applied');

  useEffect(() => {
    if (!jobId) return;
    fetchPipeline();
  }, [jobId]);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/applications/pipeline/${jobId}`);
      setPipeline(r.data.data);
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  };

  const moveToStage = async (applicationId: string, currentStatus: string, newStatus: string) => {
    setMoving(applicationId);
    try {
      await api.patch(`/api/applications/${applicationId}/status`, { status: newStatus });

      // Move in local state
      setPipeline((prev) => {
        const updated = { ...prev };
        const app = prev[currentStatus]?.find((a: any) => a._id === applicationId);
        if (app) {
          updated[currentStatus] = prev[currentStatus].filter((a: any) => a._id !== applicationId);
          updated[newStatus] = [{ ...app, status: newStatus }, ...(prev[newStatus] || [])];
        }
        return updated;
      });

      if (newStatus === 'hired') {
        toast.success('🎉 Candidate hired! Employee record created automatically.');
      } else if (newStatus === 'rejected') {
        toast.success('Application rejected.');
      } else {
        toast.success(`Moved to "${STAGES.find(s => s.key === newStatus)?.label}"`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setMoving(null);
    }
  };

  const totalApplicants = Object.values(pipeline).flat().length;
  const hired = (pipeline['hired'] || []).length;
  const active = Object.entries(pipeline)
    .filter(([k]) => !['hired', 'rejected'].includes(k))
    .reduce((s, [, v]) => s + v.length, 0);

  const currentStageApps = pipeline[activeStage] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white shadow-clay-sm flex items-center justify-center text-clay-muted hover:text-clay-text transition-colors">
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Hiring Pipeline</h1>
          <p className="text-clay-muted text-sm font-500">{jobTitle} · {totalApplicants} total applicants</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Applicants', value: totalApplicants, tint: 'bg-clay-lavender', text: 'text-clay-purple' },
          { label: 'Active in Pipeline', value: active, tint: 'bg-clay-sky', text: 'text-blue-600' },
          { label: 'Hired', value: hired, tint: 'bg-clay-mint', text: 'text-green-700' },
        ].map(({ label, value, tint, text }) => (
          <div key={label} className={`clay-card p-4 text-center ${tint}`}>
            <p className={`text-3xl font-900 ${text}`}>{value}</p>
            <p className="text-xs text-clay-muted font-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((stage) => {
          const count = (pipeline[stage.key] || []).length;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-700 transition-all ${
                activeStage === stage.key
                  ? 'bg-clay-purple text-white shadow-clay-btn'
                  : 'bg-white text-clay-muted shadow-clay-sm hover:text-clay-text'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
              {stage.label}
              {count > 0 && (
                <span className={`text-xs font-800 px-1.5 py-0.5 rounded-full ${
                  activeStage === stage.key ? 'bg-white/20 text-white' : 'bg-clay-lavender text-clay-purple'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stage content */}
      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30 flex items-center justify-between">
          <h3 className="font-800 text-clay-text">
            {STAGES.find(s => s.key === activeStage)?.label} — {currentStageApps.length} candidate{currentStageApps.length !== 1 ? 's' : ''}
          </h3>
          {activeStage !== 'hired' && activeStage !== 'rejected' && NEXT_STAGE[activeStage] && (
            <p className="text-xs text-clay-muted font-500">
              Next step: <span className="font-700 text-clay-purple">{STAGES.find(s => s.key === NEXT_STAGE[activeStage])?.label}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="clay-skeleton h-20 rounded-xl" />)}
          </div>
        ) : currentStageApps.length === 0 ? (
          <EmptyState
            icon={activeStage === 'hired' ? '🎉' : activeStage === 'rejected' ? '❌' : '📥'}
            title={`No candidates in "${STAGES.find(s => s.key === activeStage)?.label}"`}
            description={
              activeStage === 'applied'
                ? 'Candidates will appear here when they apply via the job portal.'
                : `Move candidates here from the previous stage.`
            }
          />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {currentStageApps.map((app: any) => {
              const cand = app.candidateId;
              const isMoving = moving === app._id;
              const nextStage = NEXT_STAGE[activeStage];

              return (
                <div key={app._id} className="flex items-center gap-4 p-5 hover:bg-clay-lavender/10 transition-colors">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple flex-shrink-0">
                    {cand?.name?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-clay-text">{cand?.name || 'Unknown'}</p>
                    <p className="text-sm text-clay-muted font-500">{cand?.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {cand?.yearsExperience > 0 && (
                        <span className="text-xs text-clay-muted font-500">{cand.yearsExperience} yrs exp</span>
                      )}
                      {cand?.skills?.length > 0 && (
                        <span className="text-xs text-clay-muted font-500">
                          {cand.skills.slice(0, 2).join(', ')}{cand.skills.length > 2 ? ` +${cand.skills.length - 2}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Score */}
                  {(app.aiScore > 0 || cand?.aiScore > 0) && (
                    <div className="text-center flex-shrink-0">
                      <span className={`text-xs font-800 px-2.5 py-1 rounded-pill ${SCORE_COLOR(app.aiScore || cand?.aiScore)}`}>
                        AI {app.aiScore || cand?.aiScore}
                      </span>
                    </div>
                  )}

                  {/* Resume link */}
                  {cand?.resumeUrl && (
                    <a
                      href={getDownloadUrl(cand.resumeUrl)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-clay-purple font-700 hover:underline flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText size={13} strokeWidth={2.2} /> Resume
                    </a>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Reject button (all except already rejected/hired) */}
                    {!['rejected', 'hired'].includes(activeStage) && (
                      <button
                        onClick={() => moveToStage(app._id, activeStage, 'rejected')}
                        disabled={isMoving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-clay-rose text-red-600 rounded-pill text-xs font-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} strokeWidth={2.5} /> Reject
                      </button>
                    )}

                    {/* Move forward button */}
                    {nextStage && !['hired'].includes(activeStage) && (
                      <button
                        onClick={() => moveToStage(app._id, activeStage, nextStage)}
                        disabled={isMoving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-700 transition-colors disabled:opacity-50 ${
                          nextStage === 'hired'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-clay-purple text-white hover:bg-clay-purple-light'
                        }`}
                      >
                        {isMoving
                          ? <Loader2 size={12} className="animate-spin" />
                          : nextStage === 'hired'
                          ? <><UserPlus size={12} strokeWidth={2.5} /> Hire</>
                          : <><ChevronRight size={12} strokeWidth={2.5} /> {STAGES.find(s => s.key === nextStage)?.label.split(' ')[0]}</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How it works hint */}
      <div className="clay-card p-5 bg-clay-sky/30">
        <h4 className="font-800 text-clay-text mb-3">📋 Hiring Pipeline Flow</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {STAGES.filter(s => s.key !== 'rejected').map((stage, i, arr) => (
            <span key={stage.key} className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-pill text-xs font-700 ${stage.color} ${stage.text}`}>
                {stage.label}
              </span>
              {i < arr.length - 1 && <ArrowRight size={12} className="text-clay-muted" />}
            </span>
          ))}
        </div>
        <p className="text-xs text-clay-muted font-500 mt-3">
          When you click <strong>"Hire"</strong> on a candidate:
          an <strong>Employee record</strong> is automatically created, an <strong>Onboarding checklist</strong> is generated,
          and if the candidate has an account, their profile is linked. They can then log in and access the Employee portal.
        </p>
      </div>
    </div>
  );
}

/** Convert a Cloudinary URL to a forced-download URL */
  return url;
}
