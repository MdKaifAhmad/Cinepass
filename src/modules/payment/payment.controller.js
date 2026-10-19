const paymentService = require('./payment.service');
const ApiResponse = require('../../utils/apiResponse');
const stripe = require('../../config/stripe');

class PaymentController {
  async createIntent(req, res, next) {
    try {
      const { showId, seatIds } = req.body;
      const result = await paymentService.createPaymentIntent(req.user.id, showId, seatIds);
      return ApiResponse.success(res, result, 'Payment intent created successfully');
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req, res, next) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Must receive raw body buffer for signature verification
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const result = await paymentService.handleWebhookEvent(event);
    return res.json({ received: true, result });
  }
}

module.exports = new PaymentController();
