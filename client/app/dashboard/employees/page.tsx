'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/axios';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import type { Employee, Department, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-mint',
  inactive: 'badge-yellow',
  terminated: 'badge-rose',
};

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const LIMIT = 50;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(deptFilter && { department: deptFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get<PaginatedResponse<Employee>>(`/api/employees?${params}`);
      setEmployees(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, statusFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    api.get('/api/departments').then((r) => setDepartments(r.data.data)).catch(() => {});
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, deptFilter, statusFilter]);

  const exportCSV = () => {
    const headers = ['Code', 'Name', 'Email', 'Department', 'Designation', 'Type', 'Status', 'Joined'];
    const rows = employees.map((e) => [
      e.employeeCode,
      e.name,
      e.email,
      (e.department as any)?.name || '',
      e.designation || '',
      TYPE_LABELS[e.employmentType] || e.employmentType,
      e.status,
      format(new Date(e.joiningDate), 'dd MMM yyyy'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-900 text-clay-text">Employees</h1>
          <p className="text-clay-muted text-sm font-500">{total.toLocaleString()} total employees</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="clay-btn clay-btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
            <Download size={15} strokeWidth={2.2} /> Export CSV
          </button>
          <button
            onClick={() => router.push('/dashboard/employees/new')}
            className="clay-btn clay-btn-primary px-5 py-2.5 text-sm font-700 text-white flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="clay-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay-muted" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, code..."
            className="clay-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="clay-input px-3 py-2.5 text-sm min-w-40"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-input px-3 py-2.5 text-sm min-w-36"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="clay-table overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Type</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="👥"
                    title="No employees found"
                    description="Try adjusting your search or filters."
                    action={{ label: '+ Add First Employee', onClick: () => router.push('/dashboard/employees/new') }}
                  />
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const dept = emp.department as any;
                return (
                  <tr
                    key={emp._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/employees/${emp._id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-clay-lavender flex items-center justify-center flex-shrink-0 font-800 text-clay-purple text-xs">
                            {emp.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-700 text-clay-text text-sm">{emp.name}</p>
                          <p className="text-xs text-clay-muted">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-700 text-clay-purple text-sm">{emp.employeeCode}</span></td>
                    <td className="text-sm">{dept?.name || '—'}</td>
                    <td className="text-sm">{emp.designation || '—'}</td>
                    <td>
                      <span className="badge-sky text-xs font-700 px-2 py-0.5 rounded-pill">
                        {TYPE_LABELS[emp.employmentType] || emp.employmentType}
                      </span>
                    </td>
                    <td>
                      <span className={`${STATUS_COLORS[emp.status]} text-xs font-700 px-2.5 py-0.5 rounded-pill`}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm text-clay-muted">
                      {format(new Date(emp.joiningDate), 'dd MMM yyyy')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-clay-muted font-500">
            Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="clay-btn clay-btn-outline px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="clay-card-sm px-4 py-2 text-sm font-700 text-clay-text flex items-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="clay-btn clay-btn-outline px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
