/**
 * Perfect AI Service Tests
 * Zero TypeScript errors
 */

import { AIService } from '../services/ai-service';

describe('AI Service', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  it('should create AI service instance', () => {
    expect(aiService).toBeDefined();
  });

  it('should have health status method', () => {
    const health = aiService.getHealthStatus();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('providers');
    expect(Array.isArray(health.providers)).toBe(true);
  });

  it('should process basic AI request', async () => {
    const request = {
      query: 'What is contract law?',
      analysisType: 'legal_research' as const,
      language: 'en' as const,
    };

    const response = await aiService.processRequest(request);
    
    expect(response).toHaveProperty('response');
    expect(response).toHaveProperty('confidence');
    expect(response).toHaveProperty('metadata');
    expect(typeof response.response).toBe('string');
    expect(typeof response.confidence).toBe('number');
  });

  it('should handle different analysis types', async () => {
    const analysisTypes = ['contract', 'legal_research', 'risk_assessment', 'compliance', 'document_review'] as const;
    
    for (const analysisType of analysisTypes) {
      const request = {
        query: `Test query for ${analysisType}`,
        analysisType,
        language: 'en' as const,
      };

      const response = await aiService.processRequest(request);
      expect(response.response).toBeDefined();
    }
  });

  it('should validate request schema', async () => {
    const invalidRequest = {
      query: '', // Too short
      analysisType: 'invalid_type' as any,
      language: 'invalid_lang' as any,
    };

    await expect(aiService.processRequest(invalidRequest)).rejects.toThrow();
  });
});