// AI Analysis Service
// Integrates AI capabilities with legal practice management system

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AIGatewayService } from './ai-gateway.service';
import { AIAnalysisType, AIProvider, LegalJurisdiction } from '../types/ai.types';

const prisma = new PrismaClient();

// AI Analysis request schemas
export const contractAnalysisSchema = z.object({
  contractId: z.string(),
  analysisType: z.enum(['RISK_ASSESSMENT', 'CLAUSE_EXTRACTION', 'COMPLIANCE_CHECK', 'KEY_TERMS']).default('RISK_ASSESSMENT'),
  jurisdiction: z.string().optional(),
  focusAreas: z.array(z.string()).default([])
});

export const documentAnalysisSchema = z.object({
  documentId: z.string(),
  analysisType: z.enum(['CONTENT_SUMMARY', 'KEY_POINTS', 'RISK_ANALYSIS', 'COMPLIANCE_CHECK']).default('CONTENT_SUMMARY'),
  extractionTargets: z.array(z.string()).default([])
});

export const legalResearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional(),
  sources: z.array(z.string()).default(['CASE_LAW', 'STATUTES', 'REGULATIONS'])
});

export const matterPredictionSchema = z.object({
  matterId: z.string(),
  predictionType: z.enum(['OUTCOME', 'DURATION', 'COST', 'SETTLEMENT_RANGE']).default('OUTCOME'),
  factorsToConsider: z.array(z.string()).default([])
});

export const complianceCheckSchema = z.object({
  entityType: z.enum(['CONTRACT', 'MATTER', 'DOCUMENT']),
  entityId: z.string(),
  regulations: z.array(z.string()).default([]),
  jurisdiction: z.string().optional()
});

export type ContractAnalysisDTO = z.infer<typeof contractAnalysisSchema>;
export type DocumentAnalysisDTO = z.infer<typeof documentAnalysisSchema>;
export type LegalResearchDTO = z.infer<typeof legalResearchSchema>;
export type MatterPredictionDTO = z.infer<typeof matterPredictionSchema>;
export type ComplianceCheckDTO = z.infer<typeof complianceCheckSchema>;

export class AIAnalysisService {
  private aiGateway: AIGatewayService;

  constructor() {
    this.aiGateway = new AIGatewayService();
  }

  // Contract Analysis
  async analyzeContract(data: ContractAnalysisDTO, userId: string) {
    try {
      // Get contract details
      const contract = await prisma.contract.findFirst({
        where: {
          id: data.contractId,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          client: {
            select: {
              name: true,
              clientType: true,
              industry: true
            }
          },
          documents: {
            select: {
              title: true,
              description: true,
              filePath: true
            }
          }
        }
      });

      if (!contract) {
        throw new Error('Contract not found or access denied');
      }

      // Prepare AI analysis request
      const aiRequest = {
        type: AIAnalysisType.CONTRACT_ANALYSIS,
        input: {
          contractTitle: contract.title,
          contractDescription: contract.description,
          contractType: contract.type,
          contractValue: contract.value,
          currency: contract.currency,
          startDate: contract.startDate,
          endDate: contract.endDate,
          clientInfo: contract.client,
          focusAreas: data.focusAreas,
          jurisdiction: data.jurisdiction || 'GENERAL'
        },
        context: {
          analysisType: data.analysisType,
          practiceArea: this.mapContractTypeToPracticeArea(contract.type),
          jurisdiction: data.jurisdiction as LegalJurisdiction
        },
        language: 'en',
        jurisdiction: (data.jurisdiction as LegalJurisdiction) || LegalJurisdiction.GENERAL
      };

      // Execute AI analysis
      const aiResult = await this.aiGateway.processRequest(aiRequest, userId);

      // Store analysis result in database
      const analysisRecord = await prisma.aIAnalysis.create({
        data: {
          title: `${data.analysisType} - ${contract.title}`,
          type: data.analysisType,
          input: JSON.stringify(aiRequest.input),
          output: JSON.stringify(aiResult.output),
          confidence: aiResult.confidence ? Math.round(aiResult.confidence * 100) : null,
          model: aiResult.model,
          processingTime: aiResult.processingTime,
          tokensUsed: aiResult.tokensUsed,
          cost: aiResult.cost,
          status: 'COMPLETED',
          requestedById: userId,
          contractId: contract.id
        }
      });

      return {
        id: analysisRecord.id,
        analysis: aiResult.output,
        metadata: {
          confidence: aiResult.confidence,
          model: aiResult.model,
          provider: aiResult.provider,
          processingTime: aiResult.processingTime,
          cached: aiResult.cached
        },
        contract: {
          id: contract.id,
          title: contract.title,
          type: contract.type
        }
      };
    } catch (error) {
      console.error('Error analyzing contract:', error);
      throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Document Analysis
  async analyzeDocument(data: DocumentAnalysisDTO, userId: string) {
    try {
      // Get document details
      const document = await prisma.document.findFirst({
        where: {
          id: data.documentId,
          OR: [
            { uploadedById: userId },
            { client: { assignedLawyerId: userId } },
            { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          client: {
            select: { name: true }
          },
          contract: {
            select: { title: true, type: true }
          },
          matter: {
            select: { title: true, type: true }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Prepare AI analysis request
      const aiRequest = {
        type: AIAnalysisType.DOCUMENT_SUMMARY,
        input: {
          documentTitle: document.title,
          documentDescription: document.description,
          documentType: document.type,
          fileType: document.fileType,
          extractionTargets: data.extractionTargets
        },
        context: {
          analysisType: data.analysisType,
          relatedContract: document.contract?.title,
          relatedMatter: document.matter?.title
        },
        language: 'en',
        jurisdiction: LegalJurisdiction.GENERAL
      };

      // Execute AI analysis
      const aiResult = await this.aiGateway.processRequest(aiRequest, userId);

      // Store analysis result
      const analysisRecord = await prisma.aIAnalysis.create({
        data: {
          title: `${data.analysisType} - ${document.title}`,
          type: data.analysisType,
          input: JSON.stringify(aiRequest.input),
          output: JSON.stringify(aiResult.output),
          confidence: aiResult.confidence ? Math.round(aiResult.confidence * 100) : null,
          model: aiResult.model,
          processingTime: aiResult.processingTime,
          tokensUsed: aiResult.tokensUsed,
          cost: aiResult.cost,
          status: 'COMPLETED',
          requestedById: userId,
          documentId: document.id
        }
      });

      return {
        id: analysisRecord.id,
        analysis: aiResult.output,
        metadata: {
          confidence: aiResult.confidence,
          model: aiResult.model,
          provider: aiResult.provider,
          processingTime: aiResult.processingTime,
          cached: aiResult.cached
        },
        document: {
          id: document.id,
          title: document.title,
          type: document.type
        }
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Legal Research
  async performLegalResearch(data: LegalResearchDTO, userId: string) {
    try {
      // Prepare AI research request
      const aiRequest = {
        type: AIAnalysisType.LEGAL_RESEARCH,
        input: {
          query: data.query,
          practiceArea: data.practiceArea,
          sources: data.sources,
          dateRange: data.dateRange
        },
        context: {
          jurisdiction: data.jurisdiction,
          researchType: 'COMPREHENSIVE'
        },
        language: 'en',
        jurisdiction: (data.jurisdiction as LegalJurisdiction) || LegalJurisdiction.GENERAL
      };

      // Execute AI research
      const aiResult = await this.aiGateway.processRequest(aiRequest, userId);

      // Store research result
      const analysisRecord = await prisma.aIAnalysis.create({
        data: {
          title: `Legal Research: ${data.query.substring(0, 50)}...`,
          type: 'LEGAL_RESEARCH',
          input: JSON.stringify(aiRequest.input),
          output: JSON.stringify(aiResult.output),
          confidence: aiResult.confidence ? Math.round(aiResult.confidence * 100) : null,
          model: aiResult.model,
          processingTime: aiResult.processingTime,
          tokensUsed: aiResult.tokensUsed,
          cost: aiResult.cost,
          status: 'COMPLETED',
          requestedById: userId
        }
      });

      return {
        id: analysisRecord.id,
        research: aiResult.output,
        metadata: {
          confidence: aiResult.confidence,
          model: aiResult.model,
          provider: aiResult.provider,
          processingTime: aiResult.processingTime,
          cached: aiResult.cached
        },
        query: data.query
      };
    } catch (error) {
      console.error('Error performing legal research:', error);
      throw new Error(`Failed to perform legal research: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Matter Outcome Prediction
  async predictMatterOutcome(data: MatterPredictionDTO, userId: string) {
    try {
      // Get matter details
      const matter = await prisma.matter.findFirst({
        where: {
          id: data.matterId,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          client: {
            select: { name: true, clientType: true, industry: true }
          },
          disputes: {
            select: {
              title: true,
              type: true,
              status: true,
              claimAmount: true,
              riskLevel: true
            }
          },
          documents: {
            select: { type: true, title: true }
          }
        }
      });

      if (!matter) {
        throw new Error('Matter not found or access denied');
      }

      // Prepare AI prediction request
      const aiRequest = {
        type: AIAnalysisType.CASE_PREDICTION,
        input: {
          matterTitle: matter.title,
          matterType: matter.type,
          matterStatus: matter.status,
          priority: matter.priority,
          riskLevel: matter.riskLevel,
          estimatedValue: matter.estimatedValue,
          billableHours: matter.billableHours,
          clientInfo: matter.client,
          disputes: matter.disputes,
          documentsCount: matter.documents.length,
          factorsToConsider: data.factorsToConsider
        },
        context: {
          predictionType: data.predictionType,
          practiceArea: matter.type
        },
        language: 'en',
        jurisdiction: LegalJurisdiction.GENERAL
      };

      // Execute AI prediction
      const aiResult = await this.aiGateway.processRequest(aiRequest, userId);

      // Store prediction result
      const analysisRecord = await prisma.aIAnalysis.create({
        data: {
          title: `${data.predictionType} Prediction - ${matter.title}`,
          type: 'CASE_PREDICTION',
          input: JSON.stringify(aiRequest.input),
          output: JSON.stringify(aiResult.output),
          confidence: aiResult.confidence ? Math.round(aiResult.confidence * 100) : null,
          model: aiResult.model,
          processingTime: aiResult.processingTime,
          tokensUsed: aiResult.tokensUsed,
          cost: aiResult.cost,
          status: 'COMPLETED',
          requestedById: userId,
          matterId: matter.id
        }
      });

      return {
        id: analysisRecord.id,
        prediction: aiResult.output,
        metadata: {
          confidence: aiResult.confidence,
          model: aiResult.model,
          provider: aiResult.provider,
          processingTime: aiResult.processingTime,
          cached: aiResult.cached
        },
        matter: {
          id: matter.id,
          title: matter.title,
          type: matter.type
        }
      };
    } catch (error) {
      console.error('Error predicting matter outcome:', error);
      throw new Error(`Failed to predict matter outcome: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Compliance Check
  async performComplianceCheck(data: ComplianceCheckDTO, userId: string) {
    try {
      let entity: any;
      let entityData: any;

      // Get entity details based on type
      switch (data.entityType) {
        case 'CONTRACT':
          entity = await prisma.contract.findFirst({
            where: {
              id: data.entityId,
              OR: [
                { assignedLawyerId: userId },
                { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
              ]
            },
            include: { client: true }
          });
          entityData = {
            title: entity?.title,
            type: entity?.type,
            value: entity?.value,
            client: entity?.client
          };
          break;

        case 'MATTER':
          entity = await prisma.matter.findFirst({
            where: {
              id: data.entityId,
              OR: [
                { assignedLawyerId: userId },
                { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
              ]
            },
            include: { client: true }
          });
          entityData = {
            title: entity?.title,
            type: entity?.type,
            status: entity?.status,
            client: entity?.client
          };
          break;

        case 'DOCUMENT':
          entity = await prisma.document.findFirst({
            where: {
              id: data.entityId,
              OR: [
                { uploadedById: userId },
                { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
              ]
            }
          });
          entityData = {
            title: entity?.title,
            type: entity?.type,
            category: entity?.category
          };
          break;
      }

      if (!entity) {
        throw new Error(`${data.entityType} not found or access denied`);
      }

      // Prepare AI compliance check request
      const aiRequest = {
        type: AIAnalysisType.COMPLIANCE_CHECK,
        input: {
          entityType: data.entityType,
          entityData,
          regulations: data.regulations,
          jurisdiction: data.jurisdiction
        },
        context: {
          complianceScope: 'COMPREHENSIVE'
        },
        language: 'en',
        jurisdiction: (data.jurisdiction as LegalJurisdiction) || LegalJurisdiction.GENERAL
      };

      // Execute AI compliance check
      const aiResult = await this.aiGateway.processRequest(aiRequest, userId);

      // Store compliance check result
      const analysisRecord = await prisma.aIAnalysis.create({
        data: {
          title: `Compliance Check - ${entityData.title}`,
          type: 'COMPLIANCE_CHECK',
          input: JSON.stringify(aiRequest.input),
          output: JSON.stringify(aiResult.output),
          confidence: aiResult.confidence ? Math.round(aiResult.confidence * 100) : null,
          model: aiResult.model,
          processingTime: aiResult.processingTime,
          tokensUsed: aiResult.tokensUsed,
          cost: aiResult.cost,
          status: 'COMPLETED',
          requestedById: userId,
          ...(data.entityType === 'CONTRACT' && { contractId: data.entityId }),
          ...(data.entityType === 'MATTER' && { matterId: data.entityId }),
          ...(data.entityType === 'DOCUMENT' && { documentId: data.entityId })
        }
      });

      return {
        id: analysisRecord.id,
        complianceCheck: aiResult.output,
        metadata: {
          confidence: aiResult.confidence,
          model: aiResult.model,
          provider: aiResult.provider,
          processingTime: aiResult.processingTime,
          cached: aiResult.cached
        },
        entity: {
          id: entity.id,
          title: entityData.title,
          type: data.entityType
        }
      };
    } catch (error) {
      console.error('Error performing compliance check:', error);
      throw new Error(`Failed to perform compliance check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get AI Analysis History
  async getAnalysisHistory(userId: string, entityType?: string, entityId?: string) {
    try {
      const whereClause: any = {
        requestedById: userId
      };

      // Filter by entity if specified
      if (entityType && entityId) {
        switch (entityType.toLowerCase()) {
          case 'contract':
            whereClause.contractId = entityId;
            break;
          case 'matter':
            whereClause.matterId = entityId;
            break;
          case 'document':
            whereClause.documentId = entityId;
            break;
          case 'dispute':
            whereClause.disputeId = entityId;
            break;
        }
      }

      const analyses = await prisma.aIAnalysis.findMany({
        where: whereClause,
        include: {
          requestedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          contract: {
            select: {
              title: true,
              type: true
            }
          },
          matter: {
            select: {
              title: true,
              type: true
            }
          },
          document: {
            select: {
              title: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return analyses.map(analysis => ({
        id: analysis.id,
        title: analysis.title,
        type: analysis.type,
        confidence: analysis.confidence,
        status: analysis.status,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        processingTime: analysis.processingTime,
        model: analysis.model,
        tokensUsed: analysis.tokensUsed,
        cost: analysis.cost,
        requestedBy: analysis.requestedBy,
        relatedEntity: {
          contract: analysis.contract,
          matter: analysis.matter,
          document: analysis.document
        }
      }));
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw new Error(`Failed to get analysis history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get AI Analysis by ID
  async getAnalysisById(id: string, userId: string) {
    try {
      const analysis = await prisma.aIAnalysis.findFirst({
        where: {
          id,
          requestedById: userId
        },
        include: {
          requestedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          contract: {
            select: {
              title: true,
              type: true
            }
          },
          matter: {
            select: {
              title: true,
              type: true
            }
          },
          document: {
            select: {
              title: true,
              type: true
            }
          }
        }
      });

      if (!analysis) {
        throw new Error('Analysis not found or access denied');
      }

      return {
        ...analysis,
        input: JSON.parse(analysis.input || '{}'),
        output: JSON.parse(analysis.output || '{}')
      };
    } catch (error) {
      console.error('Error getting analysis:', error);
      throw new Error(`Failed to get analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to map contract types to practice areas
  private mapContractTypeToPracticeArea(contractType: string): string {
    const mapping: Record<string, string> = {
      'SERVICE_AGREEMENT': 'COMMERCIAL',
      'EMPLOYMENT': 'EMPLOYMENT',
      'NDA': 'INTELLECTUAL_PROPERTY',
      'JOINT_VENTURE': 'CORPORATE',
      'LICENSE_AGREEMENT': 'INTELLECTUAL_PROPERTY',
      'MERGER_ACQUISITION': 'CORPORATE',
      'PARTNERSHIP': 'CORPORATE',
      'CONSULTING': 'COMMERCIAL',
      'SUPPLY': 'COMMERCIAL',
      'DISTRIBUTION': 'COMMERCIAL'
    };

    return mapping[contractType] || 'GENERAL';
  }

  // Get AI provider status
  async getProviderStatus() {
    return await this.aiGateway.getProviderStatus();
  }

  // Health check for AI services
  async healthCheck() {
    return await this.aiGateway.healthCheck();
  }
}