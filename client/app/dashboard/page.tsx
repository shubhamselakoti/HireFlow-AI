'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import ChartCard from '@/components/shared/ChartCard';
import EmptyState from '@/components/shared/EmptyState';
import { CardGridSkeleton } from '@/components/shared/SkeletonLoader';
import type { OverviewData, Leave } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6D4AFF','#9F7AEA','#F59E0B','#10B981','#EF4444','#3B82F6','#EC4899'];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [overviewRes, leaveRes] = await Promise.all([
        api.get('/api/analytics/overview'),
        api.get('/api/leave/all?status=pending&limit=5'),
      ]);
      setOverview(overviewRes.data.data);
      setPendingLeaves(leaveRes.data.data);
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/api/leave/${id}/${action}`);
      toast.success(`Leave ${action}d successfully`);
      setPendingLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch {
      toast.error('Action failed');
    }
  };

  const attendanceChartData = overview?.monthlyAttendance?.map((a) => ({
    name: MONTH_NAMES[a.month - 1],
    rate: a.rate,
  })) ?? [];

  const deptChartData = overview?.headcountByDept ?? [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-900 text-clay-text">
          Good {getGreeting()}, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-clay-muted text-sm font-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={overview?.totalEmployees ?? 0} icon="👥" tint="lavender" />
          <StatCard title="Active Jobs" value={overview?.activeJobs ?? 0} icon="💼" tint="peach" />
          <StatCard title="Pending Leaves" value={overview?.pendingLeaves ?? 0} icon="📋" tint="rose" />
          <StatCard
            title="This Month Payroll"
            value={overview?.thisMonthPayroll
              ? `₹${(overview.thisMonthPayroll / 100000).toFixed(1)}L`
              : '₹0'}
            icon="💰"
            tint="mint"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance trend */}
        <ChartCard title="Monthly Attendance Rate" subtitle="Last 6 months" loading={loading}>
          {attendanceChartData.length === 0 ? (
            <EmptyState icon="📊" title="No attendance data yet" description="Start tracking attendance to see trends here." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7B6FA0' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }}
                  formatter={(v: any) => [`${v}%`, 'Attendance Rate']}
                />
                <Line type="monotone" dataKey="rate" stroke="#6D4AFF" strokeWidth={3} dot={{ fill: '#6D4AFF', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Headcount by dept */}
        <ChartCard title="Headcount by Department" subtitle="Active employees" loading={loading}>
          {deptChartData.length === 0 ? (
            <EmptyState icon="🏢" title="No departments yet" description="Create departments and add employees to see this chart." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={deptChartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {deptChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-800 text-clay-text">Pending Leave Requests</h3>
            <span className="badge-rose text-xs font-700 px-2.5 py-1 rounded-pill">
              {pendingLeaves.length} pending
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="clay-skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : pendingLeaves.length === 0 ? (
            <EmptyState icon="✅" title="All caught up!" description="No pending leave requests right now." />
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => {
                const emp = leave.employeeId as any;
                const policy = leave.leaveType as any;
                return (
                  <div key={leave._id} className="flex items-center gap-3 p-3 bg-clay-bg rounded-2xl">
                    <div className="w-9 h-9 rounded-full bg-clay-lavender flex items-center justify-center flex-shrink-0 font-800 text-clay-purple text-sm">
                      {emp?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-clay-text text-sm truncate">{emp?.name || 'Unknown'}</p>
                      <p className="text-xs text-clay-muted font-500">
                        {policy?.name || 'Leave'} · {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleLeave(leave._id, 'approve')}
                        className="w-8 h-8 rounded-xl bg-clay-mint flex items-center justify-center hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={15} className="text-green-600" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleLeave(leave._id, 'reject')}
                        className="w-8 h-8 rounded-xl bg-clay-rose flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={15} className="text-red-500" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Hires */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-800 text-clay-text">Recent Hires</h3>
            <TrendingUp size={18} className="text-clay-purple" strokeWidth={2.2} />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="clay-skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (overview?.recentHires?.length ?? 0) === 0 ? (
            <EmptyState icon="🎉" title="No recent hires" description="New employees will appear here after joining." />
          ) : (
            <div className="space-y-3">
              {overview!.recentHires.map((emp) => {
                const dept = emp.department as any;
                return (
                  <div key={emp._id} className="flex items-center gap-3 p-3 bg-clay-bg rounded-2xl">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-clay-peach flex items-center justify-center flex-shrink-0 font-800 text-orange-600 text-sm">
                        {emp.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-clay-text text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-clay-muted font-500">
                        {emp.designation || 'Employee'} · {dept?.name || 'No dept'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="badge-mint text-xs font-700 px-2 py-0.5 rounded-pill">New</span>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
