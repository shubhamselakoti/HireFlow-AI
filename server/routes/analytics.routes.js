const express = require('express');
const router = express.Router();
const {
  getOverview, getRecruitmentAnalytics, getAttendanceAnalytics,
  getPayrollSummary, getPerformanceDistribution, predict,
} = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrRecruiter } = require('../middleware/role.middleware');

router.use(authMiddleware);

// Admin-only: company-wide financial + HR data
router.get('/overview',         isAdmin,           getOverview);
router.get('/attendance',       isAdmin,           getAttendanceAnalytics);
router.get('/payroll-summary',  isAdmin,           getPayrollSummary);
router.get('/performance-dist', isAdmin,           getPerformanceDistribution);

// Admin + Recruiter: recruitment funnel is core recruiter work
router.get('/recruitment',      isAdminOrRecruiter, getRecruitmentAnalytics);

// All authenticated users: prediction (used for candidate scoring)
router.post('/predict', predict);

module.exports = router;
