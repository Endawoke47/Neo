// Enhanced AI Routes - Full Legal AI Platform
import { Router } from 'express';
import { z } from 'zod';
import { AIGatewayService } from '../services/ai-gateway.service';
import { AIAnalysisService, contractAnalysisSchema, documentAnalysisSchema, legalResearchSchema, matterPredictionSchema, complianceCheckSchema } from '../services/ai-analysis.service';
import { 
  aiRequestSchema, 
  AIAnalysisType, 
  LegalJurisdiction, 
  SupportedLanguage, 
  LegalSystem 
} from '../types/ai.types';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
// Phase 2 Feature 1: Legal Research Engine
import legalResearchRoutes from './legal-research.routes';

const router = Router();
const aiGateway = new AIGatewayService();
const aiAnalysis = new AIAnalysisService();

// Apply authentication to all AI routes
router.use(authenticate);

// Phase 2: Mount Legal Research routes at /legal
router.use('/legal', legalResearchRoutes);

// Main AI Analysis Endpoint
router.post('/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const validatedRequest = aiRequestSchema.parse(req.body);
    const userId = req.user?.id || 'anonymous';
    
    const result = await aiGateway.processRequest(validatedRequest, userId);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        processingTime: result.processingTime,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        cached: result.cached
      }
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// Contract Analysis Endpoint
router.post('/contract/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const contractSchema = z.object({
      contract: z.any(),
      jurisdiction: z.nativeEnum(LegalJurisdiction).optional(),
      language: z.nativeEnum(SupportedLanguage).optional(),
      confidentialityLevel: z.enum(['public', 'confidential', 'privileged']).optional()
    });

    const { contract, jurisdiction, language, confidentialityLevel } = contractSchema.parse(req.body);
    
    const request = {
      type: AIAnalysisType.CONTRACT_ANALYSIS,
      input: contract,
      context: {
        jurisdiction: jurisdiction || LegalJurisdiction.NIGERIA,
        legalSystem: LegalSystem.COMMON_LAW,
        language: language || SupportedLanguage.ENGLISH,
        practiceArea: 'contract_law',
        confidentialityLevel: confidentialityLevel || 'confidential'
      }
    };

    const result = await aiGateway.processRequest(request, req.user?.id || 'anonymous');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Contract analysis failed'
    });
  }
});

// Legal Research Endpoint
router.post('/research', async (req: AuthenticatedRequest, res) => {
  try {
    const researchSchema = z.object({
      query: z.string(),
      jurisdiction: z.nativeEnum(LegalJurisdiction),
      practiceArea: z.string().optional(),
      language: z.nativeEnum(SupportedLanguage).optional()
    });

    const { query, jurisdiction, practiceArea, language } = researchSchema.parse(req.body);
    
    const request = {
      type: AIAnalysisType.LEGAL_RESEARCH,
      input: { query, practiceArea },
      context: {
        jurisdiction,
        legalSystem: LegalSystem.MIXED_SYSTEM,
        language: language || SupportedLanguage.ENGLISH,
        practiceArea: practiceArea || 'general',
        confidentialityLevel: 'public' as const
      }
    };

    const result = await aiGateway.processRequest(request, req.user?.id || 'anonymous');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Research failed'
    });
  }
});

// Helper Routes
router.get('/jurisdictions', (req: AuthenticatedRequest, res) => {
  const jurisdictions = Object.values(LegalJurisdiction);
  res.json({
    success: true,
    data: jurisdictions
  });
});

router.get('/languages', (req: AuthenticatedRequest, res) => {
  const languages = Object.values(SupportedLanguage);
  res.json({
    success: true,
    data: languages
  });
});

// =================================================================
// COMPREHENSIVE AI ANALYSIS ENDPOINTS
// =================================================================

// Contract Analysis
router.post('/analyze/contract', async (req: AuthenticatedRequest, res) => {
  try {
    const contractData = contractAnalysisSchema.parse(req.body);
    const userId = req.user!.id;
    
    const result = await aiAnalysis.analyzeContract(contractData, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Contract analysis completed successfully'
    });
  } catch (error) {
    console.error('Error in contract analysis:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Contract analysis failed'
      });
    }
  }
});

// Document Analysis
router.post('/analyze/document', async (req: AuthenticatedRequest, res) => {
  try {
    const documentData = documentAnalysisSchema.parse(req.body);
    const userId = req.user!.id;
    
    const result = await aiAnalysis.analyzeDocument(documentData, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Document analysis completed successfully'
    });
  } catch (error) {
    console.error('Error in document analysis:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Document analysis failed'
      });
    }
  }
});

// Legal Research (Enhanced)
router.post('/research/comprehensive', async (req: AuthenticatedRequest, res) => {
  try {
    const researchData = legalResearchSchema.parse(req.body);
    const userId = req.user!.id;
    
    const result = await aiAnalysis.performLegalResearch(researchData, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Legal research completed successfully'
    });
  } catch (error) {
    console.error('Error in legal research:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Legal research failed'
      });
    }
  }
});

// Matter Outcome Prediction
router.post('/predict/matter', async (req: AuthenticatedRequest, res) => {
  try {
    const predictionData = matterPredictionSchema.parse(req.body);
    const userId = req.user!.id;
    
    const result = await aiAnalysis.predictMatterOutcome(predictionData, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Matter prediction completed successfully'
    });
  } catch (error) {
    console.error('Error in matter prediction:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Matter prediction failed'
      });
    }
  }
});

// Compliance Check
router.post('/check/compliance', async (req: AuthenticatedRequest, res) => {
  try {
    const complianceData = complianceCheckSchema.parse(req.body);
    const userId = req.user!.id;
    
    const result = await aiAnalysis.performComplianceCheck(complianceData, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Compliance check completed successfully'
    });
  } catch (error) {
    console.error('Error in compliance check:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Compliance check failed'
      });
    }
  }
});

// =================================================================
// AI ANALYSIS HISTORY & MANAGEMENT
// =================================================================

// Get Analysis History
router.get('/history', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { entityType, entityId } = req.query;
    
    const history = await aiAnalysis.getAnalysisHistory(
      userId, 
      entityType as string, 
      entityId as string
    );
    
    res.json({
      success: true,
      data: history,
      message: 'Analysis history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting analysis history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analysis history'
    });
  }
});

// Get Specific Analysis
router.get('/analysis/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const analysis = await aiAnalysis.getAnalysisById(id, userId);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Analysis retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis not found'
    });
  }
});

// =================================================================
// AI PROVIDER MANAGEMENT
// =================================================================

// Get Provider Status
router.get('/providers/status', async (req: AuthenticatedRequest, res) => {
  try {
    const status = await aiAnalysis.getProviderStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Provider status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider status'
    });
  }
});

// Health Check (Enhanced)
router.get('/health', async (req: AuthenticatedRequest, res) => {
  try {
    const [gatewayHealth, analysisHealth] = await Promise.all([
      aiGateway.healthCheck(),
      aiAnalysis.healthCheck()
    ]);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        gateway: gatewayHealth,
        analysis: analysisHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// =================================================================
// AI CAPABILITIES & METADATA
// =================================================================

// Get AI Capabilities
router.get('/capabilities', async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      success: true,
      data: {
        analysisTypes: [
          {
            type: 'CONTRACT_ANALYSIS',
            description: 'Comprehensive contract risk assessment and clause analysis',
            supportedFormats: ['PDF', 'DOCX', 'TXT'],
            features: ['Risk Assessment', 'Clause Extraction', 'Compliance Check', 'Key Terms Analysis']
          },
          {
            type: 'DOCUMENT_ANALYSIS',
            description: 'Document content summary and key point extraction',
            supportedFormats: ['PDF', 'DOCX', 'TXT', 'JPEG', 'PNG'],
            features: ['Content Summary', 'Key Points', 'Risk Analysis', 'Compliance Check']
          },
          {
            type: 'LEGAL_RESEARCH',
            description: 'Comprehensive legal research and precedent analysis',
            supportedJurisdictions: Object.values(LegalJurisdiction),
            features: ['Case Law Research', 'Statute Analysis', 'Regulation Review', 'Precedent Matching']
          },
          {
            type: 'MATTER_PREDICTION',
            description: 'Predictive analytics for legal matter outcomes',
            predictionTypes: ['OUTCOME', 'DURATION', 'COST', 'SETTLEMENT_RANGE'],
            features: ['Outcome Prediction', 'Timeline Estimation', 'Cost Analysis', 'Settlement Modeling']
          },
          {
            type: 'COMPLIANCE_CHECK',
            description: 'Regulatory compliance analysis and verification',
            supportedEntities: ['CONTRACT', 'MATTER', 'DOCUMENT'],
            features: ['Regulation Mapping', 'Compliance Scoring', 'Risk Identification', 'Remediation Suggestions']
          }
        ],
        supportedJurisdictions: Object.values(LegalJurisdiction),
        supportedLanguages: Object.values(SupportedLanguage),
        providers: {
          selfHosted: ['OLLAMA', 'LEGAL_BERT'],
          cloud: ['OPENAI', 'ANTHROPIC', 'GOOGLE']
        }
      },
      message: 'AI capabilities retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capabilities'
    });
  }
});

export default router;
