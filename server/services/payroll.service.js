/**
 * Count weekdays (Mon–Fri) in a given month/year.
 */
const getWorkingDaysInMonth = (month, year) => {
  const date = new Date(year, month - 1, 1);
  let count = 0;
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
};

/**
 * Calculate a single employee's payslip for a given month.
 * @param {object} employee - Employee document with salary fields
 * @param {Array} attendanceRecords - Attendance documents for this employee/month
 * @param {number} month
 * @param {number} year
 * @returns {object} Payslip breakdown
 */
const calculatePayslip = (employee, attendanceRecords, month, year) => {
  const workingDays = getWorkingDaysInMonth(month, year);
  const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
  const leaveDays = attendanceRecords.filter((a) => a.status === 'on_leave').length;
  const halfDays = attendanceRecords.filter((a) => a.status === 'half_day').length;

  // Half days count as 0.5
  const effectiveDays = presentDays + leaveDays + halfDays * 0.5;
  const perDaySalary = workingDays > 0 ? (employee.salary?.base || 0) / workingDays : 0;
  const earnedBasic = parseFloat((perDaySalary * effectiveDays).toFixed(2));

  const hra = employee.salary?.hra || 0;
  const allowances = employee.salary?.allowances || 0;
  const grossSalary = parseFloat((earnedBasic + hra + allowances).toFixed(2));

  const pf = parseFloat((earnedBasic * 0.12).toFixed(2));
  const tax = grossSalary > 50000 ? parseFloat((grossSalary * 0.10).toFixed(2)) : 0;
  const otherDeductions = employee.salary?.deductions || 0;

  const netSalary = parseFloat((grossSalary - pf - tax - otherDeductions).toFixed(2));

  return {
    basicSalary: earnedBasic,
    hra,
    allowances,
    grossSalary,
    pf,
    tax,
    otherDeductions,
    netSalary: Math.max(0, netSalary),
    workingDays,
    presentDays,
    leaveDays,
  };
};

module.exports = { getWorkingDaysInMonth, calculatePayslip };
