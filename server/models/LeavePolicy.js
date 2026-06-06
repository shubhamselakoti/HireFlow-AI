const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid'],
    required: true,
  },
  daysAllowed: { type: Number, required: true, min: 0 },
  carryForward: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
