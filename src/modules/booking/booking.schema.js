const { z } = require('zod');

const lockSeatsSchema = z.object({
  body: z.object({
    showId: z.string().uuid('Invalid show ID'),
    seatIds: z.array(z.string().uuid('Invalid seat ID')).min(1, 'Select at least one seat').max(10, 'Maximum 10 seats per booking'),
  }),
});

const confirmBookingSchema = z.object({
  body: z.object({
    showId: z.string().uuid('Invalid show ID'),
    seatIds: z.array(z.string().uuid('Invalid seat ID')).min(1),
    paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
    expectedVersion: z.number().int().nonnegative().optional(),
  }),
});

const getShowSeatsSchema = z.object({
  params: z.object({
    showId: z.string().uuid('Invalid show ID'),
  }),
});

module.exports = {
  lockSeatsSchema,
  confirmBookingSchema,
  getShowSeatsSchema,
};
