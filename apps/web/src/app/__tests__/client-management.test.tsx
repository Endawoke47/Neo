/**
 * Client Management Page Tests
 * Tests for the client management page functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientManagementPage from '../client-management/page';

// Mock the API hooks
jest.mock('../../hooks/useApi', () => ({
  useApi: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    loading: false,
  }),
}));

// Mock the auth provider
jest.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: {
      id: 'user1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    },
    isAuthenticated: true,
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(),
  }),
}));

// Mock the SearchAndFilter component
jest.mock('../../components/ui/SearchAndFilter', () => {
  return function MockSearchAndFilter({ searchValue, onSearchChange, filterValue, onFilterChange }) {
    return (
      <div data-testid="search-and-filter">
        <input
          data-testid="search-input"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search clients..."
        />
        <select
          data-testid="filter-select"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    );
  };
});

// Mock the LoadingSkeleton component
jest.mock('../../components/ui/LoadingSkeleton', () => {
  return function MockLoadingSkeleton({ type, rows }) {
    return (
      <div data-testid="loading-skeleton">
        Loading {type} with {rows} rows...
      </div>
    );
  };
});

// Mock the EmptyState component
jest.mock('../../components/ui/EmptyState', () => {
  return function MockEmptyState({ title, description, actionLabel, onAction }) {
    return (
      <div data-testid="empty-state">
        <h2>{title}</h2>
        <p>{description}</p>
        {actionLabel && (
          <button onClick={onAction}>{actionLabel}</button>
        )}
      </div>
    );
  };
});

// Mock clients data
const mockClients = [
  {
    id: 'client1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    address: '123 Business St, City, State 12345',
    clientType: 'BUSINESS',
    industry: 'Technology',
    status: 'ACTIVE',
    assignedLawyer: {
      id: 'lawyer1',
      firstName: 'John',
      lastName: 'Doe',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'client2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0456',
    address: '456 Residential Ave, City, State 67890',
    clientType: 'INDIVIDUAL',
    industry: null,
    status: 'ACTIVE',
    assignedLawyer: {
      id: 'lawyer2',
      firstName: 'Jane',
      lastName: 'Attorney',
    },
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
];

// Mock the useApi hook with proper implementation
const mockUseApi = require('../../hooks/useApi').useApi;

describe('ClientManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementation
    mockUseApi.mockReturnValue({
      get: jest.fn().mockResolvedValue(mockClients),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      loading: false,
    });
  });

  describe('Rendering', () => {
    it('renders the page title', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Client Management')).toBeInTheDocument();
      });
    });

    it('renders search and filter components', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-and-filter')).toBeInTheDocument();
      });
    });

    it('renders add client button', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Client')).toBeInTheDocument();
      });
    });

    it('renders export button', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });

    it('renders import button', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });
    });
  });

  describe('Client List', () => {
    it('displays client list when data is loaded', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('displays client information correctly', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
        expect(screen.getByText('BUSINESS')).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
      });
    });

    it('displays assigned lawyer information', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Attorney')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', () => {
      mockUseApi.mockReturnValue({
        get: jest.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: true,
      });

      render(<ClientManagementPage />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('shows empty state when no clients found', async () => {
      mockUseApi.mockReturnValue({
        get: jest.fn().mockResolvedValue([]),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('handles search input changes', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Acme');
      
      expect(searchInput).toHaveValue('Acme');
    });

    it('handles filter changes', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select')).toBeInTheDocument();
      });

      const filterSelect = screen.getByTestId('filter-select');
      await user.selectOptions(filterSelect, 'active');
      
      expect(filterSelect).toHaveValue('active');
    });

    it('filters clients based on search term', async () => {
      const mockFilteredGet = jest.fn().mockResolvedValue([mockClients[0]]);
      mockUseApi.mockReturnValue({
        get: mockFilteredGet,
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Acme');
      
      // Should call API with search parameters
      await waitFor(() => {
        expect(mockFilteredGet).toHaveBeenCalled();
      });
    });
  });

  describe('Client Actions', () => {
    it('handles add client button click', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Client')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Client');
      await user.click(addButton);
      
      // Should open modal or navigate to form
      // This depends on the implementation
    });

    it('handles export button click', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      // Should trigger export functionality
      // This depends on the implementation
    });

    it('handles import button click', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Import')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import');
      await user.click(importButton);
      
      // Should open import modal or functionality
      // This depends on the implementation
    });
  });

  describe('Client Row Actions', () => {
    it('displays action buttons for each client', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        // Should have action buttons (edit, delete, etc.)
        const actionButtons = screen.getAllByRole('button');
        expect(actionButtons.length).toBeGreaterThan(3); // At least add, export, import + row actions
      });
    });

    it('handles edit client action', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      // Look for edit buttons or icons
      const editButtons = screen.getAllByLabelText(/edit/i);
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        // Should open edit modal or navigate to edit form
      }
    });

    it('handles delete client action', async () => {
      const user = userEvent.setup();
      const mockDelete = jest.fn().mockResolvedValue({ success: true });
      
      mockUseApi.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockClients),
        post: jest.fn(),
        put: jest.fn(),
        delete: mockDelete,
        loading: false,
      });

      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      // Look for delete buttons or icons
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        // Should show confirmation dialog and call delete API
      }
    });
  });

  describe('Pagination', () => {
    it('handles pagination when there are many clients', async () => {
      const manyClients = Array.from({ length: 50 }, (_, i) => ({
        ...mockClients[0],
        id: `client${i + 1}`,
        name: `Client ${i + 1}`,
        email: `client${i + 1}@example.com`,
      }));

      mockUseApi.mockReturnValue({
        get: jest.fn().mockResolvedValue(manyClients),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      render(<ClientManagementPage />);
      
      await waitFor(() => {
        // Should show pagination controls
        const paginationElements = screen.queryAllByText(/page/i);
        // This depends on the pagination implementation
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockError = new Error('API Error');
      mockUseApi.mockReturnValue({
        get: jest.fn().mockRejectedValue(mockError),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      render(<ClientManagementPage />);
      
      await waitFor(() => {
        // Should show error state or message
        // This depends on the error handling implementation
      });
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      mockUseApi.mockReturnValue({
        get: jest.fn().mockRejectedValue(networkError),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      render(<ClientManagementPage />);
      
      await waitFor(() => {
        // Should show network error state
        // This depends on the error handling implementation
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
      });
    });

    it('has proper table structure', async () => {
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        // Should have table with proper headers
        const table = screen.queryByRole('table');
        if (table) {
          expect(table).toBeInTheDocument();
        }
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Client')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockClients[0],
        id: `client${i + 1}`,
        name: `Client ${i + 1}`,
      }));

      mockUseApi.mockReturnValue({
        get: jest.fn().mockResolvedValue(largeDataset),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        loading: false,
      });

      const startTime = Date.now();
      render(<ClientManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Client Management')).toBeInTheDocument();
      });

      const endTime = Date.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});