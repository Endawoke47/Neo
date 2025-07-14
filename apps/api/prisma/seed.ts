// Database Seed Script for CounselFlow-Neo
// Creates sample data for all entities to make the application fully functional

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.$transaction([
    prisma.aIAnalysis.deleteMany(),
    prisma.policy.deleteMany(),
    prisma.risk.deleteMany(),
    prisma.document.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.matter.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create Users
  const hashedPassword = await bcrypt.hash('CounselFlow2024!', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@counselflow.com',
      firstName: 'John',
      lastName: 'Adebayo',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneNumber: '+234-803-123-4567',
      bio: 'Senior Partner specializing in Corporate Law and AI Legal Technology',
      timezone: 'Africa/Lagos',
      languagePreference: 'en',
      isEmailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const lawyerUser = await prisma.user.create({
    data: {
      email: 'sarah.okonkwo@counselflow.com',
      firstName: 'Sarah',
      lastName: 'Okonkwo',
      passwordHash: hashedPassword,
      role: 'LAWYER',
      status: 'ACTIVE',
      phoneNumber: '+234-807-456-7890',
      bio: 'Contract Law Specialist with expertise in Cross-border Transactions',
      timezone: 'Africa/Lagos',
      languagePreference: 'en',
      isEmailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const juniorLawyer = await prisma.user.create({
    data: {
      email: 'ahmed.hassan@counselflow.com',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      passwordHash: hashedPassword,
      role: 'USER',
      status: 'ACTIVE',
      phoneNumber: '+971-50-123-4567',
      bio: 'Junior Associate focusing on Dispute Resolution and Litigation',
      timezone: 'Asia/Dubai',
      languagePreference: 'en',
      isEmailVerified: true,
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  });

  console.log('✅ Users created');

  // Create Clients
  const safaricomClient = await prisma.client.create({
    data: {
      name: 'Safaricom PLC',
      email: 'legal@safaricom.co.ke',
      phoneNumber: '+254-722-123-456',
      address: 'Safaricom House, Waiyaki Way, Westlands, Nairobi, Kenya',
      clientType: 'CORPORATION',
      industry: 'Telecommunications',
      description: 'Leading telecommunications company in East Africa',
      status: 'ACTIVE',
      assignedLawyerId: adminUser.id,
    },
  });

  const shellNigeriaClient = await prisma.client.create({
    data: {
      name: 'Shell Nigeria Exploration and Production Company Limited',
      email: 'legal@shell.com.ng',
      phoneNumber: '+234-1-234-5678',
      address: 'Shell House, 21/22 Marina, Lagos Island, Lagos, Nigeria',
      clientType: 'CORPORATION',
      industry: 'Oil & Gas',
      description: 'International oil and gas exploration company',
      status: 'ACTIVE',
      assignedLawyerId: lawyerUser.id,
    },
  });

  const mtnClient = await prisma.client.create({
    data: {
      name: 'MTN Uganda Limited',
      email: 'legal@mtn.co.ug',
      phoneNumber: '+256-312-120-000',
      address: 'MTN Uganda House, Jinja Road, Kampala, Uganda',
      clientType: 'CORPORATION',
      industry: 'Telecommunications',
      description: 'Leading mobile telecommunications provider in Uganda',
      status: 'ACTIVE',
      assignedLawyerId: lawyerUser.id,
    },
  });

  const individualClient = await prisma.client.create({
    data: {
      name: 'Dr. Amina Al-Rashid',
      email: 'amina.alrashid@gmail.com',
      phoneNumber: '+971-50-987-6543',
      address: 'Dubai Healthcare City, Dubai, UAE',
      clientType: 'INDIVIDUAL',
      industry: 'Healthcare',
      description: 'Medical professional seeking intellectual property protection',
      status: 'ACTIVE',
      assignedLawyerId: juniorLawyer.id,
    },
  });

  console.log('✅ Clients created');

  // Create Matters
  const corporateRestructuring = await prisma.matter.create({
    data: {
      title: 'Safaricom PLC Corporate Restructuring',
      description: 'Corporate restructuring and subsidiary formation for telecommunications expansion across East Africa',
      type: 'CORPORATE',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      estimatedValue: 2500000,
      actualValue: 2100000,
      startDate: new Date('2024-01-15'),
      targetDate: new Date('2024-12-31'),
      billableHours: 450.5,
      tags: JSON.stringify(['corporate', 'restructuring', 'telecommunications', 'east-africa']),
      clientId: safaricomClient.id,
      assignedLawyerId: adminUser.id,
    },
  });

  const oilGasJV = await prisma.matter.create({
    data: {
      title: 'Nigerian Oil & Gas Joint Venture Formation',
      description: 'Formation of joint venture between Shell Nigeria and indigenous oil company for offshore drilling operations',
      type: 'CORPORATE',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      riskLevel: 'HIGH',
      estimatedValue: 15000000,
      actualValue: 14500000,
      startDate: new Date('2024-02-20'),
      targetDate: new Date('2025-02-20'),
      billableHours: 680.25,
      tags: JSON.stringify(['oil-gas', 'joint-venture', 'offshore', 'regulatory']),
      clientId: shellNigeriaClient.id,
      assignedLawyerId: lawyerUser.id,
    },
  });

  const infrastructureAgreement = await prisma.matter.create({
    data: {
      title: 'MTN Uganda Infrastructure Deployment Agreement',
      description: 'Telecommunications infrastructure deployment agreement with Uganda Communications Commission',
      type: 'REGULATORY',
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      estimatedValue: 8500000,
      actualValue: 8200000,
      startDate: new Date('2024-03-10'),
      targetDate: new Date('2025-03-10'),
      billableHours: 320.75,
      tags: JSON.stringify(['infrastructure', 'regulatory', 'telecommunications', 'uganda']),
      clientId: mtnClient.id,
      assignedLawyerId: lawyerUser.id,
    },
  });

  const ipProtection = await prisma.matter.create({
    data: {
      title: 'Medical Device Patent Protection',
      description: 'Intellectual property protection for innovative medical device technology',
      type: 'INTELLECTUAL_PROPERTY',
      status: 'OPEN',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      estimatedValue: 150000,
      startDate: new Date('2024-06-01'),
      targetDate: new Date('2024-12-01'),
      billableHours: 45.0,
      tags: JSON.stringify(['intellectual-property', 'medical-device', 'patent', 'innovation']),
      clientId: individualClient.id,
      assignedLawyerId: juniorLawyer.id,
    },
  });

  console.log('✅ Matters created');

  // Create Contracts
  const serviceAgreement = await prisma.contract.create({
    data: {
      title: 'Safaricom Network Infrastructure Service Agreement',
      description: 'Comprehensive service agreement for network infrastructure deployment and maintenance',
      type: 'SERVICE_AGREEMENT',
      status: 'APPROVED',
      value: 5200000,
      currency: 'KES',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      renewalTerms: 'Automatic renewal for 2-year terms unless terminated with 90 days notice',
      riskLevel: 'MEDIUM',
      priority: 'HIGH',
      tags: JSON.stringify(['service', 'infrastructure', 'telecommunications', 'kenya']),
      clientId: safaricomClient.id,
      assignedLawyerId: adminUser.id,
    },
  });

  const jvAgreement = await prisma.contract.create({
    data: {
      title: 'Shell-Seplat Joint Venture Agreement',
      description: 'Joint venture agreement for offshore oil exploration and production',
      type: 'JOINT_VENTURE',
      status: 'UNDER_REVIEW',
      value: 25000000,
      currency: 'USD',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2029-03-31'),
      renewalTerms: 'Extension possible subject to regulatory approval and performance metrics',
      riskLevel: 'HIGH',
      priority: 'CRITICAL',
      tags: JSON.stringify(['joint-venture', 'oil-exploration', 'offshore', 'nigeria']),
      clientId: shellNigeriaClient.id,
      assignedLawyerId: lawyerUser.id,
    },
  });

  const licenseAgreement = await prisma.contract.create({
    data: {
      title: 'MTN Uganda Spectrum License Agreement',
      description: 'Telecommunications spectrum licensing agreement with regulatory authority',
      type: 'LICENSE_AGREEMENT',
      status: 'APPROVED',
      value: 12000000,
      currency: 'USD',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2034-03-14'),
      renewalTerms: '10-year renewable license subject to compliance and performance standards',
      riskLevel: 'MEDIUM',
      priority: 'HIGH',
      tags: JSON.stringify(['spectrum', 'licensing', 'telecommunications', 'uganda']),
      clientId: mtnClient.id,
      assignedLawyerId: lawyerUser.id,
    },
  });

  const ndaAgreement = await prisma.contract.create({
    data: {
      title: 'Medical Technology Non-Disclosure Agreement',
      description: 'Non-disclosure agreement for proprietary medical device technology',
      type: 'NDA',
      status: 'DRAFT',
      value: 0,
      currency: 'AED',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2029-06-30'),
      renewalTerms: '5-year term with mutual consent for extension',
      riskLevel: 'LOW',
      priority: 'MEDIUM',
      tags: JSON.stringify(['nda', 'medical-technology', 'intellectual-property', 'uae']),
      clientId: individualClient.id,
      assignedLawyerId: juniorLawyer.id,
    },
  });

  console.log('✅ Contracts created');

  // Create Disputes
  const contractDispute = await prisma.dispute.create({
    data: {
      title: 'Telecommunications Infrastructure Contract Dispute',
      description: 'Dispute regarding performance standards and penalty clauses in infrastructure deployment contract',
      type: 'CONTRACT',
      status: 'DISCOVERY',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      claimAmount: 2500000,
      estimatedLiability: 1200000,
      jurisdiction: 'Nairobi Commercial Court',
      courtName: 'High Court of Kenya at Nairobi (Commercial Division)',
      caseNumber: 'HCCN-CC-2024-0145',
      filingDate: new Date('2024-05-15'),
      trialDate: new Date('2024-11-20'),
      deadlines: JSON.stringify([
        { type: 'Discovery', date: '2024-09-15', status: 'pending' },
        { type: 'Expert Witness Reports', date: '2024-10-01', status: 'pending' },
        { type: 'Pre-trial Conference', date: '2024-11-05', status: 'pending' }
      ]),
      clientId: safaricomClient.id,
      assignedLawyerId: adminUser.id,
      matterId: corporateRestructuring.id,
    },
  });

  const regulatoryDispute = await prisma.dispute.create({
    data: {
      title: 'Oil & Gas Regulatory Compliance Investigation',
      description: 'Regulatory investigation into environmental compliance and local content requirements',
      type: 'REGULATORY',
      status: 'INVESTIGATION',
      priority: 'CRITICAL',
      riskLevel: 'CRITICAL',
      claimAmount: 5000000,
      estimatedLiability: 3500000,
      jurisdiction: 'Federal High Court Lagos',
      courtName: 'Federal High Court of Nigeria, Lagos Division',
      caseNumber: 'FHC/L/CS/2024/0298',
      filingDate: new Date('2024-06-01'),
      deadlines: JSON.stringify([
        { type: 'Response to Investigation', date: '2024-08-01', status: 'pending' },
        { type: 'Compliance Audit', date: '2024-09-01', status: 'pending' },
        { type: 'Hearing', date: '2024-10-15', status: 'pending' }
      ]),
      clientId: shellNigeriaClient.id,
      assignedLawyerId: lawyerUser.id,
      matterId: oilGasJV.id,
    },
  });

  console.log('✅ Disputes created');

  // Create Documents
  const contractDoc = await prisma.document.create({
    data: {
      title: 'Safaricom Service Agreement - Final Draft',
      description: 'Final draft of the network infrastructure service agreement',
      type: 'CONTRACT',
      fileType: 'PDF',
      fileSize: 2458672,
      fileName: 'safaricom-service-agreement-v3.pdf',
      filePath: '/documents/contracts/safaricom-service-agreement-v3.pdf',
      isConfidential: true,
      version: '3.0',
      tags: JSON.stringify(['contract', 'service-agreement', 'final-draft']),
      uploadedById: adminUser.id,
      clientId: safaricomClient.id,
      contractId: serviceAgreement.id,
      matterId: corporateRestructuring.id,
    },
  });

  const legalMemo = await prisma.document.create({
    data: {
      title: 'Joint Venture Structure Legal Memorandum',
      description: 'Legal analysis of optimal joint venture structure for oil exploration project',
      type: 'LEGAL_MEMO',
      fileType: 'DOCX',
      fileSize: 1245890,
      fileName: 'jv-structure-legal-memo.docx',
      filePath: '/documents/memos/jv-structure-legal-memo.docx',
      isConfidential: true,
      version: '2.1',
      tags: JSON.stringify(['legal-memo', 'joint-venture', 'oil-gas']),
      uploadedById: lawyerUser.id,
      clientId: shellNigeriaClient.id,
      matterId: oilGasJV.id,
    },
  });

  const complianceReport = await prisma.document.create({
    data: {
      title: 'Uganda Telecommunications Regulatory Compliance Report',
      description: 'Comprehensive compliance analysis for telecommunications operations in Uganda',
      type: 'COMPLIANCE_REPORT',
      fileType: 'PDF',
      fileSize: 3567431,
      fileName: 'uganda-telecom-compliance-report-2024.pdf',
      filePath: '/documents/compliance/uganda-telecom-compliance-report-2024.pdf',
      isConfidential: false,
      version: '1.0',
      tags: JSON.stringify(['compliance', 'telecommunications', 'uganda']),
      uploadedById: lawyerUser.id,
      clientId: mtnClient.id,
      matterId: infrastructureAgreement.id,
    },
  });

  console.log('✅ Documents created');

  // Create Risk Assessments
  const contractRisk = await prisma.risk.create({
    data: {
      title: 'Safaricom Infrastructure Contract Risk Assessment',
      description: 'Comprehensive risk analysis of network infrastructure deployment contract',
      type: 'CONTRACT_RISK',
      level: 'MEDIUM',
      probability: 'MEDIUM',
      impact: 'HIGH',
      riskScore: 7.5,
      mitigation: 'Implement milestone-based payment structure and performance guarantees',
      status: 'ACTIVE',
      identifiedBy: adminUser.id,
      assessedBy: adminUser.id,
      clientId: safaricomClient.id,
      matterId: corporateRestructuring.id,
      contractId: serviceAgreement.id,
    },
  });

  const regulatoryRisk = await prisma.risk.create({
    data: {
      title: 'Nigerian Oil & Gas Regulatory Compliance Risk',
      description: 'Risk assessment of regulatory compliance requirements for offshore operations',
      type: 'REGULATORY_RISK',
      level: 'HIGH',
      probability: 'HIGH',
      impact: 'CRITICAL',
      riskScore: 9.2,
      mitigation: 'Engage local regulatory experts and implement comprehensive compliance monitoring',
      status: 'CRITICAL',
      identifiedBy: lawyerUser.id,
      assessedBy: lawyerUser.id,
      clientId: shellNigeriaClient.id,
      matterId: oilGasJV.id,
    },
  });

  console.log('✅ Risk assessments created');

  // Create Policies
  const dataProtectionPolicy = await prisma.policy.create({
    data: {
      title: 'Client Data Protection and Privacy Policy',
      description: 'Comprehensive policy for protecting client data and maintaining attorney-client privilege',
      type: 'DATA_PROTECTION',
      status: 'ACTIVE',
      effectiveDate: new Date('2024-01-01'),
      reviewDate: new Date('2024-12-31'),
      content: JSON.stringify({
        sections: [
          'Data Collection and Processing',
          'Storage and Security Requirements',
          'Access Controls and Authentication',
          'Data Retention and Disposal',
          'Breach Response Procedures'
        ]
      }),
      tags: JSON.stringify(['data-protection', 'privacy', 'compliance']),
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
    },
  });

  const conflictPolicy = await prisma.policy.create({
    data: {
      title: 'Conflict of Interest Identification and Management Policy',
      description: 'Policy for identifying, assessing, and managing potential conflicts of interest',
      type: 'CONFLICT_OF_INTEREST',
      status: 'ACTIVE',
      effectiveDate: new Date('2024-01-01'),
      reviewDate: new Date('2024-12-31'),
      content: JSON.stringify({
        sections: [
          'Conflict Identification Procedures',
          'Client Screening Requirements',
          'Ethical Wall Implementation',
          'Disclosure Requirements',
          'Resolution Procedures'
        ]
      }),
      tags: JSON.stringify(['conflict-of-interest', 'ethics', 'compliance']),
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
    },
  });

  console.log('✅ Policies created');

  // Create AI Analyses
  const contractAnalysis = await prisma.aIAnalysis.create({
    data: {
      title: 'AI Risk Analysis - Safaricom Service Agreement',
      type: 'CONTRACT_ANALYSIS',
      input: JSON.stringify({
        contractText: 'Service agreement for network infrastructure deployment...',
        jurisdiction: 'KENYA',
        contractType: 'SERVICE_AGREEMENT'
      }),
      output: JSON.stringify({
        riskScore: 6.5,
        keyRisks: [
          'Performance penalty clauses may be excessive',
          'Force majeure provisions need strengthening',
          'Termination clauses favor counterparty'
        ],
        recommendations: [
          'Negotiate more balanced penalty structure',
          'Add specific force majeure events',
          'Include mutual termination rights'
        ],
        confidence: 0.87
      }),
      confidence: 87,
      provider: 'LEGAL_BERT',
      model: 'legal-bert-v2',
      processingTime: 1250,
      tokensUsed: 3450,
      cost: 0.0234,
      status: 'COMPLETED',
      userId: adminUser.id,
      contractId: serviceAgreement.id,
    },
  });

  const legalResearch = await prisma.aIAnalysis.create({
    data: {
      title: 'Legal Research - Nigerian Oil & Gas Joint Venture Regulations',
      type: 'LEGAL_RESEARCH',
      input: JSON.stringify({
        query: 'Joint venture regulations for offshore oil exploration in Nigeria',
        jurisdiction: 'NIGERIA',
        practiceArea: 'oil_and_gas'
      }),
      output: JSON.stringify({
        summary: 'Nigerian joint venture regulations require minimum local content participation...',
        keyFindings: [
          'Minimum 10% Nigerian participation required',
          'Environmental impact assessment mandatory',
          'NUPRC approval required for all JV agreements'
        ],
        relevantLaws: [
          'Petroleum Industry Act 2021',
          'Nigerian Content Development Act 2010',
          'Environmental Impact Assessment Act'
        ],
        confidence: 0.92
      }),
      confidence: 92,
      provider: 'OPENAI',
      model: 'gpt-4',
      processingTime: 2850,
      tokensUsed: 8930,
      cost: 0.1247,
      status: 'COMPLETED',
      userId: lawyerUser.id,
      matterId: oilGasJV.id,
    },
  });

  console.log('✅ AI analyses created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary of created records:');
  console.log(`👥 Users: 3`);
  console.log(`🏢 Clients: 4`);
  console.log(`📋 Matters: 4`);
  console.log(`📄 Contracts: 4`);
  console.log(`⚖️  Disputes: 2`);
  console.log(`📁 Documents: 3`);
  console.log(`⚠️  Risk Assessments: 2`);
  console.log(`📋 Policies: 2`);
  console.log(`🤖 AI Analyses: 2`);
  console.log('\n🔐 Login credentials:');
  console.log('Admin: admin@counselflow.com / CounselFlow2024!');
  console.log('Lawyer: sarah.okonkwo@counselflow.com / CounselFlow2024!');
  console.log('Junior: ahmed.hassan@counselflow.com / CounselFlow2024!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });