const mongoose = require('mongoose');
const Payroll = require('../models/Payroll');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { calculatePayslip } = require('../services/payroll.service');
const { sendPayslipEmail } = require('../services/email.service');

// GET /api/payroll
const getPayrolls = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Payroll.find()
      .populate('processedBy', 'name')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payroll.countDocuments(),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// POST /api/payroll/run
const runPayroll = async (req, res) => {
  const month = parseInt(req.body.month);
  const year  = parseInt(req.body.year);

  if (!month || month < 1 || month > 12) {
    return res.status(400).json({ success: false, message: 'Valid month (1-12) is required' });
  }
  if (!year || year < 2020 || year > 2100) {
    return res.status(400).json({ success: false, message: 'Valid year is required' });
  }

  // Prevent re-running already-processed payroll
  const existing = await Payroll.findOne({ month, year, status: { $ne: 'draft' } });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Payroll for ${month}/${year} has already been processed (status: ${existing.status})`,
    });
  }

  // Create/update payroll record
  const payroll = await Payroll.findOneAndUpdate(
    { month, year },
    { $set: { status: 'processed', processedBy: req.user._id, processedAt: new Date() } },
    { upsert: true, new: true }
  );

  const employees = await Employee.find({ status: 'active' }).lean();
  if (employees.length === 0) {
    return res.status(400).json({ success: false, message: 'No active employees found' });
  }

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month,     0, 23, 59, 59);

  const results = await Promise.allSettled(
    employees.map(async (employee) => {
      const attendanceRecords = await Attendance.find({
        employeeId: employee._id,
        date: { $gte: start, $lte: end },
      }).lean();

      const calc = calculatePayslip(employee, attendanceRecords, month, year);

      const payslip = await Payslip.findOneAndUpdate(
        { employeeId: employee._id, payrollId: payroll._id },
        { $set: { employeeId: employee._id, payrollId: payroll._id, month, year, ...calc, status: 'generated' } },
        { upsert: true, new: true }
      );

      // Non-fatal email
      sendPayslipEmail(employee, payslip).catch(() => {});
      return payslip;
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed     = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);

  const totalCTC = successful.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
  payroll.totalCTC = totalCTC;
  await payroll.save();

  res.json({
    success: true,
    data: { payroll, processed: successful.length, failed: failed.length, failureDetails: failed, totalCTC },
  });
};

// GET /api/payroll/:id
const getPayroll = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid payroll ID' });
  }
  const payroll = await Payroll.findById(req.params.id).populate('processedBy', 'name').lean();
  if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });

  const payslips = await Payslip.find({ payrollId: payroll._id })
    .populate('employeeId', 'name employeeCode designation department')
    .sort({ createdAt: 1 })
    .lean();

  res.json({ success: true, data: { payroll, payslips } });
};

// GET /api/payroll/payslips/my
const getMyPayslips = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Payslip.find({ employeeId: employee._id })
      .populate('payrollId', 'month year status')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payslip.countDocuments({ employeeId: employee._id }),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// GET /api/payroll/payslips/:employeeId
const getEmployeePayslips = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
    return res.status(400).json({ success: false, message: 'Invalid employee ID' });
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Payslip.find({ employeeId: req.params.employeeId })
      .populate('payrollId', 'month year status')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payslip.countDocuments({ employeeId: req.params.employeeId }),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

module.exports = { getPayrolls, runPayroll, getPayroll, getMyPayslips, getEmployeePayslips };
