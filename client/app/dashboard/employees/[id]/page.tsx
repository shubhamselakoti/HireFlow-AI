'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Edit2, Calendar, DollarSign, TrendingUp, FileText, Loader2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import type { Employee, Attendance, Payslip, Performance } from '@/types';

type Tab = 'overview' | 'attendance' | 'payslips' | 'performance' | 'documents';

// ── Salary Panel ────────────────────────────────────────────────────────────
function SalaryPanel({ employee, onUpdated }: { employee: any; onUpdated: (e: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    base:        employee.salary?.base        || 0,
    hra:         employee.salary?.hra         || 0,
    allowances:  employee.salary?.allowances  || 0,
    deductions:  employee.salary?.deductions  || 0,
  });

  const gross = form.base + form.hra + form.allowances;
  const net   = Math.max(0, gross - form.deductions);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`/api/employees/${employee._id}`, { salary: form });
      onUpdated(r.data.data);
      setEditing(false);
      toast.success('Salary updated — will apply from next payroll run');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-clay-lavender/30">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-800 text-clay-text flex items-center gap-2">
          <DollarSign size={14} className="text-clay-purple" strokeWidth={2.2} />
          Salary Structure
        </p>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-clay-purple font-700 hover:underline">
            <Edit2 size={12} strokeWidth={2.5} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 text-xs text-white bg-clay-purple px-3 py-1.5 rounded-pill font-700">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} strokeWidth={2.5} />}
              Save
            </button>
            <button onClick={() => { setEditing(false); setForm({ base: employee.salary?.base||0, hra: employee.salary?.hra||0, allowances: employee.salary?.allowances||0, deductions: employee.salary?.deductions||0 }); }}
              className="text-xs text-clay-muted hover:text-clay-text px-2 py-1.5 font-600">
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'base',       label: 'Base Salary ₹',  hint: 'Monthly CTC base' },
            { key: 'hra',        label: 'HRA ₹',           hint: 'House rent allowance' },
            { key: 'allowances', label: 'Allowances ₹',    hint: 'Travel, food, etc.' },
            { key: 'deductions', label: 'Deductions ₹',    hint: 'Fixed monthly deductions' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className="block text-xs font-700 text-clay-muted mb-1">{label}</label>
              <input
                type="number" min={0}
                value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                className="clay-input w-full px-3 py-2 text-sm"
              />
              <p className="text-[10px] text-clay-muted mt-0.5">{hint}</p>
            </div>
          ))}
          <div className="col-span-2 flex gap-4 p-3 bg-clay-lavender/20 rounded-xl mt-1">
            <div className="text-center">
              <p className="text-[10px] text-clay-muted font-600">GROSS</p>
              <p className="font-900 text-clay-text">₹{gross.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-clay-muted font-600">NET (excl. PF/tax)</p>
              <p className="font-900 text-green-600">₹{net.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Base',        value: employee.salary?.base        || 0, color: 'text-clay-text'   },
            { label: 'HRA',         value: employee.salary?.hra         || 0, color: 'text-clay-text'   },
            { label: 'Allowances',  value: employee.salary?.allowances  || 0, color: 'text-clay-text'   },
            { label: 'Deductions',  value: employee.salary?.deductions  || 0, color: 'text-red-500'     },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 bg-clay-bg rounded-xl text-center">
              <p className="text-[10px] text-clay-muted font-700 uppercase tracking-wide">{label}</p>
              <p className={`font-800 text-sm mt-0.5 ${color}`}>
                {value > 0 ? `₹${value.toLocaleString()}` : <span className="text-clay-muted/60">Not set</span>}
              </p>
            </div>
          ))}
          {(employee.salary?.base || 0) === 0 && (
            <div className="col-span-4 mt-1">
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 font-600">
                ⚠️ No salary set. Click Edit to configure before running payroll — otherwise payslip will show ₹0.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const now = new Date();
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(now.getFullYear());

  useEffect(() => {
    api.get(`/api/employees/${id}`)
      .then((r) => setEmployee(r.data.data))
      .catch(() => toast.error('Employee not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setTabLoading(true);
    const loaders: Record<Tab, () => Promise<void>> = {
      overview: async () => {},
      attendance: async () => {
        const r = await api.get(`/api/attendance/employee/${id}?month=${attMonth}&year=${attYear}`);
        setAttendance(r.data.data);
      },
      payslips: async () => {
        const r = await api.get(`/api/payroll/payslips/${id}`);
        setPayslips(r.data.data);
      },
      performance: async () => {
        const r = await api.get(`/api/performance/all?employeeId=${id}`);
        setPerformance(r.data.data);
      },
      documents: async () => {},
    };
    loaders[tab]().catch(() => {}).finally(() => setTabLoading(false));
  }, [tab, id, attMonth, attYear]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="clay-skeleton h-48 rounded-3xl" />
        <div className="clay-skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="clay-card p-16 text-center">
        <p className="text-clay-muted font-600">Employee not found.</p>
        <button onClick={() => router.back()} className="clay-btn clay-btn-outline px-5 py-2 text-sm mt-4">Go back</button>
      </div>
    );
  }

  const dept = employee.department as any;
  const manager = employee.managerId as any;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Edit2 },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'payslips', label: 'Payslips', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const statusDayMap: Record<string, string> = {
    present: 'bg-clay-mint border-green-300',
    absent: 'bg-clay-rose border-red-300',
    on_leave: 'bg-clay-yellow border-yellow-300',
    half_day: 'bg-clay-sky border-blue-300',
    holiday: 'bg-clay-lavender border-purple-300',
  };

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-clay-muted hover:text-clay-text text-sm font-600 transition-colors">
        <ArrowLeft size={16} strokeWidth={2.2} /> Back to Employees
      </button>

      {/* Profile card */}
      <div className="clay-card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            {employee.avatar ? (
              <img src={employee.avatar} alt={employee.name} className="w-24 h-24 rounded-2xl object-cover shadow-clay" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-clay-lavender to-clay-purple/20 flex items-center justify-center shadow-clay">
                <span className="text-4xl font-900 text-clay-purple">{employee.name[0]}</span>
              </div>
            )}
            <span className={`absolute -bottom-2 -right-2 text-xs font-700 px-2 py-0.5 rounded-pill border ${
              employee.status === 'active' ? 'badge-mint border-green-200' :
              employee.status === 'inactive' ? 'badge-yellow border-yellow-200' : 'badge-rose border-red-200'
            }`}>
              {employee.status}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-900 text-clay-text">{employee.name}</h2>
                <p className="text-clay-muted font-600">{employee.designation || 'No designation'}</p>
                <p className="text-sm text-clay-purple font-700 mt-1">{employee.employeeCode}</p>
              </div>
              <button className="clay-btn clay-btn-outline px-4 py-2 text-sm flex items-center gap-2">
                <Edit2 size={14} strokeWidth={2.2} /> Edit
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Department', value: dept?.name || '—' },
                { label: 'HireFlow Email', value: (employee as any).hireflowEmail || employee.email },
                { label: 'Phone', value: employee.phone || '—' },
                { label: 'Manager', value: manager ? `${manager.name} (${manager.hireflowEmail || manager.employeeCode})` : '—' },
                { label: 'Join Date', value: format(new Date(employee.joiningDate), 'dd MMM yyyy') },
                { label: 'Type', value: employee.employmentType?.replace('_', ' ') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-clay-muted font-600 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-700 text-clay-text mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Salary edit block */}
            <SalaryPanel employee={employee} onUpdated={(updated) => setEmployee(updated)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-pill text-sm font-700 transition-all duration-150 ${
              tab === tabId
                ? 'bg-clay-purple text-white shadow-clay-btn'
                : 'bg-white text-clay-muted shadow-clay-sm hover:text-clay-text'
            }`}
          >
            <Icon size={14} strokeWidth={2.2} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="clay-card p-6">
        {tabLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="clay-skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Attendance tab */}
            {tab === 'attendance' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <select value={attMonth} onChange={(e) => setAttMonth(Number(e.target.value))} className="clay-input px-3 py-2 text-sm">
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={attYear} onChange={(e) => setAttYear(Number(e.target.value))} className="clay-input px-3 py-2 text-sm">
                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <div className="flex items-center gap-3 ml-auto text-xs font-600 text-clay-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-clay-mint" /> Present</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-clay-rose" /> Absent</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-clay-yellow" /> On Leave</span>
                  </div>
                </div>

                {attendance.length === 0 ? (
                  <div className="text-center py-8 text-clay-muted font-500">No attendance records for this period.</div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <div key={d} className="text-center text-xs font-700 text-clay-muted py-1">{d}</div>
                    ))}
                    {attendance.map((a) => {
                      const d = new Date(a.date);
                      return (
                        <div
                          key={a._id}
                          title={`${format(d, 'dd MMM')} — ${a.status}${a.totalHours ? ` (${a.totalHours}h)` : ''}`}
                          className={`rounded-xl p-2 text-center border ${statusDayMap[a.status] || 'bg-clay-bg border-gray-200'}`}
                        >
                          <p className="text-xs font-800 text-clay-text">{format(d, 'd')}</p>
                          {a.totalHours > 0 && (
                            <p className="text-[9px] text-clay-muted mt-0.5">{a.totalHours}h</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Payslips tab */}
            {tab === 'payslips' && (
              <div>
                {payslips.length === 0 ? (
                  <div className="text-center py-8 text-clay-muted font-500">No payslips generated yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-700 text-clay-muted uppercase tracking-wide">
                          <th className="py-3 pr-4">Period</th>
                          <th className="py-3 pr-4">Gross</th>
                          <th className="py-3 pr-4">Deductions</th>
                          <th className="py-3 pr-4">Net</th>
                          <th className="py-3 pr-4">Days</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-clay-lavender/30">
                        {payslips.map((ps) => (
                          <tr key={ps._id}>
                            <td className="py-3 pr-4 font-700 text-clay-text">
                              {MONTH_NAMES[ps.month - 1]} {ps.year}
                            </td>
                            <td className="py-3 pr-4">₹{ps.grossSalary.toLocaleString()}</td>
                            <td className="py-3 pr-4 text-red-500">-₹{(ps.pf + ps.tax + ps.otherDeductions).toLocaleString()}</td>
                            <td className="py-3 pr-4 font-800 text-green-600">₹{ps.netSalary.toLocaleString()}</td>
                            <td className="py-3 pr-4">{ps.presentDays}/{ps.workingDays}</td>
                            <td className="py-3">
                              <span className={`text-xs font-700 px-2 py-0.5 rounded-pill ${ps.status === 'paid' ? 'badge-mint' : 'badge-yellow'}`}>
                                {ps.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Performance tab */}
            {tab === 'performance' && (
              <div className="space-y-6">
                {performance.length === 0 ? (
                  <div className="text-center py-8 text-clay-muted font-500">No performance reviews yet.</div>
                ) : (
                  <>
                    {/* Radar chart */}
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={[
                        { axis: 'Technical', value: performance[0]?.ratings?.technical || 0 },
                        { axis: 'Communication', value: performance[0]?.ratings?.communication || 0 },
                        { axis: 'Teamwork', value: performance[0]?.ratings?.teamwork || 0 },
                        { axis: 'Punctuality', value: performance[0]?.ratings?.punctuality || 0 },
                        { axis: 'Leadership', value: performance[0]?.ratings?.leadership || 0 },
                      ]}>
                        <PolarGrid stroke="#E8E0FF" />
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#7B6FA0', fontWeight: 600 }} />
                        <Radar dataKey="value" stroke="#6D4AFF" fill="#6D4AFF" fillOpacity={0.15} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>

                    {performance.map((p) => {
                      const reviewer = p.reviewerId as any;
                      return (
                        <div key={p._id} className="bg-clay-bg rounded-2xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-700 text-clay-text">{p.period}</p>
                              <p className="text-xs text-clay-muted">Reviewed by {reviewer?.name || '—'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-900 text-clay-purple">{p.overallRating.toFixed(1)}</p>
                              <p className="text-xs text-clay-muted">/ 5</p>
                            </div>
                          </div>
                          {p.comments && <p className="text-sm text-clay-muted italic">"{p.comments}"</p>}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Documents tab */}
            {tab === 'documents' && (
              <div>
                {(!employee.documents || employee.documents.length === 0) ? (
                  <div className="text-center py-8 text-clay-muted font-500">No documents uploaded yet.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {employee.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-clay-bg rounded-2xl hover:bg-clay-lavender/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-clay-lavender flex items-center justify-center">
                          <FileText size={18} className="text-clay-purple" strokeWidth={2.2} />
                        </div>
                        <div>
                          <p className="font-700 text-clay-text text-sm">{doc.name}</p>
                          <p className="text-xs text-clay-muted">{format(new Date(doc.uploadedAt), 'dd MMM yyyy')}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Overview tab */}
            {tab === 'overview' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-800 text-clay-text mb-4">Personal Info</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Full Name', value: employee.name },
                      { label: 'Email', value: employee.email },
                      { label: 'Phone', value: employee.phone || '—' },
                      { label: 'Employment Type', value: employee.employmentType?.replace('_', ' ') },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2 border-b border-clay-lavender/30">
                        <span className="text-sm text-clay-muted font-600">{label}</span>
                        <span className="text-sm font-700 text-clay-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-800 text-clay-text mb-4">Bank Details</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Bank', value: employee.bankDetails?.bankName || '—' },
                      { label: 'Account No.', value: employee.bankDetails?.accountNumber ? `••••${employee.bankDetails.accountNumber.slice(-4)}` : '—' },
                      { label: 'IFSC Code', value: employee.bankDetails?.ifscCode || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2 border-b border-clay-lavender/30">
                        <span className="text-sm text-clay-muted font-600">{label}</span>
                        <span className="text-sm font-700 text-clay-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
