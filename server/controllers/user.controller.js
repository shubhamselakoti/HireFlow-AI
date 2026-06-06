const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateLoginEmail } = require('../utils/employee.utils');
const { sendEmail } = require('../services/email.service');

const getUsers = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const r = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: r }, { email: r }];
  }
  if (req.query.role) filter.role = req.query.role;

  const [data, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
};

/**
 * PATCH /api/users/:id/role
 *
 * When admin assigns a staff role (senior_manager, hr_recruiter, employee)
 * the system automatically:
 *   1. Generates firstname.lastname@hireflow.com login email
 *   2. Generates a temp password
 *   3. Stores both on the User document
 *   4. Sends credentials email
 *
 * Candidates who self-registered with gmail etc. get a proper
 * @hireflow.com identity when they're promoted to a staff role.
 */
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const staffRoles = ['management_admin', 'senior_manager', 'hr_recruiter', 'employee'];
  const allValid   = [...staffRoles, 'candidate'];

  if (!allValid.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${allValid.join(', ')}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const wasStaff  = staffRoles.includes(user.role);
  user.role       = role;

  const isNowStaff = staffRoles.includes(role);

  // Generate @hireflow.com login email when becoming staff for the first time
  if (isNowStaff && !user.employeeLoginEmail) {
    user.employeeLoginEmail = await generateLoginEmail(user.name);
  }

  // Always generate a fresh temp password when promoting to any staff role
  // (whether they had one or not — gives them a clean @hireflow.com credential)
  let plainPassword = null;
  if (isNowStaff && !wasStaff) {
    const base = user.name.split(' ')[0];
    const num  = Math.floor(1000 + Math.random() * 9000);
    const syms = ['@', '#', '!', '$'];
    plainPassword = `${base.charAt(0).toUpperCase()}${base.slice(1).toLowerCase()}${num}${syms[Math.floor(Math.random() * 4)]}`;
    user.password = await bcrypt.hash(plainPassword, 12);
  }

  await user.save();

  // Send credentials email with @hireflow.com ID + temp password
  if (isNowStaff && !wasStaff && user.employeeLoginEmail) {
    try {
      const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const loginUrl  = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
      const domain    = process.env.HIREFLOW_DOMAIN || 'hireflow.com';

      await sendEmail({
        to: user.email,
        subject: `Your HireFlow ${roleLabel} credentials are ready 🚀`,
        html: `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:40px;background:#fff;border-radius:24px;box-shadow:0 8px 32px rgba(100,80,200,0.10);">
  <div style="font-size:24px;font-weight:800;color:#6D4AFF;margin-bottom:24px;">🚀 HireFlow</div>
  <h2 style="color:#2D2250;margin-top:0;">Welcome to the team, ${user.name}!</h2>
  <p style="color:#2D2250;">You've been assigned the role of <strong>${roleLabel}</strong> on HireFlow HRMS. Here are your login credentials:</p>

  <div style="background:#F5F0FF;border:2px solid #E8E0FF;border-radius:16px;padding:20px;margin:20px 0;">
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;color:#7B6FA0;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">HireFlow Login Email</div>
      <div style="font-size:18px;font-weight:800;color:#6D4AFF;font-family:monospace;background:white;padding:8px 14px;border-radius:10px;border:1.5px solid #E8E0FF;display:inline-block;">${user.employeeLoginEmail}</div>
      <p style="font-size:11px;color:#7B6FA0;margin:6px 0 0;">You can also log in with: ${user.email}</p>
    </div>
    <div>
      <div style="font-size:11px;color:#7B6FA0;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Temporary Password</div>
      <div style="font-size:18px;font-weight:800;color:#6D4AFF;font-family:monospace;background:white;padding:8px 14px;border-radius:10px;border:1.5px solid #E8E0FF;display:inline-block;">${plainPassword}</div>
    </div>
  </div>

  <div style="background:#FFF3D6;border:1.5px solid #F59E0B;border-radius:12px;padding:14px 18px;margin:16px 0;font-size:13px;color:#7a5a0a;">
    ⚠️ <strong>Change your password immediately</strong> after first login via <strong>My Profile → Change Password</strong>.
  </div>

  <a href="${loginUrl}" style="display:inline-block;margin-top:8px;padding:12px 28px;background:linear-gradient(135deg,#6D4AFF,#9F7AEA);color:white;border-radius:50px;text-decoration:none;font-weight:700;">Sign In →</a>
  <p style="margin-top:16px;font-size:12px;color:#7B6FA0;">Portal: <a href="${loginUrl}" style="color:#6D4AFF;">${loginUrl}</a></p>

  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E8E0FF;color:#7B6FA0;font-size:13px;">
    <p>© 2025 HireFlow HRMS</p>
  </div>
</div>`,
        text: `Welcome ${user.name}!\n\nRole: ${roleLabel}\nLogin Email: ${user.employeeLoginEmail}\nAlso works: ${user.email}\nTemp Password: ${plainPassword}\n\nChange your password at: ${loginUrl}`,
      });
    } catch (err) {
      console.warn('Role email failed:', err.message);
    }
  }

  const updated = await User.findById(user._id).select('-password');
  res.json({ success: true, data: updated });
};

// POST /api/users/:id/reset-password  (admin resets a specific user's password)
const adminResetPassword = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const base = user.name.split(' ')[0];
  const num  = Math.floor(1000 + Math.random() * 9000);
  const syms = ['@', '#', '!', '$'];
  const plainPassword = `${base.charAt(0).toUpperCase()}${base.slice(1).toLowerCase()}${num}${syms[Math.floor(Math.random() * 4)]}`;

  user.password = await bcrypt.hash(plainPassword, 12);
  await user.save();

  res.json({
    success: true,
    message: `Password reset. New temp password: ${plainPassword}`,
    data: { tempPassword: plainPassword, email: user.email, loginEmail: user.employeeLoginEmail },
  });
};

module.exports = { getUsers, updateUserRole, adminResetPassword };
