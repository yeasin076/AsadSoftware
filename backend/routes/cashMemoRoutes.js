const express = require('express');
const router = express.Router();
const {
  getMemos,
  getMemoById,
  createMemo,
  deleteMemo
} = require('../controllers/cashMemoController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',     getMemos);
router.get('/:id',  getMemoById);
router.post('/',    createMemo);
router.delete('/:id', deleteMemo);

module.exports = router;
