const express = require('express');
const router = express.Router();
const { getPayments, updatePaymentStatus } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getPayments);
router.patch('/:id', updatePaymentStatus);

module.exports = router;
