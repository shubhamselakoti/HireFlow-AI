'use client';
import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { Attendance } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-clay-mint text-green-700 border-green-200',
  absent: 'bg-clay-rose text-red-600 border-red-200',
  on_leave: 'bg-clay-yellow text-yellow-700 border-yellow-200',
  half_day: 'bg-clay-sky text-blue-600 border-blue-200',
  holiday: 'bg-clay-lavender text-purple-600 border-purple-200',
};

export default function EmployeeAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/attendance/my?month=${month}&year=${year}`)
      .then((r) => setRecords(r.data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [month, year]);

  const recordMap = Object.fromEntries(
    records.map((r) => [format(new Date(r.date), 'yyyy-MM-dd'), r])
  );

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPadding = (getDay(firstDay) + 6) % 7; // Monday start

  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const leaveDays = records.filter((r) => r.status === 'on_leave').length;
  const totalHours = records.reduce((s, r) => s + (r.totalHours || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">My Attendance</h1>
        <p className="text-clay-muted text-sm font-500">View your attendance history and clock-in/out records</p>
      </div>

      {/* Month selector */}
      <div className="clay-card p-4 flex items-center gap-3">
        <button onClick={() => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); }}
          className="clay-btn clay-btn-outline px-4 py-2 text-sm">←</button>
        <span className="font-800 text-clay-text text-lg flex-1 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={() => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); }}
          className="clay-btn clay-btn-outline px-4 py-2 text-sm">→</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: presentDays, tint: 'bg-clay-mint', text: 'text-green-700' },
          { label: 'Absent', value: absentDays, tint: 'bg-clay-rose', text: 'text-red-600' },
          { label: 'On Leave', value: leaveDays, tint: 'bg-clay-yellow', text: 'text-yellow-700' },
          { label: 'Total Hours', value: `${totalHours.toFixed(0)}h`, tint: 'bg-clay-sky', text: 'text-blue-600' },
        ].map(({ label, value, tint, text }) => (
          <div key={label} className={`clay-card p-4 text-center ${tint}`}>
            <p className={`text-2xl font-900 ${text}`}>{value}</p>
            <p className="text-xs text-clay-muted font-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="clay-card p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-700 text-clay-muted py-2">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="clay-skeleton h-64 rounded-2xl" />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Padding for first week */}
            {[...Array(startPadding)].map((_, i) => <div key={`pad-${i}`} />)}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const record = recordMap[key];
              const isToday = key === format(now, 'yyyy-MM-dd');
              const isWeekend = [0, 6].includes(day.getDay());

              return (
                <div key={key} title={record ? `${record.status}${record.totalHours ? ` (${record.totalHours}h)` : ''}` : undefined}
                  className={`rounded-xl p-2 text-center border transition-all ${
                    isToday ? 'ring-2 ring-clay-purple ring-offset-1' : ''
                  } ${
                    record ? STATUS_COLORS[record.status] || 'bg-clay-bg border-gray-200'
                    : isWeekend ? 'bg-clay-bg/50 border-clay-lavender/20 opacity-40'
                    : 'bg-clay-bg border-clay-lavender/30'
                  }`}
                >
                  <p className="text-xs font-800">{format(day, 'd')}</p>
                  {record?.totalHours > 0 && (
                    <p className="text-[9px] opacity-70">{record.totalHours}h</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-clay-lavender/30">
          {[
            { label: 'Present', cls: 'bg-clay-mint' },
            { label: 'Absent', cls: 'bg-clay-rose' },
            { label: 'On Leave', cls: 'bg-clay-yellow' },
            { label: 'Half Day', cls: 'bg-clay-sky' },
            { label: 'Holiday', cls: 'bg-clay-lavender' },
          ].map(({ label, cls }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-600 text-clay-muted">
              <span className={`w-3 h-3 rounded ${cls}`} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
