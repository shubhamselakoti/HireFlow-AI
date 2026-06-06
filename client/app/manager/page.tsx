'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { CardGridSkeleton } from '@/components/shared/SkeletonLoader';

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const [teamSize, setTeamSize] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [avgPerformance, setAvgPerformance] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/employees?limit=200'),
      api.get('/api/attendance/team'),
      api.get('/api/leave/team?status=pending'),
      api.get('/api/performance/team'),
    ])
      .then(([emp, att, leaves, perf]) => {
        setTeamSize(emp.data.total);
        setPresentToday(att.data.data.filter((a: any) => a.status === 'present').length);
        setPendingLeaves(leaves.data.data);
        const reviews = perf.data.data;
        if (reviews.length > 0) {
          const avg = reviews.reduce((s: number, r: any) => s + r.overallRating, 0) / reviews.length;
          setAvgPerformance(avg.toFixed(1));
        }
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleLeave = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/api/leave/${id}/${action}`);
      toast.success(`Leave ${action}d`);
      setPendingLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Manager Dashboard</h1>
        <p className="text-clay-muted text-sm font-500">
          Welcome back, {session?.user?.name?.split(' ')[0]} · {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {loading ? <CardGridSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Team Size" value={teamSize} icon="👥" tint="lavender" />
          <StatCard title="Present Today" value={presentToday} icon="✅" tint="mint" />
          <StatCard title="Pending Leaves" value={pendingLeaves.length} icon="📋" tint="yellow" />
          <StatCard title="Avg Performance" value={`${avgPerformance}/5`} icon="⭐" tint="sky" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <div className="clay-card p-6">
          <h3 className="font-800 text-clay-text mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/manager/team', label: '👥 My Team', tint: 'bg-clay-lavender' },
              { href: '/manager/attendance', label: '📅 Attendance', tint: 'bg-clay-sky' },
              { href: '/manager/leave', label: '📋 Leave Requests', tint: 'bg-clay-yellow' },
              { href: '/manager/performance', label: '📈 Performance', tint: 'bg-clay-mint' },
            ].map(({ href, label, tint }) => (
              <Link key={href} href={href}>
                <div className={`${tint} rounded-2xl p-4 text-center font-700 text-clay-text text-sm hover:-translate-y-0.5 transition-all cursor-pointer`}>
                  {label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending leaves */}
        <div className="clay-card p-6">
          <h3 className="font-800 text-clay-text mb-4">Pending Leave Requests</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="clay-skeleton h-14 rounded-xl" />)}</div>
          ) : pendingLeaves.length === 0 ? (
            <EmptyState icon="✅" title="All caught up!" description="No pending leave requests." />
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave) => {
                const emp = leave.employeeId as any;
                const policy = leave.leaveType as any;
                return (
                  <div key={leave._id} className="flex items-center gap-3 p-3 bg-clay-bg rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-xs flex-shrink-0">
                      {emp?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-clay-text text-sm truncate">{emp?.name}</p>
                      <p className="text-xs text-clay-muted">{policy?.name} · {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleLeave(leave._id, 'approve')}
                        className="w-7 h-7 rounded-xl bg-clay-mint flex items-center justify-center hover:bg-green-100 transition-colors">
                        <CheckCircle size={13} className="text-green-600" strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleLeave(leave._id, 'reject')}
                        className="w-7 h-7 rounded-xl bg-clay-rose flex items-center justify-center hover:bg-red-100 transition-colors">
                        <XCircle size={13} className="text-red-500" strokeWidth={2.5} />
                      </button>
                    </div>
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
