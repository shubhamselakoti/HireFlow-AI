'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import type { Leave, LeaveBalance, LeavePolicy } from '@/types';

const schema = z.object({
  leaveType: z.string().min(1, 'Select a leave type'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});
type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<string, string> = { pending: 'badge-yellow', approved: 'badge-mint', rejected: 'badge-rose' };

export default function EmployeeLeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/leave/my');
      setLeaves(r.data.data);
      setBalances(r.data.balances || []);
    } catch { toast.error('Failed to load leave data'); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const r = await api.post('/api/leave/apply', data);
      setLeaves((prev) => [r.data.data, ...prev]);
      setShowForm(false);
      reset();
      toast.success('Leave request submitted!');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">My Leave</h1>
          <p className="text-clay-muted text-sm font-500">Apply for leave and view your history</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2">
          <Plus size={15} strokeWidth={2.5} /> Apply Leave
        </button>
      </div>

      {/* Leave balances */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {balances.map((b) => (
            <div key={b.policy._id} className="clay-card-sm p-4 text-center bg-clay-lavender/30">
              <p className="text-2xl font-900 text-clay-purple">{b.remaining}</p>
              <p className="text-[10px] font-600 text-clay-muted mt-0.5">days left</p>
              <p className="text-xs font-700 text-clay-text mt-1">{b.policy.name}</p>
              <p className="text-[10px] text-clay-muted">{b.used}/{b.policy.daysAllowed} used</p>
            </div>
          ))}
        </div>
      )}

      {/* Apply form */}
      {showForm && (
        <div className="clay-card p-6 border-2 border-clay-purple/20">
          <h3 className="font-800 text-clay-text mb-5">Apply for Leave</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Leave Type *</label>
                <select {...register('leaveType')} className="clay-input w-full px-3 py-3 text-sm">
                  <option value="">Select type...</option>
                  {balances.map((b) => (
                    <option key={b.policy._id} value={b.policy._id}>
                      {b.policy.name} ({b.remaining} days left)
                    </option>
                  ))}
                </select>
                {errors.leaveType && <p className="text-red-500 text-xs mt-1">{errors.leaveType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Start Date *</label>
                <input {...register('startDate')} type="date" className="clay-input w-full px-4 py-3 text-sm" />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">End Date *</label>
                <input {...register('endDate')} type="date" className="clay-input w-full px-4 py-3 text-sm" />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-700 text-clay-text mb-1.5">Reason *</label>
              <textarea {...register('reason')} rows={3} placeholder="Describe your reason..."
                className="clay-input w-full px-4 py-3 text-sm resize-none" />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting}
                className="clay-btn clay-btn-primary px-6 py-2.5 text-sm font-800 text-white flex items-center gap-2">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Request'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }}
                className="clay-btn clay-btn-outline px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30">
          <h3 className="font-800 text-clay-text">Leave History</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-16 rounded-xl" />)}</div>
        ) : leaves.length === 0 ? (
          <EmptyState icon="🏖️" title="No leave history" description="Your leave requests will appear here." />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {leaves.map((leave) => {
              const policy = leave.leaveType as any;
              return (
                <div key={leave._id} className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-clay-yellow flex items-center justify-center text-xl flex-shrink-0">🏖️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-clay-text">{policy?.name || 'Leave'}</p>
                    <p className="text-sm text-clay-muted font-500">
                      {format(new Date(leave.startDate), 'dd MMM')} – {format(new Date(leave.endDate), 'dd MMM yyyy')}
                      {' '}· {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                    </p>
                    {leave.reason && <p className="text-xs text-clay-muted italic truncate">"{leave.reason}"</p>}
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-1 rounded-pill flex-shrink-0 ${STATUS_COLORS[leave.status]}`}>
                    {leave.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
