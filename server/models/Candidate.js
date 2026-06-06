const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, lowercase: true, trim: true, index: true },
  phone:           { type: String, default: '' },
  resumeUrl:       { type: String, default: null },
  resumeText:      { type: String, default: '' },
  skills:          [{ type: String }],
  yearsExperience: { type: Number, default: 0 },
  aiScore:         { type: Number, default: 0, min: 0, max: 100 },
  // Link to User account — set when candidate logs in or creates account
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
