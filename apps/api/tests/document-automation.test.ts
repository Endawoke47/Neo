// Document Automation Service Tests
// Phase 2: Feature 4 - Comprehensive Test Suite for Document Generation Engine

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DocumentAutomationService } from '../src/services/document-automation-v2.service';
import {
  DocumentGenerationRequest,
  DocumentType,
  GenerationMethod,
  OutputFormat,
  DocumentComplexity,
  TemplateFilters,
  PartyInformation
} from '../src/types/document-automation.types';
import { LegalJurisdiction, SupportedLanguage } from '../src/types/ai.types';
import { LegalArea } from '../src/types/legal-research.types';

describe('DocumentAutomationService', () => {
  let service: DocumentAutomationService;

  beforeEach(() => {
    service = new DocumentAutomationService();
  });

  describe('Document Generation', () => {
    const basicRequest: DocumentGenerationRequest = {
      documentType: DocumentType.SERVICE_AGREEMENT,
      generationMethod: GenerationMethod.TEMPLATE_BASED,
      jurisdiction: LegalJurisdiction.UNITED_STATES,
      legalArea: LegalArea.CONTRACT,
      language: SupportedLanguage.ENGLISH,
      complexity: DocumentComplexity.STANDARD,
      
      variables: {
        'effective_date': '2024-01-01',
        'service_description': 'Legal consulting services',
        'payment_amount': '$5,000',
        'payment_terms': 'Net 30 days'
      },
      
      parties: [
        {
          id: 'party1',
          name: 'CounselFlow LLC',
          type: 'LLC',
          role: 'VENDOR',
          address: {
            street: '123 Legal St',
            city: 'Law City',
            state: 'CA',
            postalCode: '90210',
            country: 'US'
          },
          contactInformation: {
            email: 'contact@counselflow.com',
            phone: '+1-555-0123'
          },
          legalDetails: {
            taxId: '12-3456789',
            jurisdiction: LegalJurisdiction.UNITED_STATES
          }
        },
        {
          id: 'party2',
          name: 'Client Corp',
          type: 'CORPORATION',
          role: 'CLIENT',
          address: {
            street: '456 Business Ave',
            city: 'Corporate City',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          },
          contactInformation: {
            email: 'legal@clientcorp.com',
            phone: '+1-555-0456'
          },
          legalDetails: {
            taxId: '98-7654321',
            jurisdiction: LegalJurisdiction.UNITED_STATES
          }
        }
      ],
      
      outputFormat: [OutputFormat.PDF, OutputFormat.DOCX],
      
      features: {
        includeTableOfContents: true,
        includeExecutionPage: true,
        includeExhibits: false,
        includeDefinitions: true,
        enableTracking: false,
        enableComments: false,
        enableReview: false,
        generateAlternatives: false,
        riskAnalysis: true,
        complianceCheck: true,
        qualityAssurance: true
      },
      
      confidentialityLevel: 'CONFIDENTIAL'
    };

    test('should generate service agreement successfully', async () => {
      const result = await service.generateDocument(basicRequest);
      
      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(2); // PDF and DOCX
      expect(result.documents[0].format).toBe(OutputFormat.PDF);
      expect(result.documents[1].format).toBe(OutputFormat.DOCX);
      
      // Check document structure
      expect(result.documents[0].content).toContain('SERVICE AGREEMENT');
      expect(result.documents[0].content).toContain('CounselFlow LLC');
      expect(result.documents[0].content).toContain('Client Corp');
      expect(result.documents[0].content).toContain('Legal consulting services');
      
      // Check metadata
      expect(result.metadata.generationId).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      
      // Check quality assessment
      expect(result.quality.overall).toBeGreaterThan(0.8);
      expect(result.quality.completeness).toBeGreaterThan(0.8);
      expect(result.quality.consistency).toBeGreaterThan(0.8);
      expect(result.quality.accuracy).toBeGreaterThan(0.8);
      
      // Check compliance
      expect(result.compliance.overallCompliance).toBeGreaterThan(0.8);
      expect(result.compliance.jurisdictionalCompliance).toBeDefined();
      
      // Check summary
      expect(result.summary.totalSections).toBeGreaterThan(0);
      expect(result.summary.complexity).toBe(DocumentComplexity.STANDARD);
    });

    test('should generate employment contract with AI enhancement', async () => {
      const employmentRequest: DocumentGenerationRequest = {
        ...basicRequest,
        documentType: DocumentType.EMPLOYMENT_CONTRACT,
        generationMethod: GenerationMethod.AI_GENERATED,
        legalArea: LegalArea.EMPLOYMENT,
        variables: {
          'employee_name': 'John Doe',
          'position': 'Senior Software Engineer',
          'salary': '$120,000',
          'start_date': '2024-02-01',
          'benefits': 'Health, Dental, 401k'
        },
        parties: [
          {
            id: 'employer',
            name: 'Tech Corp Inc',
            type: 'CORPORATION',
            role: 'CLIENT',
            address: {
              street: '789 Tech Blvd',
              city: 'Silicon Valley',
              state: 'CA',
              postalCode: '94105',
              country: 'US'
            },
            contactInformation: {
              email: 'hr@techcorp.com',
              phone: '+1-555-0789'
            },
            legalDetails: {
              taxId: '11-2233445',
              jurisdiction: LegalJurisdiction.UNITED_STATES
            }
          },
          {
            id: 'employee',
            name: 'John Doe',
            type: 'INDIVIDUAL',
            role: 'EMPLOYEE',
            address: {
              street: '321 Home St',
              city: 'Residence City',
              state: 'CA',
              postalCode: '94102',
              country: 'US'
            },
            contactInformation: {
              email: 'john.doe@email.com',
              phone: '+1-555-0321'
            },
            legalDetails: {
              taxId: '123-45-6789',
              jurisdiction: LegalJurisdiction.UNITED_STATES
            }
          }
        ]
      };

      const result = await service.generateDocument(employmentRequest);
      
      expect(result).toBeDefined();
      expect(result.documents[0].content).toContain('EMPLOYMENT AGREEMENT');
      expect(result.documents[0].content).toContain('John Doe');
      expect(result.documents[0].content).toContain('Senior Software Engineer');
      expect(result.documents[0].content).toContain('$120,000');
    });

    test('should generate complex partnership agreement', async () => {
      const partnershipRequest: DocumentGenerationRequest = {
        ...basicRequest,
        documentType: DocumentType.PARTNERSHIP_AGREEMENT,
        generationMethod: GenerationMethod.HYBRID,
        complexity: DocumentComplexity.COMPLEX,
        legalArea: LegalArea.CORPORATE,
        variables: {
          'partnership_name': 'Innovation Partners LLC',
          'business_purpose': 'Technology consulting and development',
          'initial_capital': '$500,000',
          'profit_sharing': '50/50 split'
        },
        parties: [
          {
            id: 'partner1',
            name: 'Alpha Tech LLC',
            type: 'LLC',
            role: 'PARTNER',
            address: basicRequest.parties[0].address,
            contactInformation: basicRequest.parties[0].contactInformation,
            legalDetails: basicRequest.parties[0].legalDetails
          },
          {
            id: 'partner2',
            name: 'Beta Innovations Inc',
            type: 'CORPORATION',
            role: 'PARTNER',
            address: basicRequest.parties[1].address,
            contactInformation: basicRequest.parties[1].contactInformation,
            legalDetails: basicRequest.parties[1].legalDetails
          }
        ],
        features: {
          ...basicRequest.features,
          includeExhibits: true,
          generateAlternatives: true
        }
      };

      const result = await service.generateDocument(partnershipRequest);
      
      expect(result).toBeDefined();
      expect(result.documents[0].content).toContain('PARTNERSHIP AGREEMENT');
      expect(result.documents[0].content).toContain('Innovation Partners LLC');
      expect(result.summary.complexity).toBe(DocumentComplexity.COMPLEX);
    });

    test('should handle NDA with clause assembly', async () => {
      const ndaRequest: DocumentGenerationRequest = {
        ...basicRequest,
        documentType: DocumentType.NON_DISCLOSURE_AGREEMENT,
        generationMethod: GenerationMethod.CLAUSE_ASSEMBLY,
        complexity: DocumentComplexity.SIMPLE,
        customClauses: [
          {
            id: 'clause1',
            type: 'CONFIDENTIALITY',
            content: 'All information marked as confidential shall remain protected',
            mandatory: true,
            order: 1
          },
          {
            id: 'clause2',
            type: 'TERMINATION',
            content: 'This agreement terminates after 2 years',
            mandatory: false,
            order: 2
          }
        ],
        variables: {
          'disclosure_party': 'Discloser Inc',
          'receiving_party': 'Receiver LLC',
          'duration': '2 years',
          'purpose': 'Business discussions'
        }
      };

      const result = await service.generateDocument(ndaRequest);
      
      expect(result).toBeDefined();
      expect(result.documents[0].content).toContain('NON-DISCLOSURE AGREEMENT');
      expect(result.documents[0].content).toContain('Discloser Inc');
      expect(result.documents[0].content).toContain('Receiver LLC');
      expect(result.documents[0].content).toContain('All information marked as confidential');
    });

    test('should generate multiple output formats', async () => {
      const multiFormatRequest: DocumentGenerationRequest = {
        ...basicRequest,
        outputFormat: [
          OutputFormat.PDF,
          OutputFormat.DOCX,
          OutputFormat.HTML,
          OutputFormat.MARKDOWN
        ]
      };

      const result = await service.generateDocument(multiFormatRequest);
      
      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(4);
      
      const formats = result.documents.map(doc => doc.format);
      expect(formats).toContain(OutputFormat.PDF);
      expect(formats).toContain(OutputFormat.DOCX);
      expect(formats).toContain(OutputFormat.HTML);
      expect(formats).toContain(OutputFormat.MARKDOWN);
      
      // Each document should have content
      result.documents.forEach(doc => {
        expect(doc.content).toBeDefined();
        expect(doc.content.length).toBeGreaterThan(100);
        expect(doc.size).toBeGreaterThan(0);
      });
    });

    test('should handle errors gracefully', async () => {
      const invalidRequest: DocumentGenerationRequest = {
        ...basicRequest,
        parties: [] // Invalid: no parties
      };

      const result = await service.generateDocument(invalidRequest);
      
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('At least one party is required');
    });
  });

  describe('Complexity Analysis', () => {
    test('should analyze simple document complexity', async () => {
      const simpleRequest: DocumentGenerationRequest = {
        documentType: DocumentType.NON_DISCLOSURE_AGREEMENT,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.SIMPLE,
        variables: {},
        parties: [
          { 
            id: '1', 
            name: 'Party A', 
            type: 'INDIVIDUAL', 
            role: 'CLIENT',
            address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test@test.com', phone: '555-0123' },
            legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
          },
          { 
            id: '2', 
            name: 'Party B', 
            type: 'INDIVIDUAL', 
            role: 'COUNTERPARTY',
            address: { street: '456 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test2@test.com', phone: '555-0456' },
            legalDetails: { taxId: '987654321', jurisdiction: LegalJurisdiction.UNITED_STATES }
          }
        ],
        outputFormat: [OutputFormat.PDF],
        features: {
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const analysis = await service.analyzeComplexity(simpleRequest);
      
      expect(analysis.complexity).toBe(DocumentComplexity.SIMPLE);
      expect(analysis.score).toBeLessThan(30);
      expect(analysis.factors.documentType).toBeDefined();
      expect(analysis.factors.partyCount).toBe(2);
      expect(analysis.factors.jurisdictionComplexity).toBeDefined();
      expect(analysis.recommendations).toContain('Consider template-based generation');
    });

    test('should analyze complex document complexity', async () => {
      const complexRequest: DocumentGenerationRequest = {
        documentType: DocumentType.MERGER_AGREEMENT,
        generationMethod: GenerationMethod.AI_GENERATED,
        jurisdiction: LegalJurisdiction.DELAWARE,
        legalArea: LegalArea.CORPORATE,
        complexity: DocumentComplexity.COMPLEX,
        variables: {},
        parties: [
          { 
            id: '1', 
            name: 'Acquirer Corp', 
            type: 'CORPORATION', 
            role: 'BUYER',
            address: { street: '123 Corp St', city: 'Corp City', state: 'DE', postalCode: '19801', country: 'US' },
            contactInformation: { email: 'legal@acquirer.com', phone: '555-1000' },
            legalDetails: { taxId: '11-1111111', jurisdiction: LegalJurisdiction.DELAWARE }
          },
          { 
            id: '2', 
            name: 'Target Inc', 
            type: 'CORPORATION', 
            role: 'SELLER',
            address: { street: '456 Target Ave', city: 'Target City', state: 'DE', postalCode: '19802', country: 'US' },
            contactInformation: { email: 'legal@target.com', phone: '555-2000' },
            legalDetails: { taxId: '22-2222222', jurisdiction: LegalJurisdiction.DELAWARE }
          },
          { 
            id: '3', 
            name: 'Bank Advisor', 
            type: 'CORPORATION', 
            role: 'PARTNER',
            address: { street: '789 Bank St', city: 'Finance City', state: 'NY', postalCode: '10001', country: 'US' },
            contactInformation: { email: 'advisor@bank.com', phone: '555-3000' },
            legalDetails: { taxId: '33-3333333', jurisdiction: LegalJurisdiction.NEW_YORK }
          }
        ],
        outputFormat: [OutputFormat.PDF, OutputFormat.DOCX],
        customClauses: Array(10).fill({}).map((_, i) => ({
          id: `clause${i}`,
          type: 'CUSTOM',
          content: 'Complex clause',
          mandatory: true,
          order: i
        })),
        features: {
          includeTableOfContents: true,
          includeExecutionPage: true,
          includeExhibits: true,
          includeDefinitions: true,
          enableTracking: true,
          enableComments: true,
          enableReview: true,
          generateAlternatives: true,
          riskAnalysis: true,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'CONFIDENTIAL'
      };

      const analysis = await service.analyzeComplexity(complexRequest);
      
      expect(analysis.complexity).toBe(DocumentComplexity.COMPLEX);
      expect(analysis.score).toBeGreaterThan(70);
      expect(analysis.factors.partyCount).toBe(3);
      expect(analysis.factors.customClauseCount).toBe(10);
      expect(analysis.recommendations).toContain('Consider AI-generated content');
    });
  });

  describe('Generation Estimation', () => {
    test('should estimate generation time and cost', async () => {
      const request: DocumentGenerationRequest = {
        documentType: DocumentType.SERVICE_AGREEMENT,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.STANDARD,
        variables: {},
        parties: [
          { 
            id: '1', 
            name: 'Party A', 
            type: 'LLC', 
            role: 'VENDOR',
            address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test@test.com', phone: '555-0123' },
            legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
          },
          { 
            id: '2', 
            name: 'Party B', 
            type: 'CORPORATION', 
            role: 'CLIENT',
            address: { street: '456 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test2@test.com', phone: '555-0456' },
            legalDetails: { taxId: '987654321', jurisdiction: LegalJurisdiction.UNITED_STATES }
          }
        ],
        outputFormat: [OutputFormat.PDF, OutputFormat.DOCX],
        features: {
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const estimate = await service.estimateGeneration(request);
      
      expect(estimate.estimatedDuration).toBeGreaterThan(0);
      expect(estimate.estimatedDuration).toBeLessThan(300000); // Less than 5 minutes
      expect(estimate.confidence).toBeGreaterThan(0.7);
      expect(estimate.complexity).toBe(DocumentComplexity.STANDARD);
      expect(estimate.breakdown.templateProcessing).toBeGreaterThan(0);
      expect(estimate.breakdown.contentGeneration).toBeGreaterThan(0);
      expect(estimate.breakdown.qualityAssessment).toBeGreaterThan(0);
      expect(estimate.breakdown.formatConversion).toBeGreaterThan(0);
    });

    test('should estimate AI generation takes longer', async () => {
      const templateRequest: DocumentGenerationRequest = {
        documentType: DocumentType.SERVICE_AGREEMENT,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.STANDARD,
        variables: {},
        parties: [{ 
          id: '1', 
          name: 'Party A', 
          type: 'LLC', 
          role: 'VENDOR',
          address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
          contactInformation: { email: 'test@test.com', phone: '555-0123' },
          legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
        }],
        outputFormat: [OutputFormat.PDF],
        features: {
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const aiRequest: DocumentGenerationRequest = {
        ...templateRequest,
        generationMethod: GenerationMethod.AI_GENERATED
      };

      const templateEstimate = await service.estimateGeneration(templateRequest);
      const aiEstimate = await service.estimateGeneration(aiRequest);
      
      expect(aiEstimate.estimatedDuration).toBeGreaterThan(templateEstimate.estimatedDuration);
      expect(aiEstimate.breakdown.aiProcessing).toBeGreaterThan(0);
    });
  });

  describe('Template Management', () => {
    test('should retrieve templates with filters', async () => {
      const filters: TemplateFilters = {
        type: DocumentType.SERVICE_AGREEMENT,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.STANDARD
      };

      const templates = await service.getTemplates(filters);
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check template structure
      templates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.type).toBe(DocumentType.SERVICE_AGREEMENT);
        expect(template.jurisdiction).toBe(LegalJurisdiction.UNITED_STATES);
        expect(template.complexity).toBe(DocumentComplexity.STANDARD);
        expect(template.content).toBeDefined();
        expect(template.variables).toBeDefined();
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });

    test('should validate template successfully', async () => {
      const validTemplate = {
        id: 'test-template',
        name: 'Test Service Agreement',
        type: DocumentType.SERVICE_AGREEMENT,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.STANDARD,
        content: 'SERVICE AGREEMENT\n\nParties: {{party1.name}} and {{party2.name}}\nEffective Date: {{effective_date}}',
        variables: [
          { name: 'party1.name', type: 'string', required: true },
          { name: 'party2.name', type: 'string', required: true },
          { name: 'effective_date', type: 'date', required: true }
        ],
        sections: ['Parties', 'Terms', 'Signatures'],
        language: SupportedLanguage.ENGLISH,
        version: '1.0.0',
        lastModified: new Date().toISOString()
      };

      const validation = await service.validateTemplate(validTemplate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toBeDefined();
      expect(validation.suggestions).toBeDefined();
      expect(validation.score).toBeGreaterThan(0.8);
    });

    test('should detect template validation errors', async () => {
      const invalidTemplate = {
        id: 'invalid-template',
        name: 'Invalid Template',
        type: DocumentType.SERVICE_AGREEMENT,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        content: 'Missing variables: {{undefined_variable}}',
        variables: [], // Missing required variables
        sections: [],
        language: SupportedLanguage.ENGLISH,
        version: '1.0.0'
      };

      const validation = await service.validateTemplate(invalidTemplate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('undefined_variable'))).toBe(true);
      expect(validation.score).toBeLessThan(0.5);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', async () => {
      const invalidRequest = {
        // Missing required fields
        documentType: DocumentType.SERVICE_AGREEMENT,
        outputFormat: [OutputFormat.PDF]
      } as any;

      const result = await service.generateDocument(invalidRequest);
      
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    test('should handle unsupported document types', async () => {
      const request: DocumentGenerationRequest = {
        documentType: 'UNSUPPORTED_TYPE' as DocumentType,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        variables: {},
        parties: [{ 
          id: '1', 
          name: 'Party A', 
          type: 'INDIVIDUAL', 
          role: 'CLIENT',
          address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
          contactInformation: { email: 'test@test.com', phone: '555-0123' },
          legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
        }],
        outputFormat: [OutputFormat.PDF],
        features: {
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const result = await service.generateDocument(request);
      
      expect(result).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_DOCUMENT_TYPE');
    });

    test('should handle template not found', async () => {
      const filters: TemplateFilters = {
        type: 'NON_EXISTENT_TYPE' as DocumentType
      };

      const templates = await service.getTemplates(filters);
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    test('should generate document within reasonable time', async () => {
      const request: DocumentGenerationRequest = {
        documentType: DocumentType.SERVICE_AGREEMENT,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.STANDARD,
        variables: { effective_date: '2024-01-01' },
        parties: [
          { 
            id: '1', 
            name: 'Party A', 
            type: 'LLC', 
            role: 'VENDOR',
            address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test@test.com', phone: '555-0123' },
            legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
          },
          { 
            id: '2', 
            name: 'Party B', 
            type: 'CORPORATION', 
            role: 'CLIENT',
            address: { street: '456 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test2@test.com', phone: '555-0456' },
            legalDetails: { taxId: '987654321', jurisdiction: LegalJurisdiction.UNITED_STATES }
          }
        ],
        outputFormat: [OutputFormat.PDF],
        features: { 
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const startTime = Date.now();
      const result = await service.generateDocument(request);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(60000); // Less than 1 minute
      expect(result.metadata.duration).toBeLessThan(60000);
    });

    test('should handle concurrent requests', async () => {
      const request: DocumentGenerationRequest = {
        documentType: DocumentType.NON_DISCLOSURE_AGREEMENT,
        generationMethod: GenerationMethod.TEMPLATE_BASED,
        jurisdiction: LegalJurisdiction.UNITED_STATES,
        legalArea: LegalArea.CONTRACT,
        complexity: DocumentComplexity.SIMPLE,
        variables: {},
        parties: [
          { 
            id: '1', 
            name: 'Party A', 
            type: 'INDIVIDUAL', 
            role: 'CLIENT',
            address: { street: '123 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test@test.com', phone: '555-0123' },
            legalDetails: { taxId: '123456789', jurisdiction: LegalJurisdiction.UNITED_STATES }
          },
          { 
            id: '2', 
            name: 'Party B', 
            type: 'INDIVIDUAL', 
            role: 'COUNTERPARTY',
            address: { street: '456 St', city: 'City', state: 'CA', postalCode: '12345', country: 'US' },
            contactInformation: { email: 'test2@test.com', phone: '555-0456' },
            legalDetails: { taxId: '987654321', jurisdiction: LegalJurisdiction.UNITED_STATES }
          }
        ],
        outputFormat: [OutputFormat.PDF],
        features: {
          includeTableOfContents: false,
          includeExecutionPage: true,
          includeExhibits: false,
          includeDefinitions: false,
          enableTracking: false,
          enableComments: false,
          enableReview: false,
          generateAlternatives: false,
          riskAnalysis: false,
          complianceCheck: true,
          qualityAssurance: true
        },
        confidentialityLevel: 'PUBLIC'
      };

      const promises = Array(5).fill(null).map(() => service.generateDocument(request));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.documents).toHaveLength(1);
      });
    });
  });
});
