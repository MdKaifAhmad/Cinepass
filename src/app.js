const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/apiError');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const cinemaRoutes = require('./modules/cinema/cinema.routes');
const movieRoutes = require('./modules/movie/movie.routes');
const bookingRoutes = require('./modules/booking/booking.routes');
const paymentRoutes = require('./modules/payment/payment.routes');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS configuration
app.use(cors());

// 3. DoS Protection / Global Rate Limiter
app.use('/api', globalLimiter);

// 4. Mount Payment routes FIRST (raw buffer support for Stripe webhook)
app.use('/api/v1/payments', paymentRoutes);

// 5. Body Parsers for remaining endpoints
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Health Check Endpoint (Docker / K8s probe)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// 7. Mount Core API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cinemas', cinemaRoutes);
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// 8. 404 Catch-All Route
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find ${req.originalUrl} on this server`));
});

// 9. Centralized Error Handling Middleware (Always at the very end)
app.use(errorHandler);

module.exports = app;
