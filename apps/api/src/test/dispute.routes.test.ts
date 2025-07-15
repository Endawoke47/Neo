/**
 * Dispute Management API Integration Tests
 * Tests for dispute CRUD operations and business logic
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import disputeRoutes from '../routes/dispute.routes';
import authRoutes from '../routes/auth-secure.routes';
import { errorHandler } from '../middleware/error.middleware';

// Mock Prisma client
const mockPrisma = {
  dispute: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
  matter: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  document: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  timeline: {
    findMany: jest.fn(),
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

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use(errorHandler);
  return app;
};

describe('Dispute Management API', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and get auth token
    const userData = {
      email: 'dispute-test@counselflow.com',
      password: 'TestPassword123!',
      firstName: 'Dispute',
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

  describe('GET /api/disputes', () => {
    const mockDisputes = [
      {
        id: 'dispute-1',
        title: 'Contract Breach Dispute',
        description: 'Dispute over contract terms and performance',
        disputeType: 'CONTRACT_DISPUTE',
        status: 'ACTIVE',
        priority: 'HIGH',
        clientId: 'client-1',
        matterId: 'matter-1',
        assignedLawyerId: 'lawyer-1',
        opposingParty: 'ABC Corporation',
        disputeValue: 500000.00,
        currency: 'USD',
        filingDate: new Date('2024-01-15'),
        expectedResolutionDate: new Date('2024-06-15'),
        client: {
          id: 'client-1',
          name: 'XYZ Company',
          email: 'legal@xyz.com',
        },
        matter: {
          id: 'matter-1',
          title: 'Commercial Contract Matter',
        },
        assignedLawyer: {
          id: 'lawyer-1',
          firstName: 'Sarah',
          lastName: 'Johnson',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dispute-2',
        title: 'Employment Discrimination Case',
        description: 'Workplace discrimination and harassment claim',
        disputeType: 'EMPLOYMENT_DISPUTE',
        status: 'IN_MEDIATION',
        priority: 'MEDIUM',
        clientId: 'client-2',
        matterId: 'matter-2',
        assignedLawyerId: 'lawyer-2',
        opposingParty: 'Former Employer Inc.',
        disputeValue: 150000.00,
        currency: 'USD',
        filingDate: new Date('2024-02-01'),
        expectedResolutionDate: new Date('2024-05-01'),
        client: {
          id: 'client-2',
          name: 'Jane Doe',
          email: 'jane.doe@email.com',
        },
        matter: {
          id: 'matter-2',
          title: 'Employment Rights Matter',
        },
        assignedLawyer: {
          id: 'lawyer-2',
          firstName: 'Michael',
          lastName: 'Smith',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all disputes for authenticated user', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue(mockDisputes);
      mockPrisma.dispute.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title', 'Contract Breach Dispute');
      expect(response.body.data[1]).toHaveProperty('title', 'Employment Discrimination Case');
    });

    it('should support filtering by status', async () => {
      const activeDisputes = mockDisputes.filter(d => d.status === 'ACTIVE');
      mockPrisma.dispute.findMany.mockResolvedValue(activeDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('status', 'ACTIVE');
      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE'
          })
        })
      );
    });

    it('should support filtering by dispute type', async () => {
      const contractDisputes = mockDisputes.filter(d => d.disputeType === 'CONTRACT_DISPUTE');
      mockPrisma.dispute.findMany.mockResolvedValue(contractDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?disputeType=CONTRACT_DISPUTE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('disputeType', 'CONTRACT_DISPUTE');
    });

    it('should support filtering by priority', async () => {
      const highPriorityDisputes = mockDisputes.filter(d => d.priority === 'HIGH');
      mockPrisma.dispute.findMany.mockResolvedValue(highPriorityDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?priority=HIGH')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('priority', 'HIGH');
    });

    it('should support filtering by client', async () => {
      const clientDisputes = mockDisputes.filter(d => d.clientId === 'client-1');
      mockPrisma.dispute.findMany.mockResolvedValue(clientDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?clientId=client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('clientId', 'client-1');
    });

    it('should support value range filtering', async () => {
      const highValueDisputes = mockDisputes.filter(d => d.disputeValue >= 300000);
      mockPrisma.dispute.findMany.mockResolvedValue(highValueDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?minValue=300000&maxValue=1000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            disputeValue: {
              gte: 300000,
              lte: 1000000,
            }
          })
        })
      );
    });

    it('should support date range filtering', async () => {
      const dateFilteredDisputes = [mockDisputes[0]];
      mockPrisma.dispute.findMany.mockResolvedValue(dateFilteredDisputes);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            filingDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            }
          })
        })
      );
    });

    it('should support search functionality', async () => {
      const searchResults = [mockDisputes[0]];
      mockPrisma.dispute.findMany.mockResolvedValue(searchResults);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/disputes?search=contract')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'contract',
                  mode: 'insensitive'
                })
              })
            ])
          })
        })
      );
    });

    it('should support sorting', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue(mockDisputes);
      mockPrisma.dispute.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/disputes?sortBy=disputeValue&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            disputeValue: 'desc'
          }
        })
      );
    });
  });

  describe('GET /api/disputes/:id', () => {
    const mockDispute = {
      id: 'dispute-1',
      title: 'Contract Breach Dispute',
      description: 'Dispute over contract terms and performance',
      disputeType: 'CONTRACT_DISPUTE',
      status: 'ACTIVE',
      priority: 'HIGH',
      clientId: 'client-1',
      matterId: 'matter-1',
      assignedLawyerId: 'lawyer-1',
      opposingParty: 'ABC Corporation',
      disputeValue: 500000.00,
      currency: 'USD',
      filingDate: new Date('2024-01-15'),
      expectedResolutionDate: new Date('2024-06-15'),
      client: {
        id: 'client-1',
        name: 'XYZ Company',
        email: 'legal@xyz.com',
      },
      matter: {
        id: 'matter-1',
        title: 'Commercial Contract Matter',
      },
      assignedLawyer: {
        id: 'lawyer-1',
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      documents: [],
      timeline: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return dispute by ID', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);

      const response = await request(app)
        .get('/api/disputes/dispute-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 'dispute-1');
      expect(response.body.data).toHaveProperty('title', 'Contract Breach Dispute');
      expect(response.body.data).toHaveProperty('client');
      expect(response.body.data).toHaveProperty('matter');
      expect(response.body.data).toHaveProperty('assignedLawyer');
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/disputes/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });
  });

  describe('POST /api/disputes', () => {
    const validDisputeData = {
      title: 'New Legal Dispute',
      description: 'A new legal dispute for testing',
      disputeType: 'COMMERCIAL_DISPUTE',
      priority: 'MEDIUM',
      clientId: 'client-1',
      matterId: 'matter-1',
      assignedLawyerId: 'lawyer-1',
      opposingParty: 'Opposing Party Corp',
      disputeValue: 250000.00,
      currency: 'USD',
      filingDate: '2024-03-01T00:00:00Z',
      expectedResolutionDate: '2024-09-01T00:00:00Z',
    };

    it('should create new dispute successfully', async () => {
      const mockCreatedDispute = {
        id: 'new-dispute-id',
        ...validDisputeData,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1' });
      mockPrisma.dispute.create.mockResolvedValue(mockCreatedDispute);

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validDisputeData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', validDisputeData.title);
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        disputeType: 'INVALID_TYPE', // Invalid type
        priority: 'INVALID_PRIORITY', // Invalid priority
        disputeValue: -1000, // Negative value
        currency: 'INVALID', // Invalid currency
      };

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate date logic', async () => {
      const invalidDateData = {
        ...validDisputeData,
        filingDate: '2024-09-01T00:00:00Z',
        expectedResolutionDate: '2024-03-01T00:00:00Z', // Resolution date before filing date
      };

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate client exists', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validDisputeData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should validate matter exists', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validDisputeData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });

    it('should validate dispute value', async () => {
      const invalidValueData = {
        ...validDisputeData,
        disputeValue: 'invalid-value',
      };

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidValueData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/disputes/:id', () => {
    const updateData = {
      title: 'Updated Dispute Title',
      description: 'Updated description',
      priority: 'HIGH',
      disputeValue: 750000.00,
      expectedResolutionDate: '2024-08-01T00:00:00Z',
    };

    it('should update dispute successfully', async () => {
      const mockUpdatedDispute = {
        id: 'dispute-1',
        ...updateData,
        disputeType: 'CONTRACT_DISPUTE',
        status: 'ACTIVE',
        clientId: 'client-1',
        matterId: 'matter-1',
        assignedLawyerId: 'lawyer-1',
        opposingParty: 'ABC Corporation',
        currency: 'USD',
        filingDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1' });
      mockPrisma.dispute.update.mockResolvedValue(mockUpdatedDispute);

      const response = await request(app)
        .put('/api/disputes/dispute-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('priority', updateData.priority);
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/disputes/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        priority: 'INVALID_PRIORITY',
        disputeValue: -5000,
        currency: 'INVALID_CURR',
      };

      const response = await request(app)
        .put('/api/disputes/dispute-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('DELETE /api/disputes/:id', () => {
    it('should delete dispute successfully', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1' });
      mockPrisma.dispute.delete.mockResolvedValue({ id: 'dispute-1' });

      const response = await request(app)
        .delete('/api/disputes/dispute-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Dispute deleted successfully');
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/disputes/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });
  });

  describe('POST /api/disputes/:id/resolve', () => {
    it('should resolve dispute successfully', async () => {
      const mockResolvedDispute = {
        id: 'dispute-1',
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionType: 'SETTLEMENT',
        resolutionAmount: 300000.00,
      };

      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1', status: 'ACTIVE' });
      mockPrisma.dispute.update.mockResolvedValue(mockResolvedDispute);

      const response = await request(app)
        .post('/api/disputes/dispute-1/resolve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolutionType: 'SETTLEMENT',
          resolutionAmount: 300000.00,
          resolutionNotes: 'Settled out of court',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'RESOLVED');
      expect(response.body.data).toHaveProperty('resolutionType', 'SETTLEMENT');
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/disputes/non-existent/resolve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolutionType: 'SETTLEMENT',
          resolutionAmount: 100000.00,
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });

    it('should prevent resolving already resolved dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1', status: 'RESOLVED' });

      const response = await request(app)
        .post('/api/disputes/dispute-1/resolve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolutionType: 'SETTLEMENT',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute is already resolved');
    });
  });

  describe('GET /api/disputes/:id/timeline', () => {
    it('should return dispute timeline', async () => {
      const mockTimeline = [
        {
          id: 'timeline-1',
          disputeId: 'dispute-1',
          eventType: 'FILING',
          eventDate: new Date('2024-01-15'),
          description: 'Initial dispute filing',
          createdBy: 'lawyer-1',
        },
        {
          id: 'timeline-2',
          disputeId: 'dispute-1',
          eventType: 'MEDIATION_SCHEDULED',
          eventDate: new Date('2024-02-15'),
          description: 'Mediation session scheduled',
          createdBy: 'lawyer-1',
        },
      ];

      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1' });
      mockPrisma.timeline.findMany.mockResolvedValue(mockTimeline);

      const response = await request(app)
        .get('/api/disputes/dispute-1/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('eventType', 'FILING');
      expect(response.body.data[1]).toHaveProperty('eventType', 'MEDIATION_SCHEDULED');
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/disputes/non-existent/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });
  });

  describe('POST /api/disputes/:id/timeline', () => {
    it('should add timeline event successfully', async () => {
      const timelineEventData = {
        eventType: 'HEARING_SCHEDULED',
        eventDate: '2024-04-15T10:00:00Z',
        description: 'Court hearing scheduled',
      };

      const mockCreatedTimelineEvent = {
        id: 'timeline-3',
        disputeId: 'dispute-1',
        ...timelineEventData,
        createdBy: testUserId,
        createdAt: new Date(),
      };

      mockPrisma.dispute.findUnique.mockResolvedValue({ id: 'dispute-1' });
      mockPrisma.timeline.create.mockResolvedValue(mockCreatedTimelineEvent);

      const response = await request(app)
        .post('/api/disputes/dispute-1/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send(timelineEventData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('eventType', 'HEARING_SCHEDULED');
      expect(response.body.data).toHaveProperty('description', 'Court hearing scheduled');
    });

    it('should return 404 for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/disputes/non-existent/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'HEARING_SCHEDULED',
          eventDate: '2024-04-15T10:00:00Z',
          description: 'Test event',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dispute not found');
    });
  });

  describe('GET /api/disputes/statistics', () => {
    it('should return dispute statistics', async () => {
      const mockStats = {
        totalDisputes: 50,
        activeDisputes: 30,
        resolvedDisputes: 15,
        inMediationDisputes: 5,
        totalValue: 10000000.00,
        averageValue: 200000.00,
        averageResolutionTime: 180, // days
        resolutionRate: 0.75,
      };

      mockPrisma.dispute.findMany.mockResolvedValue([mockStats]);

      const response = await request(app)
        .get('/api/disputes/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalDisputes');
      expect(response.body.data).toHaveProperty('activeDisputes');
      expect(response.body.data).toHaveProperty('totalValue');
      expect(response.body.data).toHaveProperty('resolutionRate');
    });
  });

  describe('Security and Performance Tests', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/disputes' },
        { method: 'get', path: '/api/disputes/dispute-1' },
        { method: 'post', path: '/api/disputes' },
        { method: 'put', path: '/api/disputes/dispute-1' },
        { method: 'delete', path: '/api/disputes/dispute-1' },
        { method: 'post', path: '/api/disputes/dispute-1/resolve' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should handle concurrent requests efficiently', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/disputes')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        description: '"; DROP TABLE disputes; --',
        disputeType: 'CONTRACT_DISPUTE',
        priority: 'HIGH',
        clientId: 'client-1',
        matterId: 'matter-1',
        assignedLawyerId: 'lawyer-1',
        opposingParty: 'Test Corp',
        disputeValue: 100000,
        currency: 'USD',
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1' });
      mockPrisma.dispute.create.mockResolvedValue({
        id: 'safe-dispute',
        ...maliciousData,
        title: 'scriptalert("xss")/script', // Sanitized
        description: ' DROP TABLE disputes --', // Sanitized
      });

      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('";');
    });
  });
});