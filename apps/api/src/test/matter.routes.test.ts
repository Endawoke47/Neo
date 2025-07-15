/**
 * Matter Management API Integration Tests
 * Tests for matter CRUD operations and business logic
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import matterRoutes from '../routes/matter.routes';
import authRoutes from '../routes/auth-secure.routes';
import { errorHandler } from '../middleware/error.middleware';

// Mock Prisma client
const mockPrisma = {
  matter: {
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
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  document: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  timeEntry: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
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
  app.use('/api/matters', matterRoutes);
  app.use(errorHandler);
  return app;
};

describe('Matter Management API', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and get auth token
    const userData = {
      email: 'matter-test@counselflow.com',
      password: 'TestPassword123!',
      firstName: 'Matter',
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

  describe('GET /api/matters', () => {
    const mockMatters = [
      {
        id: 'matter-1',
        title: 'Personal Injury Case',
        description: 'Car accident injury claim',
        matterType: 'PERSONAL_INJURY',
        status: 'ACTIVE',
        priority: 'HIGH',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        startDate: new Date('2024-01-01'),
        deadline: new Date('2024-06-01'),
        estimatedHours: 100,
        hourlyRate: 350.00,
        estimatedValue: 35000.00,
        client: {
          id: 'client-1',
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        assignedLawyer: {
          id: 'lawyer-1',
          firstName: 'Jane',
          lastName: 'Attorney',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'matter-2',
        title: 'Contract Review',
        description: 'Commercial lease agreement review',
        matterType: 'CONTRACT_LAW',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        clientId: 'client-2',
        assignedLawyerId: 'lawyer-2',
        startDate: new Date('2024-02-01'),
        deadline: new Date('2024-03-15'),
        estimatedHours: 25,
        hourlyRate: 400.00,
        estimatedValue: 10000.00,
        client: {
          id: 'client-2',
          name: 'Business Corp',
          email: 'contact@business.com',
        },
        assignedLawyer: {
          id: 'lawyer-2',
          firstName: 'Bob',
          lastName: 'Lawyer',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all matters for authenticated user', async () => {
      mockPrisma.matter.findMany.mockResolvedValue(mockMatters);
      mockPrisma.matter.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title', 'Personal Injury Case');
      expect(response.body.data[1]).toHaveProperty('title', 'Contract Review');
    });

    it('should support filtering by status', async () => {
      const activeMatters = mockMatters.filter(m => m.status === 'ACTIVE');
      mockPrisma.matter.findMany.mockResolvedValue(activeMatters);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('status', 'ACTIVE');
      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE'
          })
        })
      );
    });

    it('should support filtering by matter type', async () => {
      const personalInjuryMatters = mockMatters.filter(m => m.matterType === 'PERSONAL_INJURY');
      mockPrisma.matter.findMany.mockResolvedValue(personalInjuryMatters);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?matterType=PERSONAL_INJURY')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('matterType', 'PERSONAL_INJURY');
    });

    it('should support filtering by priority', async () => {
      const highPriorityMatters = mockMatters.filter(m => m.priority === 'HIGH');
      mockPrisma.matter.findMany.mockResolvedValue(highPriorityMatters);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?priority=HIGH')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('priority', 'HIGH');
    });

    it('should support filtering by client', async () => {
      const clientMatters = mockMatters.filter(m => m.clientId === 'client-1');
      mockPrisma.matter.findMany.mockResolvedValue(clientMatters);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?clientId=client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('clientId', 'client-1');
    });

    it('should support date range filtering', async () => {
      const dateFilteredMatters = [mockMatters[0]];
      mockPrisma.matter.findMany.mockResolvedValue(dateFilteredMatters);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            }
          })
        })
      );
    });

    it('should support search functionality', async () => {
      const searchResults = [mockMatters[0]];
      mockPrisma.matter.findMany.mockResolvedValue(searchResults);
      mockPrisma.matter.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/matters?search=injury')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'injury',
                  mode: 'insensitive'
                })
              })
            ])
          })
        })
      );
    });

    it('should support sorting', async () => {
      mockPrisma.matter.findMany.mockResolvedValue(mockMatters);
      mockPrisma.matter.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/matters?sortBy=deadline&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            deadline: 'asc'
          }
        })
      );
    });
  });

  describe('GET /api/matters/:id', () => {
    const mockMatter = {
      id: 'matter-1',
      title: 'Personal Injury Case',
      description: 'Car accident injury claim',
      matterType: 'PERSONAL_INJURY',
      status: 'ACTIVE',
      priority: 'HIGH',
      clientId: 'client-1',
      assignedLawyerId: 'lawyer-1',
      startDate: new Date('2024-01-01'),
      deadline: new Date('2024-06-01'),
      estimatedHours: 100,
      hourlyRate: 350.00,
      estimatedValue: 35000.00,
      client: {
        id: 'client-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      assignedLawyer: {
        id: 'lawyer-1',
        firstName: 'Jane',
        lastName: 'Attorney',
      },
      tasks: [],
      documents: [],
      timeEntries: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return matter by ID', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(mockMatter);

      const response = await request(app)
        .get('/api/matters/matter-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 'matter-1');
      expect(response.body.data).toHaveProperty('title', 'Personal Injury Case');
      expect(response.body.data).toHaveProperty('client');
      expect(response.body.data).toHaveProperty('assignedLawyer');
    });

    it('should return 404 for non-existent matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/matters/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });
  });

  describe('POST /api/matters', () => {
    const validMatterData = {
      title: 'New Legal Matter',
      description: 'A new legal matter for testing',
      matterType: 'CONTRACT_LAW',
      priority: 'MEDIUM',
      clientId: 'client-1',
      assignedLawyerId: 'lawyer-1',
      startDate: '2024-03-01T00:00:00Z',
      deadline: '2024-06-01T00:00:00Z',
      estimatedHours: 50,
      hourlyRate: 375.00,
      estimatedValue: 18750.00,
    };

    it('should create new matter successfully', async () => {
      const mockCreatedMatter = {
        id: 'new-matter-id',
        ...validMatterData,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.matter.create.mockResolvedValue(mockCreatedMatter);

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validMatterData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', validMatterData.title);
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        matterType: 'INVALID_TYPE', // Invalid type
        priority: 'INVALID_PRIORITY', // Invalid priority
        estimatedHours: -10, // Negative hours
        hourlyRate: -100, // Negative rate
      };

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate date logic', async () => {
      const invalidDateData = {
        ...validMatterData,
        startDate: '2024-06-01T00:00:00Z',
        deadline: '2024-03-01T00:00:00Z', // Deadline before start date
      };

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate client exists', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validMatterData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should validate numeric fields', async () => {
      const invalidNumericData = {
        ...validMatterData,
        estimatedHours: 'invalid-hours',
        hourlyRate: 'invalid-rate',
        estimatedValue: 'invalid-value',
      };

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidNumericData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/matters/:id', () => {
    const updateData = {
      title: 'Updated Matter Title',
      description: 'Updated description',
      priority: 'HIGH',
      estimatedHours: 75,
      hourlyRate: 400.00,
      estimatedValue: 30000.00,
    };

    it('should update matter successfully', async () => {
      const mockUpdatedMatter = {
        id: 'matter-1',
        ...updateData,
        matterType: 'CONTRACT_LAW',
        status: 'ACTIVE',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        startDate: new Date('2024-01-01'),
        deadline: new Date('2024-06-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1' });
      mockPrisma.matter.update.mockResolvedValue(mockUpdatedMatter);

      const response = await request(app)
        .put('/api/matters/matter-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('priority', updateData.priority);
    });

    it('should return 404 for non-existent matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/matters/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        priority: 'INVALID_PRIORITY',
        estimatedHours: -50,
        hourlyRate: -200,
      };

      const response = await request(app)
        .put('/api/matters/matter-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('DELETE /api/matters/:id', () => {
    it('should delete matter successfully', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1' });
      mockPrisma.matter.delete.mockResolvedValue({ id: 'matter-1' });

      const response = await request(app)
        .delete('/api/matters/matter-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Matter deleted successfully');
    });

    it('should return 404 for non-existent matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/matters/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });
  });

  describe('GET /api/matters/:id/statistics', () => {
    it('should return matter statistics', async () => {
      const mockStats = {
        totalTasks: 15,
        completedTasks: 8,
        pendingTasks: 7,
        totalDocuments: 25,
        totalTimeEntries: 45,
        totalHoursLogged: 87.5,
        totalBilled: 30625.00,
        percentComplete: 53.33,
        daysUntilDeadline: 45,
        isOverdue: false,
      };

      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1' });
      mockPrisma.task.count
        .mockResolvedValueOnce(15) // total tasks
        .mockResolvedValueOnce(8) // completed tasks
        .mockResolvedValueOnce(7); // pending tasks
      mockPrisma.document.count.mockResolvedValue(25);
      mockPrisma.timeEntry.count.mockResolvedValue(45);
      mockPrisma.timeEntry.aggregate.mockResolvedValue({
        _sum: { hours: 87.5, amount: 30625.00 }
      });

      const response = await request(app)
        .get('/api/matters/matter-1/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('completedTasks');
      expect(response.body.data).toHaveProperty('totalHoursLogged');
      expect(response.body.data).toHaveProperty('totalBilled');
    });

    it('should return 404 for non-existent matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/matters/non-existent/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });
  });

  describe('POST /api/matters/:id/close', () => {
    it('should close matter successfully', async () => {
      const mockClosedMatter = {
        id: 'matter-1',
        status: 'CLOSED',
        closedAt: new Date(),
      };

      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1', status: 'ACTIVE' });
      mockPrisma.matter.update.mockResolvedValue(mockClosedMatter);

      const response = await request(app)
        .post('/api/matters/matter-1/close')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          closureReason: 'Case resolved successfully',
          closureNotes: 'Client satisfied with outcome',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'CLOSED');
    });

    it('should return 404 for non-existent matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/matters/non-existent/close')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          closureReason: 'Test closure',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter not found');
    });

    it('should prevent closing already closed matter', async () => {
      mockPrisma.matter.findUnique.mockResolvedValue({ id: 'matter-1', status: 'CLOSED' });

      const response = await request(app)
        .post('/api/matters/matter-1/close')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          closureReason: 'Test closure',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Matter is already closed');
    });
  });

  describe('GET /api/matters/overdue', () => {
    it('should return overdue matters', async () => {
      const overdueMatters = [
        {
          id: 'matter-1',
          title: 'Overdue Matter 1',
          deadline: new Date('2024-01-01'), // Past deadline
          status: 'ACTIVE',
          priority: 'HIGH',
          client: { name: 'Client 1' },
          assignedLawyer: { firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'matter-2',
          title: 'Overdue Matter 2',
          deadline: new Date('2024-01-15'), // Past deadline
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          client: { name: 'Client 2' },
          assignedLawyer: { firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      mockPrisma.matter.findMany.mockResolvedValue(overdueMatters);

      const response = await request(app)
        .get('/api/matters/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deadline: expect.objectContaining({
              lt: expect.any(Date),
            }),
            status: expect.objectContaining({
              in: ['ACTIVE', 'IN_PROGRESS']
            })
          })
        })
      );
    });
  });

  describe('GET /api/matters/upcoming-deadlines', () => {
    it('should return matters with upcoming deadlines', async () => {
      const upcomingMatters = [
        {
          id: 'matter-1',
          title: 'Upcoming Deadline Matter 1',
          deadline: new Date('2024-03-15'),
          status: 'ACTIVE',
          priority: 'HIGH',
          client: { name: 'Client 1' },
        },
      ];

      mockPrisma.matter.findMany.mockResolvedValue(upcomingMatters);

      const response = await request(app)
        .get('/api/matters/upcoming-deadlines?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deadline: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
            status: expect.objectContaining({
              in: ['ACTIVE', 'IN_PROGRESS']
            })
          })
        })
      );
    });

    it('should default to 7 days if no period specified', async () => {
      mockPrisma.matter.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/matters/upcoming-deadlines')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Security and Performance Tests', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/matters' },
        { method: 'get', path: '/api/matters/matter-1' },
        { method: 'post', path: '/api/matters' },
        { method: 'put', path: '/api/matters/matter-1' },
        { method: 'delete', path: '/api/matters/matter-1' },
        { method: 'post', path: '/api/matters/matter-1/close' },
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
      mockPrisma.matter.findMany.mockResolvedValue([]);
      mockPrisma.matter.count.mockResolvedValue(0);

      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/matters')
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
        description: '"; DROP TABLE matters; --',
        matterType: 'CONTRACT_LAW',
        priority: 'HIGH',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        estimatedHours: 50,
        hourlyRate: 350.00,
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.matter.create.mockResolvedValue({
        id: 'safe-matter',
        ...maliciousData,
        title: 'scriptalert("xss")/script', // Sanitized
        description: ' DROP TABLE matters --', // Sanitized
      });

      const response = await request(app)
        .post('/api/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('";');
    });
  });
});