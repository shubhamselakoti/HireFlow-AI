const express = require('express');
const router = express.Router();
const { register, login, verify, logout, changePassword } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register',        register);
router.post('/login',           login);
router.post('/verify',          verify);
router.post('/logout',          authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
