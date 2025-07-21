/**
 * Performance Monitor - A+++++ Performance Enhancement
 * Silent performance monitoring that doesn't interfere with your UI
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  routeChangeTime: number;
}

interface PerformanceMonitorProps {
  readonly enableDevMode?: boolean;
  readonly onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
}

export function PerformanceMonitor({ 
  enableDevMode = false, 
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [routeChangeStart, setRouteChangeStart] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            setMetrics(prev => ({ ...prev, firstContentfulPaint: fcp }));
            onMetricsUpdate?.({ firstContentfulPaint: fcp });
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        setMetrics(prev => ({ ...prev, largestContentfulPaint: lcp }));
        onMetricsUpdate?.({ largestContentfulPaint: lcp });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }));
        onMetricsUpdate?.({ cumulativeLayoutShift: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEntry & { processingStart?: number };
          if (eventEntry.processingStart) {
            const fid = eventEntry.processingStart - entry.startTime;
            setMetrics(prev => ({ ...prev, firstInputDelay: fid }));
            onMetricsUpdate?.({ firstInputDelay: fid });
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Page Load Time
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
        onMetricsUpdate?.({ pageLoadTime: loadTime });
      });

      return () => {
        observer.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    };

    measureWebVitals();
  }, [onMetricsUpdate]);

  // Route change performance monitoring
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setRouteChangeStart(performance.now());
    };

    const handleRouteChangeComplete = () => {
      if (routeChangeStart) {
        const routeChangeTime = performance.now() - routeChangeStart;
        setMetrics(prev => ({ ...prev, routeChangeTime }));
        onMetricsUpdate?.({ routeChangeTime });
        setRouteChangeStart(null);
      }
    };

    // Listen to route changes
    const originalPush = router.push;
    router.push = (...args) => {
      handleRouteChangeStart();
      return originalPush.apply(router, args);
    };

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleRouteChangeComplete();
      }
    });

    return () => {
      router.push = originalPush;
    };
  }, [router, routeChangeStart, onMetricsUpdate]);

  // Memory monitoring
  useEffect(() => {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        console.log('Memory Usage:', {
          used: Math.round(memInfo.usedJSHeapSize / 1048576),
          total: Math.round(memInfo.totalJSHeapSize / 1048576),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576),
        });
      }
    };

    const interval = setInterval(monitorMemory, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Development mode overlay
  if (enableDevMode && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-0 left-0 z-50 bg-black/80 text-white p-3 rounded-tr-lg text-xs font-mono">
        <div className="space-y-1">
          <div className="text-primary-400 font-semibold">Performance Metrics</div>
          {metrics.pageLoadTime && (
            <div>Load: {Math.round(metrics.pageLoadTime)}ms</div>
          )}
          {metrics.firstContentfulPaint && (
            <div>FCP: {Math.round(metrics.firstContentfulPaint)}ms</div>
          )}
          {metrics.largestContentfulPaint && (
            <div>LCP: {Math.round(metrics.largestContentfulPaint)}ms</div>
          )}
          {metrics.cumulativeLayoutShift && (
            <div>CLS: {metrics.cumulativeLayoutShift.toFixed(4)}</div>
          )}
          {metrics.firstInputDelay && (
            <div>FID: {Math.round(metrics.firstInputDelay)}ms</div>
          )}
          {metrics.routeChangeTime && (
            <div>Route: {Math.round(metrics.routeChangeTime)}ms</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Hook for accessing performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };

  return { metrics, updateMetrics };
}

// Performance optimization utilities
export const performanceUtils = {
  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Prefetch next page
  prefetchPage: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Defer non-critical JavaScript
  deferScript: (src: string) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  },

  // Optimize font loading
  preloadFont: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  },
};

// Component-level performance wrapper
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
        }
      };
    });

    return <Component {...props} />;
  };
}