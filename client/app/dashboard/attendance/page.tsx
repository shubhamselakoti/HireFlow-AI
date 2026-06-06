'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';

interface AttendanceRecord {
  _id: string;
  employeeId: { _id: string; name: string; designation: string; avatar?: string; employeeCode: string };
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  present: 'badge-mint',
  absent: 'badge-rose',
  half_day: 'badge-sky',
  on_leave: 'badge-yellow',
  holiday: 'badge-lavender',
};

export default function AttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/attendance/company?date=${date}`);
      setRecords(r.data.data);
      setTotalActive(r.data.totalActive);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const present = records.filter((r) => r.status === 'present' || r.status === 'half_day').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const onLeave = records.filter((r) => r.status === 'on_leave').length;
  const attendanceRate = totalActive > 0 ? Math.round((present / totalActive) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Attendance</h1>
          <p className="text-clay-muted text-sm font-500">Company-wide attendance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-clay-muted" strokeWidth={2.2} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="clay-input px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon="📊" tint="lavender" loading={loading} />
        <StatCard title="Present" value={present} icon="✅" tint="mint" loading={loading} />
        <StatCard title="Absent" value={absent} icon="❌" tint="rose" loading={loading} />
        <StatCard title="On Leave" value={onLeave} icon="🏖️" tint="yellow" loading={loading} />
      </div>

      {/* Records table */}
      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30">
          <h3 className="font-800 text-clay-text">
            Records for {format(new Date(date), 'dd MMMM yyyy')}
          </h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="clay-skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No attendance records"
            description="No records found for this date. Records appear after employees clock in."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-5 py-3 bg-clay-lavender/20">Employee</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Clock In</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Clock Out</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Hours</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const emp = rec.employeeId;
                  return (
                    <tr key={rec._id} className="border-b border-clay-lavender/20 hover:bg-clay-lavender/10 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {emp?.avatar ? (
                            <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-xs">
                              {emp?.name?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-700 text-clay-text text-sm">{emp?.name}</p>
                            <p className="text-xs text-clay-muted">{emp?.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-600 text-clay-text">
                        {rec.clockIn ? format(new Date(rec.clockIn), 'hh:mm a') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-600 text-clay-text">
                        {rec.clockOut ? format(new Date(rec.clockOut), 'hh:mm a') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-700 text-clay-purple">
                        {rec.totalHours > 0 ? `${rec.totalHours}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${STATUS_STYLE[rec.status] || 'badge-lavender'}`}>
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
