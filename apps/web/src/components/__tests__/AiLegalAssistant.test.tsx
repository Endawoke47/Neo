/**
 * AI Legal Assistant Component Tests
 * Testing the real AI chat interface functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AiLegalAssistant from '../AiLegalAssistant';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('AiLegalAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders the AI Legal Assistant interface', () => {
    render(<AiLegalAssistant />);
    
    expect(screen.getByText('AI Legal Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm your AI Legal Assistant/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me about legal matters/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays initial welcome message', () => {
    render(<AiLegalAssistant />);
    
    expect(screen.getByText(/Hello! I'm your AI Legal Assistant/)).toBeInTheDocument();
    expect(screen.getByText(/What can I assist you with today/)).toBeInTheDocument();
  });

  it('shows analysis type selector with all options', () => {
    render(<AiLegalAssistant />);
    
    const analysisSelect = screen.getByDisplayValue('Legal Research');
    expect(analysisSelect).toBeInTheDocument();
    
    // Check all analysis type options are present
    fireEvent.click(analysisSelect);
    expect(screen.getByText('Contract Analysis')).toBeInTheDocument();
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('Compliance Check')).toBeInTheDocument();
    expect(screen.getByText('Document Review')).toBeInTheDocument();
  });

  it('shows jurisdiction input field', () => {
    render(<AiLegalAssistant />);
    
    const jurisdictionInput = screen.getByPlaceholderText('e.g., nigeria, uae');
    expect(jurisdictionInput).toBeInTheDocument();
  });

  it('sends message when send button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response to your legal question.',
          confidence: 0.85,
          metadata: {
            provider: 'openai',
            tokensUsed: 150,
            processingTime: 1500,
          },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'What are the corporate formation requirements in Nigeria?');
    await userEvent.click(sendButton);

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        query: 'What are the corporate formation requirements in Nigeria?',
        analysisType: 'legal_research',
        jurisdiction: undefined,
        language: 'en',
      }),
    });
  });

  it('sends message when Enter key is pressed', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    
    await userEvent.type(input, 'Test question');
    await userEvent.keyboard('{Enter}');

    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not send message when Shift+Enter is pressed', async () => {
    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    
    await userEvent.type(input, 'Test question');
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('includes jurisdiction when specified', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const jurisdictionInput = screen.getByPlaceholderText('e.g., nigeria, uae');
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(jurisdictionInput, 'nigeria');
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        query: 'Test question',
        analysisType: 'legal_research',
        jurisdiction: 'nigeria',
        language: 'en',
      }),
    });
  });

  it('changes analysis type when selector is changed', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const analysisSelect = screen.getByDisplayValue('Legal Research');
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.selectOptions(analysisSelect, 'contract');
    await userEvent.type(input, 'Test contract question');
    await userEvent.click(sendButton);

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        query: 'Test contract question',
        analysisType: 'contract',
        jurisdiction: undefined,
        language: 'en',
      }),
    });
  });

  it('displays AI response in the chat', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'This is the AI response to your legal question.',
          confidence: 0.85,
          metadata: {
            provider: 'openai',
            tokensUsed: 150,
            processingTime: 1500,
          },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('This is the AI response to your legal question.')).toBeInTheDocument();
    });

    // Check metadata is displayed
    expect(screen.getByText(/Provider: openai/)).toBeInTheDocument();
    expect(screen.getByText(/Tokens: 150/)).toBeInTheDocument();
    expect(screen.getByText(/Time: 1500ms/)).toBeInTheDocument();
  });

  it('displays confidence badge for AI responses', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });
  });

  it('shows loading state when processing request', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValue(pendingPromise);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    // Check loading state
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
    expect(input).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/I apologize, but I encountered an error/)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/I apologize, but I encountered an error/)).toBeInTheDocument();
    });
  });

  it('disables send button when input is empty', () => {
    render(<AiLegalAssistant />);
    
    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has content', async () => {
    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    expect(sendButton).not.toBeDisabled();
  });

  it('clears input after sending message', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          response: 'AI response',
          confidence: 0.85,
          metadata: { provider: 'openai', tokensUsed: 100, processingTime: 1000 },
        },
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/) as HTMLInputElement;
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'Test question');
    expect(input.value).toBe('Test question');
    
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('displays user messages with correct styling', async () => {
    render(<AiLegalAssistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about legal matters/);
    const sendButton = screen.getByRole('button');
    
    await userEvent.type(input, 'User question');
    await userEvent.click(sendButton);

    const userMessage = screen.getByText('User question');
    expect(userMessage).toBeInTheDocument();
    expect(userMessage.closest('.bg-blue-600')).toBeInTheDocument();
  });
});