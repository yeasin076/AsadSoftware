const express = require('express');
const router = express.Router();
const {
  sellPhone,
  getSales,
  getSaleById
} = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.post('/', sellPhone);
router.get('/', getSales);
router.get('/:id', getSaleById);

module.exports = router;
