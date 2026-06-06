const express = require('express');
const router = express.Router();
const { getOnboardings, createOnboarding, updateTask } = require('../controllers/onboarding.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter } = require('../middleware/role.middleware');

router.use(authMiddleware);

// View: everyone (controller scopes employees to their own)
router.get('/', getOnboardings);

// Create: admin + recruiter only
router.post('/', isAdminOrRecruiter, createOnboarding);

// Update task: admin + recruiter + the employee themselves (controller enforces)
router.patch('/:id/task', isAdminOrRecruiter, updateTask);

module.exports = router;
