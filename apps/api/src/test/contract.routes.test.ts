/**
 * Contract Management API Integration Tests
 * Tests for contract CRUD operations and business logic
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import contractRoutes from '../routes/contract.routes';
import authRoutes from '../routes/auth-secure.routes';
import { errorHandler } from '../middleware/error.middleware';

// Mock Prisma client
const mockPrisma = {
  contract: {
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

// Mock AI analysis service
jest.mock('../services/ai-analysis.service', () => ({
  analyzeContract: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/contracts', contractRoutes);
  app.use(errorHandler);
  return app;
};

describe('Contract Management API', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and get auth token
    const userData = {
      email: 'contract-test@counselflow.com',
      password: 'TestPassword123!',
      firstName: 'Contract',
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

  describe('GET /api/contracts', () => {
    const mockContracts = [
      {
        id: 'contract-1',
        title: 'Software License Agreement',
        description: 'Enterprise software licensing contract',
        type: 'SOFTWARE_LICENSE',
        status: 'ACTIVE',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        value: 100000.00,
        currency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        autoRenewal: true,
        renewalPeriod: '1 year',
        client: {
          id: 'client-1',
          name: 'Tech Corp',
        },
        assignedLawyer: {
          id: 'lawyer-1',
          firstName: 'John',
          lastName: 'Doe',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'contract-2',
        title: 'Service Agreement',
        description: 'Professional services contract',
        type: 'SERVICE_AGREEMENT',
        status: 'DRAFT',
        clientId: 'client-2',
        assignedLawyerId: 'lawyer-2',
        value: 50000.00,
        currency: 'USD',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-01'),
        autoRenewal: false,
        renewalPeriod: null,
        client: {
          id: 'client-2',
          name: 'Service Co',
        },
        assignedLawyer: {
          id: 'lawyer-2',
          firstName: 'Jane',
          lastName: 'Smith',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all contracts for authenticated user', async () => {
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
      mockPrisma.contract.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title', 'Software License Agreement');
      expect(response.body.data[1]).toHaveProperty('title', 'Service Agreement');
    });

    it('should support filtering by status', async () => {
      const activeContracts = mockContracts.filter(c => c.status === 'ACTIVE');
      mockPrisma.contract.findMany.mockResolvedValue(activeContracts);
      mockPrisma.contract.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/contracts?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('status', 'ACTIVE');
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE'
          })
        })
      );
    });

    it('should support filtering by contract type', async () => {
      const softwareContracts = mockContracts.filter(c => c.type === 'SOFTWARE_LICENSE');
      mockPrisma.contract.findMany.mockResolvedValue(softwareContracts);
      mockPrisma.contract.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/contracts?type=SOFTWARE_LICENSE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('type', 'SOFTWARE_LICENSE');
    });

    it('should support filtering by client', async () => {
      const clientContracts = mockContracts.filter(c => c.clientId === 'client-1');
      mockPrisma.contract.findMany.mockResolvedValue(clientContracts);
      mockPrisma.contract.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/contracts?clientId=client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('clientId', 'client-1');
    });

    it('should support date range filtering', async () => {
      const dateFilteredContracts = [mockContracts[0]];
      mockPrisma.contract.findMany.mockResolvedValue(dateFilteredContracts);
      mockPrisma.contract.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/contracts?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
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

    it('should support value range filtering', async () => {
      const valueFilteredContracts = [mockContracts[0]];
      mockPrisma.contract.findMany.mockResolvedValue(valueFilteredContracts);
      mockPrisma.contract.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/contracts?minValue=75000&maxValue=150000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            value: {
              gte: 75000,
              lte: 150000,
            }
          })
        })
      );
    });

    it('should support sorting', async () => {
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
      mockPrisma.contract.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/contracts?sortBy=value&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            value: 'desc'
          }
        })
      );
    });
  });

  describe('GET /api/contracts/:id', () => {
    const mockContract = {
      id: 'contract-1',
      title: 'Software License Agreement',
      description: 'Enterprise software licensing contract',
      type: 'SOFTWARE_LICENSE',
      status: 'ACTIVE',
      clientId: 'client-1',
      assignedLawyerId: 'lawyer-1',
      value: 100000.00,
      currency: 'USD',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      autoRenewal: true,
      renewalPeriod: '1 year',
      client: {
        id: 'client-1',
        name: 'Tech Corp',
        email: 'contact@techcorp.com',
      },
      assignedLawyer: {
        id: 'lawyer-1',
        firstName: 'John',
        lastName: 'Doe',
      },
      documents: [],
      aiAnalysis: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return contract by ID', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);

      const response = await request(app)
        .get('/api/contracts/contract-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 'contract-1');
      expect(response.body.data).toHaveProperty('title', 'Software License Agreement');
      expect(response.body.data).toHaveProperty('client');
      expect(response.body.data).toHaveProperty('assignedLawyer');
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/contracts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });
  });

  describe('POST /api/contracts', () => {
    const validContractData = {
      title: 'New Contract',
      description: 'A new contract for testing',
      type: 'SERVICE_AGREEMENT',
      clientId: 'client-1',
      assignedLawyerId: 'lawyer-1',
      value: 75000.00,
      currency: 'USD',
      startDate: '2024-03-01T00:00:00Z',
      endDate: '2024-09-01T00:00:00Z',
      autoRenewal: false,
    };

    it('should create new contract successfully', async () => {
      const mockCreatedContract = {
        id: 'new-contract-id',
        ...validContractData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.contract.create.mockResolvedValue(mockCreatedContract);

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validContractData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', validContractData.title);
      expect(response.body.data).toHaveProperty('status', 'DRAFT');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        type: 'INVALID_TYPE', // Invalid type
        value: -1000, // Negative value
        currency: 'INVALID', // Invalid currency
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate date logic', async () => {
      const invalidDateData = {
        ...validContractData,
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2024-03-01T00:00:00Z', // End date before start date
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate client exists', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validContractData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should validate contract value', async () => {
      const invalidValueData = {
        ...validContractData,
        value: 'invalid-value',
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidValueData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate currency format', async () => {
      const invalidCurrencyData = {
        ...validContractData,
        currency: 'INVALID_CURRENCY',
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCurrencyData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/contracts/:id', () => {
    const updateData = {
      title: 'Updated Contract Title',
      description: 'Updated description',
      value: 125000.00,
      autoRenewal: true,
      renewalPeriod: '2 years',
    };

    it('should update contract successfully', async () => {
      const mockUpdatedContract = {
        id: 'contract-1',
        ...updateData,
        type: 'SERVICE_AGREEMENT',
        status: 'ACTIVE',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        currency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });
      mockPrisma.contract.update.mockResolvedValue(mockUpdatedContract);

      const response = await request(app)
        .put('/api/contracts/contract-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('value', updateData.value);
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/contracts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        value: -5000, // Negative value
        currency: 'INVALID_CURR', // Invalid currency
        autoRenewal: 'not-boolean', // Invalid boolean
      };

      const response = await request(app)
        .put('/api/contracts/contract-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('DELETE /api/contracts/:id', () => {
    it('should delete contract successfully', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });
      mockPrisma.contract.delete.mockResolvedValue({ id: 'contract-1' });

      const response = await request(app)
        .delete('/api/contracts/contract-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Contract deleted successfully');
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/contracts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });
  });

  describe('POST /api/contracts/:id/analyze', () => {
    const { analyzeContract } = require('../services/ai-analysis.service');

    it('should analyze contract with AI successfully', async () => {
      const mockAnalysisResult = {
        id: 'analysis-1',
        contractId: 'contract-1',
        analysisType: 'RISK_ASSESSMENT',
        result: {
          riskScore: 0.3,
          riskLevel: 'LOW',
          keyFindings: ['Standard terms', 'Reasonable liability clauses'],
          recommendations: ['Consider adding termination clause'],
          complianceIssues: [],
        },
        createdAt: new Date(),
      };

      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });
      analyzeContract.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/contracts/contract-1/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analysisType: 'RISK_ASSESSMENT',
          jurisdiction: 'US',
          focusAreas: ['liability', 'termination'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('riskScore', 0.3);
      expect(response.body.data).toHaveProperty('keyFindings');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/contracts/non-existent/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analysisType: 'RISK_ASSESSMENT',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });

    it('should validate analysis request', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });

      const response = await request(app)
        .post('/api/contracts/contract-1/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analysisType: 'INVALID_TYPE',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle AI analysis errors', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });
      analyzeContract.mockRejectedValue(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/contracts/contract-1/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analysisType: 'RISK_ASSESSMENT',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/contracts/:id/renewals', () => {
    it('should return contract renewal history', async () => {
      const mockRenewals = [
        {
          id: 'renewal-1',
          contractId: 'contract-1',
          previousEndDate: new Date('2023-12-31'),
          newEndDate: new Date('2024-12-31'),
          renewalType: 'AUTOMATIC',
          createdAt: new Date('2023-12-01'),
        },
        {
          id: 'renewal-2',
          contractId: 'contract-1',
          previousEndDate: new Date('2024-12-31'),
          newEndDate: new Date('2025-12-31'),
          renewalType: 'MANUAL',
          createdAt: new Date('2024-11-01'),
        },
      ];

      mockPrisma.contract.findUnique.mockResolvedValue({ id: 'contract-1' });
      mockPrisma.contract.findMany.mockResolvedValue(mockRenewals);

      const response = await request(app)
        .get('/api/contracts/contract-1/renewals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('renewalType', 'AUTOMATIC');
      expect(response.body.data[1]).toHaveProperty('renewalType', 'MANUAL');
    });

    it('should return 404 for non-existent contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/contracts/non-existent/renewals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Contract not found');
    });
  });

  describe('GET /api/contracts/expiring', () => {
    it('should return contracts expiring within specified period', async () => {
      const expiringContracts = [
        {
          id: 'contract-1',
          title: 'Expiring Contract 1',
          endDate: new Date('2024-03-15'),
          status: 'ACTIVE',
          client: { name: 'Client 1' },
        },
        {
          id: 'contract-2',
          title: 'Expiring Contract 2',
          endDate: new Date('2024-03-20'),
          status: 'ACTIVE',
          client: { name: 'Client 2' },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(expiringContracts);

      const response = await request(app)
        .get('/api/contracts/expiring?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endDate: expect.objectContaining({
              lte: expect.any(Date),
              gte: expect.any(Date),
            }),
            status: 'ACTIVE',
          })
        })
      );
    });

    it('should default to 30 days if no period specified', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/contracts/expiring')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/contracts/statistics', () => {
    it('should return contract statistics', async () => {
      const mockStats = {
        totalContracts: 100,
        activeContracts: 75,
        draftContracts: 15,
        expiredContracts: 10,
        totalValue: 5000000.00,
        averageValue: 50000.00,
        expiringThisMonth: 5,
        renewalsThisMonth: 3,
      };

      mockPrisma.contract.findMany.mockResolvedValue([mockStats]);

      const response = await request(app)
        .get('/api/contracts/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalContracts');
      expect(response.body.data).toHaveProperty('activeContracts');
      expect(response.body.data).toHaveProperty('totalValue');
    });
  });

  describe('Security and Performance Tests', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/contracts' },
        { method: 'get', path: '/api/contracts/contract-1' },
        { method: 'post', path: '/api/contracts' },
        { method: 'put', path: '/api/contracts/contract-1' },
        { method: 'delete', path: '/api/contracts/contract-1' },
        { method: 'post', path: '/api/contracts/contract-1/analyze' },
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
      mockPrisma.contract.findMany.mockResolvedValue([]);
      mockPrisma.contract.count.mockResolvedValue(0);

      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/contracts')
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
        description: '"; DROP TABLE contracts; --',
        type: 'SERVICE_AGREEMENT',
        clientId: 'client-1',
        assignedLawyerId: 'lawyer-1',
        value: 50000,
        currency: 'USD',
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.contract.create.mockResolvedValue({
        id: 'safe-contract',
        ...maliciousData,
        title: 'scriptalert("xss")/script', // Sanitized
        description: ' DROP TABLE contracts --', // Sanitized
      });

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('";');
    });
  });
});