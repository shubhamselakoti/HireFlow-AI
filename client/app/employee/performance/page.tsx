'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2, Target } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import type { Performance, Goal } from '@/types';

export default function EmployeePerformancePage() {
  const [reviews, setReviews] = useState<Performance[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/performance/my'),
      api.get('/api/performance/goals/my'),
    ])
      .then(([r, g]) => { setReviews(r.data.data); setGoals(g.data.data); })
      .catch(() => toast.error('Failed to load performance data'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.title) { toast.error('Goal title is required'); return; }
    setSubmitting(true);
    try {
      const r = await api.post('/api/performance/goals', newGoal);
      setGoals((prev) => [r.data.data, ...prev]);
      setShowGoalForm(false);
      setNewGoal({ title: '', description: '', targetDate: '' });
      toast.success('Goal created!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    try {
      const r = await api.patch(`/api/performance/goals/${goalId}`, { progress });
      setGoals((prev) => prev.map((g) => g._id === goalId ? r.data.data : g));
    } catch { toast.error('Failed to update goal'); }
  };

  const latestReview = reviews[0];
  const radarData = latestReview ? [
    { axis: 'Technical', value: latestReview.ratings.technical },
    { axis: 'Communication', value: latestReview.ratings.communication },
    { axis: 'Teamwork', value: latestReview.ratings.teamwork },
    { axis: 'Punctuality', value: latestReview.ratings.punctuality },
    { axis: 'Leadership', value: latestReview.ratings.leadership },
  ] : [];

  const STATUS_COLORS: Record<string, string> = {
    not_started: 'badge-yellow',
    in_progress: 'badge-sky',
    completed: 'badge-mint',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">My Performance</h1>
        <p className="text-clay-muted text-sm font-500">Reviews, ratings, and personal goals</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="clay-skeleton h-64 rounded-3xl" />
          <div className="clay-skeleton h-48 rounded-3xl" />
        </div>
      ) : (
        <>
          {/* Latest Review */}
          {latestReview ? (
            <div className="clay-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-800 text-clay-text">Latest Review — {latestReview.period}</h3>
                  <p className="text-sm text-clay-muted font-500">
                    Overall Rating: <span className="font-900 text-clay-purple text-lg">{latestReview.overallRating.toFixed(1)}</span>/5
                  </p>
                </div>
                <span className={`text-xs font-700 px-2.5 py-1 rounded-pill ${
                  latestReview.status === 'acknowledged' ? 'badge-mint' : 'badge-sky'
                }`}>
                  {latestReview.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar chart */}
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E8E0FF" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} />
                    <Radar dataKey="value" stroke="#6D4AFF" fill="#6D4AFF" fillOpacity={0.15} strokeWidth={2.5} />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Rating breakdown */}
                <div className="space-y-3">
                  {Object.entries(latestReview.ratings).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-600 text-clay-muted capitalize">{key}</span>
                        <span className="font-800 text-clay-text">{val}/5</span>
                      </div>
                      <div className="h-2 bg-clay-lavender rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all"
                          style={{ width: `${(val / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {latestReview.comments && (
                    <div className="mt-4 p-3 bg-clay-lavender/30 rounded-xl">
                      <p className="text-xs text-clay-muted font-600 mb-1">Reviewer's Comments</p>
                      <p className="text-sm text-clay-text italic">"{latestReview.comments}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="clay-card p-8">
              <EmptyState icon="📈" title="No reviews yet" description="Your manager will submit a performance review here." />
            </div>
          )}

          {/* Review history */}
          {reviews.length > 1 && (
            <div className="clay-card p-6">
              <h3 className="font-800 text-clay-text mb-4">Review History</h3>
              <div className="space-y-3">
                {reviews.slice(1).map((r) => (
                  <div key={r._id} className="flex items-center gap-4 p-4 bg-clay-bg rounded-2xl">
                    <div className="flex-1">
                      <p className="font-700 text-clay-text">{r.period}</p>
                      <p className="text-xs text-clay-muted font-500">{r.status}</p>
                    </div>
                    <div className="text-2xl font-900 text-clay-purple">{r.overallRating.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          <div className="clay-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-800 text-clay-text flex items-center gap-2">
                <Target size={18} className="text-clay-purple" strokeWidth={2.2} /> My Goals
              </h3>
              <button onClick={() => setShowGoalForm(!showGoalForm)}
                className="clay-btn clay-btn-primary px-4 py-2 text-sm font-700 text-white flex items-center gap-1.5">
                <Plus size={14} strokeWidth={2.5} /> Add Goal
              </button>
            </div>

            {/* Add goal form */}
            {showGoalForm && (
              <div className="bg-clay-lavender/20 rounded-2xl p-5 mb-5 space-y-4">
                <div>
                  <label className="block text-sm font-700 text-clay-text mb-1.5">Goal Title *</label>
                  <input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g. Complete AWS certification"
                    className="clay-input w-full px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-700 text-clay-text mb-1.5">Description</label>
                  <textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    rows={2} placeholder="Brief description..." className="clay-input w-full px-4 py-2.5 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-700 text-clay-text mb-1.5">Target Date</label>
                  <input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="clay-input px-4 py-2.5 text-sm" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddGoal} disabled={submitting}
                    className="clay-btn clay-btn-primary px-5 py-2 text-sm font-700 text-white flex items-center gap-2">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null} Create Goal
                  </button>
                  <button onClick={() => setShowGoalForm(false)} className="clay-btn clay-btn-outline px-5 py-2 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {goals.length === 0 ? (
              <EmptyState icon="🎯" title="No goals yet" description="Set personal goals to track your growth." />
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal._id} className="bg-clay-bg rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-700 text-clay-text">{goal.title}</p>
                        {goal.description && <p className="text-xs text-clay-muted font-500 mt-0.5">{goal.description}</p>}
                        {goal.targetDate && (
                          <p className="text-xs text-clay-muted mt-0.5">
                            Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill flex-shrink-0 ${STATUS_COLORS[goal.status]}`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-clay-lavender rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-clay-purple to-clay-purple-light rounded-full transition-all duration-300"
                          style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-sm font-800 text-clay-purple w-10 text-right">{goal.progress}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={goal.progress}
                      onChange={(e) => handleUpdateProgress(goal._id, Number(e.target.value))}
                      className="w-full mt-2 accent-clay-purple" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
