const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: `"HireFlow HRMS" <${process.env.BREVO_FROM_EMAIL || 'noreply@hireflow.ai'}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw error;
  }
};

// ─── Base Template ────────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #F5F0FF; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px; box-shadow: 0 8px 32px rgba(100,80,200,0.10); }
    .logo { font-size: 24px; font-weight: 800; color: #6D4AFF; margin-bottom: 24px; }
    .content { color: #2D2250; line-height: 1.6; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 50px; font-weight: 700; font-size: 14px; }
    .approved { background: #D6F5E8; color: #1a7a4a; }
    .rejected { background: #FFD6E0; color: #a0143a; }
    .info    { background: #D6EEFF; color: #0a4a7a; }
    .footer  { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E0FF; color: #7B6FA0; font-size: 13px; }
    h2 { color: #2D2250; margin-top: 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0EEFF; }
    .detail-label { color: #7B6FA0; font-weight: 600; }
    .detail-value { color: #2D2250; font-weight: 700; }
    .cta-btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: linear-gradient(135deg, #6D4AFF, #9F7AEA); color: white; border-radius: 50px; text-decoration: none; font-weight: 700; }
    .credential-box { background: #F5F0FF; border: 2px solid #E8E0FF; border-radius: 16px; padding: 20px; margin: 20px 0; }
    .credential-key { font-size: 12px; color: #7B6FA0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .credential-val { font-size: 18px; font-weight: 800; color: #6D4AFF; font-family: monospace; background: white; padding: 8px 14px; border-radius: 10px; border: 1.5px solid #E8E0FF; display: inline-block; margin-top: 4px; letter-spacing: 0.04em; }
    .warning-box { background: #FFF3D6; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 14px 18px; margin: 16px 0; font-size: 13px; color: #7a5a0a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🚀 HireFlow</div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>This is an automated message from HireFlow HRMS. Please do not reply to this email.</p>
      <p>© 2025 HireFlow HRMS. Built with ❤️ for modern HR teams.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Credentials Email (sent on hire) ─────────────────────────────────────────
/**
 * Send login credentials to a newly hired employee.
 * Called once when Application status → "hired".
 */
const sendCredentialsEmail = async (employee, plainPassword, loginEmail) => {
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;

  const html = baseTemplate(`
    <h2>🎉 You've been hired! Welcome to the team, ${employee.name}!</h2>

    <p>Congratulations! Your employment has been confirmed and your HireFlow employee portal is ready.
    Use the credentials below to sign in.</p>

    <div class="credential-box">
      <div style="margin-bottom:16px;">
        <div class="credential-key">Your Login Email (Employee ID)</div>
        <div class="credential-val">${loginEmail}</div>
        <p style="font-size:11px;color:#7B6FA0;margin:6px 0 0;">
          You can also log in with your personal email: ${employee.email}
        </p>
      </div>
      <div style="margin-bottom:16px;">
        <div class="credential-key">Employee Code</div>
        <div class="credential-val">${employee.employeeCode}</div>
      </div>
      <div>
        <div class="credential-key">Temporary Password</div>
        <div class="credential-val">${plainPassword}</div>
      </div>
    </div>

    <div class="warning-box">
      ⚠️ <strong>Important:</strong> This is a temporary password.
      Change it immediately after first login via <strong>My Profile → Change Password</strong>.
    </div>

    <div class="detail-row"><span class="detail-label">Employee Code</span><span class="detail-value">${employee.employeeCode}</span></div>
    <div class="detail-row"><span class="detail-label">Designation</span><span class="detail-value">${employee.designation || 'Employee'}</span></div>
    <div class="detail-row"><span class="detail-label">Join Date</span><span class="detail-value">${new Date(employee.joiningDate).toDateString()}</span></div>

    <a href="${loginUrl}" class="cta-btn">Sign In to Employee Portal →</a>

    <p style="margin-top:16px;font-size:12px;color:#7B6FA0;">
      Portal: <a href="${loginUrl}" style="color:#6D4AFF;">${loginUrl}</a>
    </p>
  `);

  return sendEmail({
    to: employee.email,
    subject: `🎉 Welcome aboard, ${employee.name}! Your HireFlow employee credentials`,
    html,
    text: `Welcome ${employee.name}!\n\nLogin Email: ${loginEmail}\nAlso works: ${employee.email}\nTemp Password: ${plainPassword}\nEmployee Code: ${employee.employeeCode}\n\nLog in at ${loginUrl} and change your password immediately.`,
  });
};

// ─── Welcome Email (generic, no credentials) ──────────────────────────────────
const sendWelcomeEmail = async (employee) => {
  const html = baseTemplate(`
    <h2>Welcome to the team, ${employee.name}! 🎉</h2>
    <p>Your employee profile has been set up in HireFlow HRMS. You will receive your login credentials in a separate email shortly.</p>
    <div class="detail-row"><span class="detail-label">Employee Code</span><span class="detail-value">${employee.employeeCode}</span></div>
    <div class="detail-row"><span class="detail-label">Designation</span><span class="detail-value">${employee.designation || 'N/A'}</span></div>
    <div class="detail-row"><span class="detail-label">Join Date</span><span class="detail-value">${new Date(employee.joiningDate).toDateString()}</span></div>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="cta-btn">Access Your Portal →</a>
  `);

  return sendEmail({
    to: employee.email,
    subject: `Welcome to HireFlow, ${employee.name}! 🎉`,
    html,
    text: `Welcome ${employee.name}! Employee code: ${employee.employeeCode}. Login at ${process.env.CLIENT_URL}`,
  });
};

// ─── Leave Status Email ───────────────────────────────────────────────────────
const sendLeaveStatusEmail = async (employee, leave, status, approverName) => {
  const isApproved = status === 'approved';
  const badgeClass = isApproved ? 'approved' : 'rejected';
  const emoji = isApproved ? '✅' : '❌';

  const html = baseTemplate(`
    <h2>${emoji} Leave Request ${isApproved ? 'Approved' : 'Rejected'}</h2>
    <p>Dear ${employee.name}, your leave request has been <span class="badge ${badgeClass}">${status.toUpperCase()}</span></p>
    <div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${new Date(leave.startDate).toDateString()}</span></div>
    <div class="detail-row"><span class="detail-label">To</span><span class="detail-value">${new Date(leave.endDate).toDateString()}</span></div>
    <div class="detail-row"><span class="detail-label">Total Days</span><span class="detail-value">${leave.totalDays}</span></div>
    <div class="detail-row"><span class="detail-label">Reviewed By</span><span class="detail-value">${approverName}</span></div>
    ${!isApproved ? `<p>If you have questions, please contact HR directly.</p>` : '<p>Have a great time off! 🌴</p>'}
  `);

  return sendEmail({
    to: employee.email,
    subject: `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'}`,
    html,
    text: `Your leave request (${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()}) has been ${status}.`,
  });
};

// ─── Interview Scheduled Email ────────────────────────────────────────────────
const sendInterviewScheduledEmail = async (candidate, interview, job) => {
  const interviewUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/interview/${interview._id}`;

  const typeLabel = { video: 'Video Interview', voice: 'Voice Interview', panel: 'Panel Interview' }[interview.type] || 'Interview';

  const html = baseTemplate(`
    <h2>Interview Scheduled 🎙️</h2>
    <p>Dear ${candidate.name}, your <strong>${typeLabel}</strong> for <strong>${job.title}</strong> has been scheduled.</p>

    <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${job.title}</span></div>
    <div class="detail-row"><span class="detail-label">Interview Type</span><span class="detail-value">${typeLabel}</span></div>
    <div class="detail-row"><span class="detail-label">Scheduled At</span><span class="detail-value">${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : 'To be confirmed'}</span></div>

    <div class="warning-box" style="background:#F0EEFF;border:1.5px solid #9F7AEA;border-radius:12px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#4a3580;font-weight:600;">
        📋 <strong>Your interview is conducted online.</strong> Click the button below when you are ready to start.
        The interview consists of questions — your answers will be evaluated by AI in real time.
      </p>
    </div>

    <a href="${interviewUrl}" class="cta-btn">Start Your Interview →</a>

    <p style="margin-top:16px;font-size:12px;color:#7B6FA0;">
      Interview link: <a href="${interviewUrl}" style="color:#6D4AFF;">${interviewUrl}</a><br>
      Save this link — you'll need it to take your interview.
    </p>
  `);

  return sendEmail({
    to: candidate.email,
    subject: `Interview Scheduled — ${job.title} 🎙️`,
    html,
    text: `Your ${typeLabel} for ${job.title} is scheduled${interview.scheduledAt ? ' on ' + new Date(interview.scheduledAt).toLocaleString() : ''}.\n\nTake your interview at: ${interviewUrl}`,
  });
};

// ─── Payslip Email ────────────────────────────────────────────────────────────
const sendPayslipEmail = async (employee, payslip) => {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthName = monthNames[payslip.month - 1];

  const html = baseTemplate(`
    <h2>💰 Payslip for ${monthName} ${payslip.year}</h2>
    <p>Dear ${employee.name}, your payslip for ${monthName} ${payslip.year} is ready.</p>
    <div class="detail-row"><span class="detail-label">Gross Salary</span><span class="detail-value">₹${payslip.grossSalary.toLocaleString()}</span></div>
    <div class="detail-row"><span class="detail-label">Total Deductions</span><span class="detail-value">₹${(payslip.pf + payslip.tax + payslip.otherDeductions).toLocaleString()}</span></div>
    <div class="detail-row"><span class="detail-label">Net Salary</span><span class="detail-value" style="color:#1a7a4a;font-size:18px;">₹${payslip.netSalary.toLocaleString()}</span></div>
    <div class="detail-row"><span class="detail-label">Days Worked</span><span class="detail-value">${payslip.presentDays} / ${payslip.workingDays}</span></div>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/employee/payslips" class="cta-btn">Download Payslip →</a>
  `);

  return sendEmail({
    to: employee.email,
    subject: `Payslip Ready — ${monthName} ${payslip.year} 💰`,
    html,
    text: `Your payslip for ${monthName} ${payslip.year} is ready. Net: ₹${payslip.netSalary.toLocaleString()}`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendCredentialsEmail,
  sendLeaveStatusEmail,
  sendInterviewScheduledEmail,
  sendPayslipEmail,
};
