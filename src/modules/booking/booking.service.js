const { prisma } = require('../../config/database');
const { acquireSeatLock, releaseSeatLock, getShowLockedSeats } = require('../../config/redis');
const { emitSeatUpdate } = require('../../config/socket');
const ApiError = require('../../utils/apiError');
const { BOOKING_STATUS } = require('../../utils/constants');

class BookingService {
  /**
   * 1. Get Live Seats Status for a Show
   * Merges: Physical Seats + Permanent DB Bookings + Temporary Redis Locks
   */
  async getShowSeats(showId) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        screen: {
          include: {
            seats: {
              orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
            },
          },
        },
        bookingSeats: {
          select: { seatId: true },
        },
      },
    });

    if (!show) {
      throw ApiError.notFound('Show not found');
    }

    // Permanent booked seats in PostgreSQL
    const bookedSeatIds = new Set(show.bookingSeats.map((bs) => bs.seatId));

    // Temporary locked seats in Redis (TTL active)
    const lockedSeatIds = new Set(await getShowLockedSeats(showId));

    // Map each seat with real-time status: BOOKED > LOCKED > AVAILABLE
    const seatsWithStatus = show.screen.seats.map((seat) => {
      let status = 'AVAILABLE';
      if (bookedSeatIds.has(seat.id)) {
        status = 'BOOKED';
      } else if (lockedSeatIds.has(seat.id)) {
        status = 'LOCKED';
      }

      return {
        id: seat.id,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
        category: seat.category,
        price: seat.basePrice * show.priceMultiplier,
        status,
      };
    });

    return {
      showId: show.id,
      version: show.version, // Returned for optimistic locking checks
      seats: seatsWithStatus,
    };
  }

  /**
   * 2. Lock Seats (Phase 1 of Defense)
   * Acquires atomic locks in Redis with rollback if any seat is unavailable
   */
  async lockSeats(userId, showId, seatIds) {
    // A. Verify seats are not already permanently booked in DB
    const alreadyBooked = await prisma.bookingSeat.findMany({
      where: {
        showId,
        seatId: { in: seatIds },
      },
    });

    if (alreadyBooked.length > 0) {
      throw ApiError.conflict('One or more selected seats are already booked');
    }

    // B. Attempt atomic Redis lock for all seats
    const acquiredLocks = [];

    for (const seatId of seatIds) {
      const locked = await acquireSeatLock(showId, seatId, userId);
      if (locked) {
        acquiredLocks.push(seatId);
      } else {
        // Rollback already acquired locks in this batch to prevent dangling locks
        for (const rollbackSeatId of acquiredLocks) {
          await releaseSeatLock(showId, rollbackSeatId, userId);
        }
        throw ApiError.conflict(
          'One or more selected seats are currently locked by another user. Please choose different seats.'
        );
      }
    }

    // C. Real-time broadcast to all viewers of this show via WebSocket
    emitSeatUpdate(showId, 'seat:locked', {
      seatIds,
      status: 'LOCKED',
    });

    return {
      message: 'Seats locked successfully',
      lockedSeats: seatIds,
      expiresInSeconds: 300,
    };
  }

  /**
   * 3. Confirm Booking (Phase 2 of Defense)
   * ACID Transaction with Optimistic Version Check + Unique Constraints
   */
  async confirmBooking(userId, showId, seatIds, paymentIntentId, expectedVersion) {
    return await prisma.$transaction(async (tx) => {
      // 1. Optimistic Locking Check
      const show = await tx.show.findUnique({
        where: { id: showId },
      });

      if (!show) {
        throw ApiError.notFound('Show not found');
      }

      if (expectedVersion !== undefined && show.version !== expectedVersion) {
        throw ApiError.conflict(
          'Show data was updated by another transaction. Please refresh and try again.'
        );
      }

      // 2. Double check if any seat got booked in the interim
      const conflictSeats = await tx.bookingSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
      });

      if (conflictSeats.length > 0) {
        throw ApiError.conflict('Seats have already been booked by another transaction');
      }

      // 3. Calculate total amount
      const seats = await tx.seat.findMany({
        where: { id: { in: seatIds } },
      });

      const totalAmount = seats.reduce(
        (sum, seat) => sum + seat.basePrice * show.priceMultiplier,
        0
      );

      // 4. Create Booking & BookingSeats records
      const booking = await tx.booking.create({
        data: {
          userId,
          showId,
          status: BOOKING_STATUS.CONFIRMED,
          totalAmount,
          bookingSeats: {
            create: seats.map((seat) => ({
              seatId: seat.id,
              showId,
              price: seat.basePrice * show.priceMultiplier,
            })),
          },
        },
        include: {
          bookingSeats: true,
        },
      });

      // 5. Increment Show version for optimistic concurrency control
      await tx.show.update({
        where: { id: showId },
        data: { version: { increment: 1 } },
      });

      // 6. Release temporary Redis locks
      for (const seatId of seatIds) {
        await releaseSeatLock(showId, seatId, userId);
      }

      // 7. Broadcast permanent BOOKED status to all connected users
      emitSeatUpdate(showId, 'seat:booked', {
        seatIds,
        status: 'BOOKED',
      });

      return booking;
    });
  }

  async getUserBookings(userId) {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: { include: { cinemaHall: true } },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new BookingService();
