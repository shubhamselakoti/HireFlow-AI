const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, unique: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  // HireFlow-generated login email: firstname.lastname@hireflow.com
  hireflowEmail:{ type: String, default: null, lowercase: true },
  phone:        { type: String, default: '' },
  avatar: { type: String, default: null },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
  designation: { type: String, default: '' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
  joiningDate: { type: Date, default: Date.now },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern'],
    default: 'full_time',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active',
    index: true,
  },
  salary: {
    base: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
  },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
  },
  documents: [documentSchema],
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeCode) {
    const last = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
    let num = 1;
    if (last && last.employeeCode) {
      num = parseInt(last.employeeCode.replace('EMP', ''), 10) + 1;
    }
    this.employeeCode = `EMP${String(num).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
