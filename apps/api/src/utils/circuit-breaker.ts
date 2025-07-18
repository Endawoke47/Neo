/**
 * Circuit Breaker Pattern Implementation
 * Enterprise-grade fault tolerance for AI services and external APIs
 */

import { logger, perfLogger } from '../config/logger';
import { AIServiceError, ExternalServiceError } from './errors';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  minimumRequests: number;
  successThreshold: number; // For half-open state
  timeoutMs: number;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  rejectedCount: number;
  averageResponseTime: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private metrics: CircuitBreakerMetrics;
  
  private requestHistory: Array<{
    timestamp: Date;
    success: boolean;
    duration: number;
  }> = [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {
    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      rejectedCount: 0,
      averageResponseTime: 0
    };
    
    logger.info('Circuit breaker initialized', {
      name: this.name,
      config: this.config
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker state changed to HALF_OPEN', {
          name: this.name,
          previousState: CircuitState.OPEN
        });
      } else {
        this.metrics.rejectedCount++;
        throw new AIServiceError(
          `Circuit breaker is OPEN for ${this.name}. Next attempt at ${this.nextAttempt?.toISOString()}`,
          undefined,
          { circuitState: this.state, nextAttempt: this.nextAttempt }
        );
      }
    }

    // Execute with timeout
    const timer = perfLogger.time(`circuit-breaker-${this.name}`);
    
    try {
      const result = await this.executeWithTimeout(operation);
      const duration = timer.end();
      
      this.onSuccess(duration);
      return result;
    } catch (error) {
      const duration = timer.end();
      this.onFailure(error, duration);
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.metrics.timeoutCount++;
        reject(new AIServiceError(
          `Operation timeout after ${this.config.timeoutMs}ms`,
          undefined,
          { timeout: this.config.timeoutMs, service: this.name }
        ));
      }, this.config.timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(duration: number): void {
    this.successCount++;
    this.metrics.successCount++;
    this.lastSuccessTime = new Date();
    
    this.recordRequest(true, duration);
    this.updateAverageResponseTime(duration);

    // Reset failure count on success
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0; // Reset failure count in closed state
    }

    logger.debug('Circuit breaker operation succeeded', {
      name: this.name,
      state: this.state,
      duration,
      successCount: this.successCount
    });
  }

  private onFailure(error: Error, duration: number): void {
    this.failureCount++;
    this.metrics.failureCount++;
    this.lastFailureTime = new Date();
    
    this.recordRequest(false, duration);
    this.updateAverageResponseTime(duration);

    logger.warn('Circuit breaker operation failed', {
      name: this.name,
      state: this.state,
      error: error.message,
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold
    });

    // Check if we should open the circuit
    if (this.shouldTrip()) {
      this.trip();
    }
  }

  private shouldTrip(): boolean {
    // Need minimum requests before considering tripping
    if (this.metrics.totalRequests < this.config.minimumRequests) {
      return false;
    }

    // Calculate failure rate within monitoring window
    const windowStart = new Date(Date.now() - this.config.monitoringWindow);
    const recentRequests = this.requestHistory.filter(
      req => req.timestamp >= windowStart
    );

    if (recentRequests.length < this.config.minimumRequests) {
      return false;
    }

    const failureRate = recentRequests.filter(req => !req.success).length / recentRequests.length;
    
    return failureRate >= this.config.failureThreshold;
  }

  private trip(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
    
    logger.error('Circuit breaker OPENED', {
      name: this.name,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      metrics: this.getMetrics()
    });
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  private reset(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = undefined;
    
    logger.info('Circuit breaker CLOSED (reset)', {
      name: this.name,
      previousState,
      metrics: this.getMetrics()
    });
  }

  private recordRequest(success: boolean, duration: number): void {
    this.requestHistory.push({
      timestamp: new Date(),
      success,
      duration
    });

    // Keep only requests within monitoring window
    const windowStart = new Date(Date.now() - this.config.monitoringWindow);
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp >= windowStart
    );
  }

  private updateAverageResponseTime(duration: number): void {
    const totalDuration = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration;
    this.metrics.averageResponseTime = totalDuration / this.metrics.totalRequests;
  }

  // Public methods for monitoring
  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      ...this.metrics,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime
    };
  }

  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || 
           (this.state === CircuitState.HALF_OPEN && this.successCount > 0);
  }

  getFailureRate(): number {
    const windowStart = new Date(Date.now() - this.config.monitoringWindow);
    const recentRequests = this.requestHistory.filter(
      req => req.timestamp >= windowStart
    );

    if (recentRequests.length === 0) return 0;
    
    return recentRequests.filter(req => !req.success).length / recentRequests.length;
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
    
    logger.warn('Circuit breaker force opened', {
      name: this.name,
      forced: true
    });
  }

  forceClose(): void {
    this.reset();
    
    logger.info('Circuit breaker force closed', {
      name: this.name,
      forced: true
    });
  }
}

// Circuit breaker manager for multiple services
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  createBreaker(name: string, config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 0.5, // 50% failure rate
      recoveryTimeout: 60000, // 1 minute
      monitoringWindow: 300000, // 5 minutes
      minimumRequests: 10,
      successThreshold: 3,
      timeoutMs: 30000 // 30 seconds
    };

    const finalConfig = { ...defaultConfig, ...config };
    const breaker = new CircuitBreaker(name, finalConfig);
    
    this.breakers.set(name, breaker);
    
    logger.info('Circuit breaker created', {
      name,
      config: finalConfig
    });
    
    return breaker;
  }

  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  getHealthStatus(): Record<string, {
    state: CircuitState;
    healthy: boolean;
    failureRate: number;
    metrics: CircuitBreakerMetrics;
  }> {
    const status: Record<string, any> = {};
    
    for (const [name, breaker] of this.breakers) {
      status[name] = {
        state: breaker.getState(),
        healthy: breaker.isHealthy(),
        failureRate: breaker.getFailureRate(),
        metrics: breaker.getMetrics()
      };
    }
    
    return status;
  }

  resetAll(): void {
    for (const [name, breaker] of this.breakers) {
      breaker.forceClose();
    }
    
    logger.info('All circuit breakers reset');
  }
}

// Retry mechanism with exponential backoff
export class RetryHandler {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 10000,
    private backoffMultiplier: number = 2
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    predicate: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if predicate returns false
        if (!predicate(lastError)) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(this.backoffMultiplier, attempt),
          this.maxDelay
        );
        
        logger.debug('Retrying operation', {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          delay,
          error: lastError.message
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();