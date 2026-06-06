'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/axios';
import ChartCard from '@/components/shared/ChartCard';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#6D4AFF','#9F7AEA','#F59E0B','#10B981','#EF4444','#3B82F6','#EC4899','#F97316'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [recruitment, setRecruitment] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/overview'),
      api.get('/api/analytics/recruitment'),
      api.get('/api/analytics/attendance'),
      api.get('/api/analytics/payroll-summary'),
      api.get('/api/analytics/performance-dist'),
    ])
      .then(([o, r, a, p, perf]) => {
        setOverview(o.data.data);
        setRecruitment(r.data.data);
        setAttendanceData(a.data.data);
        setPayrollData(p.data.data);
        setPerformanceData(perf.data.data);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const attendanceChart = attendanceData?.monthlyTrend?.map((d: any) => ({
    name: MONTH_NAMES[d.month - 1],
    rate: d.rate,
    present: d.present,
    absent: d.absent,
  })) ?? [];

  const payrollChart = payrollData?.monthlyCost?.map((d: any) => ({
    name: MONTH_NAMES[d.month - 1],
    gross: Math.round(d.grossTotal / 1000),
    net: Math.round(d.netTotal / 1000),
  })) ?? [];

  const funnelData = recruitment?.funnel?.map((d: any) => ({
    name: d.status.replace('_', ' '),
    count: d.count,
  })) ?? [];

  const perfDist = performanceData?.distribution ?? [];
  const topPerformers = performanceData?.topPerformers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Analytics</h1>
        <p className="text-clay-muted text-sm font-500">Real-time insights from your MongoDB data</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={overview?.totalEmployees ?? 0} icon="👥" tint="lavender" loading={loading} />
        <StatCard title="Active Jobs" value={overview?.activeJobs ?? 0} icon="💼" tint="peach" loading={loading} />
        <StatCard title="Pending Leaves" value={overview?.pendingLeaves ?? 0} icon="📋" tint="rose" loading={loading} />
        <StatCard
          title="YTD Payroll"
          value={payrollData?.ytdTotal ? `₹${(payrollData.ytdTotal / 100000).toFixed(1)}L` : '₹0'}
          icon="💰"
          tint="mint"
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance trend */}
        <ChartCard title="Monthly Attendance Rate" subtitle="% of employees present" loading={loading}>
          {attendanceChart.length === 0 ? (
            <EmptyState icon="📊" title="No data yet" description="Attendance data will appear here once recorded." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7B6FA0' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }} />
                <Line type="monotone" dataKey="rate" stroke="#6D4AFF" strokeWidth={3} dot={{ fill: '#6D4AFF', r: 4, strokeWidth: 0 }} name="Rate %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Payroll cost trend */}
        <ChartCard title="Monthly Payroll Cost" subtitle="Gross vs Net (₹ thousands)" loading={loading}>
          {payrollChart.length === 0 ? (
            <EmptyState icon="💰" title="No payroll data" description="Run payroll to see cost trends here." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={payrollChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7B6FA0' }} axisLine={false} tickLine={false} unit="K" />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }} formatter={(v: any) => [`₹${v}K`, '']} />
                <Legend />
                <Bar dataKey="gross" fill="#E8E0FF" radius={[6, 6, 0, 0]} name="Gross" />
                <Bar dataKey="net" fill="#6D4AFF" radius={[6, 6, 0, 0]} name="Net" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recruitment funnel */}
        <ChartCard title="Recruitment Funnel" subtitle="Applications by stage" loading={loading}>
          {funnelData.length === 0 ? (
            <EmptyState icon="🎯" title="No applications yet" description="Post jobs and receive applications to see the funnel." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#7B6FA0' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Candidates">
                  {funnelData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Performance distribution */}
        <ChartCard title="Performance Rating Distribution" subtitle="All submitted reviews" loading={loading}>
          {perfDist.length === 0 ? (
            <EmptyState icon="📈" title="No reviews yet" description="Submit performance reviews to see the distribution." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={perfDist} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={4}>
                  {perfDist.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', fontFamily: 'Nunito' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Headcount by department */}
      <ChartCard title="Headcount by Department" subtitle="Active employees per department" loading={loading}>
        {(overview?.headcountByDept?.length ?? 0) === 0 ? (
          <EmptyState icon="🏢" title="No department data" description="Add employees to departments to see this chart." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overview.headcountByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7B6FA0' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(100,80,200,0.12)', fontFamily: 'Nunito' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Employees">
                {overview.headcountByDept.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <div className="clay-card p-6">
          <h3 className="font-800 text-clay-text mb-5">🏆 Top Performers</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPerformers.map((emp: any, i: number) => (
              <div key={i} className="text-center p-4 bg-clay-bg rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-clay-lavender mx-auto flex items-center justify-center font-800 text-clay-purple mb-2">
                  {emp.avatar ? <img src={emp.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : emp.name[0]}
                </div>
                <p className="font-700 text-clay-text text-sm truncate">{emp.name}</p>
                <p className="text-xs text-clay-muted mb-1">{emp.designation || 'Employee'}</p>
                <p className="text-xl font-900 text-clay-purple">{emp.avgRating}</p>
                <p className="text-[10px] text-clay-muted">/ 5.0</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
