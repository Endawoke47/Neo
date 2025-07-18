/**
 * Virtualized List - A+++++ Performance Enhancement
 * High-performance list rendering for large datasets
 * Preserves your existing design styling
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScrollEnd?: () => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = "",
  overscan = 3,
  onScrollEnd,
  loading = false,
  emptyState
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if scrolled to bottom
    const { scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - newScrollTop <= clientHeight + 100) {
      onScrollEnd?.();
    }
  };

  // Render empty state
  if (items.length === 0 && !loading) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height: containerHeight }}>
        {emptyState || (
          <div className="text-center text-neutral-500 py-8">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(visibleRange.start, visibleRange.end).map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center py-4 text-neutral-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing infinite loading
export function useInfiniteScroll<T>(
  initialItems: T[],
  loadMore: () => Promise<T[]>,
  options: {
    pageSize?: number;
    threshold?: number;
  } = {}
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { pageSize = 20 } = options;

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await loadMore();
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    hasMore,
    loadMore: handleLoadMore,
    reset: () => {
      setItems(initialItems);
      setHasMore(true);
    }
  };
}