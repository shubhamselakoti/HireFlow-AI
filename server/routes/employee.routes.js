const express = require('express');
const router = express.Router();
const {
  getEmployees, createEmployee, getEmployee, updateEmployee,
  deleteEmployee, getDocuments, uploadEmployeeDocument,
  uploadEmployeeAvatar, getMyProfile,
} = require('../controllers/employee.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  isAdmin, isAdminOrRecruiter, isAdminManagerOrRecruiter,
} = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

router.use(authMiddleware);

// Every authenticated user can fetch their own profile
router.get('/my/profile', getMyProfile);

// List employees: admin + manager (own team) + recruiter (read-only)
router.get('/',   isAdminManagerOrRecruiter, getEmployees);

// Create employee: admin + recruiter (after hiring)
router.post('/',  isAdminOrRecruiter, createEmployee);

// Single employee: admin + manager + recruiter (read) — controller enforces team scope for managers
router.get('/:id', isAdminManagerOrRecruiter, getEmployee);

// Update / delete: admin only
router.patch('/:id',  isAdmin, updateEmployee);
router.delete('/:id', isAdmin, deleteEmployee);

// Documents: admin + recruiter (for onboarding docs)
router.get('/:id/documents',                                           isAdminOrRecruiter, getDocuments);
router.post('/:id/documents', uploadSingle('document'),                isAdminOrRecruiter, uploadEmployeeDocument);

// Avatar: admin only
router.patch('/:id/avatar',   uploadSingle('avatar'), isAdmin, uploadEmployeeAvatar);

module.exports = router;
