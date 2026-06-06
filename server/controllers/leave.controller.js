const Leave = require('../models/Leave');
const LeavePolicy = require('../models/LeavePolicy');
const Employee = require('../models/Employee');
const { sendLeaveStatusEmail } = require('../services/email.service');

// GET /api/leave/policies
const getPolicies = async (req, res) => {
  const policies = await LeavePolicy.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: policies });
};

// POST /api/leave/policies
const createPolicy = async (req, res) => {
  const { name, type, daysAllowed, carryForward } = req.body;
  if (!name || !type || daysAllowed === undefined) {
    return res.status(400).json({ success: false, message: 'name, type and daysAllowed are required' });
  }
  const policy = await LeavePolicy.create({ name, type, daysAllowed, carryForward: !!carryForward });
  res.status(201).json({ success: true, data: policy });
};

// GET /api/leave/my
const getMyLeaves = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }

  const y = parseInt(req.query.year) || new Date().getFullYear();

  const [leaves, policies] = await Promise.all([
    Leave.find({
      employeeId: employee._id,
      startDate: { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) },
    })
      .populate('leaveType', 'name type daysAllowed')
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 })
      .lean(),
    LeavePolicy.find().lean(),
  ]);

  const approvedLeaves = leaves.filter((l) => l.status === 'approved');

  const balances = policies.map((policy) => {
    const used = approvedLeaves
      .filter((l) => l.leaveType && l.leaveType._id.toString() === policy._id.toString())
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);
    return {
      policy,
      used,
      remaining: Math.max(0, policy.daysAllowed - used),
    };
  });

  res.json({ success: true, data: leaves, balances });
};

// POST /api/leave/apply
const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate and reason are required' });
  }

  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return res.status(400).json({ success: false, message: 'Start date must be before end date' });
  }

  // Count business days
  let totalDays = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) totalDays++;
    d.setDate(d.getDate() + 1);
  }
  if (totalDays === 0) {
    return res.status(400).json({ success: false, message: 'Leave period must include at least one working day' });
  }

  const policy = await LeavePolicy.findById(leaveType);
  if (!policy) {
    return res.status(404).json({ success: false, message: 'Leave policy not found' });
  }

  // Check remaining balance (skip for unpaid)
  if (policy.type !== 'unpaid') {
    const year = start.getFullYear();
    const usedResult = await Leave.aggregate([
      {
        $match: {
          employeeId: employee._id,
          leaveType: policy._id,
          status: 'approved',
          startDate: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalDays' } } },
    ]);
    const used = usedResult[0]?.total || 0;
    const remaining = policy.daysAllowed - used;
    if (totalDays > remaining) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${remaining} days, Requested: ${totalDays} days`,
      });
    }
  }

  const leave = await Leave.create({
    employeeId: employee._id,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
    status: 'pending',
    appliedAt: new Date(),
  });
  await leave.populate('leaveType', 'name type');

  res.status(201).json({ success: true, data: leave });
};

// GET /api/leave/team
const getTeamLeaves = async (req, res) => {
  const managerEmployee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!managerEmployee) {
    return res.status(404).json({ success: false, message: 'Manager profile not found' });
  }
  const teamMembers = await Employee.find({ managerId: managerEmployee._id }).lean();
  const teamIds = teamMembers.map((e) => e._id);

  const filter = { employeeId: { $in: teamIds } };
  if (req.query.status) filter.status = req.query.status;

  const leaves = await Leave.find(filter)
    .populate('employeeId', 'name designation avatar employeeCode')
    .populate('leaveType', 'name type')
    .populate('approvedBy', 'name')
    .sort({ appliedAt: -1 })
    .lean();

  res.json({ success: true, data: leaves });
};

// GET /api/leave/all
const getAllLeaves = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employeeId) filter.employeeId = req.query.employeeId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Leave.find(filter)
      .populate('employeeId', 'name designation avatar employeeCode')
      .populate('leaveType', 'name type')
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Leave.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// PATCH /api/leave/:id/approve
const approveLeave = async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id },
    { new: true }
  )
    .populate('employeeId', 'name email designation')
    .populate('leaveType', 'name type');

  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

  try {
    await sendLeaveStatusEmail(leave.employeeId, leave, 'approved', req.user.name);
  } catch (err) {
    console.warn('Leave email failed:', err.message);
  }
  res.json({ success: true, data: leave });
};

// PATCH /api/leave/:id/reject
const rejectLeave = async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', approvedBy: req.user._id },
    { new: true }
  )
    .populate('employeeId', 'name email designation')
    .populate('leaveType', 'name type');

  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

  try {
    await sendLeaveStatusEmail(leave.employeeId, leave, 'rejected', req.user.name);
  } catch (err) {
    console.warn('Leave email failed:', err.message);
  }
  res.json({ success: true, data: leave });
};

// exports at end of file

// DELETE /api/leave/policies/:id
const deletePolicy = async (req, res) => {
  const policy = await LeavePolicy.findByIdAndDelete(req.params.id);
  if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, message: 'Policy deleted' });
};
module.exports = { getPolicies, createPolicy, deletePolicy, getMyLeaves, applyLeave, getTeamLeaves, getAllLeaves, approveLeave, rejectLeave };
