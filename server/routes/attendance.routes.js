const express = require('express');
const router = express.Router();
const {
  clockIn, clockOut, getMyAttendance, getEmployeeAttendance,
  getTeamAttendance, getCompanyAttendance, markAttendance,
} = require('../controllers/attendance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrManager, isAdminManagerOrRecruiter } = require('../middleware/role.middleware');

router.use(authMiddleware);

// Every logged-in user with an employee profile
router.post('/clock-in',  clockIn);
router.post('/clock-out', clockOut);
router.get('/my',         getMyAttendance);

// Managers + Admin: team view
router.get('/team',    isAdminOrManager,          getTeamAttendance);
// Admin only: company-wide
router.get('/company', isAdmin,                   getCompanyAttendance);
router.post('/mark',   isAdmin,                   markAttendance);

// Admin + Manager + Recruiter (recruiter needs it for onboarding checks)
// Employee /:id guarded — controller checks ownership for employees
router.get('/employee/:id', isAdminManagerOrRecruiter, getEmployeeAttendance);

module.exports = router;
