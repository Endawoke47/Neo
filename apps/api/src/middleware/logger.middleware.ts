// Request Logger Middleware
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log the request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Add response time logging on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
