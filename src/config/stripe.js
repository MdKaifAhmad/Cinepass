const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY environment variable is required in production');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy_key_for_dev', {
  apiVersion: '2024-12-18.acacia',
  typescript: false,
});

module.exports = stripe;
