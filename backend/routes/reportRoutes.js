const express = require('express');
const router = express.Router();
const {
  getDailyReport,
  getMonthlyReport,
  getBrandReport
} = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/brand', getBrandReport);

module.exports = router;
