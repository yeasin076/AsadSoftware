const express = require('express');
const router = express.Router();
const { login, getMe, register, getUsers, deleteUser } = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me',             authMiddleware,            getMe);
router.post('/register',      authMiddleware, adminOnly, register);
router.get('/users',          authMiddleware, adminOnly, getUsers);
router.delete('/users/:id',   authMiddleware, adminOnly, deleteUser);

module.exports = router;
