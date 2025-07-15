/**
 * SearchAndFilter Component Tests
 * Tests for the universal search and filter component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchAndFilter from '../SearchAndFilter';

describe('SearchAndFilter', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnFilterChange = jest.fn();
  
  const defaultProps = {
    searchValue: '',
    onSearchChange: mockOnSearchChange,
    searchPlaceholder: 'Search...',
    filterValue: 'all',
    onFilterChange: mockOnFilterChange,
    filterOptions: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    filterLabel: 'Filter'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search and filter components', () => {
      render(<SearchAndFilter {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('renders with custom search placeholder', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          searchPlaceholder="Search clients..."
        />
      );
      
      expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument();
    });

    it('renders with custom filter label', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          filterLabel="Status"
        />
      );
      
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('displays current search value', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          searchValue="test search"
        />
      );
      
      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearchChange when typing in search input', async () => {
      const user = userEvent.setup();
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'test query');
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
    });

    it('calls onSearchChange when clearing search input', async () => {
      const user = userEvent.setup();
      render(
        <SearchAndFilter
          {...defaultProps}
          searchValue="existing search"
        />
      );
      
      const searchInput = screen.getByDisplayValue('existing search');
      await user.clear(searchInput);
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });

    it('focuses search input when clicked', async () => {
      const user = userEvent.setup();
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.click(searchInput);
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Filter Functionality', () => {
    it('displays filter options', () => {
      render(<SearchAndFilter {...defaultProps} />);
      
      // Check if filter options are available (may need to click to open dropdown)
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('calls onFilterChange when selecting different filter', async () => {
      const user = userEvent.setup();
      render(<SearchAndFilter {...defaultProps} />);
      
      // Find and click the filter dropdown
      const filterButton = screen.getByText('All');
      await user.click(filterButton);
      
      // Select a different option
      const activeOption = screen.getByText('Active');
      await user.click(activeOption);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith('active');
    });

    it('shows selected filter value', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          filterValue="active"
        />
      );
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables search input when disabled prop is true', () => {
      render(<SearchAndFilter {...defaultProps} disabled={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeDisabled();
    });

    it('disables filter when disabled prop is true', () => {
      render(<SearchAndFilter {...defaultProps} disabled={true} />);
      
      const filterButton = screen.getByText('All');
      expect(filterButton).toBeDisabled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          className="custom-class"
        />
      );
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty filter options', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          filterOptions={[]}
        />
      );
      
      // Should still render without crashing
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('handles undefined filter options', () => {
      render(
        <SearchAndFilter
          {...defaultProps}
          filterOptions={undefined}
        />
      );
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('handles long search values', async () => {
      const user = userEvent.setup();
      const longValue = 'a'.repeat(1000);
      
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, longValue);
      
      expect(mockOnSearchChange).toHaveBeenCalledWith(longValue);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      
      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
      
      // Tab to filter
      await user.tab();
      const filterButton = screen.getByText('All');
      expect(filterButton).toHaveFocus();
    });

    it('handles Enter key in search input', async () => {
      const user = userEvent.setup();
      render(<SearchAndFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'test{enter}');
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<SearchAndFilter {...defaultProps} />);
      
      // Re-render with same props
      rerender(<SearchAndFilter {...defaultProps} />);
      
      // Should not call callbacks during re-render
      expect(mockOnSearchChange).not.toHaveBeenCalled();
      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });
  });
});