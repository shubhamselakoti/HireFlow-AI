const express = require('express');
const router = express.Router();
const {
  getInterviews, getInterview, createInterview,
  submitInterview, updateInterview,
} = require('../controllers/interview.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter, isAdminManagerOrRecruiter } = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// ── PUBLIC: candidate takes their interview via emailed link ─────────────────
// No auth — interview ID is the access token (sufficiently unguessable ObjectId)
router.get('/take/:id',    getInterview);               // fetch interview details
router.post('/take/:id/submit', submitInterview);       // submit answers + scores

// ── Authenticated: staff ─────────────────────────────────────────────────────
router.use(authMiddleware);
router.get('/',    isAdminManagerOrRecruiter, getInterviews);
router.post('/',   isAdminOrRecruiter,        createInterview);
router.get('/:id', isAdminManagerOrRecruiter, getInterview);
router.patch('/:id', isAdminOrRecruiter,      updateInterview);

module.exports = router;
