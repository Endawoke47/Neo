/**
 * EmptyState Component Tests
 * Tests for the empty state component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders basic empty state', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    });

    it('renders with custom icon', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          icon="search"
        />
      );
      
      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    });

    it('renders with action button', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
          onAction={mockOnAction}
        />
      );
      
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    it('renders without action button when not provided', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('calls onAction when action button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
          onAction={mockOnAction}
        />
      );
      
      const actionButton = screen.getByText('Add Item');
      await user.click(actionButton);
      
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('handles Enter key on action button', async () => {
      const user = userEvent.setup();
      
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
          onAction={mockOnAction}
        />
      );
      
      const actionButton = screen.getByText('Add Item');
      actionButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('handles Space key on action button', async () => {
      const user = userEvent.setup();
      
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
          onAction={mockOnAction}
        />
      );
      
      const actionButton = screen.getByText('Add Item');
      actionButton.focus();
      await user.keyboard(' ');
      
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          className="custom-empty-state"
        />
      );
      
      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('custom-empty-state');
    });

    it('has proper default styling classes', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('text-center');
    });
  });

  describe('Different Variants', () => {
    it('renders search variant', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search criteria"
          variant="search"
        />
      );
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    });

    it('renders error variant', () => {
      render(
        <EmptyState
          title="Something went wrong"
          description="Unable to load data"
          variant="error"
        />
      );
      
      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('error-variant');
    });

    it('renders default variant when not specified', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('default-variant');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-label', 'Empty state');
    });

    it('has proper heading structure', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      const title = screen.getByRole('heading');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('No items found');
    });

    it('action button has proper focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
          onAction={mockOnAction}
        />
      );
      
      const actionButton = screen.getByText('Add Item');
      await user.tab();
      
      expect(actionButton).toHaveFocus();
    });
  });

  describe('Content Variations', () => {
    it('handles long title text', () => {
      const longTitle = 'A'.repeat(100);
      render(
        <EmptyState
          title={longTitle}
          description="Description"
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long description text', () => {
      const longDescription = 'A very long description that might wrap to multiple lines and should be handled gracefully by the component.'.repeat(3);
      render(
        <EmptyState
          title="Title"
          description={longDescription}
        />
      );
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles HTML entities in text', () => {
      render(
        <EmptyState
          title="No items found &amp; nothing to display"
          description="Try again &lt;later&gt;"
        />
      );
      
      expect(screen.getByText('No items found & nothing to display')).toBeInTheDocument();
      expect(screen.getByText('Try again <later>')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(
        <EmptyState
          title=""
          description="Description"
        />
      );
      
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('handles empty description', () => {
      render(
        <EmptyState
          title="Title"
          description=""
        />
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('handles missing onAction with actionLabel', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
          actionLabel="Add Item"
        />
      );
      
      // Should render without crashing
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      // Re-render with same props
      rerender(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      // Should not call onAction during re-render
      expect(mockOnAction).not.toHaveBeenCalled();
    });
  });
});