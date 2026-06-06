'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Shield, RefreshCw, RotateCcw, Copy } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const ROLES = ['management_admin', 'senior_manager', 'hr_recruiter', 'employee', 'candidate'] as const;
const ROLE_COLORS: Record<string, string> = {
  management_admin: 'badge-rose',
  senior_manager:   'badge-lavender',
  hr_recruiter:     'badge-sky',
  employee:         'badge-mint',
  candidate:        'badge-yellow',
};
const ROLE_LABELS: Record<string, string> = {
  management_admin: 'Admin',
  senior_manager:   'Sr. Manager',
  hr_recruiter:     'HR Recruiter',
  employee:         'Employee',
  candidate:        'Candidate',
};

export default function SettingsPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/users?limit=100')
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await api.patch(`/api/users/${userId}/role`, { role: newRole });
      const updated = res.data.data;
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, ...updated } : u));

      const staffRoles = ['management_admin', 'senior_manager', 'hr_recruiter', 'employee'];
      if (staffRoles.includes(newRole)) {
        toast.success(`Role updated. Login credentials sent to ${updated.email}`);
      } else {
        toast.success('Role updated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Reset password for ${userName}? A new temp password will be generated and shown here.`)) return;
    setResetting(userId);
    try {
      const res = await api.post(`/api/users/${userId}/reset-password`);
      const { tempPassword, email, loginEmail } = res.data.data;
      toast.success(
        <div className="space-y-1">
          <p className="font-700">Password reset for {userName}</p>
          <p className="text-xs">Login: <strong>{loginEmail || email}</strong></p>
          <p className="text-xs">Temp password: <strong className="font-mono">{tempPassword}</strong></p>
        </div>,
        { duration: 10000 }
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResetting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Settings</h1>
        <p className="text-clay-muted text-sm font-500">Manage user roles and credentials</p>
      </div>

      {/* Info box */}
      <div className="clay-card p-4 bg-clay-lavender/20 flex items-start gap-3">
        <Shield size={16} className="text-clay-purple flex-shrink-0 mt-0.5" strokeWidth={2.2} />
        <div className="text-xs text-clay-muted font-500 leading-relaxed">
          <strong className="text-clay-text">Assigning a staff role</strong> automatically generates a{' '}
          <code className="bg-clay-lavender px-1.5 py-0.5 rounded text-clay-purple font-700">firstname.lastname@hireflow.com</code>{' '}
          login email and a temporary password, and sends them to the user&apos;s personal email.
          The user logs in with their HireFlow ID and changes their password from <strong>My Profile</strong>.
        </div>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-clay-lavender flex items-center justify-center">
              <Shield size={16} className="text-clay-purple" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-800 text-clay-text">User Role Management</h3>
              <p className="text-xs text-clay-muted font-500">{users.length} users</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="text-xs text-clay-purple font-700 flex items-center gap-1.5 hover:underline">
            <RefreshCw size={12} strokeWidth={2.5} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="clay-skeleton h-16 rounded-xl" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon="👤" title="No users found" description="Users appear here after they sign up." />
        ) : (
          <div className="divide-y divide-clay-lavender/20">
            {users.map((user) => (
              <div key={user._id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-clay-lavender/5 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-clay-lavender flex items-center justify-center font-800 text-clay-purple text-sm flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-clay-text text-sm">{user.name}</p>
                  <p className="text-xs text-clay-muted font-500 truncate">{user.email}</p>
                  {/* Show @hireflow.com email if set */}
                  {user.employeeLoginEmail && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-clay-purple font-700 font-mono truncate">
                        {user.employeeLoginEmail}
                      </span>
                      <button
                        onClick={() => copyToClipboard(user.employeeLoginEmail)}
                        className="text-clay-muted hover:text-clay-purple transition-colors flex-shrink-0"
                        title="Copy HireFlow login email"
                      >
                        <Copy size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Current role badge */}
                <span className={`text-xs font-700 px-2.5 py-1 rounded-pill flex-shrink-0 ${ROLE_COLORS[user.role] || 'badge-lavender'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>

                {/* Role selector */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    disabled={updating === user._id}
                    className="clay-input px-3 py-2 text-xs min-w-36"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {updating === user._id && (
                    <RefreshCw size={14} className="text-clay-purple animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* Admin reset password */}
                <button
                  onClick={() => handleResetPassword(user._id, user.name)}
                  disabled={resetting === user._id}
                  title="Reset password (generates new temp password)"
                  className="flex items-center gap-1.5 text-xs text-clay-muted hover:text-clay-purple transition-colors flex-shrink-0 px-2 py-1.5 rounded-lg hover:bg-clay-lavender/30"
                >
                  {resetting === user._id
                    ? <RefreshCw size={13} className="animate-spin" />
                    : <RotateCcw size={13} strokeWidth={2.2} />
                  }
                  <span className="hidden sm:inline">Reset PW</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
