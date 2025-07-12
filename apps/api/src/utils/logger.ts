/**
 * Logger Utility for API
 * Centralized logging functionality
 */

import { env } from '../config/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.getLogLevel(env.LOG_LEVEL);
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Request logging middleware
   */
  logRequest(req: any, res: any, next: any): void {
    if (!env.ENABLE_REQUEST_LOGGING) {
      return next();
    }

    const start = Date.now();
    const { method, url, ip } = req;
    
    this.info('Request started', { method, url, ip });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      
      this.info('Request completed', { 
        method, 
        url, 
        statusCode, 
        duration: `${duration}ms`,
        ip 
      });
    });

    next();
  }
}

export const logger = new Logger();
export default logger;
