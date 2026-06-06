const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: {
    type: String,
    enum: ['applied', 'screened', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'],
    default: 'applied',
  },
  aiScore: { type: Number, default: 0, min: 0, max: 100 },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
