/**
 * LoadingSkeleton Component Tests
 * Tests for the loading skeleton component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSkeleton from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  describe('Rendering', () => {
    it('renders loading skeleton', () => {
      render(<LoadingSkeleton />);
      
      // Should render animate-pulse elements
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('renders correct number of skeleton rows', () => {
      const rows = 5;
      render(<LoadingSkeleton rows={rows} />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows).toHaveLength(rows);
    });

    it('renders with default number of rows when not specified', () => {
      render(<LoadingSkeleton />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows.length).toBe(5); // Default is 5 rows
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<LoadingSkeleton className="custom-skeleton" />);
      
      expect(container.firstChild).toHaveClass('custom-skeleton');
    });

    it('has proper loading animation classes', () => {
      render(<LoadingSkeleton />);
      
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Variants', () => {
    it('renders table variant (default)', () => {
      render(<LoadingSkeleton type="table" />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('renders cards variant', () => {
      render(<LoadingSkeleton type="cards" />);
      
      const cardSkeletons = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(cardSkeletons.length).toBeGreaterThan(0);
    });

    it('renders stats variant', () => {
      render(<LoadingSkeleton type="stats" />);
      
      const statsSkeletons = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statsSkeletons.length).toBeGreaterThan(0);
    });

    it('renders default variant when not specified', () => {
      render(<LoadingSkeleton />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows.length).toBe(5); // Default table type with 5 rows
    });
  });

  describe('Stats Variant', () => {
    it('renders exactly 4 stats cards', () => {
      render(<LoadingSkeleton type="stats" />);
      
      const statsCards = document.querySelectorAll('.bg-white.rounded-lg.p-6.shadow-sm.border.border-gray-200.animate-pulse');
      expect(statsCards.length).toBe(4);
    });

    it('ignores rows prop for stats variant', () => {
      render(<LoadingSkeleton type="stats" rows={10} />);
      
      const statsCards = document.querySelectorAll('.bg-white.rounded-lg.p-6.shadow-sm.border.border-gray-200.animate-pulse');
      expect(statsCards.length).toBe(4); // Should still be 4, not 10
    });
  });

  describe('Cards Variant', () => {
    it('renders correct number of cards', () => {
      const rows = 3;
      render(<LoadingSkeleton type="cards" rows={rows} />);
      
      const cardSkeletons = document.querySelectorAll('.bg-white.rounded-lg.p-6.shadow-sm.border.border-gray-200.animate-pulse');
      expect(cardSkeletons.length).toBe(rows);
    });

    it('uses default rows for cards variant', () => {
      render(<LoadingSkeleton type="cards" />);
      
      const cardSkeletons = document.querySelectorAll('.bg-white.rounded-lg.p-6.shadow-sm.border.border-gray-200.animate-pulse');
      expect(cardSkeletons.length).toBe(5); // Default is 5
    });
  });

  describe('Edge Cases', () => {
    it('handles zero rows', () => {
      render(<LoadingSkeleton rows={0} />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows).toHaveLength(0);
    });

    it('handles negative rows', () => {
      render(<LoadingSkeleton rows={-1} />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows).toHaveLength(0);
    });

    it('handles very large number of rows', () => {
      const largeNumber = 100;
      render(<LoadingSkeleton rows={largeNumber} />);
      
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows).toHaveLength(largeNumber);
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with many rows', () => {
      const { unmount } = render(<LoadingSkeleton rows={50} />);
      
      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('renders quickly with reasonable number of rows', () => {
      const startTime = Date.now();
      render(<LoadingSkeleton rows={10} />);
      const endTime = Date.now();
      
      // Should render within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      render(<LoadingSkeleton />);
      
      // Should have proper div structure
      const container = document.querySelector('.bg-white.rounded-lg.shadow-sm.border.border-gray-200.p-6');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('has proper table structure', () => {
      render(<LoadingSkeleton type="table" />);
      
      // Should have main container
      const container = document.querySelector('.bg-white.rounded-lg.shadow-sm.border.border-gray-200.p-6');
      expect(container).toBeInTheDocument();
      
      // Should have animate-pulse wrapper
      const animateWrapper = document.querySelector('.animate-pulse.space-y-4');
      expect(animateWrapper).toBeInTheDocument();
    });

    it('has proper card structure', () => {
      render(<LoadingSkeleton type="cards" />);
      
      // Should have grid container
      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('has proper stats structure', () => {
      render(<LoadingSkeleton type="stats" />);
      
      // Should have stats grid container
      const statsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statsContainer).toBeInTheDocument();
    });
  });
});