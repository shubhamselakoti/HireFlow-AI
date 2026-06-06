require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { initBrainJS } = require('./services/brainjs.service');
const { seedLeavePolicies } = require('./utils/seed');
const errorMiddleware = require('./middleware/error.middleware');
const sanitizeBody = require('./middleware/sanitize.middleware');

const authRoutes       = require('./routes/auth.routes');
const userRoutes       = require('./routes/user.routes');
const employeeRoutes   = require('./routes/employee.routes');
const departmentRoutes = require('./routes/department.routes');
const jobRoutes        = require('./routes/job.routes');
const candidateRoutes  = require('./routes/candidate.routes');
const applicationRoutes= require('./routes/application.routes');
const interviewRoutes  = require('./routes/interview.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes      = require('./routes/leave.routes');
const payrollRoutes    = require('./routes/payroll.routes');
const performanceRoutes= require('./routes/performance.routes');
const analyticsRoutes  = require('./routes/analytics.routes');
const aiRoutes         = require('./routes/ai.routes');
const onboardingRoutes = require('./routes/onboarding.routes');

const app = express();

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Strip empty strings / coerce types before hitting any controller
app.use(sanitizeBody);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'HireFlow API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/employees',   employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/jobs',        jobRoutes);
app.use('/api/candidates',  candidateRoutes);
app.use('/api/applications',applicationRoutes);
app.use('/api/interviews',  interviewRoutes);
app.use('/api/attendance',  attendanceRoutes);
app.use('/api/leave',       leaveRoutes);
app.use('/api/payroll',     payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/onboarding',  onboardingRoutes);

app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 HireFlow API running on port ${PORT}`);
  try {
    await initBrainJS();
    await seedLeavePolicies();
  } catch (err) {
    console.warn('⚠️  Startup init failed (non-fatal):', err.message);
  }
});

module.exports = app;
