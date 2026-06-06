const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payslip = require('../models/Payslip');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Performance = require('../models/Performance');
const Candidate = require('../models/Candidate');
const { predictHireProbability, predictFlightRisk, isModelReady } = require('../services/brainjs.service');

// GET /api/analytics/overview
const getOverview = async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalEmployees,
    activeJobs,
    pendingLeaves,
    todayPresent,
    thisMonthPayroll,
    recentHires,
    headcountByDept,
    monthlyAttendance,
  ] = await Promise.all([
    Employee.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'open' }),
    Leave.countDocuments({ status: 'pending' }),
    Attendance.countDocuments({ date: { $gte: today }, status: 'present' }),

    Payslip.aggregate([
      { $match: { month: now.getMonth() + 1, year: now.getFullYear() } },
      { $group: { _id: null, total: { $sum: '$grossSalary' } } },
    ]),

    Employee.find({ joiningDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
      .populate('department', 'name')
      .sort({ joiningDate: -1 })
      .limit(5)
      .lean(),

    Employee.aggregate([
      { $match: { status: 'active' } },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$dept.name', 'Unassigned'] }, count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),

    Attendance.aggregate([
      { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'half_day']] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          rate: { $round: [{ $multiply: [{ $divide: ['$present', { $max: ['$total', 1] }] }, 100] }, 1] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalEmployees,
      activeJobs,
      pendingLeaves,
      todayPresent,
      thisMonthPayroll: thisMonthPayroll[0]?.total || 0,
      recentHires,
      headcountByDept,
      monthlyAttendance,
    },
  });
};

// GET /api/analytics/recruitment
const getRecruitmentAnalytics = async (req, res) => {
  const [funnel, topCandidates] = await Promise.all([
    Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),
    Candidate.find().sort({ aiScore: -1 }).limit(10).lean(),
  ]);

  const statusOrder = ['applied', 'screened', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];
  const funnelOrdered = statusOrder.map((s) => ({
    status: s,
    count: funnel.find((f) => f.status === s)?.count || 0,
  }));

  res.json({ success: true, data: { funnel: funnelOrdered, topCandidates } });
};

// GET /api/analytics/attendance
const getAttendanceAnalytics = async (req, res) => {
  const now = new Date();

  const [monthlyTrend, departmentAttendance] = await Promise.all([
    Attendance.aggregate([
      { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          present: 1,
          absent: 1,
          onLeave: 1,
          rate: { $round: [{ $multiply: [{ $divide: ['$present', { $max: ['$total', 1] }] }, 100] }, 1] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),

    Attendance.aggregate([
      { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }, status: 'present' } },
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $lookup: { from: 'departments', localField: 'employee.department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$dept.name', 'Unassigned'] }, presentCount: { $sum: 1 } } },
      { $project: { _id: 0, department: '$_id', presentCount: 1 } },
      { $sort: { presentCount: -1 } },
    ]),
  ]);

  res.json({ success: true, data: { monthlyTrend, departmentAttendance } });
};

// GET /api/analytics/payroll-summary
const getPayrollSummary = async (req, res) => {
  const now = new Date();

  const [monthlyCost, departmentCost, ytdResult] = await Promise.all([
    Payslip.aggregate([
      { $match: { year: now.getFullYear() } },
      {
        $group: {
          _id: '$month',
          grossTotal: { $sum: '$grossSalary' },
          netTotal: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          grossTotal: { $round: ['$grossTotal', 0] },
          netTotal: { $round: ['$netTotal', 0] },
          employeeCount: 1,
        },
      },
      { $sort: { month: 1 } },
    ]),

    Payslip.aggregate([
      { $match: { month: now.getMonth() + 1, year: now.getFullYear() } },
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $lookup: { from: 'departments', localField: 'employee.department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$dept.name', 'Unassigned'] },
          total: { $sum: '$grossSalary' },
          headcount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: '$_id', total: { $round: ['$total', 0] }, headcount: 1 } },
      { $sort: { total: -1 } },
    ]),

    Payslip.aggregate([
      { $match: { year: now.getFullYear() } },
      { $group: { _id: null, ytd: { $sum: '$grossSalary' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      monthlyCost,
      departmentCost,
      ytdTotal: ytdResult[0]?.ytd ? Math.round(ytdResult[0].ytd) : 0,
    },
  });
};

// GET /api/analytics/performance-dist
const getPerformanceDistribution = async (req, res) => {
  const [distribution, topPerformers, departmentAvg] = await Promise.all([
    Performance.aggregate([
      { $match: { status: 'submitted' } },
      {
        $bucket: {
          groupBy: '$overallRating',
          boundaries: [1, 2, 3, 4, 5, 6],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]),

    Performance.aggregate([
      { $match: { status: 'submitted' } },
      { $group: { _id: '$employeeId', avgRating: { $avg: '$overallRating' }, reviewCount: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      {
        $project: {
          _id: 0,
          name: '$employee.name',
          designation: '$employee.designation',
          avatar: '$employee.avatar',
          avgRating: { $round: ['$avgRating', 2] },
          reviewCount: 1,
        },
      },
    ]),

    Performance.aggregate([
      { $match: { status: 'submitted' } },
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $lookup: { from: 'departments', localField: 'employee.department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$dept.name', 'Unassigned'] },
          avgRating: { $avg: '$overallRating' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: '$_id', avgRating: { $round: ['$avgRating', 2] }, count: 1 } },
      { $sort: { avgRating: -1 } },
    ]),
  ]);

  const ratingLabels = { 1: '1★', 2: '2★', 3: '3★', 4: '4★', 5: '5★' };
  const formattedDistribution = distribution.map((d) => ({
    rating: ratingLabels[d._id] || String(d._id),
    count: d.count,
  }));

  res.json({ success: true, data: { distribution: formattedDistribution, topPerformers, departmentAvg } });
};

// POST /api/analytics/predict
const predict = async (req, res) => {
  const { aiScore, yearsExperience, interviewScore, attendanceRate, performanceRating } = req.body;

  const hireProbability = predictHireProbability({
    aiScore: aiScore ?? 50,
    yearsExperience: yearsExperience ?? 0,
    interviewScore: interviewScore ?? 5,
    attendanceRate: attendanceRate ?? 0.9,
    performanceRating: performanceRating ?? 3,
  });

  const flightRisk = predictFlightRisk({
    yearsExperience: yearsExperience ?? 0,
    attendanceRate: attendanceRate ?? 0.9,
    performanceRating: performanceRating ?? 3,
  });

  res.json({ success: true, data: { hireProbability, flightRisk } });
};

module.exports = { getOverview, getRecruitmentAnalytics, getAttendanceAnalytics, getPayrollSummary, getPerformanceDistribution, predict };
