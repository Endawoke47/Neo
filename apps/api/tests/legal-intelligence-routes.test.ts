// Legal Intelligence API Routes Integration Tests
// Phase 2: Feature 3 - REST API Testing

import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { router as legalIntelligenceRoutes } from '../src/routes/legal-intelligence.routes';
import {
  IntelligenceType,
  AnalyticsPeriod,
  VisualizationType
} from '../src/types/legal-intelligence.types';
import { LegalJurisdiction, SupportedLanguage } from '../src/types/ai.types';
import { LegalArea } from '../src/types/legal-research.types';

describe('Legal Intelligence API Routes', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/intelligence', legalIntelligenceRoutes);
  });

  describe('POST /api/intelligence/analyze', () => {
    const validRequest = {
      analysisTypes: [IntelligenceType.TREND_ANALYSIS],
      jurisdictions: [LegalJurisdiction.NIGERIA],
      legalAreas: [LegalArea.CORPORATE],
      period: AnalyticsPeriod.LAST_6_MONTHS,
      filters: {},
      insights: {
        includeRecommendations: true,
        includePredictions: true,
        includeComparisons: true,
        includeTrends: true,
        includeAlerts: true,
        detailLevel: 'detailed',
        visualizations: [VisualizationType.LINE_CHART]
      },
      language: SupportedLanguage.ENGLISH,
      confidentialityLevel: 'public'
    };

    it('should return 200 with valid request', async () => {
      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.analysisId).toBeDefined();
      expect(response.body.data.requestSummary).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return 400 for missing analysis types', async () => {
      const invalidRequest = {
        ...validRequest,
        analysisTypes: []
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('analysisTypes');
    });

    it('should return 400 for missing jurisdictions', async () => {
      const invalidRequest = {
        ...validRequest,
        jurisdictions: []
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('jurisdictions');
    });

    it('should return 400 for missing legal areas', async () => {
      const invalidRequest = {
        ...validRequest,
        legalAreas: []
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('legalAreas');
    });

    it('should handle multiple analysis types', async () => {
      const multiTypeRequest = {
        ...validRequest,
        analysisTypes: [
          IntelligenceType.TREND_ANALYSIS,
          IntelligenceType.PREDICTIVE_MODELING,
          IntelligenceType.RISK_INTELLIGENCE
        ]
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(multiTypeRequest);

      expect(response.status).toBe(200);
      expect(response.body.data.trendAnalysis).toBeDefined();
      expect(response.body.data.predictiveInsights).toBeDefined();
      expect(response.body.data.riskIntelligence).toBeDefined();
    });

    it('should handle multiple jurisdictions', async () => {
      const multiJurisdictionRequest = {
        ...validRequest,
        jurisdictions: [
          LegalJurisdiction.NIGERIA,
          LegalJurisdiction.SOUTH_AFRICA,
          LegalJurisdiction.KENYA
        ]
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(multiJurisdictionRequest);

      expect(response.status).toBe(200);
      expect(response.body.data.requestSummary.jurisdictionsAnalyzed).toHaveLength(3);
    });

    it('should handle custom date range', async () => {
      const customDateRequest = {
        ...validRequest,
        period: AnalyticsPeriod.CUSTOM_RANGE,
        customDateRange: {
          startDate: '2024-01-01',
          endDate: '2024-06-30'
        }
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(customDateRequest);

      expect(response.status).toBe(200);
      expect(response.body.data.requestSummary.coveragePeriod).toBe(AnalyticsPeriod.CUSTOM_RANGE);
    });

    it('should return 400 for invalid date range', async () => {
      const invalidDateRequest = {
        ...validRequest,
        period: AnalyticsPeriod.CUSTOM_RANGE,
        customDateRange: {
          startDate: '2024-06-30',
          endDate: '2024-01-01' // End before start
        }
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(invalidDateRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date range');
    });

    it('should include execution metadata', async () => {
      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.metadata.requestId).toBeDefined();
      expect(response.body.metadata.executionTime).toBeGreaterThan(0);
      expect(response.body.metadata.dataPoints).toBeGreaterThan(0);
      expect(response.body.metadata.confidence).toBeGreaterThan(0);
      expect(response.body.metadata.timestamp).toBeDefined();
    });
  });

  describe('POST /api/intelligence/trends', () => {
    const trendRequest = {
      jurisdictions: [LegalJurisdiction.NIGERIA],
      legalAreas: [LegalArea.CORPORATE],
      period: AnalyticsPeriod.LAST_6_MONTHS,
      language: SupportedLanguage.ENGLISH
    };

    it('should return trend analysis results', async () => {
      const response = await request(app)
        .post('/api/intelligence/trends')
        .send(trendRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
      expect(response.body.data.visualizations).toBeDefined();
      expect(response.body.metadata.trendsFound).toBeGreaterThanOrEqual(0);
    });

    it('should handle default values', async () => {
      const response = await request(app)
        .post('/api/intelligence/trends')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.trends).toBeDefined();
    });

    it('should filter insights for legal trends', async () => {
      const response = await request(app)
        .post('/api/intelligence/trends')
        .send(trendRequest);

      expect(response.status).toBe(200);
      if (response.body.data.insights.length > 0) {
        expect(response.body.data.insights[0].category).toBe('legal_trends');
      }
    });
  });

  describe('POST /api/intelligence/predictions', () => {
    const predictionRequest = {
      jurisdictions: [LegalJurisdiction.NIGERIA],
      legalAreas: [LegalArea.CORPORATE],
      language: SupportedLanguage.ENGLISH
    };

    it('should return predictive analysis results', async () => {
      const response = await request(app)
        .post('/api/intelligence/predictions')
        .send(predictionRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
      expect(response.body.metadata.predictionsGenerated).toBeGreaterThanOrEqual(0);
    });

    it('should include recommendations and alerts', async () => {
      const response = await request(app)
        .post('/api/intelligence/predictions')
        .send(predictionRequest);

      expect(response.status).toBe(200);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
    });

    it('should filter for case outcome insights', async () => {
      const response = await request(app)
        .post('/api/intelligence/predictions')
        .send(predictionRequest);

      expect(response.status).toBe(200);
      if (response.body.data.insights.length > 0) {
        expect(response.body.data.insights[0].category).toBe('case_outcomes');
      }
    });
  });

  describe('GET /api/intelligence/capabilities', () => {
    it('should return system capabilities', async () => {
      const response = await request(app)
        .get('/api/intelligence/capabilities');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analysisTypes).toBeDefined();
      expect(response.body.data.supportedJurisdictions).toBeDefined();
      expect(response.body.data.supportedLegalAreas).toBeDefined();
      expect(response.body.data.analyticsPeriods).toBeDefined();
      expect(response.body.data.visualizationTypes).toBeDefined();
      expect(response.body.data.supportedLanguages).toBeDefined();
      expect(response.body.data.rateLimits).toBeDefined();
    });

    it('should include all intelligence types', async () => {
      const response = await request(app)
        .get('/api/intelligence/capabilities');

      expect(response.status).toBe(200);
      const analysisTypes = response.body.data.analysisTypes;
      expect(analysisTypes).toContain(IntelligenceType.TREND_ANALYSIS);
      expect(analysisTypes).toContain(IntelligenceType.PREDICTIVE_MODELING);
      expect(analysisTypes).toContain(IntelligenceType.RISK_INTELLIGENCE);
    });

    it('should include supported jurisdictions', async () => {
      const response = await request(app)
        .get('/api/intelligence/capabilities');

      expect(response.status).toBe(200);
      const jurisdictions = response.body.data.supportedJurisdictions;
      expect(jurisdictions).toContain(LegalJurisdiction.NIGERIA);
      expect(jurisdictions).toContain(LegalJurisdiction.SOUTH_AFRICA);
      expect(jurisdictions).toContain(LegalJurisdiction.UAE);
    });

    it('should include rate limit information', async () => {
      const response = await request(app)
        .get('/api/intelligence/capabilities');

      expect(response.status).toBe(200);
      expect(response.body.data.rateLimits.requestsPerHour).toBeGreaterThan(0);
      expect(response.body.data.rateLimits.requestsPerDay).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const request_data = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.NIGERIA],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_30_DAYS,
        filters: {},
        insights: {
          includeRecommendations: false,
          includePredictions: false,
          includeComparisons: false,
          includeTrends: true,
          includeAlerts: false,
          detailLevel: 'summary',
          visualizations: []
        },
        language: SupportedLanguage.ENGLISH,
        confidentialityLevel: 'public'
      };

      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 25 }, () => 
        request(app)
          .post('/api/intelligence/analyze')
          .send(request_data)
      );

      const responses = await Promise.all(requests);
      
      // Check if some requests are rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      // Should have at least some successful responses
      const successfulResponses = responses.filter(res => res.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // If rate limiting is working, some requests should be rejected
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].text).toContain('Too many');
      }
    }, 30000); // Increase timeout for this test
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/intelligence/analyze');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 for internal errors', async () => {
      // Create a request that might cause internal error
      const problematicRequest = {
        analysisTypes: ['invalid_type' as any],
        jurisdictions: [LegalJurisdiction.NIGERIA],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          includeTrends: true,
          includeAlerts: true,
          detailLevel: 'detailed',
          visualizations: []
        },
        language: SupportedLanguage.ENGLISH,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(problematicRequest);

      // Should still handle gracefully
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response format', async () => {
      const validRequest = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.NIGERIA],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          includeTrends: true,
          includeAlerts: true,
          detailLevel: 'detailed',
          visualizations: [VisualizationType.LINE_CHART]
        },
        language: SupportedLanguage.ENGLISH,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.success).toBe(true);
    });

    it('should include all required fields in analysis result', async () => {
      const validRequest = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.NIGERIA],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          includeTrends: true,
          includeAlerts: true,
          detailLevel: 'detailed',
          visualizations: []
        },
        language: SupportedLanguage.ENGLISH,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(validRequest);

      expect(response.status).toBe(200);
      
      const data = response.body.data;
      expect(data).toHaveProperty('analysisId');
      expect(data).toHaveProperty('requestSummary');
      expect(data).toHaveProperty('trendAnalysis');
      expect(data).toHaveProperty('predictiveInsights');
      expect(data).toHaveProperty('comparativeAnalysis');
      expect(data).toHaveProperty('riskIntelligence');
      expect(data).toHaveProperty('marketIntelligence');
      expect(data).toHaveProperty('regulatoryIntelligence');
      expect(data).toHaveProperty('keyInsights');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('visualizations');
      expect(data).toHaveProperty('metadata');
    });
  });

  describe('Multi-language Support', () => {
    it('should handle English requests', async () => {
      const englishRequest = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.NIGERIA],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: false,
          includePredictions: false,
          includeComparisons: false,
          includeTrends: true,
          includeAlerts: false,
          detailLevel: 'summary',
          visualizations: []
        },
        language: SupportedLanguage.ENGLISH,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(englishRequest);

      expect(response.status).toBe(200);
    });

    it('should handle Arabic requests', async () => {
      const arabicRequest = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.UAE],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: false,
          includePredictions: false,
          includeComparisons: false,
          includeTrends: true,
          includeAlerts: false,
          detailLevel: 'summary',
          visualizations: []
        },
        language: SupportedLanguage.ARABIC,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(arabicRequest);

      expect(response.status).toBe(200);
    });

    it('should handle French requests', async () => {
      const frenchRequest = {
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        jurisdictions: [LegalJurisdiction.MOROCCO],
        legalAreas: [LegalArea.CORPORATE],
        period: AnalyticsPeriod.LAST_6_MONTHS,
        filters: {},
        insights: {
          includeRecommendations: false,
          includePredictions: false,
          includeComparisons: false,
          includeTrends: true,
          includeAlerts: false,
          detailLevel: 'summary',
          visualizations: []
        },
        language: SupportedLanguage.FRENCH,
        confidentialityLevel: 'public'
      };

      const response = await request(app)
        .post('/api/intelligence/analyze')
        .send(frenchRequest);

      expect(response.status).toBe(200);
    });
  });
});

// Helper function for array contains check
const expectToBeOneOf = (actual: any, expected: any[]) => {
  expect(expected).toContain(actual);
};
