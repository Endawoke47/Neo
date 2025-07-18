/**
 * AI Routes Integration Tests
 * End-to-end testing for AI API endpoints
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import aiRoutes from '../routes/ai.routes.simple';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

// Mock the AI service
jest.mock('../services/ai-service', () => ({
  aiService: {
    processRequest: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

// Mock the authentication middleware for testing
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'PARTNER',
    };
    next();
  },
}));

describe('AI Routes Integration Tests', () => {
  let app: express.Application;
  let mockAIService: any;

  beforeEach(() => {
    // Create test app
    app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/api/v1/ai', aiRoutes);
    app.use(errorHandler);

    // Get mock AI service
    mockAIService = require('../services/ai-service').aiService;
    jest.clearAllMocks();
  });

  describe('POST /api/v1/ai/analyze', () => {
    it('should process a valid AI analysis request', async () => {
      const mockResponse = {
        response: 'This is a test AI response about Nigerian corporate law.',
        confidence: 0.85,
        metadata: {
          provider: 'openai',
          tokensUsed: 120,
          processingTime: 1500,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'What are the requirements for forming a corporation in Nigeria?',
        analysisType: 'legal_research',
        jurisdiction: 'nigeria',
        language: 'en',
      };

      const response = await request(app)
        .post('/api/v1/ai/analyze')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(response.body.timestamp).toBeDefined();
      expect(mockAIService.processRequest).toHaveBeenCalledWith(requestBody);
    });

    it('should handle AI service errors', async () => {
      mockAIService.processRequest.mockRejectedValue(new Error('AI service error'));

      const requestBody = {
        query: 'Test query that will fail',
        analysisType: 'legal_research',
      };

      const response = await request(app)
        .post('/api/v1/ai/analyze')
        .send(requestBody)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      // Mock authentication middleware to reject
      jest.doMock('../middleware/auth.middleware', () => ({
        authenticate: (req: any, res: any, next: any) => {
          res.status(401).json({ success: false, message: 'Unauthorized' });
        },
      }));

      const requestBody = {
        query: 'Test query',
        analysisType: 'legal_research',
      };

      await request(app)
        .post('/api/v1/ai/analyze')
        .send(requestBody)
        .expect(401);
    });
  });

  describe('POST /api/v1/ai/contract/analyze', () => {
    it('should analyze a contract with enhanced response structure', async () => {
      const mockResponse = {
        response: 'Contract analysis shows moderate risk due to unclear termination clauses.',
        confidence: 0.78,
        metadata: {
          provider: 'anthropic',
          tokensUsed: 200,
          processingTime: 2000,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'Please analyze this employment contract for legal issues.',
        jurisdiction: 'uae',
        language: 'en',
      };

      const response = await request(app)
        .post('/api/v1/ai/contract/analyze')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(mockResponse.response);
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.riskLevel).toBeDefined();
      expect(response.body.data.analysis.keyTerms).toBeInstanceOf(Array);
      expect(response.body.data.analysis.recommendations).toBeInstanceOf(Array);

      // Verify the request was modified to include analysisType
      expect(mockAIService.processRequest).toHaveBeenCalledWith({
        ...requestBody,
        analysisType: 'contract',
      });
    });
  });

  describe('POST /api/v1/ai/research', () => {
    it('should process legal research requests', async () => {
      const mockResponse = {
        response: 'Legal research on corporate governance in South Africa...',
        confidence: 0.92,
        metadata: {
          provider: 'openai',
          tokensUsed: 180,
          processingTime: 1800,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'What are the corporate governance requirements in South Africa?',
        jurisdiction: 'south-africa',
        language: 'en',
      };

      const response = await request(app)
        .post('/api/v1/ai/research')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockAIService.processRequest).toHaveBeenCalledWith({
        ...requestBody,
        analysisType: 'legal_research',
      });
    });
  });

  describe('POST /api/v1/ai/risk/assess', () => {
    it('should assess risks with enhanced analysis', async () => {
      const mockResponse = {
        response: 'Risk assessment indicates high compliance risk due to regulatory changes.',
        confidence: 0.88,
        metadata: {
          provider: 'anthropic',
          tokensUsed: 160,
          processingTime: 1600,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'Assess the risks of this business expansion into Kenya.',
        jurisdiction: 'kenya',
      };

      const response = await request(app)
        .post('/api/v1/ai/risk/assess')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.riskAnalysis).toBeDefined();
      expect(response.body.data.riskAnalysis.overallRisk).toBeDefined();
      expect(response.body.data.riskAnalysis.riskFactors).toBeInstanceOf(Array);
      expect(response.body.data.riskAnalysis.mitigationStrategies).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/ai/compliance/check', () => {
    it('should check compliance with enhanced response', async () => {
      const mockResponse = {
        response: 'Compliance check reveals non-compliant data handling practices.',
        confidence: 0.91,
        metadata: {
          provider: 'openai',
          tokensUsed: 140,
          processingTime: 1400,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'Check if our data processing practices comply with Nigerian data protection laws.',
        jurisdiction: 'nigeria',
      };

      const response = await request(app)
        .post('/api/v1/ai/compliance/check')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.compliance).toBeDefined();
      expect(response.body.data.compliance.status).toBeDefined();
      expect(response.body.data.compliance.issues).toBeInstanceOf(Array);
      expect(response.body.data.compliance.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/ai/document/review', () => {
    it('should review documents', async () => {
      const mockResponse = {
        response: 'Document review completed. Found several areas requiring attention.',
        confidence: 0.86,
        metadata: {
          provider: 'anthropic',
          tokensUsed: 220,
          processingTime: 2200,
        },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const requestBody = {
        query: 'Please review this lease agreement for completeness.',
        jurisdiction: 'egypt',
      };

      const response = await request(app)
        .post('/api/v1/ai/document/review')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockAIService.processRequest).toHaveBeenCalledWith({
        ...requestBody,
        analysisType: 'document_review',
      });
    });
  });

  describe('GET /api/v1/ai/health', () => {
    it('should return AI service health status', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        providers: [
          { name: 'openai', available: true },
          { name: 'anthropic', available: true },
          { name: 'local', available: false },
        ],
      };

      mockAIService.healthCheck.mockResolvedValue(mockHealthResponse);

      const response = await request(app)
        .get('/api/v1/ai/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHealthResponse);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle health check errors', async () => {
      mockAIService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      await request(app)
        .get('/api/v1/ai/health')
        .expect(500);
    });
  });

  describe('GET /api/v1/ai/jurisdictions', () => {
    it('should return supported jurisdictions', async () => {
      const response = await request(app)
        .get('/api/v1/ai/jurisdictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jurisdictions).toBeInstanceOf(Array);
      expect(response.body.data.jurisdictions.length).toBeGreaterThan(0);
      
      // Check for specific jurisdictions
      expect(response.body.data.jurisdictions).toContain('nigeria');
      expect(response.body.data.jurisdictions).toContain('uae');
      expect(response.body.data.jurisdictions).toContain('south-africa');
    });
  });

  describe('GET /api/v1/ai/languages', () => {
    it('should return supported languages', async () => {
      const response = await request(app)
        .get('/api/v1/ai/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.languages).toBeInstanceOf(Array);
      expect(response.body.data.languages.length).toBeGreaterThan(0);
      
      // Check language structure
      const englishLang = response.body.data.languages.find((lang: any) => lang.code === 'en');
      expect(englishLang).toBeDefined();
      expect(englishLang.name).toBe('English');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/v1/ai/analyze')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing request body', async () => {
      await request(app)
        .post('/api/v1/ai/analyze')
        .expect(500); // Will be validation error from AI service
    });

    it('should handle very large request bodies', async () => {
      const largeQuery = 'a'.repeat(10000); // Very large query
      
      await request(app)
        .post('/api/v1/ai/analyze')
        .send({ query: largeQuery, analysisType: 'legal_research' })
        .expect(500); // Should be rejected by validation
    });
  });

  describe('Response format validation', () => {
    it('should always include success, data, and timestamp fields', async () => {
      const mockResponse = {
        response: 'Test response',
        confidence: 0.85,
        metadata: { provider: 'test', tokensUsed: 100, processingTime: 1000 },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/ai/analyze')
        .send({ query: 'test query', analysisType: 'legal_research' })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should include enhanced analysis for contract analysis', async () => {
      const mockResponse = {
        response: 'Contract analysis response',
        confidence: 0.75,
        metadata: { provider: 'test', tokensUsed: 100, processingTime: 1000 },
      };

      mockAIService.processRequest.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/ai/contract/analyze')
        .send({ query: 'test contract', jurisdiction: 'nigeria' })
        .expect(200);

      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.riskLevel).toMatch(/^(low|medium|high)$/);
    });
  });
});