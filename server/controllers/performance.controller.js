const mongoose = require('mongoose');
const Performance = require('../models/Performance');
const Goal = require('../models/Goal');
const Employee = require('../models/Employee');

const toObjectId = (val) => {
  if (!val || val === '' || val === 'undefined' || val === 'null') return null;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return null;
};

// GET /api/performance/my
const getMyPerformance = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const reviews = await Performance.find({ employeeId: employee._id })
    .populate('reviewerId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: reviews });
};

// GET /api/performance/team
const getTeamPerformance = async (req, res) => {
  const managerEmployee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!managerEmployee) return res.status(404).json({ success: false, message: 'Manager profile not found' });

  const teamMembers = await Employee.find({ managerId: managerEmployee._id }).lean();
  const teamIds = teamMembers.map((e) => e._id);

  const reviews = await Performance.find({ employeeId: { $in: teamIds } })
    .populate('employeeId', 'name designation avatar employeeCode')
    .populate('reviewerId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: reviews });
};

// GET /api/performance/all
const getAllPerformance = async (req, res) => {
  const filter = {};
  const empId = toObjectId(req.query.employeeId);
  if (empId) filter.employeeId = empId;
  if (req.query.period) filter.period = req.query.period;
  if (req.query.status) filter.status = req.query.status;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Performance.find(filter)
      .populate('employeeId', 'name designation department avatar employeeCode')
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Performance.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// POST /api/performance
const createPerformance = async (req, res) => {
  const { employeeId, period, ratings, comments, status } = req.body;

  const empId = toObjectId(employeeId);
  if (!empId) return res.status(400).json({ success: false, message: 'Valid employeeId is required' });
  if (!period) return res.status(400).json({ success: false, message: 'period is required' });
  if (!ratings || typeof ratings !== 'object') {
    return res.status(400).json({ success: false, message: 'ratings object is required' });
  }

  // Ensure all rating values are numbers 1-5
  const cleanRatings = {
    technical:     Math.min(5, Math.max(1, Number(ratings.technical)     || 3)),
    communication: Math.min(5, Math.max(1, Number(ratings.communication) || 3)),
    teamwork:      Math.min(5, Math.max(1, Number(ratings.teamwork)      || 3)),
    punctuality:   Math.min(5, Math.max(1, Number(ratings.punctuality)   || 3)),
    leadership:    Math.min(5, Math.max(1, Number(ratings.leadership)    || 3)),
  };

  const review = await Performance.create({
    employeeId: empId,
    reviewerId: req.user._id,
    period,
    ratings: cleanRatings,
    comments: comments || '',
    status: status || 'submitted',
  });

  await review.populate([
    { path: 'employeeId', select: 'name designation' },
    { path: 'reviewerId', select: 'name' },
  ]);
  res.status(201).json({ success: true, data: review });
};

// PATCH /api/performance/:id
const updatePerformance = async (req, res) => {
  const updates = { ...req.body };

  if (updates.ratings) {
    ['technical','communication','teamwork','punctuality','leadership'].forEach((k) => {
      if (updates.ratings[k] !== undefined) {
        updates.ratings[k] = Math.min(5, Math.max(1, Number(updates.ratings[k]) || 3));
      }
    });
  }

  const review = await Performance.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('employeeId', 'name designation')
    .populate('reviewerId', 'name');
  if (!review) return res.status(404).json({ success: false, message: 'Performance review not found' });
  res.json({ success: true, data: review });
};

// GET /api/performance/goals/my
const getMyGoals = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id }).lean();
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const goals = await Goal.find({ employeeId: employee._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: goals });
};

// POST /api/performance/goals
const createGoal = async (req, res) => {
  const { title, description, targetDate, employeeId } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Goal title is required' });

  let empId = toObjectId(employeeId);

  const isPrivileged = ['management_admin', 'senior_manager'].includes(req.user.role);

  if (!empId || !isPrivileged) {
    // Non-admin: always set goal for their own profile regardless of what employeeId was sent
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found. Ask HR to link your account.' });
    empId = employee._id;
  }

  const goal = await Goal.create({
    employeeId: empId,
    title: title.trim(),
    description: description || '',
    targetDate: targetDate || null,
  });
  res.status(201).json({ success: true, data: goal });
};

// PATCH /api/performance/goals/:id
const updateGoal = async (req, res) => {
  // Verify ownership for non-privileged users
  if (!['management_admin', 'senior_manager'].includes(req.user.role)) {
    const employee = await Employee.findOne({ userId: req.user._id }).lean();
    if (employee) {
      const goal = await Goal.findById(req.params.id).lean();
      if (goal && goal.employeeId.toString() !== employee._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only update your own goals' });
      }
    }
  }

  const updates = { ...req.body };

  // Coerce progress to number
  if (updates.progress !== undefined) {
    updates.progress = Math.min(100, Math.max(0, Number(updates.progress) || 0));
  }

  // Auto-set status from progress
  if (updates.progress === 100) {
    updates.status = 'completed';
  } else if (updates.progress > 0 && !updates.status) {
    updates.status = 'in_progress';
  }

  const goal = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
  res.json({ success: true, data: goal });
};

module.exports = {
  getMyPerformance, getTeamPerformance, getAllPerformance,
  createPerformance, updatePerformance,
  getMyGoals, createGoal, updateGoal,
};
