'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import type { Payslip } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmployeePayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    api.get('/api/payroll/payslips/my')
      .then((r) => setPayslips(r.data.data))
      .catch(() => toast.error('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, []);

  const printPayslip = (ps: Payslip) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip ${MONTH_NAMES[ps.month - 1]} ${ps.year}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#6D4AFF}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #eee}th{text-align:left;color:#888;font-size:12px}strong{color:#2D2250}</style>
      </head><body>
      <h1>HireFlow Payslip</h1>
      <p><strong>Period:</strong> ${MONTH_NAMES[ps.month - 1]} ${ps.year}</p>
      <p><strong>Working Days:</strong> ${ps.workingDays} | <strong>Present:</strong> ${ps.presentDays}</p>
      <table>
        <tr><th>Earnings</th><th>Amount</th></tr>
        <tr><td>Basic Salary</td><td>₹${ps.basicSalary.toLocaleString()}</td></tr>
        <tr><td>HRA</td><td>₹${ps.hra.toLocaleString()}</td></tr>
        <tr><td>Allowances</td><td>₹${ps.allowances.toLocaleString()}</td></tr>
        <tr><td><strong>Gross Salary</strong></td><td><strong>₹${ps.grossSalary.toLocaleString()}</strong></td></tr>
        <tr><th>Deductions</th><th>Amount</th></tr>
        <tr><td>PF (12%)</td><td>₹${ps.pf.toLocaleString()}</td></tr>
        <tr><td>Tax</td><td>₹${ps.tax.toLocaleString()}</td></tr>
        <tr><td>Other</td><td>₹${ps.otherDeductions.toLocaleString()}</td></tr>
        <tr><td><strong>Net Salary</strong></td><td><strong style="color:#10B981">₹${ps.netSalary.toLocaleString()}</strong></td></tr>
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-900 text-clay-text">My Payslips</h1>
        <p className="text-clay-muted text-sm font-500">Download or view your monthly payslips</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="clay-skeleton h-40 rounded-3xl" />)}
        </div>
      ) : payslips.length === 0 ? (
        <EmptyState icon="💰" title="No payslips yet" description="Payslips will appear here after payroll is processed." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((ps) => (
            <div key={ps._id} className="clay-card p-5 bg-clay-lavender/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center">
                  <DollarSign size={18} className="text-clay-purple" strokeWidth={2.2} />
                </div>
                <span className={`text-xs font-700 px-2.5 py-0.5 rounded-pill ${ps.status === 'paid' ? 'badge-mint' : 'badge-yellow'}`}>
                  {ps.status}
                </span>
              </div>
              <p className="font-800 text-clay-text text-lg">{MONTH_NAMES[ps.month - 1]} {ps.year}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-clay-muted font-500">Gross</span>
                  <span className="font-700 text-clay-text">₹{ps.grossSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-clay-muted font-500">Deductions</span>
                  <span className="font-700 text-red-500">-₹{(ps.pf + ps.tax + ps.otherDeductions).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-clay-lavender/30 pt-1.5">
                  <span className="text-clay-text font-700">Net Pay</span>
                  <span className="font-900 text-green-600 text-base">₹{ps.netSalary.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-clay-muted mt-2 font-500">{ps.presentDays}/{ps.workingDays} days</p>
              <button onClick={() => printPayslip(ps)}
                className="clay-btn clay-btn-outline w-full py-2.5 text-sm mt-4 font-700">
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
