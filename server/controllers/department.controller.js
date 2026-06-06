const Department = require('../models/Department');

const getDepartments = async (req, res) => {
  const departments = await Department.find()
    .populate('headId', 'name designation avatar')
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: departments });
};

const createDepartment = async (req, res) => {
  const { name, description, headId } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });
  const dept = await Department.create({ name, description, headId: headId || null });
  res.status(201).json({ success: true, data: dept });
};

const updateDepartment = async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, data: dept });
};

module.exports = { getDepartments, createDepartment, updateDepartment };
