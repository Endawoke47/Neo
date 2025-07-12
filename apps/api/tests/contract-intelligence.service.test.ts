// Contract Intelligence Service Tests
// Phase 2: Feature 2 Testing Suite

import { ContractIntelligenceService } from '../src/services/contract-intelligence.service';
import {
  ContractAnalysisRequest,
  ContractType,
  ContractAnalysisType,
  RiskLevel,
  ComplianceStandard,
  AnalysisDepth
} from '../src/types/contract-intelligence.types';
import { LegalJurisdiction, SupportedLanguage } from '../src/types/ai.types';

describe('ContractIntelligenceService', () => {
  let contractService: ContractIntelligenceService;

  beforeEach(() => {
    contractService = new ContractIntelligenceService();
  });

  describe('Basic Contract Analysis', () => {
    test('should analyze employment contract for Nigeria', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            EMPLOYMENT AGREEMENT
            
            This Employment Agreement is entered into between Acme Corporation (Company) 
            and John Doe (Employee) on January 1, 2024.
            
            1. POSITION AND DUTIES
            Employee shall serve as Software Developer.
            
            2. COMPENSATION
            Company shall pay Employee a salary of ₦2,000,000 per annum.
            
            3. TERM OF EMPLOYMENT
            This agreement shall commence on January 1, 2024 and continue indefinitely 
            until terminated by either party with 30 days written notice.
            
            4. CONFIDENTIALITY
            Employee agrees to maintain strict confidentiality of all company information.
            
            5. GOVERNING LAW
            This agreement shall be governed by the laws of Nigeria.
          `,
          fileName: 'employment_agreement_nigeria.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.CLAUSE_EXTRACTION,
          ContractAnalysisType.RISK_ASSESSMENT,
          ContractAnalysisType.COMPLIANCE_CHECK,
          ContractAnalysisType.TERM_EXTRACTION
        ],
        jurisdiction: LegalJurisdiction.NIGERIA,
        language: SupportedLanguage.ENGLISH,
        contractType: ContractType.EMPLOYMENT,
        complianceStandards: [ComplianceStandard.LOCAL_LABOR_LAW],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: true,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: true,
          extractDates: true,
          extractAmounts: true,
          extractParties: true,
          extractObligations: true,
          extractRights: true,
          extractConditions: true,
          extractPenalties: true,
          extractDeadlines: true,
          identifyMissingClauses: true
        },
        analysisDepth: AnalysisDepth.COMPREHENSIVE
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      expect(result.analysisId).toMatch(/^contract_\d+_[a-z0-9]+$/);
      expect(result.contractType).toBe(ContractType.EMPLOYMENT);
      expect(result.extractedClauses.length).toBeGreaterThan(0);
      expect(result.identifiedRisks.length).toBeGreaterThan(0);
      expect(result.complianceChecks.length).toBeGreaterThan(0);
      expect(result.extractedTerms.length).toBeGreaterThan(0);
      expect(result.contractScore.overall).toBeGreaterThan(0);
      expect(result.contractScore.overall).toBeLessThanOrEqual(100);
      
      // Check for Nigerian-specific compliance
      const laborLawCompliance = result.complianceChecks.find(
        check => check.standard === ComplianceStandard.LOCAL_LABOR_LAW
      );
      expect(laborLawCompliance).toBeDefined();
      expect(laborLawCompliance?.jurisdiction).toBe(LegalJurisdiction.NIGERIA);
      
      // Verify extracted terms
      expect(result.extractedTerms.some(term => term.value === 'Acme Corporation')).toBe(true);
      expect(result.extractedTerms.some(term => term.value === '₦2,000,000')).toBe(true);
      
      // Check execution time
      expect(result.summary.executionTime).toBeGreaterThan(0);
      expect(result.summary.confidenceLevel).toBeGreaterThan(0.5);
    }, 30000);

    test('should analyze service agreement for UAE', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            SERVICE AGREEMENT
            
            This Service Agreement is entered into between Dubai Tech Solutions LLC (Provider) 
            and Global Enterprises FZE (Client) on February 15, 2024.
            
            1. SCOPE OF SERVICES
            Provider shall provide software development and consulting services.
            
            2. PAYMENT TERMS
            Client shall pay Provider AED 100,000 within 60 days of invoice.
            
            3. INTELLECTUAL PROPERTY
            All intellectual property developed shall remain with Provider unless 
            specifically transferred in writing.
            
            4. LIABILITY LIMITATION
            Provider's liability shall not exceed the total contract value.
            
            5. DISPUTE RESOLUTION
            Any disputes shall be resolved through arbitration in Dubai International 
            Arbitration Centre (DIAC).
            
            6. GOVERNING LAW
            This agreement is governed by UAE Federal Law.
          `,
          fileName: 'service_agreement_uae.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.CLAUSE_EXTRACTION,
          ContractAnalysisType.RISK_ASSESSMENT,
          ContractAnalysisType.RED_FLAG_DETECTION
        ],
        jurisdiction: LegalJurisdiction.UAE,
        language: SupportedLanguage.ENGLISH,
        contractType: ContractType.SERVICE_AGREEMENT,
        complianceStandards: [ComplianceStandard.LOCAL_COMMERCIAL_LAW],
        riskThreshold: RiskLevel.HIGH,
        includeRecommendations: true,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: true,
          extractDates: true,
          extractAmounts: true,
          extractParties: true,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: true,
          identifyMissingClauses: true
        },
        analysisDepth: AnalysisDepth.STANDARD
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      expect(result.contractType).toBe(ContractType.SERVICE_AGREEMENT);
      expect(result.extractedClauses.length).toBeGreaterThan(0);
      expect(result.identifiedRisks.length).toBeGreaterThan(0);
      
      // Check for UAE-specific features
      expect(result.extractedTerms.some(term => term.value === 'AED 100,000')).toBe(true);
      expect(result.extractedTerms.some(term => term.value.includes('Dubai'))).toBe(true);
      
      // Verify red flags detection
      expect(result.redFlags.length).toBeGreaterThan(0);
      
      // Check contract score
      expect(result.contractScore.overall).toBeGreaterThan(0);
      expect(result.contractScore.benchmarkComparison.jurisdiction).toBe(LegalJurisdiction.UAE);
    }, 30000);

    test('should handle international trade agreement', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            INTERNATIONAL TRADE AGREEMENT
            
            This Trade Agreement is between African Export Company Ltd (Nigeria) and 
            Middle East Import Corp (UAE) dated March 1, 2024.
            
            1. GOODS
            Seller agrees to supply agricultural products as per attached specifications.
            
            2. PRICE AND PAYMENT
            Total value USD 500,000. Payment by Letter of Credit confirmed by 
            international bank within 30 days of shipment.
            
            3. DELIVERY
            Goods to be delivered CIF Dubai Port. Shipment by April 30, 2024.
            
            4. FORCE MAJEURE
            Neither party liable for delays due to acts of God, war, or government action.
            
            5. DISPUTE RESOLUTION
            Disputes resolved by ICC Arbitration in London, England.
            
            6. GOVERNING LAW
            English Law shall govern this agreement.
            
            7. COMPLIANCE
            Both parties shall comply with all applicable international trade regulations,
            export controls, and sanctions.
          `,
          fileName: 'international_trade_agreement.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.CLAUSE_EXTRACTION,
          ContractAnalysisType.RISK_ASSESSMENT,
          ContractAnalysisType.COMPLIANCE_CHECK,
          ContractAnalysisType.TERM_EXTRACTION,
          ContractAnalysisType.RED_FLAG_DETECTION
        ],
        jurisdiction: LegalJurisdiction.INTERNATIONAL,
        language: SupportedLanguage.ENGLISH,
        contractType: ContractType.SERVICE_AGREEMENT,
        complianceStandards: [
          ComplianceStandard.INTERNATIONAL_TRADE
        ],
        riskThreshold: RiskLevel.LOW,
        includeRecommendations: true,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: true,
          extractDates: true,
          extractAmounts: true,
          extractParties: true,
          extractObligations: true,
          extractRights: true,
          extractConditions: true,
          extractPenalties: false,
          extractDeadlines: true,
          identifyMissingClauses: true
        },
        analysisDepth: AnalysisDepth.EXPERT
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      expect(result.contractType).toBe(ContractType.SERVICE_AGREEMENT);
      
      // Check international trade compliance
      const tradeCompliance = result.complianceChecks.find(
        check => check.standard === ComplianceStandard.INTERNATIONAL_TRADE
      );
      expect(tradeCompliance).toBeDefined();
      
      // Verify multi-jurisdictional elements
      expect(result.extractedTerms.some(term => term.value.includes('Nigeria'))).toBe(true);
      expect(result.extractedTerms.some(term => term.value.includes('UAE'))).toBe(true);
      expect(result.extractedTerms.some(term => term.value === 'USD 500,000')).toBe(true);
      
      // Check for force majeure and international trade risks
      expect(result.identifiedRisks.length).toBeGreaterThan(0);
      expect(result.extractedClauses.some(clause => 
        clause.content.toLowerCase().includes('force majeure')
      )).toBe(true);
    }, 30000);
  });

  describe('Risk Assessment', () => {
    test('should identify high-risk clauses', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            HIGH-RISK CONTRACT
            
            1. UNLIMITED LIABILITY
            Contractor assumes unlimited liability for all damages, whether direct, 
            indirect, consequential, or punitive.
            
            2. BROAD INDEMNIFICATION
            Contractor shall indemnify Client against all claims, including those 
            arising from Client's own negligence.
            
            3. EXTENSIVE IP ASSIGNMENT
            All intellectual property, including pre-existing IP, shall automatically 
            transfer to Client.
            
            4. TERMINATION FOR CONVENIENCE
            Client may terminate this agreement at any time without cause and 
            without compensation.
            
            5. EXCLUSIVE JURISDICTION
            All disputes must be resolved in Client's home jurisdiction regardless 
            of where services are performed.
          `,
          fileName: 'high_risk_contract.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.RISK_ASSESSMENT,
          ContractAnalysisType.RED_FLAG_DETECTION
        ],
        jurisdiction: LegalJurisdiction.NIGERIA,
        language: SupportedLanguage.ENGLISH,
        riskThreshold: RiskLevel.LOW, // Strict threshold to catch all risks
        complianceStandards: [],
        includeRecommendations: true,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: false,
          extractDates: false,
          extractAmounts: false,
          extractParties: false,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: false,
          identifyMissingClauses: true
        },
        analysisDepth: AnalysisDepth.COMPREHENSIVE
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      expect(result.identifiedRisks.length).toBeGreaterThan(3);
      expect(result.redFlags.length).toBeGreaterThan(1);
      
      // Check for high-risk elements
      const highRisks = result.identifiedRisks.filter(risk => 
        risk.level === RiskLevel.HIGH || risk.level === RiskLevel.CRITICAL
      );
      expect(highRisks.length).toBeGreaterThan(0);
      
      // Contract score should be low due to high risks
      expect(result.contractScore.overall).toBeLessThan(60);
      
      // Should have recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check for specific red flags
      expect(result.redFlags.some(flag => 
        flag.title.toLowerCase().includes('liability') ||
        flag.description.toLowerCase().includes('unlimited')
      )).toBe(true);
    }, 30000);
  });

  describe('Compliance Checking', () => {
    test('should check GDPR compliance for data processing contract', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            DATA PROCESSING AGREEMENT
            
            This Data Processing Agreement governs the processing of personal data 
            between Data Controller and Data Processor.
            
            1. SCOPE OF PROCESSING
            Processor will process personal data solely for providing cloud storage services.
            
            2. DATA SUBJECT RIGHTS
            Processor shall assist Controller in responding to data subject requests 
            for access, rectification, erasure, and data portability.
            
            3. SECURITY MEASURES
            Processor implements appropriate technical and organizational measures 
            including encryption and access controls.
            
            4. DATA BREACH NOTIFICATION
            Processor shall notify Controller of any personal data breach within 24 hours.
            
            5. DATA TRANSFERS
            No personal data shall be transferred outside the EU without adequate 
            safeguards as required by GDPR.
            
            6. RETENTION
            Personal data shall be deleted or returned upon termination of services.
          `,
          fileName: 'gdpr_data_processing.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.COMPLIANCE_CHECK,
          ContractAnalysisType.CLAUSE_EXTRACTION
        ],
        jurisdiction: LegalJurisdiction.INTERNATIONAL,
        language: SupportedLanguage.ENGLISH,
        contractType: ContractType.SERVICE_AGREEMENT,
        complianceStandards: [ComplianceStandard.GDPR],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: true,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: true,
          extractDates: false,
          extractAmounts: false,
          extractParties: true,
          extractObligations: true,
          extractRights: true,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: true,
          identifyMissingClauses: true
        },
        analysisDepth: AnalysisDepth.COMPREHENSIVE
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      
      // Check GDPR compliance
      const gdprCompliance = result.complianceChecks.find(
        check => check.standard === ComplianceStandard.GDPR
      );
      expect(gdprCompliance).toBeDefined();
      expect(gdprCompliance?.requirements.length).toBeGreaterThan(0);
      
      // Should detect data protection clauses
      expect(result.extractedClauses.some(clause => 
        clause.content.toLowerCase().includes('data') &&
        clause.content.toLowerCase().includes('processing')
      )).toBe(true);
      
      // Should have good compliance score due to comprehensive GDPR clauses
      expect(result.contractScore.breakdown.compliance).toBeGreaterThan(70);
    }, 30000);
  });

  describe('Multi-language Support', () => {
    test('should handle Arabic contract terms', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: `
            عقد خدمات تقنية
            
            يتم إبرام هذا العقد بين شركة التقنية المتطورة (مقدم الخدمة) 
            وشركة الأعمال الدولية (العميل) بتاريخ 1 مارس 2024.
            
            Service Agreement (English Translation)
            
            This Service Agreement is entered into between Advanced Tech Company (Provider) 
            and International Business Company (Client) on March 1, 2024.
            
            1. SCOPE OF SERVICES / نطاق الخدمات
            Provider shall deliver software development services.
            
            2. PAYMENT / الدفع
            Payment of AED 50,000 within 30 days.
            
            3. GOVERNING LAW / القانون المطبق
            UAE Federal Law shall govern this agreement.
          `,
          fileName: 'arabic_contract.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [
          ContractAnalysisType.CLAUSE_EXTRACTION,
          ContractAnalysisType.TERM_EXTRACTION
        ],
        jurisdiction: LegalJurisdiction.UAE,
        language: SupportedLanguage.ARABIC,
        contractType: ContractType.SERVICE_AGREEMENT,
        complianceStandards: [ComplianceStandard.LOCAL_COMMERCIAL_LAW],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: false,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: true,
          extractDates: true,
          extractAmounts: true,
          extractParties: true,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: false,
          identifyMissingClauses: false
        },
        analysisDepth: AnalysisDepth.STANDARD
      };

      const result = await contractService.analyzeContract(request);

      expect(result).toBeDefined();
      expect(result.extractedClauses.length).toBeGreaterThan(0);
      
      // Should extract both Arabic and English terms
      expect(result.extractedTerms.some(term => term.value === 'AED 50,000')).toBe(true);
      
      // Should handle bilingual content
      expect(result.document.language).toBe(SupportedLanguage.ARABIC);
    }, 30000);
  });

  describe('Performance and Edge Cases', () => {
    test('should handle empty document', async () => {
      const request: ContractAnalysisRequest = {
        document: {
          content: '',
          fileName: 'empty.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [ContractAnalysisType.CLAUSE_EXTRACTION],
        jurisdiction: LegalJurisdiction.NIGERIA,
        language: SupportedLanguage.ENGLISH,
        complianceStandards: [],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: false,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: false,
          extractDates: false,
          extractAmounts: false,
          extractParties: false,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: false,
          identifyMissingClauses: false
        },
        analysisDepth: AnalysisDepth.BASIC
      };

      await expect(contractService.analyzeContract(request))
        .rejects
        .toThrow();
    });

    test('should complete analysis within performance threshold', async () => {
      const startTime = Date.now();
      
      const request: ContractAnalysisRequest = {
        document: {
          content: 'Simple contract content for performance testing.',
          fileName: 'performance_test.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [ContractAnalysisType.CLAUSE_EXTRACTION],
        jurisdiction: LegalJurisdiction.NIGERIA,
        language: SupportedLanguage.ENGLISH,
        complianceStandards: [],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: false,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: false,
          extractDates: false,
          extractAmounts: false,
          extractParties: false,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: false,
          identifyMissingClauses: false
        },
        analysisDepth: AnalysisDepth.BASIC
      };

      const result = await contractService.analyzeContract(request);
      const executionTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.summary.executionTime).toBeLessThan(10000);
    });
  });

  describe('Integration with AI Services', () => {
    test('should handle AI service failures gracefully', async () => {
      // This test would normally mock AI service failures
      const request: ContractAnalysisRequest = {
        document: {
          content: 'Contract content for AI failure testing.',
          fileName: 'ai_failure_test.txt',
          mimeType: 'text/plain'
        },
        analysisTypes: [ContractAnalysisType.CLAUSE_EXTRACTION],
        jurisdiction: LegalJurisdiction.NIGERIA,
        language: SupportedLanguage.ENGLISH,
        complianceStandards: [],
        riskThreshold: RiskLevel.MEDIUM,
        includeRecommendations: false,
        confidentialityLevel: 'confidential',
        extractionOptions: {
          extractEntities: false,
          extractDates: false,
          extractAmounts: false,
          extractParties: false,
          extractObligations: false,
          extractRights: false,
          extractConditions: false,
          extractPenalties: false,
          extractDeadlines: false,
          identifyMissingClauses: false
        },
        analysisDepth: AnalysisDepth.BASIC
      };

      // Should still return results even if AI services partially fail
      const result = await contractService.analyzeContract(request);
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });
  });
});
