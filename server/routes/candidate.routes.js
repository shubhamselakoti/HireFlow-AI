const express = require('express');
const router = express.Router();
const { getCandidates, bulkUpload, getCandidate, updateCandidate } = require('../controllers/candidate.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter } = require('../middleware/role.middleware');
const { uploadMultiple } = require('../middleware/upload.middleware');

// ─── PUBLIC: candidate portal applications (no login required) ───────────────
// Candidates apply by uploading their resume — no account needed
router.post('/bulk-upload', uploadMultiple('resumes', 20), bulkUpload);

// ─── Authenticated: HR/Admin access ─────────────────────────────────────────
router.use(authMiddleware);
router.get('/',    isAdminOrRecruiter, getCandidates);
router.get('/:id', isAdminOrRecruiter, getCandidate);
router.patch('/:id', isAdminOrRecruiter, updateCandidate);

module.exports = router;
