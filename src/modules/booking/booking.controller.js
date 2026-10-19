const bookingService = require('./booking.service');
const ApiResponse = require('../../utils/apiResponse');

class BookingController {
  async getShowSeats(req, res, next) {
    try {
      const seats = await bookingService.getShowSeats(req.params.showId);
      return ApiResponse.success(res, seats, 'Seats status fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  async lockSeats(req, res, next) {
    try {
      const { showId, seatIds } = req.body;
      const result = await bookingService.lockSeats(req.user.id, showId, seatIds);
      return ApiResponse.success(res, result, 'Seats locked successfully for 5 minutes');
    } catch (err) {
      next(err);
    }
  }

  async confirmBooking(req, res, next) {
    try {
      const { showId, seatIds, paymentIntentId, expectedVersion } = req.body;
      const booking = await bookingService.confirmBooking(
        req.user.id,
        showId,
        seatIds,
        paymentIntentId,
        expectedVersion
      );
      return ApiResponse.created(res, booking, 'Booking confirmed successfully');
    } catch (err) {
      next(err);
    }
  }

  async getUserBookings(req, res, next) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      return ApiResponse.success(res, bookings, 'User bookings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
