const { z } = require('zod');

const createPaymentIntentSchema = z.object({
  body: z.object({
    showId: z.string().uuid('Invalid show ID'),
    seatIds: z.array(z.string().uuid('Invalid seat ID')).min(1),
  }),
});

module.exports = {
  createPaymentIntentSchema,
};
