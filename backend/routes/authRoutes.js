const express = require('express');
const router = express.Router();
const { login, getMe, register } = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/register', authMiddleware, adminOnly, register);

module.exports = router;
