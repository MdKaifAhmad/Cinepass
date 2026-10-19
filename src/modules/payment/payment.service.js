const stripe = require('../../config/stripe');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { PAYMENT_STATUS } = require('../../utils/constants');

class PaymentService {
  /**
   * 1. Create Stripe Payment Intent
   * Price calculation is always strictly performed on the backend to avoid client manipulation.
   */
  async createPaymentIntent(userId, showId, seatIds) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { screen: true },
    });

    if (!show) {
      throw ApiError.notFound('Show not found');
    }

    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        screenId: show.screenId,
      },
    });

    if (seats.length !== seatIds.length) {
      throw ApiError.badRequest('Invalid seat selection');
    }

    // Calculate total amount in INR
    const totalAmount = seats.reduce(
      (sum, seat) => sum + seat.basePrice * show.priceMultiplier,
      0
    );

    // Convert to lowest denomination (Paise for INR, Cents for USD)
    const amountInPaise = Math.round(totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      metadata: {
        userId,
        showId,
        seatIds: JSON.stringify(seatIds),
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: 'INR',
    };
  }

  /**
   * 2. Webhook Event Processing with Idempotency
   */
  async handleWebhookEvent(event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Idempotency: verify if already stored
      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentIntent.id },
      });

      if (existingPayment) {
        return { status: 'already_processed' };
      }

      return {
        status: 'processed',
        paymentIntentId: paymentIntent.id,
      };
    }

    return { status: 'ignored' };
  }
}

module.exports = new PaymentService();
