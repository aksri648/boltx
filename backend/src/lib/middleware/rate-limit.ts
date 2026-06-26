import type { Request, Response, NextFunction } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RateLimit');

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 * @param windowMs  – time window in milliseconds
 * @param maxRequests – max requests per window
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function clearRateLimitInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export function rateLimit(windowMs: number = 60_000, maxRequests: number = 120) {
  // Start periodic cleanup only once
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of buckets) {
        if (now > entry.resetAt) {
          buckets.delete(key);
        }
      }
    }, windowMs * 2);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip ?? req.socket.remoteAddress ?? 'unknown'}:${req.path}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      logger.warn(`Rate limit exceeded for ${key}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
      return;
    }

    next();
  };
}
