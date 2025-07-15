/**
 * useApi Hook Tests
 * Tests for the API hook functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../lib/api-client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should handle successful API call', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      let response;
      await act(async () => {
        response = await result.current.get('/test');
      });

      expect(response).toEqual(mockData);
      expect(mockApiClient.get).toHaveBeenCalledWith('/test');
    });

    it('should handle API error', async () => {
      const mockError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get('/test');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/test');
    });
  });

  describe('Loading State', () => {
    it('should track loading state during API call', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockData }), 100))
      );

      const { result } = renderHook(() => useApi());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.get('/test');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should reset loading state on error', async () => {
      const mockError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get('/test');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.get.mockRejectedValue(networkError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get('/test');
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });
    });

    it('should handle HTTP errors', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      };
      mockApiClient.get.mockRejectedValue(httpError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get('/test');
        } catch (error) {
          expect(error).toBe(httpError);
        }
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.get('/test');
        } catch (error) {
          expect(error).toBe(timeoutError);
        }
      });
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const mockData = { id: 1 };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.get('/test');
        expect(response).toEqual(mockData);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/test');
    });

    it('should handle POST requests', async () => {
      const mockData = { id: 1, name: 'Created' };
      const postData = { name: 'New Item' };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.post('/test', postData);
        expect(response).toEqual(mockData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/test', postData);
    });

    it('should handle PUT requests', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated Item' };
      mockApiClient.put.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.put('/test/1', putData);
        expect(response).toEqual(mockData);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('/test/1', putData);
    });

    it('should handle DELETE requests', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.delete('/test/1');
        expect(response).toEqual({ success: true });
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/test/1');
    });
  });

  describe('Request Options', () => {
    it('should pass through request options', async () => {
      const mockData = { id: 1 };
      const options = { 
        headers: { 'Custom-Header': 'value' },
        timeout: 5000 
      };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get('/test', options);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/test', options);
    });

    it('should handle authentication headers', async () => {
      const mockData = { id: 1 };
      const options = { 
        headers: { 'Authorization': 'Bearer token123' }
      };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get('/protected', options);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/protected', options);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };
      
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockData1 })
        .mockResolvedValueOnce({ data: mockData2 });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const [response1, response2] = await Promise.all([
          result.current.get('/test1'),
          result.current.get('/test2')
        ]);

        expect(response1).toEqual(mockData1);
        expect(response2).toEqual(mockData2);
      });

      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and error responses', async () => {
      const mockData = { id: 1 };
      const mockError = new Error('API Error');
      
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockData })
        .mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const results = await Promise.allSettled([
          result.current.get('/test1'),
          result.current.get('/test2')
        ]);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
      });
    });
  });

  describe('Data Transformation', () => {
    it('should extract data from response', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        data: mockData,
        status: 200,
        headers: {},
        config: {}
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.get('/test');
        expect(response).toEqual(mockData);
      });
    });

    it('should handle empty response data', async () => {
      mockApiClient.get.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.get('/test');
        expect(response).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined response', async () => {
      mockApiClient.get.mockResolvedValue(undefined);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.get('/test');
        expect(response).toBeUndefined();
      });
    });

    it('should handle malformed response', async () => {
      const malformedResponse = { notData: 'value' };
      mockApiClient.get.mockResolvedValue(malformedResponse);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const response = await result.current.get('/test');
        expect(response).toBeUndefined();
      });
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks on unmount', async () => {
      const mockData = { id: 1 };
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockData }), 100))
      );

      const { result, unmount } = renderHook(() => useApi());

      act(() => {
        result.current.get('/test');
      });

      // Unmount before request completes
      unmount();

      // Should not cause errors
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });
    });
  });
});