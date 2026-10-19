const { Router } = require('express');
const express = require('express');
const paymentController = require('./payment.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createPaymentIntentSchema } = require('./payment.schema');

const router = Router();

// Webhook Route: Raw Buffer required for Stripe signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// Protected routes (Authenticated User)
router.post(
  '/create-intent',
  authMiddleware,
  validate(createPaymentIntentSchema),
  paymentController.createIntent
);

module.exports = router;
