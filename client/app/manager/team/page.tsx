'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import type { Employee } from '@/types';

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/employees?limit=200')
      .then((r) => setTeam(r.data.data))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">My Team</h1>
        <p className="text-clay-muted text-sm font-500">{team.length} team members</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="clay-skeleton h-40 rounded-3xl" />)}
        </div>
      ) : team.length === 0 ? (
        <EmptyState icon="👥" title="No team members" description="No employees are assigned to you yet." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((emp) => {
            const dept = emp.department as any;
            return (
              <div key={emp._id} className="clay-card p-5 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-xl object-cover shadow-clay-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-clay-lavender flex items-center justify-center font-900 text-clay-purple text-lg">
                      {emp.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-800 text-clay-text">{emp.name}</p>
                    <p className="text-xs text-clay-muted font-500">{emp.designation || 'Employee'}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-clay-muted font-500">Code</span>
                    <span className="font-700 text-clay-purple">{emp.employeeCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clay-muted font-500">Department</span>
                    <span className="font-700 text-clay-text">{dept?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clay-muted font-500">Joined</span>
                    <span className="font-700 text-clay-text">{format(new Date(emp.joiningDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clay-muted font-500">Status</span>
                    <span className={`text-xs font-700 px-2 py-0.5 rounded-pill ${
                      emp.status === 'active' ? 'badge-mint' : 'badge-rose'
                    }`}>{emp.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
