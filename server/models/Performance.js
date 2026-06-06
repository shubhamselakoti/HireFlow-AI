const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  ratings: {
    technical: { type: Number, min: 1, max: 5, default: 3 },
    communication: { type: Number, min: 1, max: 5, default: 3 },
    teamwork: { type: Number, min: 1, max: 5, default: 3 },
    punctuality: { type: Number, min: 1, max: 5, default: 3 },
    leadership: { type: Number, min: 1, max: 5, default: 3 },
  },
  overallRating: { type: Number, default: 3 },
  comments: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'acknowledged'],
    default: 'draft',
  },
}, { timestamps: true });

performanceSchema.pre('save', function (next) {
  const r = this.ratings;
  this.overallRating = parseFloat(
    ((r.technical + r.communication + r.teamwork + r.punctuality + r.leadership) / 5).toFixed(2)
  );
  next();
});

module.exports = mongoose.model('Performance', performanceSchema);
