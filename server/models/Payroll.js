const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'processed', 'paid'],
    default: 'draft',
  },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date, default: null },
  totalCTC: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Payroll', payrollSchema);
