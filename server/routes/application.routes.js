const express = require('express');
const router = express.Router();
const {
  getApplications, createApplication, updateApplicationStatus,
  getPipeline, trackApplications,
} = require('../controllers/application.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter } = require('../middleware/role.middleware');

// ── All routes require auth ──────────────────────────────────────────────────
router.use(authMiddleware);

// Candidate: see their own applications (scoped by userId in controller)
router.get('/my', trackApplications);

// Staff: full list + pipeline
router.get('/',                isAdminOrRecruiter, getApplications);
router.post('/',               createApplication);
router.get('/pipeline/:jobId', isAdminOrRecruiter, getPipeline);
router.patch('/:id/status',    isAdminOrRecruiter, updateApplicationStatus);

module.exports = router;
