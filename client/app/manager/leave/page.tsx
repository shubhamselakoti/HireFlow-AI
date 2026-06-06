'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

export default function ManagerLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/leave/team?status=${filter}`)
      .then((r) => setLeaves(r.data.data))
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/api/leave/${id}/${action}`);
      toast.success(`Leave ${action}d`);
      setLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch { toast.error('Action failed'); }
  };

  const STATUS_STYLE: Record<string, string> = {
    pending: 'badge-yellow', approved: 'badge-mint', rejected: 'badge-rose',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Team Leave Requests</h1>
        <p className="text-clay-muted text-sm font-500">{leaves.length} requests</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-pill text-sm font-700 transition-all capitalize ${
              filter === s ? 'bg-clay-purple text-white shadow-clay-btn' : 'bg-white text-clay-muted shadow-clay-sm'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="clay-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-20 rounded-xl" />)}</div>
        ) : leaves.length === 0 ? (
          <EmptyState icon="✅" title="No requests" description={`No ${filter} leave requests.`} />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {leaves.map((leave) => {
              const emp = leave.employeeId as any;
              const policy = leave.leaveType as any;
              return (
                <div key={leave._id} className="flex items-center gap-4 p-5 hover:bg-clay-lavender/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple flex-shrink-0">
                    {emp?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-clay-text">{emp?.name || 'Unknown'}</p>
                    <p className="text-sm text-clay-muted font-500">
                      {policy?.name} · {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''} ·{' '}
                      {format(new Date(leave.startDate), 'dd MMM')} – {format(new Date(leave.endDate), 'dd MMM yyyy')}
                    </p>
                    {leave.reason && <p className="text-xs text-clay-muted italic truncate">"{leave.reason}"</p>}
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${STATUS_STYLE[leave.status]}`}>
                    {leave.status}
                  </span>
                  {filter === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleAction(leave._id, 'approve')}
                        className="w-8 h-8 rounded-xl bg-clay-mint flex items-center justify-center hover:bg-green-100 transition-colors">
                        <CheckCircle size={14} className="text-green-600" strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleAction(leave._id, 'reject')}
                        className="w-8 h-8 rounded-xl bg-clay-rose flex items-center justify-center hover:bg-red-100 transition-colors">
                        <XCircle size={14} className="text-red-500" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
