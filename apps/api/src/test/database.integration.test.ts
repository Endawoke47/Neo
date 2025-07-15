/**
 * Database Integration Tests
 * Tests for database operations, transactions, and data integrity
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

// Test database configuration
const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/counselflow_test';

describe('Database Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize test database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
      log: ['error', 'warn'],
    });

    try {
      await prisma.$connect();
      logger.info('Connected to test database');
    } catch (error) {
      logger.error('Failed to connect to test database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await cleanupDatabase();
  });

  const cleanupDatabase = async () => {
    const tables = [
      'DocumentVersion',
      'DocumentAccess',
      'Document',
      'AIAnalysis',
      'TimeEntry',
      'Task',
      'ContractRenewal',
      'Contract',
      'DisputeTimeline',
      'Dispute',
      'MatterNote',
      'Matter',
      'Client',
      'User',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
      } catch (error) {
        // Table might not exist in some test scenarios
        logger.warn(`Could not clean table ${table}:`, error);
      }
    }
  };

  describe('User Management', () => {
    it('should create and retrieve user successfully', async () => {
      const userData = {
        email: 'test@counselflow.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed_password',
        role: 'ADMIN' as const,
      };

      const createdUser = await prisma.user.create({
        data: userData,
      });

      expect(createdUser).toMatchObject({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      });
      expect(createdUser.id).toBeDefined();
      expect(createdUser.createdAt).toBeInstanceOf(Date);
      expect(createdUser.updatedAt).toBeInstanceOf(Date);

      // Retrieve user
      const retrievedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(retrievedUser).toMatchObject(userData);
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@counselflow.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed_password',
        role: 'ADMIN' as const,
      };

      await prisma.user.create({ data: userData });

      // Try to create another user with same email
      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow();
    });

    it('should handle user deletion with cascade', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@counselflow.com',
          firstName: 'Delete',
          lastName: 'Test',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      // Create related data
      const client = await prisma.client.create({
        data: {
          name: 'Test Client',
          email: 'client@test.com',
          clientType: 'INDIVIDUAL',
          assignedLawyerId: user.id,
        },
      });

      // Delete user
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Check that related data handles the deletion appropriately
      const orphanedClient = await prisma.client.findUnique({
        where: { id: client.id },
      });

      // Depending on schema, client might still exist with null assignedLawyerId
      // or might be deleted due to cascade
      if (orphanedClient) {
        expect(orphanedClient.assignedLawyerId).toBeNull();
      }
    });
  });

  describe('Client Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });
    });

    it('should create client with all fields', async () => {
      const clientData = {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        address: '123 Business St, City, State 12345',
        clientType: 'BUSINESS' as const,
        industry: 'Technology',
        status: 'ACTIVE' as const,
        assignedLawyerId: testUser.id,
      };

      const client = await prisma.client.create({
        data: clientData,
        include: {
          assignedLawyer: true,
        },
      });

      expect(client).toMatchObject(clientData);
      expect(client.assignedLawyer).toMatchObject({
        id: testUser.id,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });
    });

    it('should handle client search with case insensitive matching', async () => {
      await prisma.client.createMany({
        data: [
          {
            name: 'Alpha Corp',
            email: 'alpha@corp.com',
            clientType: 'BUSINESS',
            status: 'ACTIVE',
          },
          {
            name: 'Beta Industries',
            email: 'beta@industries.com',
            clientType: 'BUSINESS',
            status: 'ACTIVE',
          },
          {
            name: 'Gamma Solutions',
            email: 'gamma@solutions.com',
            clientType: 'BUSINESS',
            status: 'ACTIVE',
          },
        ],
      });

      // Search for "corp" (case insensitive)
      const searchResults = await prisma.client.findMany({
        where: {
          OR: [
            {
              name: {
                contains: 'corp',
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: 'corp',
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Alpha Corp');
    });

    it('should aggregate client statistics correctly', async () => {
      // Create multiple clients with different statuses
      await prisma.client.createMany({
        data: [
          { name: 'Client 1', email: 'c1@test.com', clientType: 'BUSINESS', status: 'ACTIVE' },
          { name: 'Client 2', email: 'c2@test.com', clientType: 'INDIVIDUAL', status: 'ACTIVE' },
          { name: 'Client 3', email: 'c3@test.com', clientType: 'BUSINESS', status: 'INACTIVE' },
          { name: 'Client 4', email: 'c4@test.com', clientType: 'INDIVIDUAL', status: 'ACTIVE' },
        ],
      });

      const stats = await prisma.client.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      const activeCount = stats.find(s => s.status === 'ACTIVE')?._count.id || 0;
      const inactiveCount = stats.find(s => s.status === 'INACTIVE')?._count.id || 0;

      expect(activeCount).toBe(3);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('Matter Management', () => {
    let testUser: any;
    let testClient: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testClient = await prisma.client.create({
        data: {
          name: 'Test Client',
          email: 'client@test.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: testUser.id,
        },
      });
    });

    it('should create matter with all relationships', async () => {
      const matterData = {
        title: 'Contract Review',
        description: 'Review and analysis of service agreement',
        matterType: 'CONTRACT_LAW' as const,
        status: 'ACTIVE' as const,
        priority: 'HIGH' as const,
        clientId: testClient.id,
        assignedLawyerId: testUser.id,
        startDate: new Date('2024-01-01'),
        deadline: new Date('2024-06-01'),
        estimatedHours: 100,
        hourlyRate: 350.00,
        estimatedValue: 35000.00,
      };

      const matter = await prisma.matter.create({
        data: matterData,
        include: {
          client: true,
          assignedLawyer: true,
          tasks: true,
          documents: true,
        },
      });

      expect(matter).toMatchObject(matterData);
      expect(matter.client.name).toBe(testClient.name);
      expect(matter.assignedLawyer.firstName).toBe(testUser.firstName);
      expect(matter.tasks).toEqual([]);
      expect(matter.documents).toEqual([]);
    });

    it('should handle matter filtering by date ranges', async () => {
      // Create matters with different start dates
      const matters = await prisma.matter.createMany({
        data: [
          {
            title: 'Matter 1',
            matterType: 'LITIGATION',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            startDate: new Date('2024-01-15'),
            deadline: new Date('2024-06-15'),
          },
          {
            title: 'Matter 2',
            matterType: 'CONTRACT_LAW',
            status: 'ACTIVE',
            priority: 'HIGH',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            startDate: new Date('2024-02-15'),
            deadline: new Date('2024-07-15'),
          },
          {
            title: 'Matter 3',
            matterType: 'CORPORATE_LAW',
            status: 'COMPLETED',
            priority: 'LOW',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            startDate: new Date('2024-03-15'),
            deadline: new Date('2024-08-15'),
          },
        ],
      });

      // Query matters started in January 2024
      const januaryMatters = await prisma.matter.findMany({
        where: {
          startDate: {
            gte: new Date('2024-01-01'),
            lt: new Date('2024-02-01'),
          },
        },
      });

      expect(januaryMatters).toHaveLength(1);
      expect(januaryMatters[0].title).toBe('Matter 1');
    });

    it('should calculate matter statistics with aggregations', async () => {
      // Create matters with different statuses and values
      await prisma.matter.createMany({
        data: [
          {
            title: 'Matter 1',
            matterType: 'LITIGATION',
            status: 'ACTIVE',
            priority: 'HIGH',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            estimatedValue: 50000,
            startDate: new Date(),
            deadline: new Date('2024-12-31'),
          },
          {
            title: 'Matter 2',
            matterType: 'CONTRACT_LAW',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            estimatedValue: 30000,
            startDate: new Date(),
            deadline: new Date('2024-12-31'),
          },
          {
            title: 'Matter 3',
            matterType: 'CORPORATE_LAW',
            status: 'COMPLETED',
            priority: 'LOW',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            estimatedValue: 20000,
            startDate: new Date(),
            deadline: new Date('2024-12-31'),
          },
        ],
      });

      const stats = await prisma.matter.aggregate({
        _count: {
          id: true,
        },
        _sum: {
          estimatedValue: true,
        },
        _avg: {
          estimatedValue: true,
        },
        where: {
          status: 'ACTIVE',
        },
      });

      expect(stats._count.id).toBe(2);
      expect(stats._sum.estimatedValue).toBe(80000);
      expect(stats._avg.estimatedValue).toBe(40000);
    });
  });

  describe('Contract Management', () => {
    let testUser: any;
    let testClient: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testClient = await prisma.client.create({
        data: {
          name: 'Test Client',
          email: 'client@test.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: testUser.id,
        },
      });
    });

    it('should create contract with renewal tracking', async () => {
      const contractData = {
        title: 'Service Agreement',
        description: 'Professional services contract',
        type: 'SERVICE_AGREEMENT' as const,
        status: 'ACTIVE' as const,
        clientId: testClient.id,
        assignedLawyerId: testUser.id,
        value: 100000.00,
        currency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        autoRenewal: true,
        renewalPeriod: '1 year',
      };

      const contract = await prisma.contract.create({
        data: contractData,
        include: {
          renewals: true,
        },
      });

      expect(contract).toMatchObject(contractData);
      expect(contract.renewals).toEqual([]);

      // Add a renewal
      const renewal = await prisma.contractRenewal.create({
        data: {
          contractId: contract.id,
          previousEndDate: contract.endDate,
          newEndDate: new Date('2025-12-31'),
          renewalType: 'AUTOMATIC',
          createdById: testUser.id,
        },
      });

      expect(renewal.contractId).toBe(contract.id);
      expect(renewal.renewalType).toBe('AUTOMATIC');
    });

    it('should handle contract expiration queries', async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      // Create contracts with different expiration dates
      await prisma.contract.createMany({
        data: [
          {
            title: 'Expiring Soon',
            type: 'SERVICE_AGREEMENT',
            status: 'ACTIVE',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            value: 50000,
            currency: 'USD',
            startDate: today,
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          },
          {
            title: 'Expiring Later',
            type: 'LICENSE_AGREEMENT',
            status: 'ACTIVE',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            value: 75000,
            currency: 'USD',
            startDate: today,
            endDate: sixtyDaysFromNow,
          },
        ],
      });

      // Find contracts expiring in next 30 days
      const expiringContracts = await prisma.contract.findMany({
        where: {
          endDate: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
          status: 'ACTIVE',
        },
      });

      expect(expiringContracts).toHaveLength(1);
      expect(expiringContracts[0].title).toBe('Expiring Soon');
    });
  });

  describe('Document Management', () => {
    let testUser: any;
    let testClient: any;
    let testMatter: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testClient = await prisma.client.create({
        data: {
          name: 'Test Client',
          email: 'client@test.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: testUser.id,
        },
      });

      testMatter = await prisma.matter.create({
        data: {
          title: 'Test Matter',
          matterType: 'CONTRACT_LAW',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          clientId: testClient.id,
          assignedLawyerId: testUser.id,
          startDate: new Date(),
          deadline: new Date('2024-12-31'),
        },
      });
    });

    it('should create document with version tracking', async () => {
      const documentData = {
        title: 'Contract Draft',
        description: 'Initial contract draft',
        documentType: 'CONTRACT' as const,
        mimeType: 'application/pdf',
        fileSize: 2048000,
        fileName: 'contract_draft.pdf',
        filePath: '/documents/contract_draft.pdf',
        status: 'ACTIVE' as const,
        version: 1,
        clientId: testClient.id,
        matterId: testMatter.id,
        uploadedById: testUser.id,
        isConfidential: false,
        tags: ['contract', 'draft'],
      };

      const document = await prisma.document.create({
        data: documentData,
        include: {
          versions: true,
          accessLog: true,
        },
      });

      expect(document).toMatchObject(documentData);
      expect(document.versions).toEqual([]);
      expect(document.accessLog).toEqual([]);

      // Create a new version
      const newVersion = await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: 2,
          fileName: 'contract_draft_v2.pdf',
          filePath: '/documents/contract_draft_v2.pdf',
          fileSize: 2150000,
          changeNotes: 'Updated terms and conditions',
          uploadedById: testUser.id,
        },
      });

      expect(newVersion.documentId).toBe(document.id);
      expect(newVersion.version).toBe(2);

      // Update document to latest version
      await prisma.document.update({
        where: { id: document.id },
        data: {
          version: 2,
          fileName: newVersion.fileName,
          filePath: newVersion.filePath,
          fileSize: newVersion.fileSize,
        },
      });
    });

    it('should track document access', async () => {
      const document = await prisma.document.create({
        data: {
          title: 'Confidential Document',
          documentType: 'LEGAL_BRIEF',
          mimeType: 'application/pdf',
          fileSize: 1024000,
          fileName: 'brief.pdf',
          filePath: '/documents/brief.pdf',
          status: 'ACTIVE',
          version: 1,
          clientId: testClient.id,
          matterId: testMatter.id,
          uploadedById: testUser.id,
          isConfidential: true,
        },
      });

      // Track access
      const accessLog = await prisma.documentAccess.create({
        data: {
          documentId: document.id,
          accessType: 'VIEW',
          accessedById: testUser.id,
          accessedAt: new Date(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
        },
      });

      expect(accessLog.documentId).toBe(document.id);
      expect(accessLog.accessType).toBe('VIEW');
      expect(accessLog.accessedById).toBe(testUser.id);
    });

    it('should handle document search with full-text capabilities', async () => {
      await prisma.document.createMany({
        data: [
          {
            title: 'Employment Contract',
            description: 'Employment agreement for software engineer',
            documentType: 'CONTRACT',
            mimeType: 'application/pdf',
            fileSize: 1024000,
            fileName: 'employment.pdf',
            filePath: '/documents/employment.pdf',
            status: 'ACTIVE',
            version: 1,
            clientId: testClient.id,
            matterId: testMatter.id,
            uploadedById: testUser.id,
            tags: ['employment', 'contract', 'engineer'],
          },
          {
            title: 'NDA Agreement',
            description: 'Non-disclosure agreement for confidential information',
            documentType: 'LEGAL_DOCUMENT',
            mimeType: 'application/pdf',
            fileSize: 512000,
            fileName: 'nda.pdf',
            filePath: '/documents/nda.pdf',
            status: 'ACTIVE',
            version: 1,
            clientId: testClient.id,
            matterId: testMatter.id,
            uploadedById: testUser.id,
            tags: ['nda', 'confidential'],
          },
        ],
      });

      // Search for documents containing "contract"
      const contractDocuments = await prisma.document.findMany({
        where: {
          OR: [
            {
              title: {
                contains: 'contract',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'contract',
                mode: 'insensitive',
              },
            },
            {
              tags: {
                hasSome: ['contract'],
              },
            },
          ],
        },
      });

      expect(contractDocuments).toHaveLength(1);
      expect(contractDocuments[0].title).toBe('Employment Contract');
    });
  });

  describe('AI Analysis Integration', () => {
    let testUser: any;
    let testDocument: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testDocument = await prisma.document.create({
        data: {
          title: 'Test Document',
          documentType: 'CONTRACT',
          mimeType: 'application/pdf',
          fileSize: 1024000,
          fileName: 'test.pdf',
          filePath: '/documents/test.pdf',
          status: 'ACTIVE',
          version: 1,
          uploadedById: testUser.id,
        },
      });
    });

    it('should store AI analysis results', async () => {
      const analysisData = {
        documentId: testDocument.id,
        analysisType: 'CONTENT_ANALYSIS' as const,
        result: {
          summary: 'This is a service agreement between two parties.',
          keyTerms: ['service', 'payment', 'termination'],
          entities: [
            { type: 'PERSON', text: 'John Doe', confidence: 0.95 },
            { type: 'ORGANIZATION', text: 'Acme Corp', confidence: 0.92 },
          ],
          sentiment: { score: 0.1, label: 'NEUTRAL' },
          riskLevel: 'LOW',
        },
        confidence: 0.87,
        processingTime: 2340,
        requestedById: testUser.id,
      };

      const analysis = await prisma.aiAnalysis.create({
        data: analysisData,
        include: {
          document: true,
          requestedBy: true,
        },
      });

      expect(analysis).toMatchObject(analysisData);
      expect(analysis.document.title).toBe(testDocument.title);
      expect(analysis.requestedBy.firstName).toBe(testUser.firstName);
      expect(analysis.result.summary).toBe(analysisData.result.summary);
    });

    it('should query analyses by confidence and date', async () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await prisma.aiAnalysis.createMany({
        data: [
          {
            documentId: testDocument.id,
            analysisType: 'CONTENT_ANALYSIS',
            result: { summary: 'High confidence analysis' },
            confidence: 0.95,
            processingTime: 1000,
            requestedById: testUser.id,
            createdAt: today,
          },
          {
            documentId: testDocument.id,
            analysisType: 'RISK_ASSESSMENT',
            result: { riskLevel: 'MEDIUM' },
            confidence: 0.65,
            processingTime: 1500,
            requestedById: testUser.id,
            createdAt: yesterday,
          },
        ],
      });

      // Query high-confidence analyses
      const highConfidenceAnalyses = await prisma.aiAnalysis.findMany({
        where: {
          confidence: {
            gte: 0.8,
          },
        },
      });

      expect(highConfidenceAnalyses).toHaveLength(1);
      expect(highConfidenceAnalyses[0].confidence).toBe(0.95);

      // Query analyses from today
      const todayAnalyses = await prisma.aiAnalysis.findMany({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          },
        },
      });

      expect(todayAnalyses).toHaveLength(1);
    });
  });

  describe('Transaction Management', () => {
    let testUser: any;
    let testClient: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'lawyer@counselflow.com',
          firstName: 'Test',
          lastName: 'Lawyer',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testClient = await prisma.client.create({
        data: {
          name: 'Test Client',
          email: 'client@test.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: testUser.id,
        },
      });
    });

    it('should handle transactional operations correctly', async () => {
      await prisma.$transaction(async (tx) => {
        // Create matter
        const matter = await tx.matter.create({
          data: {
            title: 'Transactional Matter',
            matterType: 'CONTRACT_LAW',
            status: 'ACTIVE',
            priority: 'HIGH',
            clientId: testClient.id,
            assignedLawyerId: testUser.id,
            startDate: new Date(),
            deadline: new Date('2024-12-31'),
          },
        });

        // Create related tasks
        await tx.task.createMany({
          data: [
            {
              title: 'Review Contract',
              description: 'Initial contract review',
              priority: 'HIGH',
              status: 'PENDING',
              matterId: matter.id,
              assignedToId: testUser.id,
              dueDate: new Date('2024-06-01'),
            },
            {
              title: 'Client Meeting',
              description: 'Discuss contract terms',
              priority: 'MEDIUM',
              status: 'PENDING',
              matterId: matter.id,
              assignedToId: testUser.id,
              dueDate: new Date('2024-06-05'),
            },
          ],
        });

        // Verify creation within transaction
        const matterWithTasks = await tx.matter.findUnique({
          where: { id: matter.id },
          include: { tasks: true },
        });

        expect(matterWithTasks?.tasks).toHaveLength(2);
      });

      // Verify transaction was committed
      const allMatters = await prisma.matter.findMany({
        include: { tasks: true },
      });

      expect(allMatters).toHaveLength(1);
      expect(allMatters[0].tasks).toHaveLength(2);
    });

    it('should rollback on transaction failure', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          // Create matter
          await tx.matter.create({
            data: {
              title: 'Failed Matter',
              matterType: 'CONTRACT_LAW',
              status: 'ACTIVE',
              priority: 'HIGH',
              clientId: testClient.id,
              assignedLawyerId: testUser.id,
              startDate: new Date(),
              deadline: new Date('2024-12-31'),
            },
          });

          // Force an error to trigger rollback
          throw new Error('Simulated transaction failure');
        });
      } catch (error) {
        expect(error.message).toBe('Simulated transaction failure');
      }

      // Verify rollback - no matter should exist
      const allMatters = await prisma.matter.findMany();
      expect(allMatters).toHaveLength(0);
    });
  });

  describe('Database Performance', () => {
    let testUser: any;
    let testClient: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'performance@counselflow.com',
          firstName: 'Performance',
          lastName: 'Test',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      testClient = await prisma.client.create({
        data: {
          name: 'Performance Client',
          email: 'perf@test.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: testUser.id,
        },
      });
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Create 100 matters in bulk
      const matterData = Array.from({ length: 100 }, (_, i) => ({
        title: `Matter ${i + 1}`,
        matterType: 'CONTRACT_LAW' as const,
        status: 'ACTIVE' as const,
        priority: 'MEDIUM' as const,
        clientId: testClient.id,
        assignedLawyerId: testUser.id,
        startDate: new Date(),
        deadline: new Date('2024-12-31'),
      }));

      await prisma.matter.createMany({
        data: matterData,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify all matters were created
      const matterCount = await prisma.matter.count();
      expect(matterCount).toBe(100);
    });

    it('should handle complex queries with joins efficiently', async () => {
      // Create test data
      const matter = await prisma.matter.create({
        data: {
          title: 'Complex Query Matter',
          matterType: 'LITIGATION',
          status: 'ACTIVE',
          priority: 'HIGH',
          clientId: testClient.id,
          assignedLawyerId: testUser.id,
          startDate: new Date(),
          deadline: new Date('2024-12-31'),
        },
      });

      // Create related documents
      await prisma.document.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          title: `Document ${i + 1}`,
          documentType: 'LEGAL_BRIEF',
          mimeType: 'application/pdf',
          fileSize: 1024000,
          fileName: `doc_${i + 1}.pdf`,
          filePath: `/documents/doc_${i + 1}.pdf`,
          status: 'ACTIVE',
          version: 1,
          clientId: testClient.id,
          matterId: matter.id,
          uploadedById: testUser.id,
        })),
      });

      const startTime = Date.now();

      // Complex query with multiple joins
      const result = await prisma.matter.findMany({
        where: {
          status: 'ACTIVE',
          client: {
            status: 'ACTIVE',
          },
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          assignedLawyer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          documents: {
            select: {
              title: true,
              documentType: true,
              fileSize: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          tasks: {
            select: {
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
      expect(result).toHaveLength(1);
      expect(result[0].documents).toHaveLength(10);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity on cascading deletes', async () => {
      // Create user with related data
      const user = await prisma.user.create({
        data: {
          email: 'integrity@counselflow.com',
          firstName: 'Integrity',
          lastName: 'Test',
          passwordHash: 'password',
          role: 'LAWYER',
        },
      });

      const client = await prisma.client.create({
        data: {
          name: 'Integrity Client',
          email: 'integrity@client.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
          assignedLawyerId: user.id,
        },
      });

      const matter = await prisma.matter.create({
        data: {
          title: 'Integrity Matter',
          matterType: 'CONTRACT_LAW',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          clientId: client.id,
          assignedLawyerId: user.id,
          startDate: new Date(),
          deadline: new Date('2024-12-31'),
        },
      });

      // Create document linked to matter
      const document = await prisma.document.create({
        data: {
          title: 'Integrity Document',
          documentType: 'CONTRACT',
          mimeType: 'application/pdf',
          fileSize: 1024000,
          fileName: 'integrity.pdf',
          filePath: '/documents/integrity.pdf',
          status: 'ACTIVE',
          version: 1,
          clientId: client.id,
          matterId: matter.id,
          uploadedById: user.id,
        },
      });

      // Delete matter - should handle related documents appropriately
      await prisma.matter.delete({
        where: { id: matter.id },
      });

      // Check document still exists but matterId is null
      const orphanedDocument = await prisma.document.findUnique({
        where: { id: document.id },
      });

      expect(orphanedDocument).toBeTruthy();
      expect(orphanedDocument?.matterId).toBeNull();
    });

    it('should handle concurrent updates correctly', async () => {
      const client = await prisma.client.create({
        data: {
          name: 'Concurrent Client',
          email: 'concurrent@client.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
        },
      });

      // Simulate concurrent updates
      const update1 = prisma.client.update({
        where: { id: client.id },
        data: { name: 'Updated by Process 1' },
      });

      const update2 = prisma.client.update({
        where: { id: client.id },
        data: { name: 'Updated by Process 2' },
      });

      // Both updates should complete without deadlock
      await Promise.all([update1, update2]);

      // Final state should be one of the updates
      const finalClient = await prisma.client.findUnique({
        where: { id: client.id },
      });

      expect(finalClient?.name).toMatch(/Updated by Process [12]/);
    });
  });
});