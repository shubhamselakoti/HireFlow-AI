'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const STATUS_STYLE: Record<string, string> = {
  present: 'badge-mint', absent: 'badge-rose', half_day: 'badge-sky',
  on_leave: 'badge-yellow', holiday: 'badge-lavender',
};

export default function ManagerAttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<any[]>([]);
  const [teamSize, setTeamSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/attendance/team?date=${date}`)
      .then((r) => { setRecords(r.data.data); setTeamSize(r.data.teamSize || 0); })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [date]);

  const present = records.filter((r) => r.status === 'present').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Team Attendance</h1>
          <p className="text-clay-muted text-sm font-500">{present}/{teamSize} present today</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-clay-muted" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="clay-input px-4 py-2.5 text-sm" />
        </div>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30">
          <h3 className="font-800 text-clay-text">Records for {format(new Date(date), 'dd MMMM yyyy')}</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="clay-skeleton h-14 rounded-xl" />)}</div>
        ) : records.length === 0 ? (
          <EmptyState icon="📅" title="No records" description="No attendance records for this date." />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {records.map((rec) => {
              const emp = rec.employeeId;
              return (
                <div key={rec._id} className="flex items-center gap-4 px-5 py-3 hover:bg-clay-lavender/10 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-sm flex-shrink-0">
                    {emp?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-700 text-clay-text text-sm">{emp?.name}</p>
                    <p className="text-xs text-clay-muted">{emp?.designation || 'Employee'}</p>
                  </div>
                  <div className="text-sm text-clay-muted font-500">
                    {rec.clockIn ? format(new Date(rec.clockIn), 'hh:mm a') : '—'}
                    {rec.clockOut ? ` → ${format(new Date(rec.clockOut), 'hh:mm a')}` : ''}
                  </div>
                  {rec.totalHours > 0 && (
                    <span className="text-sm font-700 text-clay-purple">{rec.totalHours}h</span>
                  )}
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${STATUS_STYLE[rec.status] || 'badge-lavender'}`}>
                    {rec.status.replace('_', ' ')}
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
