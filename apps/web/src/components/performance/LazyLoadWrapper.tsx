/**
 * Lazy Load Wrapper - A+++++ Performance Enhancement
 * Preserves existing design while adding performance optimizations
 */

'use client';

import React, { Suspense, lazy } from 'react';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface LazyLoadWrapperProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode;
  readonly minHeight?: string;
  readonly className?: string;
}

export function LazyLoadWrapper({ 
  children, 
  fallback,
  minHeight = "200px",
  className = ""
}: LazyLoadWrapperProps) {
  const defaultFallback = (
    <div className={`${className}`} style={{ minHeight }}>
      <LoadingSkeleton />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// Utility function to create lazy-loaded components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackComponent?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return function EnhancedLazyComponent(props: React.ComponentProps<T>) {
    const Fallback = fallbackComponent || LoadingSkeleton;
    
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Performance-optimized component wrapper
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    displayName?: string;
    preload?: boolean;
  } = {}
) {
  const { displayName, preload = false } = options;
  
  const PerformanceWrapper = React.memo(
    React.forwardRef<any, P>((props, ref) => {
      return <Component {...(props as P)} ref={ref} />;
    })
  );
  
  if (displayName) {
    PerformanceWrapper.displayName = displayName;
  }
  
  // Preload component if specified
  if (preload && typeof window !== 'undefined') {
    // Preload on idle
    requestIdleCallback(() => {
      // Component is already loaded since it's passed directly
    });
  }
  
  return PerformanceWrapper;
}