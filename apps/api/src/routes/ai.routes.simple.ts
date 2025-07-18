/**
 * AI Routes - Simplified Implementation
 * Real AI functionality without over-engineering
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai-service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import { logger } from '../config/logger';

const router = Router();

// AI Analysis endpoint
router.post('/analyze', 
  authenticate, 
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await aiService.processRequest(req.body);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Contract Analysis endpoint
router.post('/contract/analyze',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestData = {
        ...req.body,
        analysisType: 'contract' as const,
      };
      
      const result = await aiService.processRequest(requestData);
      
      res.json({
        success: true,
        data: {
          ...result,
          analysis: {
            riskLevel: calculateRiskLevel(result.response),
            keyTerms: extractKeyTerms(result.response),
            recommendations: extractRecommendations(result.response),
          }
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Legal Research endpoint
router.post('/research',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestData = {
        ...req.body,
        analysisType: 'legal_research' as const,
      };
      
      const result = await aiService.processRequest(requestData);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Risk Assessment endpoint
router.post('/risk/assess',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestData = {
        ...req.body,
        analysisType: 'risk_assessment' as const,
      };
      
      const result = await aiService.processRequest(requestData);
      
      res.json({
        success: true,
        data: {
          ...result,
          riskAnalysis: {
            overallRisk: calculateRiskLevel(result.response),
            riskFactors: extractRiskFactors(result.response),
            mitigationStrategies: extractMitigationStrategies(result.response),
          }
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Compliance Check endpoint
router.post('/compliance/check',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestData = {
        ...req.body,
        analysisType: 'compliance' as const,
      };
      
      const result = await aiService.processRequest(requestData);
      
      res.json({
        success: true,
        data: {
          ...result,
          compliance: {
            status: extractComplianceStatus(result.response),
            issues: extractComplianceIssues(result.response),
            recommendations: extractRecommendations(result.response),
          }
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Document Review endpoint
router.post('/document/review',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requestData = {
        ...req.body,
        analysisType: 'document_review' as const,
      };
      
      const result = await aiService.processRequest(requestData);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Health check endpoint
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await aiService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Supported jurisdictions endpoint
router.get('/jurisdictions', (req: Request, res: Response) => {
  const jurisdictions = [
    // African Countries
    'algeria', 'angola', 'benin', 'botswana', 'burkina-faso', 'burundi',
    'cameroon', 'cape-verde', 'central-african-republic', 'chad', 'comoros',
    'congo', 'democratic-republic-congo', 'djibouti', 'egypt', 'equatorial-guinea',
    'eritrea', 'eswatini', 'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea',
    'guinea-bissau', 'ivory-coast', 'kenya', 'lesotho', 'liberia', 'libya',
    'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco',
    'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda', 'sao-tome-principe',
    'senegal', 'seychelles', 'sierra-leone', 'somalia', 'south-africa',
    'south-sudan', 'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia',
    'zimbabwe',
    
    // Middle Eastern Countries
    'uae', 'saudi-arabia', 'israel', 'turkey', 'iran', 'iraq', 'jordan',
    'kuwait', 'lebanon', 'oman', 'palestine', 'qatar', 'syria', 'yemen',
    'bahrain', 'cyprus'
  ];
  
  res.json({
    success: true,
    data: { jurisdictions },
    timestamp: new Date().toISOString(),
  });
});

// Supported languages endpoint
router.get('/languages', (req: Request, res: Response) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'sw', name: 'Swahili' },
  ];
  
  res.json({
    success: true,
    data: { languages },
    timestamp: new Date().toISOString(),
  });
});

// Helper functions for response analysis
function calculateRiskLevel(response: string): 'low' | 'medium' | 'high' {
  const lowRiskIndicators = ['standard', 'minimal risk', 'compliant', 'acceptable'];
  const highRiskIndicators = ['high risk', 'problematic', 'non-compliant', 'dangerous', 'illegal'];
  
  const lowerResponse = response.toLowerCase();
  
  if (highRiskIndicators.some(indicator => lowerResponse.includes(indicator))) {
    return 'high';
  }
  
  if (lowRiskIndicators.some(indicator => lowerResponse.includes(indicator))) {
    return 'low';
  }
  
  return 'medium';
}

function extractKeyTerms(response: string): string[] {
  // Simple extraction - in real implementation, use NLP
  const terms = response.match(/(?:clause|term|provision|agreement|contract|obligation)[\w\s]{1,50}/gi);
  return terms ? terms.slice(0, 5) : [];
}

function extractRecommendations(response: string): string[] {
  // Simple extraction - look for recommendation-like sentences
  const sentences = response.split(/[.!?]+/);
  const recommendations = sentences.filter(sentence => 
    /recommend|suggest|should|consider|advise/i.test(sentence)
  );
  return recommendations.slice(0, 3);
}

function extractRiskFactors(response: string): string[] {
  const sentences = response.split(/[.!?]+/);
  const riskFactors = sentences.filter(sentence => 
    /risk|danger|concern|issue|problem/i.test(sentence)
  );
  return riskFactors.slice(0, 3);
}

function extractMitigationStrategies(response: string): string[] {
  const sentences = response.split(/[.!?]+/);
  const strategies = sentences.filter(sentence => 
    /mitigate|prevent|avoid|reduce|minimize/i.test(sentence)
  );
  return strategies.slice(0, 3);
}

function extractComplianceStatus(response: string): 'compliant' | 'non-compliant' | 'partial' {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes('non-compliant') || lowerResponse.includes('violat')) {
    return 'non-compliant';
  }
  
  if (lowerResponse.includes('compliant') && !lowerResponse.includes('non-compliant')) {
    return 'compliant';
  }
  
  return 'partial';
}

function extractComplianceIssues(response: string): string[] {
  const sentences = response.split(/[.!?]+/);
  const issues = sentences.filter(sentence => 
    /violat|breach|non-compliant|issue|problem|concern/i.test(sentence)
  );
  return issues.slice(0, 3);
}

export default router;