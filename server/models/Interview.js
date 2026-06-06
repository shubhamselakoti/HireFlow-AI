const mongoose = require('mongoose');

const voiceResponseSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
  score: { type: Number, default: 0, min: 0, max: 10 },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledAt: { type: Date },
  type: {
    type: String,
    enum: ['video', 'voice', 'panel'],
    default: 'video',
  },
  videoUrl: { type: String, default: null },
  transcript: { type: String, default: '' },
  sentimentScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  clarityScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  voiceResponses: [voiceResponseSchema],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
