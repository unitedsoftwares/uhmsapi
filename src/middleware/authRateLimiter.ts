import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';

// Development mode: relaxed rate limits
const isDevelopment = config.env === 'development';

// Rate limiting for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 50, // 50 attempts in production
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req: Request) => {
    // Use both IP and email/username for rate limiting
    const identifier = req.body?.email || req.ip;
    return identifier;
  },
});

// General auth endpoints rate limiter
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 200, // 200 requests in production
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password change
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 1000 : 10, // 10 attempts per hour in production
  message: 'Too many password change attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 10000 : 100, // 100 registrations per hour in production
  message: 'Too many registration attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});