/**
 * AI Service Unit Tests
 * Comprehensive testing for the simplified AI service
 */

import { AIService } from '../services/ai-service';

// Mock environment variables
const mockEnv = {
  OPENAI_API_KEY: 'test-openai-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  NODE_ENV: 'test',
};

// Mock the environment module
jest.mock('../config/environment', () => ({
  env: mockEnv,
  features: {
    ai: {
      openai: true,
      anthropic: true,
      google: false,
    },
  },
}));

// Mock the logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'This is a test AI response for legal analysis.',
              },
            },
          ],
          usage: {
            total_tokens: 150,
          },
        }),
      },
    },
  })),
}));

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'This is a test Anthropic response for legal analysis.',
          },
        ],
        usage: {
          input_tokens: 50,
          output_tokens: 100,
        },
      }),
    },
  })),
}));

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('processRequest', () => {
    it('should process a valid legal research request', async () => {
      const request = {
        query: 'What are the requirements for forming a corporation in Nigeria?',
        analysisType: 'legal_research',
        jurisdiction: 'nigeria',
        language: 'en',
      };

      const response = await aiService.processRequest(request);

      expect(response).toBeDefined();
      expect(response.response).toBe('This is a test AI response for legal analysis.');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.provider).toBe('openai');
      expect(response.metadata.tokensUsed).toBe(150);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should process a contract analysis request', async () => {
      const request = {
        query: 'Please review this employment contract for potential issues.',
        analysisType: 'contract',
        jurisdiction: 'uae',
        language: 'en',
      };

      const response = await aiService.processRequest(request);

      expect(response).toBeDefined();
      expect(response.response).toContain('legal analysis');
      expect(response.metadata.provider).toBe('openai');
    });

    it('should process a risk assessment request', async () => {
      const request = {
        query: 'Assess the legal risks of this business structure.',
        analysisType: 'risk_assessment',
        language: 'en',
      };

      const response = await aiService.processRequest(request);

      expect(response).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should validate input and reject invalid requests', async () => {
      const invalidRequest = {
        query: '', // Empty query should fail
        analysisType: 'legal_research',
      };

      await expect(aiService.processRequest(invalidRequest)).rejects.toThrow();
    });

    it('should reject query that is too long', async () => {
      const longQuery = 'a'.repeat(6000); // Exceeds 5000 character limit
      const request = {
        query: longQuery,
        analysisType: 'legal_research',
      };

      await expect(aiService.processRequest(request)).rejects.toThrow();
    });

    it('should handle invalid analysis type', async () => {
      const request = {
        query: 'Valid query',
        analysisType: 'invalid_type', // Invalid analysis type
      };

      await expect(aiService.processRequest(request)).rejects.toThrow();
    });

    it('should handle invalid language', async () => {
      const request = {
        query: 'Valid query',
        analysisType: 'legal_research',
        language: 'invalid', // Invalid language
      };

      await expect(aiService.processRequest(request)).rejects.toThrow();
    });

    it('should use cache for repeated requests', async () => {
      const request = {
        query: 'What are corporate formation requirements?',
        analysisType: 'legal_research',
        jurisdiction: 'nigeria',
        language: 'en',
      };

      // First request
      const response1 = await aiService.processRequest(request);
      
      // Second identical request (should be cached)
      const response2 = await aiService.processRequest(request);

      expect(response1.response).toBe(response2.response);
      expect(response1.metadata.tokensUsed).toBe(response2.metadata.tokensUsed);
    });

    it('should default to english language when not specified', async () => {
      const request = {
        query: 'Legal question without language specified',
        analysisType: 'legal_research',
      };

      const response = await aiService.processRequest(request);
      expect(response).toBeDefined();
    });

    it('should default to legal_research when analysis type not specified', async () => {
      const request = {
        query: 'Legal question without analysis type',
      };

      const response = await aiService.processRequest(request);
      expect(response).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return health status with available providers', async () => {
      const health = await aiService.healthCheck();

      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.providers).toBeInstanceOf(Array);
      expect(health.providers.length).toBeGreaterThan(0);
      
      const openaiProvider = health.providers.find(p => p.name === 'openai');
      expect(openaiProvider).toBeDefined();
      expect(openaiProvider?.available).toBe(true);
    });

    it('should return degraded status when no providers available', async () => {
      // Mock environment without API keys
      jest.doMock('../config/environment', () => ({
        env: { ...mockEnv, OPENAI_API_KEY: undefined, ANTHROPIC_API_KEY: undefined },
        features: {
          ai: {
            openai: false,
            anthropic: false,
            google: false,
          },
        },
      }));

      const degradedService = new AIService();
      const health = await degradedService.healthCheck();

      expect(health.status).toBe('degraded');
    });
  });

  describe('error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        },
      }));

      const request = {
        query: 'Test query that will fail',
        analysisType: 'legal_research',
      };

      await expect(aiService.processRequest(request)).rejects.toThrow();
    });

    it('should try fallback provider when primary fails', async () => {
      // Mock OpenAI to fail and Anthropic to succeed
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        },
      }));

      const request = {
        query: 'Test query for fallback',
        analysisType: 'legal_research',
      };

      const response = await aiService.processRequest(request);
      
      expect(response).toBeDefined();
      expect(response.metadata.provider).toBe('anthropic');
    });
  });

  describe('caching', () => {
    it('should cache responses and serve from cache', async () => {
      const request = {
        query: 'Cached query test',
        analysisType: 'legal_research',
        jurisdiction: 'nigeria',
        language: 'en',
      };

      // First request - should hit API
      const startTime = Date.now();
      const response1 = await aiService.processRequest(request);
      const firstRequestTime = Date.now() - startTime;

      // Second request - should be cached (much faster)
      const startTime2 = Date.now();
      const response2 = await aiService.processRequest(request);
      const secondRequestTime = Date.now() - startTime2;

      expect(response1.response).toBe(response2.response);
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });

    it('should generate different cache keys for different requests', async () => {
      const request1 = {
        query: 'First query',
        analysisType: 'legal_research',
      };

      const request2 = {
        query: 'Second query',
        analysisType: 'contract',
      };

      const response1 = await aiService.processRequest(request1);
      const response2 = await aiService.processRequest(request2);

      // Responses should be different since queries are different
      expect(response1.response).not.toBe(response2.response);
    });
  });

  describe('input validation edge cases', () => {
    it('should handle context parameter', async () => {
      const request = {
        query: 'Query with context',
        analysisType: 'legal_research',
        context: {
          documentType: 'contract',
          industry: 'technology',
        },
      };

      const response = await aiService.processRequest(request);
      expect(response).toBeDefined();
    });

    it('should handle whitespace-only query', async () => {
      const request = {
        query: '   \n\t   ',
        analysisType: 'legal_research',
      };

      await expect(aiService.processRequest(request)).rejects.toThrow();
    });

    it('should handle special characters in query', async () => {
      const request = {
        query: 'Query with special chars: @#$%^&*()[]{}|\\:";\'<>?,./`~',
        analysisType: 'legal_research',
      };

      const response = await aiService.processRequest(request);
      expect(response).toBeDefined();
    });
  });
});