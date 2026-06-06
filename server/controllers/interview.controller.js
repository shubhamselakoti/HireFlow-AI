const Interview = require('../models/Interview');
const Application = require('../models/Application');
const { uploadVideo } = require('../services/cloudinary.service');
const { sendInterviewScheduledEmail } = require('../services/email.service');

const getInterviews = async (req, res) => {
  const filter = {};
  if (req.query.applicationId) filter.applicationId = req.query.applicationId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  if (req.query.upcoming === 'true') {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    filter.scheduledAt = { $gte: now, $lte: threeDays };
    filter.status = 'scheduled';
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

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
  const interview = await Interview.create({
    applicationId,
    scheduledAt,
    type: type || 'video',
    status: 'scheduled',
  });
  await Application.findByIdAndUpdate(applicationId, { status: 'interview_scheduled' });

  // Notify candidate
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
    sentimentScore: Number(sentimentScore) || 0,
    communicationScore: Number(communicationScore) || 0,
    clarityScore: Number(clarityScore) || 0,
    confidenceScore: Number(confidenceScore) || 0,
  };
  if (voiceResponses) updateData.voiceResponses = voiceResponses;

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

  await Application.findByIdAndUpdate(interview.applicationId, { status: 'interviewed' });
  res.json({ success: true, data: interview });
};

const updateInterview = async (req, res) => {
  const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
  res.json({ success: true, data: interview });
};

module.exports = { getInterviews, getInterview, createInterview, submitInterview, updateInterview };
