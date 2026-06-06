// ─── Department Controller ────────────────────────────────────────────────────
const Department = require('../models/Department');

const getDepartments = async (req, res) => {
  const departments = await Department.find()
    .populate('headId', 'name designation avatar')
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: departments });
};

const createDepartment = async (req, res) => {
  const { name, description, headId } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });
  const dept = await Department.create({ name, description, headId: headId || null });
  res.status(201).json({ success: true, data: dept });
};

const updateDepartment = async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, data: dept });
};

// ─── Job Controller ───────────────────────────────────────────────────────────
const Job = require('../models/Job');

const getJobs = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  else filter.status = 'open'; // default to open jobs for public
  if (req.query.department) filter.department = req.query.department;
  if (req.query.jobType) filter.jobType = req.query.jobType;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
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

const getAllJobs = async (req, res) => {
  // For authenticated users — no status filter
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.department) filter.department = req.query.department;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
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
  const job = await Job.create({ ...req.body, createdBy: req.user._id });
  await job.populate('department', 'name');
  res.status(201).json({ success: true, data: job });
};

const updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('department', 'name');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
};

const deleteJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, message: 'Job closed successfully' });
};

// ─── Application Controller ───────────────────────────────────────────────────
const Application = require('../models/Application');
const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');
const { sendWelcomeEmail } = require('../services/email.service');

const getApplications = async (req, res) => {
  const filter = {};
  if (req.query.jobId) filter.jobId = req.query.jobId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.candidateId) filter.candidateId = req.query.candidateId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Application.find(filter)
      .populate('candidateId')
      .populate('jobId', 'title department')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const createApplication = async (req, res) => {
  const { candidateId, jobId } = req.body;
  if (!candidateId || !jobId) {
    return res.status(400).json({ success: false, message: 'candidateId and jobId are required' });
  }
  const existing = await Application.findOne({ candidateId, jobId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Application already exists for this candidate and job' });
  }
  const app = await Application.create({ candidateId, jobId, status: 'applied', appliedAt: Date.now() });
  await app.populate(['candidateId', { path: 'jobId', select: 'title' }]);
  res.status(201).json({ success: true, data: app });
};

const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['applied', 'screened', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate(['candidateId', { path: 'jobId', select: 'title department' }]);

  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  // Auto-create onboarding when hired
  if (status === 'hired' && app.candidateId) {
    const existingEmployee = await Employee.findOne({ email: app.candidateId.email });
    if (!existingEmployee) {
      try {
        const newEmployee = await Employee.create({
          name: app.candidateId.name,
          email: app.candidateId.email,
          phone: app.candidateId.phone || '',
          joiningDate: new Date(),
          status: 'active',
        });
        await Onboarding.create({ employeeId: newEmployee._id, jobId: app.jobId });
        await sendWelcomeEmail(newEmployee).catch(() => {});
      } catch (err) {
        console.warn('Auto-onboarding failed:', err.message);
      }
    }
  }

  res.json({ success: true, data: app });
};

// ─── Interview Controller ─────────────────────────────────────────────────────
const Interview = require('../models/Interview');
const { uploadVideo } = require('../services/cloudinary.service');
const { sendInterviewScheduledEmail } = require('../services/email.service');
const Candidate = require('../models/Candidate');

const getInterviews = async (req, res) => {
  const filter = {};
  if (req.query.applicationId) filter.applicationId = req.query.applicationId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Upcoming filter
  if (req.query.upcoming === 'true') {
    const now = new Date();
    const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    filter.scheduledAt = { $gte: now, $lte: threeDaysAhead };
    filter.status = 'scheduled';
  }

  const [data, total] = await Promise.all([
    Interview.find(filter)
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'candidateId', select: 'name email phone' },
          { path: 'jobId', select: 'title department' },
        ],
      })
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interview.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const getInterview = async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate({
      path: 'applicationId',
      populate: [
        { path: 'candidateId' },
        { path: 'jobId', populate: { path: 'department', select: 'name' } },
      ],
    })
    .lean();
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
  res.json({ success: true, data: interview });
};

const createInterview = async (req, res) => {
  const { applicationId, scheduledAt, type } = req.body;
  if (!applicationId) {
    return res.status(400).json({ success: false, message: 'applicationId is required' });
  }

  const interview = await Interview.create({ applicationId, scheduledAt, type: type || 'video', status: 'scheduled' });

  // Update application status
  await Application.findByIdAndUpdate(applicationId, { status: 'interview_scheduled' });

  // Send notification email
  try {
    const app = await Application.findById(applicationId)
      .populate('candidateId')
      .populate('jobId', 'title')
      .lean();
    if (app?.candidateId && app?.jobId) {
      await sendInterviewScheduledEmail(app.candidateId, interview, app.jobId);
    }
  } catch (err) {
    console.warn('Interview email failed:', err.message);
  }

  res.status(201).json({ success: true, data: interview });
};

const submitInterview = async (req, res) => {
  const { transcript, sentimentScore, communicationScore, clarityScore, confidenceScore, voiceResponses } = req.body;

  const updateData = {
    status: 'completed',
    transcript: transcript || '',
    sentimentScore: sentimentScore || 0,
    communicationScore: communicationScore || 0,
    clarityScore: clarityScore || 0,
    confidenceScore: confidenceScore || 0,
  };

  if (voiceResponses) updateData.voiceResponses = voiceResponses;

  // Handle video upload if present
  if (req.file) {
    try {
      const cloudResult = await uploadVideo(req.file.buffer, req.params.id);
      updateData.videoUrl = cloudResult.secure_url;
    } catch (err) {
      console.warn('Video upload failed:', err.message);
    }
  }

  const interview = await Interview.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

  // Update application status to interviewed
  await Application.findByIdAndUpdate(interview.applicationId, { status: 'interviewed' });

  res.json({ success: true, data: interview });
};

const updateInterview = async (req, res) => {
  const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
  res.json({ success: true, data: interview });
};

// ─── User Controller ──────────────────────────────────────────────────────────
const User = require('../models/User');

const getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);

  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['management_admin', 'senior_manager', 'hr_recruiter', 'employee'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, data: user });
};

module.exports = {
  getDepartments, createDepartment, updateDepartment,
  getJobs, getAllJobs, getJob, createJob, updateJob, deleteJob,
  getApplications, createApplication, updateApplicationStatus,
  getInterviews, getInterview, createInterview, submitInterview, updateInterview,
  getUsers, updateUserRole,
};
