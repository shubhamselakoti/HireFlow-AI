const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, adminResetPassword } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(authMiddleware);
router.get('/',                       isAdmin, getUsers);
router.patch('/:id/role',             isAdmin, updateUserRole);
router.post('/:id/reset-password',    isAdmin, adminResetPassword);

module.exports = router;
