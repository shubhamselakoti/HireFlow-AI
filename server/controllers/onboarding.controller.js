const mongoose = require('mongoose');
const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');

const toObjectId = (val) => {
  if (!val || val === '' || val === 'undefined' || val === 'null') return null;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return null;
};

const getOnboardings = async (req, res) => {
  const filter = {};

  if (req.user.role === 'employee') {
    const employee = await Employee.findOne({ userId: req.user._id }).lean();
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    filter.employeeId = employee._id;
  } else {
    const empId = toObjectId(req.query.employeeId);
    if (empId) filter.employeeId = empId;
  }

  const onboardings = await Onboarding.find(filter)
    .populate('employeeId', 'name designation avatar employeeCode')
    .populate('jobId', 'title department')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: onboardings });
};

const createOnboarding = async (req, res) => {
  const empId = toObjectId(req.body.employeeId);
  if (!empId) return res.status(400).json({ success: false, message: 'Valid employeeId is required' });

  const existing = await Onboarding.findOne({ employeeId: empId });
  if (existing) return res.status(400).json({ success: false, message: 'Onboarding record already exists for this employee' });

  const data = { employeeId: empId };
  const jobId = toObjectId(req.body.jobId);
  if (jobId) data.jobId = jobId;
  if (req.body.startDate) data.startDate = req.body.startDate;

  const onboarding = await Onboarding.create(data);
  await onboarding.populate('employeeId', 'name designation');
  res.status(201).json({ success: true, data: onboarding });
};

const updateTask = async (req, res) => {
  const { taskIndex, completed } = req.body;
  if (taskIndex === undefined || completed === undefined) {
    return res.status(400).json({ success: false, message: 'taskIndex and completed are required' });
  }

  const onboarding = await Onboarding.findById(req.params.id);
  if (!onboarding) return res.status(404).json({ success: false, message: 'Onboarding not found' });

  const idx = parseInt(taskIndex);
  if (isNaN(idx) || idx < 0 || idx >= onboarding.checklist.length) {
    return res.status(400).json({ success: false, message: 'Invalid task index' });
  }

  onboarding.checklist[idx].completed = !!completed;
  onboarding.checklist[idx].completedAt = completed ? new Date() : null;
  await onboarding.save();
  res.json({ success: true, data: onboarding });
};

module.exports = { getOnboardings, createOnboarding, updateTask };
