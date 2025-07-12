// Legal Intelligence Service Tests - Phase 2 Feature 3
// Comprehensive test suite for legal analytics and insights

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LegalIntelligenceService } from '../src/services/legal-intelligence.service';
import {
  LegalIntelligenceRequest,
  IntelligenceType,
  AnalyticsPeriod,
  VisualizationType,
  TrendDirection,
  PredictionConfidence,
  InsightCategory
} from '../src/types/legal-intelligence.types';
import { LegalJurisdiction, SupportedLanguage, AIProvider } from '../src/types/ai.types';
import { LegalArea } from '../src/types/legal-research.types';
import { RiskLevel } from '../src/types/contract-intelligence.types';

describe('LegalIntelligenceService', () => {
  let service: LegalIntelligenceService;
  let mockRequest: LegalIntelligenceRequest;

  beforeEach(() => {
    service = new LegalIntelligenceService();
    
    // Base mock request for testing
    mockRequest = {
      analysisTypes: [IntelligenceType.TREND_ANALYSIS],
      jurisdictions: [LegalJurisdiction.NIGERIA, LegalJurisdiction.SOUTH_AFRICA],
      legalAreas: [LegalArea.CORPORATE, LegalArea.CONTRACT],
      period: AnalyticsPeriod.LAST_6_MONTHS,
      filters: {
        documentTypes: ['contract', 'regulation'],
        riskLevels: [RiskLevel.MEDIUM, RiskLevel.HIGH]
      },
      insights: {
        includeRecommendations: true,
        includePredictions: true,
        includeComparisons: true,
        includeTrends: true,
        includeAlerts: true,
        detailLevel: 'detailed',
        visualizations: [VisualizationType.LINE_CHART, VisualizationType.BAR_CHART]
      },
      language: SupportedLanguage.ENGLISH,
      confidentialityLevel: 'internal'
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Intelligence Analysis', () => {
    it('should perform comprehensive legal intelligence analysis', async () => {
      const result = await service.analyzeLegalIntelligence(mockRequest);

      expect(result).toBeDefined();
      expect(result.analysisId).toMatch(/^intelligence_\d+_[a-z0-9]+$/);
      expect(result.requestSummary).toBeDefined();
      expect(result.requestSummary.analysisTypes).toEqual(mockRequest.analysisTypes);
      expect(result.requestSummary.jurisdictionsAnalyzed).toEqual(mockRequest.jurisdictions);
      expect(result.requestSummary.legalAreasAnalyzed).toEqual(mockRequest.legalAreas);
      expect(result.requestSummary.executionTime).toBeGreaterThan(0);
      expect(result.requestSummary.dataPointsProcessed).toBeGreaterThan(0);
      expect(result.requestSummary.confidenceLevel).toBeGreaterThan(0);
    });

    it('should include trend analysis when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.TREND_ANALYSIS]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.trendAnalysis).toBeDefined();
      expect(result.trendAnalysis.length).toBeGreaterThan(0);
      
      const trendResult = result.trendAnalysis[0];
      expect(trendResult.id).toBeDefined();
      expect(trendResult.category).toBe(InsightCategory.LEGAL_TRENDS);
      expect(trendResult.jurisdiction).toBe(request.jurisdictions[0]);
      expect(trendResult.trend).toBeDefined();
      expect(trendResult.trend.direction).toBeOneOf(Object.values(TrendDirection));
      expect(trendResult.trend.magnitude).toBeTypeOf('number');
      expect(trendResult.trend.confidence).toBeOneOf(Object.values(PredictionConfidence));
    });

    it('should include predictive insights when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.PREDICTIVE_MODELING]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.predictiveInsights).toBeDefined();
      expect(result.predictiveInsights.length).toBeGreaterThan(0);
      
      const prediction = result.predictiveInsights[0];
      expect(prediction.id).toBeDefined();
      expect(prediction.jurisdiction).toBeDefined();
      expect(prediction.prediction).toBeDefined();
      expect(prediction.prediction.probability).toBeGreaterThan(0);
      expect(prediction.prediction.probability).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeOneOf(Object.values(PredictionConfidence));
    });

    it('should include comparative analysis when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.COMPARATIVE_ANALYSIS],
        jurisdictions: [LegalJurisdiction.NIGERIA, LegalJurisdiction.SOUTH_AFRICA, LegalJurisdiction.KENYA]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.comparativeAnalysis).toBeDefined();
      expect(result.comparativeAnalysis.length).toBeGreaterThan(0);
      
      const comparison = result.comparativeAnalysis[0];
      expect(comparison.id).toBeDefined();
      expect(comparison.subjects).toBeDefined();
      expect(comparison.subjects.length).toBeGreaterThan(1);
      expect(comparison.metrics).toBeDefined();
      expect(comparison.insights).toBeDefined();
    });

    it('should include risk intelligence when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.RISK_INTELLIGENCE]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.riskIntelligence).toBeDefined();
      expect(result.riskIntelligence.riskLandscape).toBeDefined();
      expect(result.riskIntelligence.riskLandscape.totalRisks).toBeGreaterThanOrEqual(0);
      expect(result.riskIntelligence.riskLandscape.riskDistribution).toBeDefined();
      expect(result.riskIntelligence.emergingRisks).toBeDefined();
      expect(result.riskIntelligence.mitigationStrategies).toBeDefined();
    });

    it('should include market intelligence when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.MARKET_INTELLIGENCE]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.marketIntelligence).toBeDefined();
      expect(result.marketIntelligence.marketOverview).toBeDefined();
      expect(result.marketIntelligence.marketOverview.marketSize).toBeGreaterThan(0);
      expect(result.marketIntelligence.competitiveAnalysis).toBeDefined();
      expect(result.marketIntelligence.opportunityAnalysis).toBeDefined();
    });

    it('should include regulatory intelligence when requested', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.REGULATORY_INTELLIGENCE]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.regulatoryIntelligence).toBeDefined();
      expect(result.regulatoryIntelligence.regulatoryLandscape).toBeDefined();
      expect(result.regulatoryIntelligence.upcomingChanges).toBeDefined();
      expect(result.regulatoryIntelligence.complianceGaps).toBeDefined();
      expect(result.regulatoryIntelligence.impactAssessment).toBeDefined();
    });
  });

  describe('Multi-Type Analysis', () => {
    it('should handle multiple analysis types in single request', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [
          IntelligenceType.TREND_ANALYSIS,
          IntelligenceType.PREDICTIVE_MODELING,
          IntelligenceType.RISK_INTELLIGENCE
        ]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.trendAnalysis.length).toBeGreaterThan(0);
      expect(result.predictiveInsights.length).toBeGreaterThan(0);
      expect(result.riskIntelligence.riskLandscape.totalRisks).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights from all analysis types', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [
          IntelligenceType.TREND_ANALYSIS,
          IntelligenceType.PREDICTIVE_MODELING
        ]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.keyInsights).toBeDefined();
      expect(result.keyInsights.length).toBeGreaterThan(0);
      
      const hasLegalTrends = result.keyInsights.some(i => i.category === InsightCategory.LEGAL_TRENDS);
      const hasRiskPatterns = result.keyInsights.some(i => i.category === InsightCategory.RISK_PATTERNS);
      
      expect(hasLegalTrends || hasRiskPatterns).toBe(true);
    });
  });

  describe('Insight Generation', () => {
    it('should generate key insights when requested', async () => {
      const request = {
        ...mockRequest,
        insights: { ...mockRequest.insights, includeRecommendations: true }
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.keyInsights).toBeDefined();
      expect(result.keyInsights.length).toBeGreaterThan(0);
      
      const insight = result.keyInsights[0];
      expect(insight.id).toBeDefined();
      expect(insight.category).toBeOneOf(Object.values(InsightCategory));
      expect(insight.title).toBeDefined();
      expect(insight.description).toBeDefined();
      expect(insight.significance).toBeOneOf(['low', 'medium', 'high', 'critical']);
      expect(insight.confidence).toBeOneOf(Object.values(PredictionConfidence));
    });

    it('should generate recommendations when requested', async () => {
      const request = {
        ...mockRequest,
        insights: { ...mockRequest.insights, includeRecommendations: true }
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const recommendation = result.recommendations[0];
      expect(recommendation.id).toBeDefined();
      expect(recommendation.title).toBeDefined();
      expect(recommendation.description).toBeDefined();
      expect(recommendation.priority).toBeOneOf(['low', 'medium', 'high', 'urgent']);
      expect(recommendation.actions).toBeDefined();
      expect(recommendation.timeline).toBeDefined();
    });

    it('should generate alerts for critical findings', async () => {
      const request = {
        ...mockRequest,
        insights: { ...mockRequest.insights, includeAlerts: true }
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.alerts).toBeDefined();
      
      if (result.alerts.length > 0) {
        const alert = result.alerts[0];
        expect(alert.id).toBeDefined();
        expect(alert.severity).toBeOneOf(['low', 'medium', 'high', 'critical', 'warning']);
        expect(alert.title).toBeDefined();
        expect(alert.description).toBeDefined();
        expect(alert.category).toBeOneOf(Object.values(InsightCategory));
      }
    });
  });

  describe('Visualization Data', () => {
    it('should generate visualization data when requested', async () => {
      const request = {
        ...mockRequest,
        insights: {
          ...mockRequest.insights,
          visualizations: [VisualizationType.LINE_CHART, VisualizationType.BAR_CHART]
        }
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.visualizations).toBeDefined();
      
      if (result.visualizations.length > 0) {
        const viz = result.visualizations[0];
        expect(viz.id).toBeDefined();
        expect(viz.type).toBeOneOf(Object.values(VisualizationType));
        expect(viz.title).toBeDefined();
        expect(viz.data).toBeDefined();
        expect(viz.configuration).toBeDefined();
      }
    });

    it('should include chart configuration for visualizations', async () => {
      const request = {
        ...mockRequest,
        analysisTypes: [IntelligenceType.TREND_ANALYSIS],
        insights: {
          ...mockRequest.insights,
          visualizations: [VisualizationType.LINE_CHART]
        }
      };

      const result = await service.analyzeLegalIntelligence(request);

      if (result.visualizations.length > 0) {
        const viz = result.visualizations[0];
        expect(viz.configuration.responsive).toBeDefined();
        expect(viz.configuration.scales).toBeDefined();
        expect(viz.configuration.plugins).toBeDefined();
        expect(viz.interactivity).toBeDefined();
        expect(viz.interactivity.clickable).toBeTypeOf('boolean');
        expect(viz.interactivity.exportable).toBeTypeOf('boolean');
      }
    });
  });

  describe('Error Handling and Validation', () => {
    it('should throw error for empty analysis types', async () => {
      const invalidRequest = {
        ...mockRequest,
        analysisTypes: []
      };

      await expect(service.analyzeLegalIntelligence(invalidRequest))
        .rejects.toThrow('At least one analysis type must be specified');
    });

    it('should throw error for empty jurisdictions', async () => {
      const invalidRequest = {
        ...mockRequest,
        jurisdictions: []
      };

      await expect(service.analyzeLegalIntelligence(invalidRequest))
        .rejects.toThrow('At least one jurisdiction must be specified');
    });

    it('should throw error for empty legal areas', async () => {
      const invalidRequest = {
        ...mockRequest,
        legalAreas: []
      };

      await expect(service.analyzeLegalIntelligence(invalidRequest))
        .rejects.toThrow('At least one legal area must be specified');
    });

    it('should handle custom date range validation', async () => {
      const invalidRequest = {
        ...mockRequest,
        period: AnalyticsPeriod.CUSTOM_RANGE,
        customDateRange: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-05-01') // End before start
        }
      };

      // Should not throw error in service level - validation handled in routes
      const result = await service.analyzeLegalIntelligence(invalidRequest);
      expect(result).toBeDefined();
    });
  });

  describe('Performance and Metadata', () => {
    it('should track execution time', async () => {
      const startTime = Date.now();
      const result = await service.analyzeLegalIntelligence(mockRequest);
      const endTime = Date.now();

      expect(result.requestSummary.executionTime).toBeGreaterThan(0);
      expect(result.requestSummary.executionTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    it('should calculate data points processed', async () => {
      const result = await service.analyzeLegalIntelligence(mockRequest);

      expect(result.requestSummary.dataPointsProcessed).toBeGreaterThan(0);
      expect(result.requestSummary.dataPointsProcessed).toBeTypeOf('number');
    });

    it('should include comprehensive metadata', async () => {
      const result = await service.analyzeLegalIntelligence(mockRequest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.requestId).toBe(result.analysisId);
      expect(result.metadata.dataSourcesUsed).toBeDefined();
      expect(result.metadata.modelsUsed).toBeDefined();
      expect(result.metadata.providersUsed).toContain(AIProvider.OLLAMA);
      expect(result.metadata.accuracy).toBeDefined();
      expect(result.metadata.coverage).toBeDefined();
      expect(result.metadata.limitations).toBeDefined();
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.processedAt).toBeInstanceOf(Date);
    });

    it('should provide accuracy metrics', async () => {
      const result = await service.analyzeLegalIntelligence(mockRequest);

      expect(result.metadata.accuracy.overall).toBeGreaterThan(0);
      expect(result.metadata.accuracy.overall).toBeLessThanOrEqual(1);
      expect(result.metadata.accuracy.trendAnalysis).toBeGreaterThan(0);
      expect(result.metadata.accuracy.predictions).toBeGreaterThan(0);
      expect(result.metadata.accuracy.insights).toBeGreaterThan(0);
    });

    it('should provide coverage information', async () => {
      const result = await service.analyzeLegalIntelligence(mockRequest);

      expect(result.metadata.coverage.jurisdictionalCoverage).toBeGreaterThan(0);
      expect(result.metadata.coverage.jurisdictionalCoverage).toBeLessThanOrEqual(1);
      expect(result.metadata.coverage.temporalCoverage).toBeGreaterThan(0);
      expect(result.metadata.coverage.dataCompleteness).toBeGreaterThan(0);
      expect(result.metadata.coverage.sampleSize).toBeGreaterThan(0);
    });
  });

  describe('Jurisdiction-Specific Analysis', () => {
    it('should handle single jurisdiction analysis', async () => {
      const request = {
        ...mockRequest,
        jurisdictions: [LegalJurisdiction.NIGERIA]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.jurisdictionsAnalyzed).toEqual([LegalJurisdiction.NIGERIA]);
      expect(result.trendAnalysis[0].jurisdiction).toBe(LegalJurisdiction.NIGERIA);
    });

    it('should handle multiple jurisdiction analysis', async () => {
      const jurisdictions = [
        LegalJurisdiction.NIGERIA,
        LegalJurisdiction.SOUTH_AFRICA,
        LegalJurisdiction.KENYA,
        LegalJurisdiction.GHANA
      ];
      
      const request = {
        ...mockRequest,
        jurisdictions,
        analysisTypes: [IntelligenceType.COMPARATIVE_ANALYSIS]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.jurisdictionsAnalyzed).toEqual(jurisdictions);
      expect(result.comparativeAnalysis[0].subjects.length).toBeGreaterThan(1);
    });

    it('should handle Middle Eastern jurisdictions', async () => {
      const request = {
        ...mockRequest,
        jurisdictions: [LegalJurisdiction.UAE, LegalJurisdiction.SAUDI_ARABIA],
        language: SupportedLanguage.ARABIC
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.jurisdictionsAnalyzed).toInclude(LegalJurisdiction.UAE);
      expect(result.requestSummary.jurisdictionsAnalyzed).toInclude(LegalJurisdiction.SAUDI_ARABIA);
    });
  });

  describe('Legal Area Focus', () => {
    it('should analyze corporate law focus', async () => {
      const request = {
        ...mockRequest,
        legalAreas: [LegalArea.CORPORATE],
        analysisTypes: [IntelligenceType.TREND_ANALYSIS]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.legalAreasAnalyzed).toEqual([LegalArea.CORPORATE]);
      expect(result.trendAnalysis[0].legalArea).toBe(LegalArea.CORPORATE);
    });

    it('should analyze contract law focus', async () => {
      const request = {
        ...mockRequest,
        legalAreas: [LegalArea.CONTRACT],
        analysisTypes: [IntelligenceType.RISK_INTELLIGENCE]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.legalAreasAnalyzed).toEqual([LegalArea.CONTRACT]);
    });

    it('should handle multiple legal areas', async () => {
      const legalAreas = [
        LegalArea.CORPORATE,
        LegalArea.CONTRACT,
        LegalArea.INTELLECTUAL_PROPERTY,
        LegalArea.REGULATORY
      ];
      
      const request = {
        ...mockRequest,
        legalAreas,
        analysisTypes: [IntelligenceType.TREND_ANALYSIS]
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.legalAreasAnalyzed).toEqual(legalAreas);
      expect(result.trendAnalysis.length).toBeGreaterThanOrEqual(legalAreas.length);
    });
  });

  describe('Time Period Analysis', () => {
    it('should handle different time periods', async () => {
      const periods = [
        AnalyticsPeriod.LAST_30_DAYS,
        AnalyticsPeriod.LAST_6_MONTHS,
        AnalyticsPeriod.LAST_YEAR
      ];

      for (const period of periods) {
        const request = {
          ...mockRequest,
          period
        };

        const result = await service.analyzeLegalIntelligence(request);
        expect(result.requestSummary.coveragePeriod).toBe(period);
      }
    });

    it('should handle custom date ranges', async () => {
      const request = {
        ...mockRequest,
        period: AnalyticsPeriod.CUSTOM_RANGE,
        customDateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30')
        }
      };

      const result = await service.analyzeLegalIntelligence(request);

      expect(result.requestSummary.coveragePeriod).toBe(AnalyticsPeriod.CUSTOM_RANGE);
    });
  });
});

// Helper custom matchers
expect.extend({
  toBeOneOf(received: any, array: any[]) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${array}`,
        pass: false,
      };
    }
  },
  
  toInclude(received: any[], item: any) {
    const pass = received.includes(item);
    if (pass) {
      return {
        message: () => `expected ${received} not to include ${item}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to include ${item}`,
        pass: false,
      };
    }
  }
});

declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeOneOf(array: any[]): any;
      toInclude(item: any): any;
    }
  }
}
