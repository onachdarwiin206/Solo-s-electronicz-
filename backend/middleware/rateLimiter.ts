import { Request, Response, NextFunction } from "express";

const attemptsStore: Record<string, { count: number; firstAttemptTime: number }> = {};

export function pinRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_ATTEMPTS = 5;

  const record = attemptsStore[ip];

  if (!record) {
    attemptsStore[ip] = { count: 1, firstAttemptTime: now };
    return next();
  }

  if (now - record.firstAttemptTime > LIMIT_WINDOW) {
    // Reset window
    record.count = 1;
    record.firstAttemptTime = now;
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    console.warn(`[Security WARNING] Rate limit exceeded for IP: ${ip} on Admin login routes.`);
    return res.status(429).json({
      success: false,
      error: "Too many login attempts. Please try again in 1 minute."
    });
  }

  record.count += 1;
  next();
}
