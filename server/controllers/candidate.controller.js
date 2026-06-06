const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const { bulkScreenResumes } = require('../services/ai.service');

const getCandidates = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.minScore) filter.aiScore = { $gte: parseInt(req.query.minScore) };
  if (req.query.maxScore) {
    filter.aiScore = { ...(filter.aiScore || {}), $lte: parseInt(req.query.maxScore) };
  }

  const [data, total] = await Promise.all([
    Candidate.find(filter).sort({ aiScore: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Candidate.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

const bulkUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No resume files uploaded' });
  }

  const jobId  = req.body.jobId  || null;
  const userId = req.body.userId || null;   // passed from frontend when user is logged in

  const { successful, failed } = await bulkScreenResumes(req.files, jobId);

  // Link all newly created/updated candidates to the logged-in user's account
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const candidateIds = successful.map((r) => r.candidate._id).filter(Boolean);
    if (candidateIds.length > 0) {
      await Candidate.updateMany(
        { _id: { $in: candidateIds }, userId: null },
        { $set: { userId } }
      );
    }
  }

  res.json({
    success: true,
    data: {
      candidates:   successful.map((r) => r.candidate),
      applications: successful.map((r) => r.application).filter(Boolean),
      failed,
      total:        req.files.length,
      processed:    successful.length,
      failedCount:  failed.length,
    },
  });
};

const getCandidate = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).lean();
  if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
  res.json({ success: true, data: candidate });
};

const updateCandidate = async (req, res) => {
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
  res.json({ success: true, data: candidate });
};

module.exports = { getCandidates, bulkUpload, getCandidate, updateCandidate };
