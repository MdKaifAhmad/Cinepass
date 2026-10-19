const { Router } = require('express');
const bookingController = require('./booking.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  lockSeatsSchema,
  confirmBookingSchema,
  getShowSeatsSchema,
} = require('./booking.schema');

const router = Router();

// Public / Authenticated: View live seats status for a show
router.get('/shows/:showId/seats', validate(getShowSeatsSchema), bookingController.getShowSeats);

// Protected routes (Login required)
router.use(authMiddleware);

router.post('/lock-seats', validate(lockSeatsSchema), bookingController.lockSeats);
router.post('/confirm', validate(confirmBookingSchema), bookingController.confirmBooking);
router.get('/my-bookings', bookingController.getUserBookings);

module.exports = router;
