const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  payrollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll', required: true },
  month: { type: Number, required: true, min: 1, max: 12, index: true },
  year: { type: Number, required: true, index: true },
  basicSalary: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['generated', 'paid'],
    default: 'generated',
  },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payslip', payslipSchema);
