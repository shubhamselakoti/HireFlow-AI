const express = require('express');
const router = express.Router();
const { getPolicies, createPolicy, deletePolicy, getMyLeaves, applyLeave, getTeamLeaves, getAllLeaves, approveLeave, rejectLeave } = require('../controllers/leave.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrManager } = require('../middleware/role.middleware');

router.use(authMiddleware);

router.get('/policies',       getPolicies);
router.post('/policies',      isAdmin, createPolicy);
router.delete('/policies/:id',isAdmin, deletePolicy);
router.get('/my', getMyLeaves);
router.post('/apply', applyLeave);
router.get('/team', isAdminOrManager, getTeamLeaves);
router.get('/all', isAdmin, getAllLeaves);
router.patch('/:id/approve', isAdminOrManager, approveLeave);
router.patch('/:id/reject', isAdminOrManager, rejectLeave);

module.exports = router;
