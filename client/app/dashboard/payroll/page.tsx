'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Play, Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import type { Payroll, Payslip } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const now = new Date();
  const [runMonth, setRunMonth] = useState(now.getMonth() + 1);
  const [runYear, setRunYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/payroll');
      setPayrolls(r.data.data);
    } catch {
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayroll = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    try {
      const r = await api.get(`/api/payroll/${payroll._id}`);
      setPayslips(r.data.data.payslips);
    } catch {
      toast.error('Failed to load payslips');
    }
  };

  const handleRunPayroll = async () => {
    setRunning(true);
    try {
      const res = await api.post('/api/payroll/run', { month: runMonth, year: runYear });
      toast.success(`✅ Payroll processed! ${res.data.data.processed} employees · ₹${(res.data.data.totalCTC / 100000).toFixed(1)}L total`);
      await fetchPayrolls();
    } catch (err: any) {
      toast.error(err.message || 'Payroll run failed');
    } finally {
      setRunning(false);
    }
  };

  const totalPaid = payrolls.reduce((sum, p) => sum + (p.totalCTC || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">Payroll</h1>
        <p className="text-clay-muted text-sm font-500">Manage payroll runs and payslips</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Payroll Runs" value={payrolls.length} icon="📊" tint="lavender" loading={loading} />
        <StatCard title="YTD Total" value={`₹${(totalPaid / 100000).toFixed(1)}L`} icon="💰" tint="mint" loading={loading} />
        <StatCard
          title="Last Run"
          value={payrolls[0] ? `${MONTH_NAMES[payrolls[0].month - 1]} ${payrolls[0].year}` : 'Never'}
          icon="📅"
          tint="sky"
          loading={loading}
        />
      </div>

      {/* Run Payroll Card */}
      <div className="clay-card p-6 bg-gradient-to-br from-clay-lavender/50 to-clay-peach/30">
        <h3 className="font-800 text-clay-text mb-4 flex items-center gap-2">
          <Play size={18} className="text-clay-purple" strokeWidth={2.5} />
          Run Payroll
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">Month</label>
            <select value={runMonth} onChange={(e) => setRunMonth(Number(e.target.value))} className="clay-input px-3 py-2.5 text-sm">
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-700 text-clay-text mb-1.5">Year</label>
            <select value={runYear} onChange={(e) => setRunYear(Number(e.target.value))} className="clay-input px-3 py-2.5 text-sm">
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleRunPayroll}
            disabled={running}
            className="clay-btn clay-btn-primary px-6 py-2.5 text-sm font-800 text-white flex items-center gap-2"
          >
            {running ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><Play size={15} strokeWidth={2.5} /> Run Payroll for {MONTH_NAMES[runMonth - 1]} {runYear}</>
            )}
          </button>
        </div>
        <p className="text-xs text-clay-muted font-500 mt-3">
          Payroll calculates PF (12%), tax (10% if gross &gt; ₹50K), and net salary for all active employees based on attendance.
        </p>
      </div>

      {/* Payroll History */}
      <div className="clay-card overflow-hidden">
        <div className="p-5 border-b border-clay-lavender/30">
          <h3 className="font-800 text-clay-text">Payroll History</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-16 rounded-xl" />)}
          </div>
        ) : payrolls.length === 0 ? (
          <EmptyState icon="💰" title="No payroll runs yet" description="Run your first payroll above to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-5 py-3 bg-clay-lavender/20">Period</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Total CTC</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Status</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Processed</th>
                  <th className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide px-4 py-3 bg-clay-lavender/20">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => {
                  const processor = p.processedBy as any;
                  return (
                    <tr key={p._id} className="border-b border-clay-lavender/20 hover:bg-clay-lavender/10 transition-colors">
                      <td className="px-5 py-3 font-800 text-clay-text">
                        {MONTH_NAMES[p.month - 1]} {p.year}
                      </td>
                      <td className="px-4 py-3 font-700 text-clay-purple">
                        ₹{(p.totalCTC / 100000).toFixed(2)}L
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${
                          p.status === 'paid' ? 'badge-mint' : p.status === 'processed' ? 'badge-sky' : 'badge-yellow'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-clay-muted">
                        {p.processedAt ? format(new Date(p.processedAt), 'dd MMM yyyy hh:mm a') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewPayroll(p)}
                          className="text-xs text-clay-purple font-700 hover:underline"
                        >
                          View Payslips
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslips modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 clay-modal-overlay" onClick={() => setSelectedPayroll(null)}>
          <div className="clay-card-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-clay-lavender/30 flex items-center justify-between">
              <h3 className="font-800 text-clay-text">
                Payslips — {MONTH_NAMES[selectedPayroll.month - 1]} {selectedPayroll.year}
              </h3>
              <button onClick={() => setSelectedPayroll(null)} className="text-clay-muted hover:text-clay-text text-xl font-700">×</button>
            </div>
            <div className="p-6">
              {payslips.length === 0 ? (
                <p className="text-center text-clay-muted py-8">No payslips in this run.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-700 text-clay-muted uppercase">
                        <th className="py-2 pr-3">Employee</th>
                        <th className="py-2 pr-3">Gross</th>
                        <th className="py-2 pr-3">PF</th>
                        <th className="py-2 pr-3">Tax</th>
                        <th className="py-2 pr-3">Net</th>
                        <th className="py-2">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clay-lavender/20">
                      {payslips.map((ps) => {
                        const emp = ps.employeeId as any;
                        return (
                          <tr key={ps._id}>
                            <td className="py-2.5 pr-3 font-700 text-clay-text">{emp?.name || '—'}</td>
                            <td className="py-2.5 pr-3">₹{ps.grossSalary.toLocaleString()}</td>
                            <td className="py-2.5 pr-3 text-red-500">-₹{ps.pf.toLocaleString()}</td>
                            <td className="py-2.5 pr-3 text-red-500">-₹{ps.tax.toLocaleString()}</td>
                            <td className="py-2.5 pr-3 font-800 text-green-600">₹{ps.netSalary.toLocaleString()}</td>
                            <td className="py-2.5 text-clay-muted">{ps.presentDays}/{ps.workingDays}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
