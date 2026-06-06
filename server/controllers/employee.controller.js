const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const { uploadAvatar, uploadDocument } = require('../services/cloudinary.service');
const { sendWelcomeEmail } = require('../services/email.service');

const toObjectId = (val) => {
  if (!val || val === '' || val === 'undefined' || val === 'null') return null;
  if (mongoose.Types.ObjectId.isValid(val)) return new mongoose.Types.ObjectId(val);
  return null;
};

// GET /api/employees
const getEmployees = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { employeeCode: regex }, { designation: regex }];
  }
  const dept = toObjectId(req.query.department);
  if (dept) filter.department = dept;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employmentType) filter.employmentType = req.query.employmentType;

  // Senior managers only see their team
  if (req.user.role === 'senior_manager') {
    const managerEmployee = await Employee.findOne({ userId: req.user._id }).lean();
    if (managerEmployee) filter.managerId = managerEmployee._id;
  }

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name')
      .populate('managerId', 'name employeeCode hireflowEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

// POST /api/employees
const createEmployee = async (req, res) => {
  const { name, email, phone, department, designation, managerId, joiningDate, employmentType, salary, bankDetails } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const empData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    designation: designation || '',
    joiningDate: joiningDate || Date.now(),
    employmentType: employmentType || 'full_time',
    salary: {
      base: Number(salary?.base) || 0,
      hra: Number(salary?.hra) || 0,
      allowances: Number(salary?.allowances) || 0,
      deductions: Number(salary?.deductions) || 0,
    },
    bankDetails: bankDetails || {},
  };

  const deptId = toObjectId(department);
  if (deptId) empData.department = deptId;

  const mgr = toObjectId(managerId);
  if (mgr) empData.managerId = mgr;

  const employee = await Employee.create(empData);
  await employee.populate('department', 'name');

  try {
    await sendWelcomeEmail(employee);
  } catch (err) {
    console.warn('Welcome email failed:', err.message);
  }

  res.status(201).json({ success: true, data: employee });
};

// GET /api/employees/my/profile
const getMyProfile = async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id })
    .populate('department', 'name description')
    .populate('managerId', 'name designation avatar employeeCode hireflowEmail')
    .lean();

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee profile not found. Ask HR to link your account.' });
  }
  res.json({ success: true, data: employee });
};

// GET /api/employees/:id
const getEmployee = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid employee ID' });
  }
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name description')
    .populate('managerId', 'name designation avatar employeeCode hireflowEmail')
    .lean();

  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee });
};

// PATCH /api/employees/:id
const updateEmployee = async (req, res) => {
  const forbidden = ['employeeCode', 'userId', '_id', '__v'];
  const updates = { ...req.body };
  forbidden.forEach((f) => delete updates[f]);

  // Sanitize ObjectId fields
  if ('department' in updates) {
    const id = toObjectId(updates.department);
    if (id) updates.department = id; else delete updates.department;
  }
  if ('managerId' in updates) {
    const id = toObjectId(updates.managerId);
    if (id) updates.managerId = id; else delete updates.managerId;
  }

  // Coerce salary numbers
  if (updates.salary) {
    ['base', 'hra', 'allowances', 'deductions'].forEach((k) => {
      if (updates.salary[k] !== undefined) updates.salary[k] = Number(updates.salary[k]) || 0;
    });
  }

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('department', 'name')
    .populate('managerId', 'name employeeCode hireflowEmail');

  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee });
};

// DELETE /api/employees/:id  — soft delete
const deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, { status: 'terminated' }, { new: true });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, message: 'Employee terminated successfully' });
};

// GET /api/employees/:id/documents
const getDocuments = async (req, res) => {
  const employee = await Employee.findById(req.params.id).select('documents').lean();
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee.documents || [] });
};

// POST /api/employees/:id/documents
const uploadEmployeeDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Document name is required' });

  const cloudResult = await uploadDocument(req.file.buffer, req.file.originalname);

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { $push: { documents: { name, url: cloudResult.secure_url, uploadedAt: new Date() } } },
    { new: true }
  ).select('documents');

  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee.documents });
};

// PATCH /api/employees/:id/avatar
const uploadEmployeeAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  const cloudResult = await uploadAvatar(req.file.buffer, employee.employeeCode);
  employee.avatar = cloudResult.secure_url;
  await employee.save();
  res.json({ success: true, data: { avatar: employee.avatar } });
};

module.exports = {
  getEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee,
  getDocuments, uploadEmployeeDocument, uploadEmployeeAvatar, getMyProfile,
};
