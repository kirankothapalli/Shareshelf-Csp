const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  createTransaction, acceptTransaction, declineTransaction,
  completeTransaction, markNoShow, getMyTransactions,
} = require('../controllers/transactionController');

router.post('/', requireAuth, createTransaction);
router.get('/mine', requireAuth, getMyTransactions);
router.patch('/:id/accept', requireAuth, acceptTransaction);
router.patch('/:id/decline', requireAuth, declineTransaction);
router.patch('/:id/complete', requireAuth, completeTransaction);
router.patch('/:id/no-show', requireAuth, markNoShow);

module.exports = router;
