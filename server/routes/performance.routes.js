const express = require('express');
const router = express.Router();
const {
  getMyPerformance, getTeamPerformance, getAllPerformance,
  createPerformance, updatePerformance,
  getMyGoals, createGoal, updateGoal,
} = require('../controllers/performance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrManager } = require('../middleware/role.middleware');

router.use(authMiddleware);

// Goals — MUST be before /:id to avoid Express param collision
router.get('/goals/my',    getMyGoals);   // every authenticated user (own goals only)
router.post('/goals',      createGoal);   // employee creates their own; admin/manager can create for others
router.patch('/goals/:id', updateGoal);   // controller verifies ownership

// Performance reviews
router.get('/my',   getMyPerformance);              // every authenticated user (own reviews)
router.get('/team', isAdminOrManager, getTeamPerformance);  // manager: own team only
router.get('/all',  isAdmin,          getAllPerformance);    // admin: everyone

router.post('/',    isAdminOrManager, createPerformance);   // manager submits review for their team
router.patch('/:id',isAdminOrManager, updatePerformance);

module.exports = router;
