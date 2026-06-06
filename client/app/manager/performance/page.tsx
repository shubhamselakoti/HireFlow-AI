'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Star, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const RATING_KEYS = ['technical', 'communication', 'teamwork', 'punctuality', 'leadership'] as const;

export default function ManagerPerformancePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({ technical: 3, communication: 3, teamwork: 3, punctuality: 3, leadership: 3 });
  const [form, setForm] = useState({ employeeId: '', period: '', comments: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/performance/team'),
      api.get('/api/employees?limit=200'),
    ])
      .then(([r, e]) => { setReviews(r.data.data); setEmployees(e.data.data); })
      .catch(() => toast.error('Failed to load performance data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.employeeId || !form.period) { toast.error('Employee and period are required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/api/performance', { ...form, ratings });
      setReviews((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      setForm({ employeeId: '', period: '', comments: '' });
      setRatings({ technical: 3, communication: 3, teamwork: 3, punctuality: 3, leadership: 3 });
      toast.success('Review submitted!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Team Performance</h1>
          <p className="text-clay-muted text-sm font-500">Submit and view performance reviews</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2">
          <Plus size={15} strokeWidth={2.5} /> Add Review
        </button>
      </div>

      <div className="clay-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-20 rounded-xl" />)}</div>
        ) : reviews.length === 0 ? (
          <EmptyState icon="📈" title="No reviews yet" description="Submit your first performance review."
            action={{ label: '+ Add Review', onClick: () => setShowModal(true) }} />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {reviews.map((review) => {
              const emp = review.employeeId as any;
              return (
                <div key={review._id} className="flex items-center gap-4 p-5 hover:bg-clay-lavender/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple flex-shrink-0">
                    {emp?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-700 text-clay-text">{emp?.name || 'Unknown'}</p>
                    <p className="text-xs text-clay-muted font-500">{review.period}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} strokeWidth={0}
                        className={i < Math.round(review.overallRating) ? 'fill-yellow-400' : 'fill-clay-lavender'} />
                    ))}
                    <span className="text-sm font-800 text-clay-text ml-1">{review.overallRating.toFixed(1)}</span>
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${
                    review.status === 'acknowledged' ? 'badge-mint' : 'badge-sky'
                  }`}>{review.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 clay-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="clay-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-clay-lavender/30">
              <h3 className="font-800 text-clay-text text-lg">Add Performance Review</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Employee *</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="clay-input w-full px-3 py-2.5 text-sm">
                  <option value="">Select employee...</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Review Period *</label>
                <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="e.g. Q2 2025" className="clay-input w-full px-4 py-2.5 text-sm" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-700 text-clay-text">Ratings (1–5)</p>
                {RATING_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-4">
                    <span className="text-sm font-600 text-clay-muted capitalize w-28">{k}</span>
                    <input type="range" min={1} max={5} step={1} value={ratings[k]}
                      onChange={(e) => setRatings({ ...ratings, [k]: Number(e.target.value) })}
                      className="flex-1 accent-clay-purple" />
                    <span className="text-sm font-800 text-clay-purple w-6 text-center">{ratings[k]}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Comments</label>
                <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  rows={3} className="clay-input w-full px-4 py-3 text-sm resize-none" placeholder="Optional feedback..." />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={submitting}
                  className="clay-btn clay-btn-primary flex-1 py-3 text-sm font-800 text-white flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Review'}
                </button>
                <button onClick={() => setShowModal(false)} className="clay-btn clay-btn-outline px-5 py-3 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
