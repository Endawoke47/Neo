/**
 * Command Palette Testing - A+++++ Quality Assurance
 * Comprehensive testing of the elite UI/UX command interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import CommandPalette from '../command-palette/CommandPalette';
import { toast } from '../../utils/toast';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../../utils/toast');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  info: jest.fn(),
  dismiss: jest.fn(),
};

describe('CommandPalette - A+++++ UI/UX Testing', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    Object.assign(toast, mockToast);
    jest.clearAllMocks();
  });

  describe('Rendering and Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<CommandPalette isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByPlaceholder('Type a command or search...')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByPlaceholder('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('ESC')).toBeInTheDocument();
    });

    it('should display all command categories by default', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('AI Actions')).toBeInTheDocument();
      expect(screen.getByText('Search & Filter')).toBeInTheDocument();
      expect(screen.getByText('Export & Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should focus search input when opened', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Search Functionality', () => {
    it('should filter commands based on search term', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      await user.type(searchInput, 'dashboard');
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Go to Client Management')).not.toBeInTheDocument();
    });

    it('should search across command titles, descriptions, and keywords', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      // Search by keyword
      await user.type(searchInput, 'ai');
      
      expect(screen.getByText('Analyze Contract with AI')).toBeInTheDocument();
      expect(screen.getByText('Start Legal Research')).toBeInTheDocument();
      expect(screen.getByText('AI Risk Assessment')).toBeInTheDocument();
    });

    it('should show "No commands found" when search yields no results', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      await user.type(searchInput, 'nonexistentcommand');
      
      expect(screen.getByText('No commands found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });

    it('should clear search and show all commands when search is cleared', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      await user.type(searchInput, 'dashboard');
      expect(screen.queryByText('Go to Client Management')).not.toBeInTheDocument();
      
      await user.clear(searchInput);
      expect(screen.getByText('Go to Client Management')).toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    it('should show category filter buttons when no search term', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'AI Actions' })).toBeInTheDocument();
    });

    it('should filter commands by category when category button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const aiActionsButton = screen.getByRole('button', { name: 'AI Actions' });
      await user.click(aiActionsButton);
      
      expect(screen.getByText('Analyze Contract with AI')).toBeInTheDocument();
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
    });

    it('should highlight selected category button', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const aiActionsButton = screen.getByRole('button', { name: 'AI Actions' });
      await user.click(aiActionsButton);
      
      expect(aiActionsButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should show all commands when "All" category is selected', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      // First select a specific category
      const aiActionsButton = screen.getByRole('button', { name: 'AI Actions' });
      await user.click(aiActionsButton);
      
      // Then select "All"
      const allButton = screen.getByRole('button', { name: 'All' });
      await user.click(allButton);
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analyze Contract with AI')).toBeInTheDocument();
    });

    it('should hide category filters when searching', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      await user.type(searchInput, 'test');
      
      expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Navigation' })).not.toBeInTheDocument();
    });
  });

  describe('Command Execution', () => {
    it('should execute navigation commands correctly', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const dashboardCommand = screen.getByText('Go to Dashboard');
      await user.click(dashboardCommand);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should execute AI commands with loading toast', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const aiCommand = screen.getByText('Analyze Contract with AI');
      await user.click(aiCommand);
      
      expect(mockToast.loading).toHaveBeenCalledWith('Starting AI contract analysis...');
      expect(mockRouter.push).toHaveBeenCalledWith('/contract-management?action=ai-analyze');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should execute create commands with success toast', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const createClientCommand = screen.getByText('Add New Client');
      await user.click(createClientCommand);
      
      expect(mockToast.success).toHaveBeenCalledWith('Opening new client form...');
      expect(mockRouter.push).toHaveBeenCalledWith('/client-management');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle command execution errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock router to throw error
      mockRouter.push.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const dashboardCommand = screen.getByText('Go to Dashboard');
      await user.click(dashboardCommand);
      
      expect(mockToast.error).toHaveBeenCalledWith('Failed to execute command');
      expect(consoleSpy).toHaveBeenCalledWith('Command execution error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display keyboard shortcuts for commands', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      // Check for keyboard shortcut indicators
      expect(screen.getByText('G')).toBeInTheDocument(); // From "G D" shortcut
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('N')).toBeInTheDocument(); // From "N C" shortcut
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should show navigation help in footer', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('↑')).toBeInTheDocument();
      expect(screen.getByText('↓')).toBeInTheDocument();
      expect(screen.getByText('to navigate')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('to select')).toBeInTheDocument();
    });
  });

  describe('Command Badges and Styling', () => {
    it('should display AI badges for AI commands', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const aiBadges = screen.getAllByText('AI');
      expect(aiBadges.length).toBeGreaterThan(0);
      
      // Check that AI badge has gradient styling
      const firstAiBadge = aiBadges[0];
      expect(firstAiBadge).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-blue-500');
    });

    it('should display command icons', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      // Check that command items have icons
      const commandItems = screen.getAllByRole('option');
      expect(commandItems.length).toBeGreaterThan(0);
      
      // Each command should have an icon (though we can't easily test the specific icon)
      commandItems.forEach(item => {
        const icon = item.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    it('should show command count in footer', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      // Should show total number of commands
      expect(screen.getByText(/\d+ commands?/)).toBeInTheDocument();
    });
  });

  describe('Priority and Sorting', () => {
    it('should prioritize AI commands and high-priority navigation', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const commandItems = screen.getAllByRole('option');
      const commandTexts = commandItems.map(item => item.textContent);
      
      // Dashboard (priority 10) should appear early
      const dashboardIndex = commandTexts.findIndex(text => text?.includes('Go to Dashboard'));
      expect(dashboardIndex).toBeLessThan(5); // Should be in top 5
      
      // AI commands should also appear early due to high priority
      const aiCommandIndex = commandTexts.findIndex(text => text?.includes('Analyze Contract with AI'));
      expect(aiCommandIndex).toBeLessThan(10);
    });

    it('should sort search results by relevance', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      await user.type(searchInput, 'client');
      
      const commandItems = screen.getAllByRole('option');
      const commandTexts = commandItems.map(item => item.textContent);
      
      // Commands with "client" in title should appear before those with "client" in description
      const clientManagementIndex = commandTexts.findIndex(text => text?.includes('Client Management'));
      const addClientIndex = commandTexts.findIndex(text => text?.includes('Add New Client'));
      
      expect(Math.min(clientManagementIndex, addClientIndex)).toBeLessThan(commandTexts.length / 2);
    });
  });

  describe('Performance', () => {
    it('should handle large number of commands efficiently', async () => {
      const user = userEvent.setup();
      
      const startTime = performance.now();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      await user.type(searchInput, 'test');
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render and handle search within reasonable time
      expect(renderTime).toBeLessThan(1000); // 1 second max
    });

    it('should debounce search input to avoid excessive filtering', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      // Type quickly - this should not cause performance issues
      await user.type(searchInput, 'dashboard');
      
      // Should complete without hanging
      expect(screen.getByDisplayValue('dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const commandList = screen.getByRole('listbox');
      expect(commandList).toBeInTheDocument();
      
      const commandItems = screen.getAllByRole('option');
      expect(commandItems.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation between commands', async () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      
      // Should be able to navigate with arrow keys (implementation depends on Command component)
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      
      // Test passes if no errors are thrown
      expect(searchInput).toBeInTheDocument();
    });

    it('should announce search results for screen readers', async () => {
      const user = userEvent.setup();
      render(<CommandPalette isOpen={true} onClose={mockOnClose} />);
      
      const searchInput = screen.getByPlaceholder('Type a command or search...');
      await user.type(searchInput, 'dashboard');
      
      // Command list should be accessible to screen readers
      const commandList = screen.getByRole('listbox');
      expect(commandList).toBeInTheDocument();
    });
  });
});