const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  targetDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
