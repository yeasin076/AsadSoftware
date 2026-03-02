const express = require('express');
const router = express.Router();
const {
  getInvestments,
  addInvestment,
  updateInvestmentStatus,
  deleteInvestment,
  getReturns,
  addReturn,
  deleteReturn
} = require('../controllers/investmentController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getInvestments);
router.post('/', addInvestment);
router.patch('/:id/status', updateInvestmentStatus);
router.delete('/:id', deleteInvestment);

router.get('/:id/returns', getReturns);
router.post('/:id/returns', addReturn);
router.delete('/returns/:returnId', deleteReturn);

module.exports = router;
