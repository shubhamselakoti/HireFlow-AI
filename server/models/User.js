const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, default: null },
  image:    { type: String, default: null },
  role: {
    type: String,
    enum: [
      'management_admin',
      'senior_manager',
      'hr_recruiter',
      'employee',
      'candidate',
    ],
    default: 'candidate',
  },
  employeeId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  candidateId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null },
  // Generated on hire: firstname.lastname@hireflow.com (unique, used as alternate login)
  employeeLoginEmail: { type: String, default: null, sparse: true, lowercase: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
