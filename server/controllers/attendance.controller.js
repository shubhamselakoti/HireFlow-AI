const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// POST /api/attendance/clock-in
const clockIn = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found. Ask HR to link your account.' });
  }

  const today = startOfDay(new Date());

  const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
  if (existing && existing.clockIn) {
    return res.status(400).json({ success: false, message: 'Already clocked in today' });
  }

  const record = await Attendance.findOneAndUpdate(
    { employeeId: employee._id, date: today },
    { $setOnInsert: { employeeId: employee._id, date: today }, $set: { clockIn: new Date(), status: 'present' } },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: record });
};

// POST /api/attendance/clock-out
const clockOut = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }

  const today = startOfDay(new Date());
  const record = await Attendance.findOne({ employeeId: employee._id, date: today });

  if (!record || !record.clockIn) {
    return res.status(400).json({ success: false, message: 'No clock-in found for today' });
  }
  if (record.clockOut) {
    return res.status(400).json({ success: false, message: 'Already clocked out today' });
  }

  const now = new Date();
  const totalHours = parseFloat(((now - record.clockIn) / (1000 * 60 * 60)).toFixed(2));
  const status = totalHours < 4 ? 'half_day' : 'present';

  record.clockOut = now;
  record.totalHours = totalHours;
  record.status = status;
  await record.save();

  res.json({ success: true, data: record });
};

// GET /api/attendance/my
const getMyAttendance = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found' });
  }

  const now = new Date();
  const m = parseInt(req.query.month) || (now.getMonth() + 1);
  const y = parseInt(req.query.year) || now.getFullYear();

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const records = await Attendance.find({
    employeeId: employee._id,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 }).lean();

  res.json({ success: true, data: records });
};

// GET /api/attendance/employee/:id
const getEmployeeAttendance = async (req, res) => {
  const now = new Date();
  const m = parseInt(req.query.month) || (now.getMonth() + 1);
  const y = parseInt(req.query.year) || now.getFullYear();

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const records = await Attendance.find({
    employeeId: req.params.id,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 }).lean();

  res.json({ success: true, data: records });
};

// GET /api/attendance/team — senior_manager
const getTeamAttendance = async (req, res) => {
  const managerEmployee = await Employee.findOne({ userId: req.user._id });
  if (!managerEmployee) {
    return res.status(404).json({ success: false, message: 'Manager profile not found' });
  }

  const teamMembers = await Employee.find({ managerId: managerEmployee._id, status: 'active' }).lean();
  const teamIds = teamMembers.map((e) => e._id);

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const start = startOfDay(date);
  const end = endOfDay(date);

  const records = await Attendance.find({
    employeeId: { $in: teamIds },
    date: { $gte: start, $lte: end },
  })
    .populate('employeeId', 'name designation avatar employeeCode')
    .sort({ date: -1 })
    .lean();

  res.json({ success: true, data: records, teamSize: teamIds.length });
};

// GET /api/attendance/company — admin
const getCompanyAttendance = async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const start = startOfDay(date);
  const end = endOfDay(date);

  const [records, totalActive] = await Promise.all([
    Attendance.find({ date: { $gte: start, $lte: end } })
      .populate('employeeId', 'name designation department avatar employeeCode')
      .sort({ createdAt: -1 })
      .lean(),
    Employee.countDocuments({ status: 'active' }),
  ]);

  res.json({ success: true, data: records, totalActive });
};

// POST /api/attendance/mark — admin manual mark
const markAttendance = async (req, res) => {
  const { employeeId, date, status, note } = req.body;
  if (!employeeId || !date || !status) {
    return res.status(400).json({ success: false, message: 'employeeId, date and status are required' });
  }

  const dayStart = startOfDay(new Date(date));
  const record = await Attendance.findOneAndUpdate(
    { employeeId, date: dayStart },
    { $set: { status, note: note || '', date: dayStart } },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: record });
};

module.exports = { clockIn, clockOut, getMyAttendance, getEmployeeAttendance, getTeamAttendance, getCompanyAttendance, markAttendance };
