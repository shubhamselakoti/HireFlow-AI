const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const setCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Determine what role a new user should get.
 * Logic:
 *  - First ever user in the DB → management_admin (bootstrap)
 *  - Anyone else → employee (HR assigns roles from /dashboard/settings)
 */
const getDefaultRole = async () => {
  // First user on a fresh install becomes admin so they can set up the system
  const count = await User.countDocuments();
  return count === 0 ? 'management_admin' : 'candidate';
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter and one number',
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'This email is already registered' });
  }

  const role = await getDefaultRole();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
  });

  const token = generateToken(user._id);
  res.cookie('hireflow_token', token, setCookieOptions);

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: null,
      token,
    },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const domain = process.env.HIREFLOW_DOMAIN || 'hireflow.com';
  const loginInput = email.toLowerCase().trim();
  let user = null;

  // Support login with firstname.lastname@hireflow.com (employeeLoginEmail)
  if (loginInput.endsWith(`@${domain}`)) {
    user = await User.findOne({ employeeLoginEmail: loginInput });
  }

  // Fall back to personal email
  if (!user) user = await User.findOne({ email: loginInput });

  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Auto-link employee record if not yet linked
  if (!user.employeeId) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp && !emp.userId) {
      emp.userId = user._id;
      await emp.save();
      user.employeeId = emp._id;
      await user.save();
    }
  }

  // Auto-link any candidate records for this email
  const Candidate = require('../models/Candidate');
  await Candidate.updateMany({ email: user.email, userId: null }, { $set: { userId: user._id } });

  const token = generateToken(user._id);
  res.cookie('hireflow_token', token, setCookieOptions);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      employeeId: user.employeeId || null,
      token,
    },
  });
};

// POST /api/auth/verify — NextAuth OAuth callback
const verify = async (req, res) => {
  const { email, name, image } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const role = await getDefaultRole();
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      image: image || null,
      password: null,
      role,
    });
  } else {
    if (image && user.image !== image) {
      user.image = image;
      await user.save();
    }
  }

  // Auto-link employee record
  if (!user.employeeId) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp && !emp.userId) {
      emp.userId = user._id;
      await emp.save();
      user.employeeId = emp._id;
      await user.save();
    }
  }

  const token = generateToken(user._id);
  res.cookie('hireflow_token', token, setCookieOptions);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      employeeId: user.employeeId || null,
      token,
    },
  });
};

// POST /api/auth/logout
const logout = async (_req, res) => {
  res.clearCookie('hireflow_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, verify, logout };

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'New password must contain an uppercase letter and a number' });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (!user.password) {
    return res.status(400).json({ success: false, message: 'This account uses Google sign-in. Set a password via Google account settings.' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

module.exports = { register, login, verify, logout, changePassword };
