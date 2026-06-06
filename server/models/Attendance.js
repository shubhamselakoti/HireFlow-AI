const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  date: { type: Date, required: true, index: true },
  clockIn: { type: Date, default: null },
  clockOut: { type: Date, default: null },
  totalHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday'],
    default: 'absent',
  },
  note: { type: String, default: '' },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
