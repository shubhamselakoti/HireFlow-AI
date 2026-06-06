const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  checklist: {
    type: [checklistItemSchema],
    default: [
      { task: 'Sign employment contract', completed: false },
      { task: 'Complete tax forms', completed: false },
      { task: 'Set up company email', completed: false },
      { task: 'IT equipment setup', completed: false },
      { task: 'Complete company orientation', completed: false },
      { task: 'Meet the team', completed: false },
      { task: 'Review company policies', completed: false },
      { task: 'Set up payroll & bank details', completed: false },
    ],
  },
  startDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
