'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Loader2, ClipboardList, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';

const TYPE_LABELS: Record<string, string> = {
  casual: 'Casual', sick: 'Sick', annual: 'Annual',
  maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid',
};
const TYPE_COLORS: Record<string, string> = {
  casual: 'badge-sky', sick: 'badge-rose', annual: 'badge-mint',
  maternity: 'badge-peach', paternity: 'badge-lavender', unpaid: 'badge-yellow',
};

const policySchema = z.object({
  name:         z.string().min(2, 'Name is required'),
  type:         z.enum(['casual','sick','annual','maternity','paternity','unpaid']),
  daysAllowed:  z.coerce.number().min(1,'At least 1 day').max(365),
  carryForward: z.boolean().default(false),
});
type PolicyForm = z.infer<typeof policySchema>;

export default function LeavePoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: { type: 'casual', carryForward: false },
  });

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/leave/policies');
      setPolicies(r.data.data);
    } catch { toast.error('Failed to load leave policies'); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: PolicyForm) => {
    try {
      const r = await api.post('/api/leave/policies', data);
      setPolicies((prev) => [...prev, r.data.data]);
      reset({ type: 'casual', carryForward: false });
      setShowForm(false);
      toast.success(`"${data.name}" created`);
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const deletePolicy = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Employees using this policy will lose their balance.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/leave/policies/${id}`);
      setPolicies((prev) => prev.filter((p) => p._id !== id));
      toast.success('Deleted');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Leave Policies</h1>
          <p className="text-clay-muted text-sm font-500">
            These appear as options in the employee leave request dropdown.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2">
          <Plus size={15} strokeWidth={2.5} /> Add Policy
        </button>
      </div>

      <div className="clay-card p-4 bg-clay-sky/20 flex items-start gap-3">
        <ClipboardList size={15} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
        <p className="text-xs text-blue-700 font-500 leading-relaxed">
          Default policies (Casual, Sick, Annual, Maternity, Paternity, Unpaid) are created automatically on first server start.
          Add custom ones here. Employees see their remaining balance per type when applying for leave.
        </p>
      </div>

      {showForm && (
        <div className="clay-card p-6 border-2 border-clay-purple/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-800 text-clay-text">New Leave Policy</h3>
            <button onClick={() => { setShowForm(false); reset(); }}
              className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center text-clay-muted hover:text-clay-text">
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Policy Name *</label>
                <input {...register('name')} placeholder="e.g. Casual Leave"
                  className="clay-input w-full px-4 py-3 text-sm" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Type *</label>
                <select {...register('type')} className="clay-input w-full px-4 py-3 text-sm">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-700 text-clay-text mb-1.5">Days Allowed / Year *</label>
                <input {...register('daysAllowed')} type="number" min={1} max={365} placeholder="12"
                  className="clay-input w-full px-4 py-3 text-sm" />
                {errors.daysAllowed && <p className="text-red-500 text-xs mt-1">{errors.daysAllowed.message}</p>}
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input {...register('carryForward')} type="checkbox" id="cf" className="w-4 h-4 accent-clay-purple" />
                <label htmlFor="cf" className="text-sm font-600 text-clay-text cursor-pointer">
                  Carry forward to next year
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSubmitting}
                className="clay-btn clay-btn-primary px-7 py-3 text-sm font-800 text-white flex items-center gap-2">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Create Policy'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }}
                className="clay-btn clay-btn-outline px-5 py-3 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-20 rounded-2xl" />)}</div>
      ) : policies.length === 0 ? (
        <EmptyState icon="📋" title="No leave policies"
          description="Restart your server to auto-seed defaults, or add policies manually."
          action={{ label: '+ Add Policy', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="clay-card overflow-hidden">
          <div className="divide-y divide-clay-lavender/20">
            {policies.map((p) => (
              <div key={p._id} className="flex items-center gap-4 p-5 hover:bg-clay-lavender/5 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={16} className="text-clay-purple" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-700 text-clay-text">{p.name}</p>
                    <span className={`text-xs font-700 px-2 py-0.5 rounded-pill ${TYPE_COLORS[p.type] || 'badge-lavender'}`}>
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                    {p.carryForward && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-600">
                        <CheckCircle size={11} strokeWidth={2.5} /> Carry forward
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-clay-muted font-500 mt-0.5">{p.daysAllowed} days / year</p>
                </div>
                <button onClick={() => deletePolicy(p._id, p.name)} disabled={deleting === p._id}
                  className="text-clay-muted hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 flex-shrink-0">
                  {deleting === p._id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} strokeWidth={2.2} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
