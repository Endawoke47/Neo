/**
 * AI Services API Integration Tests
 * Tests for AI analysis and processing endpoints
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import aiRoutes from '../routes/ai.routes';
import authRoutes from '../routes/auth-secure.routes';
import { errorHandler } from '../middleware/error.middleware';

// Mock Prisma client
const mockPrisma = {
  document: {
    findUnique: jest.fn(),
  },
  contract: {
    findUnique: jest.fn(),
  },
  aiAnalysis: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

// Mock database service
jest.mock('../services/database.service', () => ({
  prisma: mockPrisma,
}));

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock AI services
jest.mock('../services/ai-analysis.service', () => ({
  analyzeDocument: jest.fn(),
  analyzeContract: jest.fn(),
  generateLegalSummary: jest.fn(),
  extractKeyTerms: jest.fn(),
  classifyDocument: jest.fn(),
  detectRisks: jest.fn(),
}));

jest.mock('../services/ai-chat.service', () => ({
  processLegalQuery: jest.fn(),
  generateResponse: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/ai', aiRoutes);
  app.use(errorHandler);
  return app;
};

describe('AI Services API', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and get auth token
    const userData = {
      email: 'ai-test@counselflow.com',
      password: 'TestPassword123!',
      firstName: 'AI',
      lastName: 'Tester',
      confirmPassword: 'TestPassword123!',
    };

    testUserId = 'test-user-id';
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: testUserId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'ADMIN',
    });

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = loginResponse.body.tokens.accessToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/analyze/document', () => {
    const { analyzeDocument } = require('../services/ai-analysis.service');

    it('should analyze document successfully', async () => {
      const mockDocument = {
        id: 'doc-1',
        title: 'Contract Agreement',
        filePath: '/documents/contract.pdf',
        mimeType: 'application/pdf',
      };

      const mockAnalysisResult = {
        id: 'analysis-1',
        documentId: 'doc-1',
        analysisType: 'CONTENT_ANALYSIS',
        result: {
          summary: 'This is a commercial lease agreement between two parties.',
          keyTerms: ['lease term', 'rental amount', 'security deposit'],
          entities: [
            { type: 'PERSON', text: 'John Doe', confidence: 0.95 },
            { type: 'ORGANIZATION', text: 'ABC Corp', confidence: 0.92 },
          ],
          sentiment: { score: 0.1, label: 'NEUTRAL' },
          classification: {
            category: 'COMMERCIAL_LEASE',
            confidence: 0.88,
          },
          riskAssessment: {
            riskLevel: 'MEDIUM',
            riskScore: 0.6,
            riskFactors: ['Unclear termination clause', 'High penalty fees'],
          },
        },
        confidence: 0.87,
        processingTime: 2340,
        createdAt: new Date(),
      };

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      analyzeDocument.mockResolvedValue(mockAnalysisResult);
      mockPrisma.aiAnalysis.create.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/ai/analyze/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          analysisType: 'CONTENT_ANALYSIS',
          options: {
            extractEntities: true,
            performSentimentAnalysis: true,
            classifyDocument: true,
            assessRisks: true,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('keyTerms');
      expect(response.body.data).toHaveProperty('entities');
      expect(response.body.data).toHaveProperty('riskAssessment');
      expect(response.body.data.riskAssessment).toHaveProperty('riskLevel', 'MEDIUM');
    });

    it('should return 404 for non-existent document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ai/analyze/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'non-existent',
          analysisType: 'CONTENT_ANALYSIS',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Document not found');
    });

    it('should validate analysis type', async () => {
      const response = await request(app)
        .post('/api/ai/analyze/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          analysisType: 'INVALID_TYPE',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle AI service errors', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });
      analyzeDocument.mockRejectedValue(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/ai/analyze/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          analysisType: 'CONTENT_ANALYSIS',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle rate limiting for AI requests', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });

      // Make multiple requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/ai/analyze/document')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            documentId: 'doc-1',
            analysisType: 'CONTENT_ANALYSIS',
          })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/ai/analyze/contract', () => {
    const { analyzeContract } = require('../services/ai-analysis.service');

    it('should analyze contract successfully', async () => {
      const mockContract = {
        id: 'contract-1',
        title: 'Service Agreement',
        type: 'SERVICE_AGREEMENT',
      };

      const mockAnalysisResult = {
        id: 'analysis-2',
        contractId: 'contract-1',
        analysisType: 'RISK_ASSESSMENT',
        result: {
          riskScore: 0.3,
          riskLevel: 'LOW',
          keyFindings: [
            'Standard service terms',
            'Reasonable liability clauses',
            'Clear payment terms',
          ],
          recommendations: [
            'Consider adding force majeure clause',
            'Clarify intellectual property rights',
          ],
          complianceIssues: [],
          financialTerms: {
            totalValue: 50000,
            paymentSchedule: 'Monthly',
            penalties: ['Late payment: 1.5% per month'],
          },
          legalClauses: {
            termination: 'Standard 30-day notice',
            liability: 'Limited to contract value',
            governing_law: 'New York State',
          },
        },
        confidence: 0.91,
        processingTime: 1850,
        createdAt: new Date(),
      };

      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      analyzeContract.mockResolvedValue(mockAnalysisResult);
      mockPrisma.aiAnalysis.create.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/ai/analyze/contract')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'contract-1',
          analysisType: 'RISK_ASSESSMENT',
          jurisdiction: 'NY',
          focusAreas: ['liability', 'termination', 'payment'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('riskScore', 0.3);
      expect(response.body.data).toHaveProperty('riskLevel', 'LOW');
      expect(response.body.data).toHaveProperty('keyFindings');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('financialTerms');
      expect(response.body.data).toHaveProperty('legalClauses');
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ai/analyze/contract')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'non-existent',
          analysisType: 'RISK_ASSESSMENT',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });

    it('should validate analysis parameters', async () => {
      const response = await request(app)
        .post('/api/ai/analyze/contract')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'contract-1',
          analysisType: 'INVALID_TYPE',
          jurisdiction: 'INVALID_JURISDICTION',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('POST /api/ai/generate/summary', () => {
    const { generateLegalSummary } = require('../services/ai-analysis.service');

    it('should generate legal summary successfully', async () => {
      const mockSummaryResult = {
        id: 'summary-1',
        summary: 'This document outlines the terms and conditions for a commercial lease agreement between the landlord and tenant. Key provisions include rental amount, lease duration, maintenance responsibilities, and termination clauses.',
        keyPoints: [
          'Monthly rent: $5,000',
          'Lease term: 3 years',
          'Tenant responsible for utilities',
          'Landlord handles major repairs',
          '60-day notice required for termination',
        ],
        legalImplications: [
          'Standard commercial lease terms apply',
          'Tenant has limited termination rights',
          'Clear maintenance responsibility division',
        ],
        wordCount: 156,
        readingTime: '1 minute',
        confidence: 0.88,
        language: 'en',
        createdAt: new Date(),
      };

      const mockDocument = { id: 'doc-1', title: 'Lease Agreement' };
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      generateLegalSummary.mockResolvedValue(mockSummaryResult);

      const response = await request(app)
        .post('/api/ai/generate/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          summaryType: 'EXECUTIVE',
          maxLength: 200,
          focusAreas: ['financial_terms', 'legal_obligations'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('keyPoints');
      expect(response.body.data).toHaveProperty('legalImplications');
      expect(response.body.data).toHaveProperty('wordCount', 156);
      expect(response.body.data).toHaveProperty('readingTime', '1 minute');
    });

    it('should validate summary parameters', async () => {
      const response = await request(app)
        .post('/api/ai/generate/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          summaryType: 'INVALID_TYPE',
          maxLength: -1, // Invalid length
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('POST /api/ai/extract/terms', () => {
    const { extractKeyTerms } = require('../services/ai-analysis.service');

    it('should extract key terms successfully', async () => {
      const mockTermsResult = {
        id: 'terms-1',
        terms: [
          {
            term: 'rental amount',
            definition: 'The monthly payment due from tenant to landlord',
            category: 'FINANCIAL',
            importance: 'HIGH',
            frequency: 8,
            context: 'The rental amount shall be paid on the first day of each month',
          },
          {
            term: 'security deposit',
            definition: 'Refundable deposit held by landlord as security',
            category: 'FINANCIAL',
            importance: 'HIGH',
            frequency: 5,
            context: 'Security deposit equivalent to two months rent',
          },
          {
            term: 'force majeure',
            definition: 'Unforeseeable circumstances preventing contract fulfillment',
            category: 'LEGAL',
            importance: 'MEDIUM',
            frequency: 2,
            context: 'Force majeure events include natural disasters and government actions',
          },
        ],
        totalTerms: 3,
        categories: ['FINANCIAL', 'LEGAL'],
        confidence: 0.85,
        processingTime: 1200,
        createdAt: new Date(),
      };

      const mockDocument = { id: 'doc-1', title: 'Contract Terms' };
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      extractKeyTerms.mockResolvedValue(mockTermsResult);

      const response = await request(app)
        .post('/api/ai/extract/terms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          termTypes: ['FINANCIAL', 'LEGAL'],
          includeDefinitions: true,
          minImportance: 'MEDIUM',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('terms');
      expect(response.body.data.terms).toHaveLength(3);
      expect(response.body.data.terms[0]).toHaveProperty('term', 'rental amount');
      expect(response.body.data.terms[0]).toHaveProperty('definition');
      expect(response.body.data.terms[0]).toHaveProperty('category', 'FINANCIAL');
      expect(response.body.data).toHaveProperty('totalTerms', 3);
      expect(response.body.data).toHaveProperty('categories');
    });

    it('should validate extraction parameters', async () => {
      const response = await request(app)
        .post('/api/ai/extract/terms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          termTypes: ['INVALID_TYPE'],
          minImportance: 'INVALID_IMPORTANCE',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('POST /api/ai/classify/document', () => {
    const { classifyDocument } = require('../services/ai-analysis.service');

    it('should classify document successfully', async () => {
      const mockClassificationResult = {
        id: 'classification-1',
        documentId: 'doc-1',
        primaryCategory: 'CONTRACT',
        subcategory: 'COMMERCIAL_LEASE',
        confidence: 0.92,
        alternativeCategories: [
          { category: 'RENTAL_AGREEMENT', confidence: 0.78 },
          { category: 'REAL_ESTATE', confidence: 0.65 },
        ],
        features: [
          'Contains rental terms',
          'Mentions landlord and tenant',
          'Includes payment schedules',
          'References property details',
        ],
        language: 'en',
        documentType: 'LEGAL_DOCUMENT',
        complexity: 'MEDIUM',
        processingTime: 890,
        createdAt: new Date(),
      };

      const mockDocument = { id: 'doc-1', title: 'Unknown Document' };
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      classifyDocument.mockResolvedValue(mockClassificationResult);

      const response = await request(app)
        .post('/api/ai/classify/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          includeAlternatives: true,
          minConfidence: 0.7,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('primaryCategory', 'CONTRACT');
      expect(response.body.data).toHaveProperty('subcategory', 'COMMERCIAL_LEASE');
      expect(response.body.data).toHaveProperty('confidence', 0.92);
      expect(response.body.data).toHaveProperty('alternativeCategories');
      expect(response.body.data.alternativeCategories).toHaveLength(2);
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data).toHaveProperty('complexity', 'MEDIUM');
    });
  });

  describe('POST /api/ai/chat/legal', () => {
    const { processLegalQuery } = require('../services/ai-chat.service');

    it('should process legal query successfully', async () => {
      const mockChatResponse = {
        id: 'chat-1',
        query: 'What are the key elements of a valid contract?',
        response: 'A valid contract requires four essential elements: 1) Offer - A clear proposal from one party to another, 2) Acceptance - Unqualified agreement to the terms of the offer, 3) Consideration - Something of value exchanged between parties, and 4) Legal capacity - Both parties must have the legal ability to enter into the contract. Additionally, the contract must have a lawful purpose and proper form if required by law.',
        sources: [
          'Contract Law Fundamentals',
          'Restatement of Contracts',
          'Uniform Commercial Code',
        ],
        confidence: 0.94,
        responseType: 'LEGAL_EXPLANATION',
        jurisdiction: 'US',
        practiceArea: 'CONTRACT_LAW',
        relatedTopics: [
          'Contract Formation',
          'Contract Enforceability',
          'Contract Remedies',
        ],
        processingTime: 1456,
        createdAt: new Date(),
      };

      processLegalQuery.mockResolvedValue(mockChatResponse);

      const response = await request(app)
        .post('/api/ai/chat/legal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'What are the key elements of a valid contract?',
          jurisdiction: 'US',
          practiceArea: 'CONTRACT_LAW',
          includeSourcesourceReferences: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('query');
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('sources');
      expect(response.body.data).toHaveProperty('confidence', 0.94);
      expect(response.body.data).toHaveProperty('practiceArea', 'CONTRACT_LAW');
      expect(response.body.data).toHaveProperty('relatedTopics');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .post('/api/ai/chat/legal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: '', // Empty query
          jurisdiction: 'INVALID_JURISDICTION',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle inappropriate queries', async () => {
      const inappropriateQuery = 'How to commit fraud?';
      
      processLegalQuery.mockRejectedValue(new Error('Inappropriate query detected'));

      const response = await request(app)
        .post('/api/ai/chat/legal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: inappropriateQuery,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/ai/analysis/:id', () => {
    it('should return analysis by ID', async () => {
      const mockAnalysis = {
        id: 'analysis-1',
        documentId: 'doc-1',
        analysisType: 'CONTENT_ANALYSIS',
        result: {
          summary: 'Document analysis result',
          confidence: 0.87,
        },
        status: 'COMPLETED',
        processingTime: 2340,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aiAnalysis.findUnique.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .get('/api/ai/analysis/analysis-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 'analysis-1');
      expect(response.body.data).toHaveProperty('analysisType', 'CONTENT_ANALYSIS');
      expect(response.body.data).toHaveProperty('result');
    });

    it('should return 404 for non-existent analysis', async () => {
      mockPrisma.aiAnalysis.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ai/analysis/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Analysis not found');
    });
  });

  describe('GET /api/ai/analysis', () => {
    it('should return analysis history', async () => {
      const mockAnalyses = [
        {
          id: 'analysis-1',
          documentId: 'doc-1',
          analysisType: 'CONTENT_ANALYSIS',
          status: 'COMPLETED',
          confidence: 0.87,
          createdAt: new Date(),
        },
        {
          id: 'analysis-2',
          contractId: 'contract-1',
          analysisType: 'RISK_ASSESSMENT',
          status: 'COMPLETED',
          confidence: 0.91,
          createdAt: new Date(),
        },
      ];

      mockPrisma.aiAnalysis.findMany.mockResolvedValue(mockAnalyses);
      mockPrisma.aiAnalysis.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/ai/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('analysisType', 'CONTENT_ANALYSIS');
      expect(response.body.data[1]).toHaveProperty('analysisType', 'RISK_ASSESSMENT');
    });

    it('should support filtering by analysis type', async () => {
      const riskAnalyses = [
        {
          id: 'analysis-2',
          analysisType: 'RISK_ASSESSMENT',
          status: 'COMPLETED',
        },
      ];

      mockPrisma.aiAnalysis.findMany.mockResolvedValue(riskAnalyses);
      mockPrisma.aiAnalysis.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/ai/analysis?analysisType=RISK_ASSESSMENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('analysisType', 'RISK_ASSESSMENT');
    });
  });

  describe('GET /api/ai/statistics', () => {
    it('should return AI usage statistics', async () => {
      const mockStats = {
        totalAnalyses: 150,
        analysesThisMonth: 25,
        averageProcessingTime: 1850, // milliseconds
        analysesByType: {
          CONTENT_ANALYSIS: 60,
          RISK_ASSESSMENT: 45,
          CLASSIFICATION: 30,
          TERM_EXTRACTION: 15,
        },
        averageConfidence: 0.87,
        successRate: 0.96,
        totalProcessingTime: 277500, // milliseconds
        mostActiveUsers: [
          { userId: 'user-1', analyses: 45 },
          { userId: 'user-2', analyses: 32 },
        ],
      };

      mockPrisma.aiAnalysis.findMany.mockResolvedValue([mockStats]);

      const response = await request(app)
        .get('/api/ai/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalAnalyses', 150);
      expect(response.body.data).toHaveProperty('analysesThisMonth', 25);
      expect(response.body.data).toHaveProperty('analysesByType');
      expect(response.body.data).toHaveProperty('averageConfidence', 0.87);
      expect(response.body.data).toHaveProperty('successRate', 0.96);
    });
  });

  describe('Security and Performance Tests', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/ai/analyze/document' },
        { method: 'post', path: '/api/ai/analyze/contract' },
        { method: 'post', path: '/api/ai/generate/summary' },
        { method: 'post', path: '/api/ai/extract/terms' },
        { method: 'post', path: '/api/ai/classify/document' },
        { method: 'post', path: '/api/ai/chat/legal' },
        { method: 'get', path: '/api/ai/analysis' },
        { method: 'get', path: '/api/ai/statistics' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should handle AI service timeouts gracefully', async () => {
      const { analyzeDocument } = require('../services/ai-analysis.service');
      
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });
      analyzeDocument.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 1000)
        )
      );

      const response = await request(app)
        .post('/api/ai/analyze/document')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentId: 'doc-1',
          analysisType: 'CONTENT_ANALYSIS',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize input data', async () => {
      const { processLegalQuery } = require('../services/ai-chat.service');

      const maliciousQuery = '<script>alert("xss")</script> What is contract law?';

      processLegalQuery.mockResolvedValue({
        id: 'chat-1',
        query: 'scriptalert("xss")/script What is contract law?', // Sanitized
        response: 'Contract law governs agreements between parties...',
        confidence: 0.9,
      });

      const response = await request(app)
        .post('/api/ai/chat/legal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: maliciousQuery,
        })
        .expect(200);

      // Verify the query was sanitized
      expect(response.body.data.query).not.toContain('<script>');
    });

    it('should implement proper rate limiting for AI requests', async () => {
      const { analyzeDocument } = require('../services/ai-analysis.service');
      
      mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });
      analyzeDocument.mockResolvedValue({ id: 'analysis-1', result: {} });

      // Make many requests quickly
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/ai/analyze/document')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            documentId: 'doc-1',
            analysisType: 'CONTENT_ANALYSIS',
          })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});