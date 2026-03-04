const express = require('express');
const router = express.Router();
const { getExchanges, processExchange, deleteExchange } = require('../controllers/exchangeController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getExchanges);
router.post('/', processExchange);
router.delete('/:id', deleteExchange);

module.exports = router;
