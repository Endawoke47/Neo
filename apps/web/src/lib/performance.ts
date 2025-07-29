// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if (PerformanceObserver.supportedEntryTypes?.includes('navigation')) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart);
          this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          this.recordMetric('first-paint', navEntry.loadEventEnd - navEntry.fetchStart);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    }

    // Observe largest contentful paint
    if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // Observe first input delay
    if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric('first-input-delay', fidEntry.processingStart - fidEntry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Observe cumulative layout shift
    if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any; // Layout shift entry type
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
            this.recordMetric('cumulative-layout-shift', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${name} = ${value.toFixed(2)}ms`);
    }

    // Send to analytics in production (replace with your analytics service)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, value);
    }
  }

  private sendToAnalytics(name: string, value: number) {
    // Replace with your analytics service
    // gtag('event', 'performance_metric', {
    //   metric_name: name,
    //   metric_value: Math.round(value),
    //   custom_parameter: 'value'
    // });
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }
    
    return result;
  }

  // Measure component render time
  measureComponent<T extends any[], R>(
    componentName: string,
    fn: (...args: T) => R
  ): (...args: T) => R {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      this.recordMetric(`component-${componentName}`, end - start);
      return result;
    };
  }

  // Measure async function execution time
  async measureAsync<T extends any[], R>(
    name: string,
    fn: (...args: T) => Promise<R>,
    ...args: T
  ): Promise<R> {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      this.recordMetric(name, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      this.recordMetric(`${name}-error`, end - start);
      throw error;
    }
  }

  // Report Web Vitals
  reportWebVitals() {
    const metrics = this.getMetrics();
    const webVitals = {
      lcp: metrics['largest-contentful-paint']?.avg || 0,
      fid: metrics['first-input-delay']?.avg || 0,
      cls: metrics['cumulative-layout-shift']?.avg || 0,
      pageLoad: metrics['page-load']?.avg || 0,
      domContentLoaded: metrics['dom-content-loaded']?.avg || 0
    };

    console.table(webVitals);
    return webVitals;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    reportWebVitals: performanceMonitor.reportWebVitals.bind(performanceMonitor)
  };
};

// HOC for measuring component performance
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      const start = performance.now();
      return () => {
        const end = performance.now();
        performanceMonitor.recordMetric(`component-${name}-lifecycle`, end - start);
      };
    }, []);

    const start = performance.now();
    const result = <Component {...props} ref={ref} />;
    const end = performance.now();
    
    performanceMonitor.recordMetric(`component-${name}-render`, end - start);
    return result;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`;
  return WrappedComponent;
}

// Utility to measure bundle size impact
export const measureBundleImpact = () => {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    const bundleSize = navigation.transferSize || 0;
    const compressedSize = navigation.encodedBodySize || 0;
    const uncompressedSize = navigation.decodedBodySize || 0;
    
    console.log('Bundle Impact Analysis:', {
      totalTransferSize: `${(bundleSize / 1024).toFixed(2)} KB`,
      compressedSize: `${(compressedSize / 1024).toFixed(2)} KB`,
      uncompressedSize: `${(uncompressedSize / 1024).toFixed(2)} KB`,
      compressionRatio: `${((1 - compressedSize / uncompressedSize) * 100).toFixed(1)}%`
    });
  }
};