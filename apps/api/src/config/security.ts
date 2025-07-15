// Comprehensive Security Configuration
// Centralized security settings for the CounselFlow API

import { env } from './environment';
import { logger, securityLogger } from './logger';

// Security configuration interface
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authWindowMs: number;
    authMaxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  fileUpload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    uploadPath: string;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
  };
  headers: {
    contentSecurityPolicy: {
      directives: Record<string, string[]>;
    };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  validation: {
    maxRequestSize: number;
    maxQueryLength: number;
    maxHeaderSize: number;
    sanitization: {
      enableHtmlSanitization: boolean;
      enableSqlInjectionPrevention: boolean;
      enableXssProtection: boolean;
    };
  };
  monitoring: {
    enableSecurityLogs: boolean;
    enableAuditLogs: boolean;
    enablePerformanceLogs: boolean;
    logRetentionDays: number;
    alertThresholds: {
      slowRequestMs: number;
      highErrorRate: number;
      suspiciousActivityCount: number;
    };
  };
}

// Default security configuration
export const securityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    authWindowMs: 15 * 60 * 1000, // 15 minutes for auth endpoints
    authMaxRequests: 5, // Strict limit for auth
    skipSuccessfulRequests: true
  },
  fileUpload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ],
    allowedExtensions: env.ALLOWED_FILE_TYPES.split(','),
    uploadPath: env.UPLOAD_PATH
  },
  cors: {
    origins: [
      env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-API-Key'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Request-ID',
      'X-Rate-Limit-Remaining'
    ]
  },
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'https://api.openai.com',
          'https://api.anthropic.com',
          'https://generativelanguage.googleapis.com'
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  },
  validation: {
    maxRequestSize: env.MAX_FILE_SIZE,
    maxQueryLength: 1000,
    maxHeaderSize: 8192,
    sanitization: {
      enableHtmlSanitization: true,
      enableSqlInjectionPrevention: true,
      enableXssProtection: true
    }
  },
  monitoring: {
    enableSecurityLogs: env.ENABLE_AUDIT_LOGGING,
    enableAuditLogs: env.ENABLE_AUDIT_LOGGING,
    enablePerformanceLogs: true,
    logRetentionDays: env.LOG_RETENTION_DAYS,
    alertThresholds: {
      slowRequestMs: 5000,
      highErrorRate: 0.1, // 10% error rate
      suspiciousActivityCount: 10
    }
  }
};

// Security validation functions
export const validateSecurityConfig = (): boolean => {
  const errors: string[] = [];

  // Validate rate limiting
  if (securityConfig.rateLimit.maxRequests < 1) {
    errors.push('Rate limit max requests must be at least 1');
  }

  // Validate file upload settings
  if (securityConfig.fileUpload.maxFileSize < 1024) {
    errors.push('Max file size must be at least 1KB');
  }

  // Validate CORS origins
  if (securityConfig.cors.origins.length === 0) {
    errors.push('At least one CORS origin must be specified');
  }

  // Log validation results
  if (errors.length > 0) {
    securityLogger.suspiciousActivity('system', 'security_config_validation_failed', {
      errors
    });
    logger.error('Security configuration validation failed', { errors });
    return false;
  }

  logger.info('Security configuration validated successfully');
  return true;
};

// Security metrics tracking
export class SecurityMetrics {
  private static instance: SecurityMetrics;
  private metrics: {
    rateLimitViolations: number;
    authenticationFailures: number;
    suspiciousActivities: number;
    blockedRequests: number;
    lastReset: number;
  };

  private constructor() {
    this.metrics = {
      rateLimitViolations: 0,
      authenticationFailures: 0,
      suspiciousActivities: 0,
      blockedRequests: 0,
      lastReset: Date.now()
    };

    // Reset metrics every hour
    setInterval(() => this.resetMetrics(), 3600000);
  }

  public static getInstance(): SecurityMetrics {
    if (!SecurityMetrics.instance) {
      SecurityMetrics.instance = new SecurityMetrics();
    }
    return SecurityMetrics.instance;
  }

  public incrementRateLimitViolations(): void {
    this.metrics.rateLimitViolations++;
    this.checkThresholds();
  }

  public incrementAuthenticationFailures(): void {
    this.metrics.authenticationFailures++;
    this.checkThresholds();
  }

  public incrementSuspiciousActivities(): void {
    this.metrics.suspiciousActivities++;
    this.checkThresholds();
  }

  public incrementBlockedRequests(): void {
    this.metrics.blockedRequests++;
    this.checkThresholds();
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  private resetMetrics(): void {
    const oldMetrics = { ...this.metrics };
    
    this.metrics = {
      rateLimitViolations: 0,
      authenticationFailures: 0,
      suspiciousActivities: 0,
      blockedRequests: 0,
      lastReset: Date.now()
    };

    // Log hourly security summary
    logger.info('Hourly security metrics reset', {
      previousHour: oldMetrics,
      resetTime: new Date().toISOString()
    });
  }

  private checkThresholds(): void {
    const { alertThresholds } = securityConfig.monitoring;

    if (this.metrics.suspiciousActivities >= alertThresholds.suspiciousActivityCount) {
      securityLogger.suspiciousActivity('system', 'high_suspicious_activity_count', {
        count: this.metrics.suspiciousActivities,
        threshold: alertThresholds.suspiciousActivityCount,
        timeWindow: 'last_hour'
      });
    }

    if (this.metrics.authenticationFailures >= 50) {
      securityLogger.suspiciousActivity('system', 'high_auth_failure_count', {
        count: this.metrics.authenticationFailures,
        timeWindow: 'last_hour'
      });
    }
  }
}

// IP address utilities
export class IPAddressManager {
  private static blacklistedIPs = new Set<string>();
  private static whitelistedIPs = new Set<string>();
  private static suspiciousIPs = new Map<string, { count: number; lastActivity: number }>();

  public static addToBlacklist(ip: string, reason: string): void {
    this.blacklistedIPs.add(ip);
    securityLogger.suspiciousActivity('system', 'ip_blacklisted', {
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
    logger.warn('IP address blacklisted', { ip, reason });
  }

  public static removeFromBlacklist(ip: string): void {
    this.blacklistedIPs.delete(ip);
    logger.info('IP address removed from blacklist', { ip });
  }

  public static addToWhitelist(ip: string): void {
    this.whitelistedIPs.add(ip);
    logger.info('IP address whitelisted', { ip });
  }

  public static removeFromWhitelist(ip: string): void {
    this.whitelistedIPs.delete(ip);
    logger.info('IP address removed from whitelist', { ip });
  }

  public static isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  public static isWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.size === 0 || this.whitelistedIPs.has(ip);
  }

  public static trackSuspiciousActivity(ip: string): void {
    const now = Date.now();
    const activity = this.suspiciousIPs.get(ip);

    if (!activity || now - activity.lastActivity > 3600000) { // 1 hour
      this.suspiciousIPs.set(ip, { count: 1, lastActivity: now });
    } else {
      activity.count++;
      activity.lastActivity = now;

      // Auto-blacklist after threshold
      if (activity.count >= 20) {
        this.addToBlacklist(ip, 'Automated blacklist due to suspicious activity');
      }
    }
  }

  public static getSuspiciousIPs(): Array<{ ip: string; count: number; lastActivity: number }> {
    return Array.from(this.suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      ...data
    }));
  }

  public static cleanupSuspiciousIPs(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [ip, activity] of this.suspiciousIPs.entries()) {
      if (now - activity.lastActivity > maxAge) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Cleanup suspicious IPs every hour
setInterval(() => {
  IPAddressManager.cleanupSuspiciousIPs();
}, 3600000);

// Security configuration validation on startup
if (!validateSecurityConfig()) {
  logger.error('Security configuration validation failed - some security features may not work correctly');
}

// Export security metrics instance
export const securityMetrics = SecurityMetrics.getInstance();

// Export configuration
export default securityConfig;