const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, updateDepartment } = require('../controllers/department.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(authMiddleware);
router.get('/', getDepartments);
router.post('/', isAdmin, createDepartment);
router.patch('/:id', isAdmin, updateDepartment);

module.exports = router;
