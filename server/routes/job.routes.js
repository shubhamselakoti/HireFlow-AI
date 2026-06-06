const express = require('express');
const router = express.Router();
const { getJobs, getAllJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/job.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter } = require('../middleware/role.middleware');

// ── Static named routes MUST come before /:id ────────────────────────────────

// Public: list open jobs (no auth)
router.get('/', getJobs);

// Authenticated: full job list for staff (no status filter)
router.get('/all', authMiddleware, getAllJobs);

// Staff: create
router.post('/', authMiddleware, isAdminOrRecruiter, createJob);

// ── Dynamic param routes LAST ─────────────────────────────────────────────────

// Public: single job detail (candidate portal preview)
router.get('/:id', getJob);

// Staff: update / delete
router.patch('/:id',  authMiddleware, isAdminOrRecruiter, updateJob);
router.delete('/:id', authMiddleware, isAdminOrRecruiter, deleteJob);

module.exports = router;
