const Job = require('../models/Job');
const mongoose = require('mongoose');

/** Convert a value to ObjectId or null. Returns null for any falsy/invalid value. */
const toObjectId = (val) => {
  if (!val || val === '' || val === 'undefined' || val === 'null') return null;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return null;
};

const getJobs = async (req, res) => {
  const filter = { status: 'open' };
  const dept = toObjectId(req.query.department);
  if (dept) filter.department = dept;
  if (req.query.jobType) filter.jobType = req.query.jobType;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Job.find(filter).populate('department', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const getAllJobs = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const dept = toObjectId(req.query.department);
  if (dept) filter.department = dept;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Job.find(filter)
      .populate('department', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const getJob = async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name')
    .lean();
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
};

const createJob = async (req, res) => {
  const { title, description, department, skills, experience, location, jobType, status } = req.body;

  if (!title) return res.status(400).json({ success: false, message: 'Job title is required' });

  const jobData = {
    title: title.trim(),
    description: description || '',
    skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
    experience: Number(experience) || 0,
    location: location || '',
    jobType: jobType || 'full_time',
    status: status || 'draft',
    createdBy: req.user._id,
  };

  // Only set department if valid ObjectId
  const deptId = toObjectId(department);
  if (deptId) jobData.department = deptId;

  const job = await Job.create(jobData);
  await job.populate('department', 'name');
  res.status(201).json({ success: true, data: job });
};

const updateJob = async (req, res) => {
  const updates = { ...req.body };

  // Sanitize department field
  if ('department' in updates) {
    const deptId = toObjectId(updates.department);
    if (deptId) updates.department = deptId;
    else delete updates.department;
  }

  const job = await Job.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('department', 'name');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
};

const deleteJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, message: 'Job closed successfully' });
};

module.exports = { getJobs, getAllJobs, getJob, createJob, updateJob, deleteJob };
