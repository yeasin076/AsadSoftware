const express = require('express');
const router = express.Router();
const {
  getPhones,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone,
  getBrands
} = require('../controllers/phoneController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/', getPhones);
router.get('/brands/list', getBrands);
router.get('/:id', getPhoneById);
router.post('/', addPhone);
router.put('/:id', updatePhone);
router.delete('/:id', deletePhone);

module.exports = router;
