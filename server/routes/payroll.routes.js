const express = require('express');
const router = express.Router();
const {
  getPayrolls, runPayroll, getPayroll, getMyPayslips, getEmployeePayslips,
} = require('../controllers/payroll.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', isAdmin, getPayrolls);
router.post('/run', isAdmin, runPayroll);
router.get('/payslips/my', getMyPayslips);
router.get('/payslips/:employeeId', isAdmin, getEmployeePayslips);
router.get('/:id', isAdmin, getPayroll);

module.exports = router;
