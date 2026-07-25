/**
 * Express app: JSON parser, CORS, security headers, rate limiting, all routes, global error handler.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./modules/auth/auth.routes');
const queueRoutes = require('./modules/queue/queue.routes');
const doctorRoutes = require('./modules/doctors/doctor.routes');
const patientRoutes = require('./modules/patients/patient.routes');
const appointmentRoutes = require('./modules/appointments/appointment.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const emrRoutes = require('./modules/emr/emr.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// Parse cookies
app.use(cookieParser());

// Trust proxy for Vercel / reverse proxy deployments
app.set('trust proxy', 1);

// CORS: strict origin checking in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    // In development, allow all; in production, reject unknown origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({
  limit: '1mb', // Prevent oversized payloads
  verify: (req, res, buf) => {
    // Razorpay signs the exact raw bytes of the webhook body; re-serializing
    // req.body would produce a different byte sequence and fail verification.
    req.rawBody = buf;
  },
})); 

// Rate limiting on auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again after 15 minutes' },
});

// General API rate limiter (prevent abuse)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' },
});

// Health check (no rate limit)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Apply rate limiters
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/queue', apiLimiter, queueRoutes);
app.use('/api/v1/doctors', apiLimiter, doctorRoutes);
app.use('/api/v1/patients', apiLimiter, patientRoutes);
app.use('/api/v1/appointments', apiLimiter, appointmentRoutes);
app.use('/api/v1/admin', apiLimiter, adminRoutes);
app.use('/api/v1/payments', apiLimiter, paymentRoutes);
app.use('/api/v1/emr', apiLimiter, emrRoutes);

app.use(errorHandler);

module.exports = app;
