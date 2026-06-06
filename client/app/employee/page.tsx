'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Clock, Loader2, LogIn, LogOut } from 'lucide-react';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import { CardGridSkeleton } from '@/components/shared/SkeletonLoader';

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [monthAttendance, setMonthAttendance] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);

  const now = new Date();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [profileRes, attRes, leaveRes, goalsRes] = await Promise.all([
        api.get('/api/employees/my/profile'),
        api.get(`/api/attendance/my?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
        api.get('/api/leave/my'),
        api.get('/api/performance/goals/my'),
      ]);

      setProfile(profileRes.data.data);
      setMonthAttendance(attRes.data.data);
      setLeaveBalance(leaveRes.data.balances || []);
      setGoals(goalsRes.data.data);

      // Today's record
      const today = format(now, 'yyyy-MM-dd');
      const todayAtt = attRes.data.data.find((a: any) =>
        format(new Date(a.date), 'yyyy-MM-dd') === today
      );
      setTodayRecord(todayAtt || null);
    } catch { /* profile may not exist yet */ }
    finally { setLoading(false); }
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const r = await api.post('/api/attendance/clock-in');
      setTodayRecord(r.data.data);
      toast.success('Clocked in! Have a great day 👋');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setClockLoading(false); }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      const r = await api.post('/api/attendance/clock-out');
      setTodayRecord(r.data.data);
      toast.success(`Clocked out! You worked ${r.data.data.totalHours}h today 🎉`);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setClockLoading(false); }
  };

  const presentDays = monthAttendance.filter((a) => a.status === 'present').length;
  const totalLeaveBalance = leaveBalance.reduce((s, b) => s + b.remaining, 0);
  const pendingGoals = goals.filter((g) => g.status !== 'completed').length;
  const dept = profile?.department as any;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      {profile && (
        <div className="clay-card p-6 bg-gradient-to-br from-clay-lavender/50 to-clay-peach/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-clay flex items-center justify-center text-2xl font-900 text-clay-purple flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-2xl object-cover" />
              ) : profile.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-900 text-clay-text">
                Good {getGreeting()}, {profile.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-clay-muted text-sm font-500">
                {profile.designation || 'Employee'} · {dept?.name || 'No department'} · {profile.employeeCode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clock In/Out */}
      <div className="clay-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-800 text-clay-text mb-1 flex items-center gap-2">
              <Clock size={18} className="text-clay-purple" strokeWidth={2.2} /> Today's Attendance
            </h3>
            <p className="text-clay-muted text-sm font-500">{format(now, 'EEEE, MMMM d, yyyy')}</p>
            {todayRecord && (
              <div className="flex gap-4 mt-3">
                {todayRecord.clockIn && (
                  <div>
                    <p className="text-xs text-clay-muted font-600">Clock In</p>
                    <p className="font-800 text-clay-text">{format(new Date(todayRecord.clockIn), 'hh:mm a')}</p>
                  </div>
                )}
                {todayRecord.clockOut && (
                  <div>
                    <p className="text-xs text-clay-muted font-600">Clock Out</p>
                    <p className="font-800 text-clay-text">{format(new Date(todayRecord.clockOut), 'hh:mm a')}</p>
                  </div>
                )}
                {todayRecord.totalHours > 0 && (
                  <div>
                    <p className="text-xs text-clay-muted font-600">Hours</p>
                    <p className="font-800 text-green-600">{todayRecord.totalHours}h</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!todayRecord?.clockIn ? (
              <button onClick={handleClockIn} disabled={clockLoading}
                className="clay-btn clay-btn-primary px-8 py-4 text-base font-800 text-white flex items-center gap-3">
                {clockLoading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} strokeWidth={2.5} />}
                Clock In
              </button>
            ) : !todayRecord?.clockOut ? (
              <button onClick={handleClockOut} disabled={clockLoading}
                className="clay-btn bg-clay-rose text-red-600 px-8 py-4 text-base font-800 border border-red-200 flex items-center gap-3">
                {clockLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} strokeWidth={2.5} />}
                Clock Out
              </button>
            ) : (
              <div className="clay-card-sm px-6 py-4 text-center bg-clay-mint">
                <p className="text-green-700 font-800">✅ Done for today!</p>
                <p className="text-xs text-green-600 font-600">{todayRecord.totalHours}h worked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? <CardGridSkeleton count={3} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Present Days This Month" value={presentDays} icon="📅" tint="mint" />
          <StatCard title="Leave Balance" value={`${totalLeaveBalance} days`} icon="🏖️" tint="sky" />
          <StatCard title="Active Goals" value={pendingGoals} icon="🎯" tint="peach" />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/employee/attendance', label: '📅 My Attendance', tint: 'bg-clay-sky' },
          { href: '/employee/leave', label: '🏖️ Apply Leave', tint: 'bg-clay-rose' },
          { href: '/employee/payslips', label: '💰 My Payslips', tint: 'bg-clay-yellow' },
          { href: '/employee/performance', label: '📈 Performance', tint: 'bg-clay-mint' },
        ].map(({ href, label, tint }) => (
          <Link key={href} href={href}>
            <div className={`clay-card p-4 text-center font-700 text-clay-text text-sm ${tint} hover:-translate-y-0.5 transition-all cursor-pointer`}>
              {label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
