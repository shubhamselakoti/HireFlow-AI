const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Onboarding = require('../models/Onboarding');
const Interview = require('../models/Interview');
const { sendCredentialsEmail } = require('../services/email.service');
const { generateLoginEmail } = require('../utils/employee.utils');

const toObjectId = (val) => {
  if (!val || val === '' || val === 'undefined' || val === 'null') return null;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return null;
};

const generateTempPassword = (name) => {
  const base = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1).toLowerCase();
  const num  = Math.floor(1000 + Math.random() * 9000);
  const syms = ['@', '#', '!', '$'];
  return `${base}${num}${syms[Math.floor(Math.random() * syms.length)]}`;
};

// GET /api/applications
const getApplications = async (req, res) => {
  const filter = {};
  const jobId = toObjectId(req.query.jobId);
  if (jobId) filter.jobId = jobId;
  if (req.query.status) filter.status = req.query.status;
  const candidateId = toObjectId(req.query.candidateId);
  if (candidateId) filter.candidateId = candidateId;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Application.find(filter)
      .populate('candidateId')
      .populate({ path: 'jobId', select: 'title department location jobType' })
      .sort({ appliedAt: -1 })
      .skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// POST /api/applications
const createApplication = async (req, res) => {
  const candidateId = toObjectId(req.body.candidateId);
  const jobId       = toObjectId(req.body.jobId);
  if (!candidateId || !jobId) {
    return res.status(400).json({ success: false, message: 'Valid candidateId and jobId are required' });
  }
  const existing = await Application.findOne({ candidateId, jobId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already applied for this job' });
  }
  const app = await Application.create({ candidateId, jobId, status: 'applied', appliedAt: Date.now() });
  await app.populate(['candidateId', { path: 'jobId', select: 'title' }]);
  res.status(201).json({ success: true, data: app });
};

// PATCH /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['applied','screened','interview_scheduled','interviewed','offered','hired','rejected'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Valid: ${valid.join(', ')}` });
  }

  const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('candidateId')
    .populate({ path: 'jobId', select: 'title department' });
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  // ── HIRE FLOW ──────────────────────────────────────────────────────────────
  if (status === 'hired' && app.candidateId) {
    const cand = app.candidateId;
    try {
      // 1. Generate @hireflow.com login identity FIRST (needed for employee record)
      const loginEmail = await generateLoginEmail(cand.name);
      const plainPassword = generateTempPassword(cand.name);

      // 2. Create / activate Employee record
      let employee = await Employee.findOne({ email: cand.email.toLowerCase() });
      if (!employee) {
        const empData = {
          name:          cand.name,
          email:         cand.email.toLowerCase(),
          hireflowEmail: loginEmail,
          phone:         cand.phone || '',
          joiningDate:   new Date(),
          status:        'active',
          employmentType:'full_time',
        };
        if (app.jobId?.department) empData.department = app.jobId.department;
        employee = await Employee.create(empData);
      } else {
        employee.status        = 'active';
        employee.hireflowEmail = employee.hireflowEmail || loginEmail;
        employee.joiningDate   = employee.joiningDate || new Date();
        await employee.save();
      }

      // 3. Create Onboarding checklist
      const existingOB = await Onboarding.findOne({ employeeId: employee._id });
      if (!existingOB) {
        await Onboarding.create({ employeeId: employee._id, jobId: app.jobId?._id || app.jobId });
      }

      // 4. Create / update User account
      let user = await User.findOne({ email: cand.email.toLowerCase() });

      if (!user) {
        user = await User.create({
          name:               cand.name,
          email:              cand.email.toLowerCase(),
          password:           await bcrypt.hash(plainPassword, 12),
          role:               'employee',
          employeeId:         employee._id,
          employeeLoginEmail: loginEmail,
        });
      } else {
        // Upgrade existing candidate account to employee
        user.role               = 'employee';
        user.employeeId         = user.employeeId || employee._id;
        user.password           = await bcrypt.hash(plainPassword, 12); // always reset to new temp
        user.employeeLoginEmail = user.employeeLoginEmail || loginEmail;
        await user.save();
      }

      // 5. Cross-link everything
      if (!employee.userId) { employee.userId = user._id; await employee.save(); }
      if (cand._id)          await Candidate.findByIdAndUpdate(cand._id, { userId: user._id });

      // 6. Send credentials email — always, with every hire
      await sendCredentialsEmail(employee, plainPassword, loginEmail).catch((e) =>
        console.warn('Credentials email failed:', e.message)
      );

    } catch (err) {
      console.error('❌ Hire flow error:', err.message);
    }
  }

  res.json({ success: true, data: app });
};

// GET /api/applications/pipeline/:jobId
const getPipeline = async (req, res) => {
  const jobId = toObjectId(req.params.jobId);
  if (!jobId) return res.status(400).json({ success: false, message: 'Invalid job ID' });

  const statuses = ['applied','screened','interview_scheduled','interviewed','offered','hired','rejected'];
  const applications = await Application.find({ jobId })
    .populate('candidateId').sort({ appliedAt: -1 }).lean();

  const pipeline = {};
  for (const s of statuses) pipeline[s] = applications.filter((a) => a.status === s);
  res.json({ success: true, data: pipeline, total: applications.length });
};

// GET /api/applications/my
// Authenticated — candidate sees ONLY their own applications, scoped to their userId
const trackApplications = async (req, res) => {
  const userId = req.user._id;

  // Find all candidate records linked to this user account
  const candidates = await Candidate.find({ userId }).lean();

  if (candidates.length === 0) {
    return res.json({ success: true, data: [], message: 'No applications found' });
  }

  const candidateIds = candidates.map((c) => c._id);

  const applications = await Application.find({ candidateId: { $in: candidateIds } })
    .populate({ path: 'jobId', select: 'title department location jobType skills' })
    .populate('candidateId', 'name email aiScore skills yearsExperience')
    .sort({ appliedAt: -1 })
    .lean();

  // Enrich with interview data
  const enriched = await Promise.all(
    applications.map(async (app) => {
      const interview = await Interview.findOne({ applicationId: app._id })
        .sort({ createdAt: -1 }).lean();
      return {
        ...app,
        aiScore: app.candidateId?.aiScore || 0,
        interview: interview ? {
          _id:               interview._id,
          type:              interview.type,
          status:            interview.status,
          scheduledAt:       interview.scheduledAt,
          communicationScore:interview.communicationScore,
          clarityScore:      interview.clarityScore,
          confidenceScore:   interview.confidenceScore,
        } : null,
      };
    })
  );

  res.json({ success: true, data: enriched });
};

module.exports = { getApplications, createApplication, updateApplicationStatus, getPipeline, trackApplications };
