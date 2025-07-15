/**
 * Client Management API Integration Tests
 * Tests for client CRUD operations and business logic
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import clientRoutes from '../routes/client.routes';
import authRoutes from '../routes/auth-secure.routes';
import { errorHandler } from '../middleware/error.middleware';
import { logger } from '../config/logger';

// Mock Prisma client
const mockPrisma = {
  client: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
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

// Mock logger to avoid console spam
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
  app.use('/api/clients', clientRoutes);
  app.use(errorHandler);
  return app;
};

describe('Client Management API', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and get auth token
    const userData = {
      email: 'client-test@counselflow.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      confirmPassword: 'TestPassword123!',
    };

    // Mock user creation
    testUserId = 'test-user-id';
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: testUserId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'ADMIN',
    });

    // Register user and get token
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

  describe('GET /api/clients', () => {
    const mockClients = [
      {
        id: 'client-1',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        address: '123 Business St',
        clientType: 'BUSINESS',
        industry: 'Technology',
        status: 'ACTIVE',
        assignedLawyer: {
          id: 'lawyer-1',
          firstName: 'John',
          lastName: 'Doe',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'client-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0456',
        address: '456 Home St',
        clientType: 'INDIVIDUAL',
        industry: null,
        status: 'ACTIVE',
        assignedLawyer: {
          id: 'lawyer-2',
          firstName: 'Jane',
          lastName: 'Attorney',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all clients for authenticated user', async () => {
      mockPrisma.client.findMany.mockResolvedValue(mockClients);
      mockPrisma.client.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name', 'Acme Corporation');
      expect(response.body.data[1]).toHaveProperty('name', 'Jane Smith');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total', 2);
    });

    it('should support pagination', async () => {
      mockPrisma.client.findMany.mockResolvedValue([mockClients[0]]);
      mockPrisma.client.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/clients?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 1);
      expect(response.body.pagination).toHaveProperty('total', 2);
      expect(response.body.pagination).toHaveProperty('totalPages', 2);
    });

    it('should support search functionality', async () => {
      const searchResults = [mockClients[0]];
      mockPrisma.client.findMany.mockResolvedValue(searchResults);
      mockPrisma.client.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/clients?search=Acme')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('name', 'Acme Corporation');
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'Acme',
                  mode: 'insensitive'
                })
              })
            ])
          })
        })
      );
    });

    it('should support filtering by status', async () => {
      const activeClients = mockClients.filter(c => c.status === 'ACTIVE');
      mockPrisma.client.findMany.mockResolvedValue(activeClients);
      mockPrisma.client.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/clients?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE'
          })
        })
      );
    });

    it('should support filtering by client type', async () => {
      const businessClients = mockClients.filter(c => c.clientType === 'BUSINESS');
      mockPrisma.client.findMany.mockResolvedValue(businessClients);
      mockPrisma.client.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/clients?clientType=BUSINESS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('clientType', 'BUSINESS');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.client.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/clients/:id', () => {
    const mockClient = {
      id: 'client-1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0123',
      address: '123 Business St',
      clientType: 'BUSINESS',
      industry: 'Technology',
      status: 'ACTIVE',
      assignedLawyer: {
        id: 'lawyer-1',
        firstName: 'John',
        lastName: 'Doe',
      },
      matters: [],
      contracts: [],
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return client by ID', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 'client-1');
      expect(response.body.data).toHaveProperty('name', 'Acme Corporation');
    });

    it('should return 404 for non-existent client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/clients/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/clients/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/clients', () => {
    const validClientData = {
      name: 'New Client Corp',
      email: 'new@client.com',
      phone: '+1-555-0789',
      address: '789 New St',
      clientType: 'BUSINESS',
      industry: 'Finance',
      assignedLawyerId: 'lawyer-1',
    };

    it('should create new client successfully', async () => {
      const mockCreatedClient = {
        id: 'new-client-id',
        ...validClientData,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.create.mockResolvedValue(mockCreatedClient);

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validClientData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', validClientData.name);
      expect(response.body.data).toHaveProperty('email', validClientData.email);
    });

    it('should reject duplicate email', async () => {
      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';
      mockPrisma.client.create.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validClientData)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Duplicate entry');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        clientType: 'INVALID_TYPE', // Invalid client type
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validClientData,
        email: 'invalid-email-format',
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmailData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        ...validClientData,
        phone: 'invalid-phone',
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should validate client type enum', async () => {
      const invalidTypeData = {
        ...validClientData,
        clientType: 'INVALID_TYPE',
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTypeData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/clients/:id', () => {
    const updateData = {
      name: 'Updated Client Name',
      email: 'updated@client.com',
      phone: '+1-555-9999',
      address: '999 Updated St',
      industry: 'Updated Industry',
    };

    it('should update client successfully', async () => {
      const mockUpdatedClient = {
        id: 'client-1',
        ...updateData,
        clientType: 'BUSINESS',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.client.update.mockResolvedValue(mockUpdatedClient);

      const response = await request(app)
        .put('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('email', updateData.email);
    });

    it('should return 404 for non-existent client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/clients/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        email: 'invalid-email',
        phone: 'invalid-phone',
        clientType: 'INVALID_TYPE',
      };

      const response = await request(app)
        .put('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle duplicate email in update', async () => {
      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';
      
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.client.update.mockRejectedValue(duplicateError);

      const response = await request(app)
        .put('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Duplicate entry');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client successfully', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.client.delete.mockResolvedValue({ id: 'client-1' });

      const response = await request(app)
        .delete('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Client deleted successfully');
    });

    it('should return 404 for non-existent client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/clients/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });

    it('should handle foreign key constraint errors', async () => {
      const constraintError = new Error('Foreign key constraint failed');
      constraintError.code = 'P2003';
      
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrisma.client.delete.mockRejectedValue(constraintError);

      const response = await request(app)
        .delete('/api/clients/client-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/clients/:id/statistics', () => {
    it('should return client statistics', async () => {
      const mockStats = {
        totalMatters: 5,
        activeMatters: 3,
        completedMatters: 2,
        totalContracts: 8,
        activeContracts: 6,
        expiredContracts: 2,
        totalDocuments: 25,
        totalBilling: 15000.00,
        lastActivity: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-1' });
      
      // Mock the statistics queries
      mockPrisma.client.findMany.mockResolvedValue([mockStats]);

      const response = await request(app)
        .get('/api/clients/client-1/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalMatters');
      expect(response.body.data).toHaveProperty('activeMatters');
      expect(response.body.data).toHaveProperty('totalContracts');
    });

    it('should return 404 for non-existent client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/clients/non-existent/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Client not found');
    });
  });

  describe('POST /api/clients/import', () => {
    it('should import clients from CSV data', async () => {
      const csvData = [
        {
          name: 'Import Client 1',
          email: 'import1@example.com',
          phone: '+1-555-0001',
          clientType: 'BUSINESS',
          industry: 'Technology',
        },
        {
          name: 'Import Client 2',
          email: 'import2@example.com',
          phone: '+1-555-0002',
          clientType: 'INDIVIDUAL',
          industry: 'Healthcare',
        },
      ];

      mockPrisma.client.create
        .mockResolvedValueOnce({ id: 'import-1', ...csvData[0] })
        .mockResolvedValueOnce({ id: 'import-2', ...csvData[1] });

      const response = await request(app)
        .post('/api/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: csvData })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('imported', 2);
      expect(response.body.data).toHaveProperty('failed', 0);
    });

    it('should handle import validation errors', async () => {
      const invalidCsvData = [
        {
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: bad email format
          clientType: 'INVALID_TYPE', // Invalid: bad enum value
        },
      ];

      const response = await request(app)
        .post('/api/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: invalidCsvData })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('imported', 0);
      expect(response.body.data).toHaveProperty('failed', 1);
      expect(response.body.data).toHaveProperty('errors');
    });

    it('should handle partial import failures', async () => {
      const mixedData = [
        {
          name: 'Valid Client',
          email: 'valid@example.com',
          phone: '+1-555-0001',
          clientType: 'BUSINESS',
        },
        {
          name: 'Duplicate Client',
          email: 'duplicate@example.com',
          clientType: 'BUSINESS',
        },
      ];

      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';

      mockPrisma.client.create
        .mockResolvedValueOnce({ id: 'valid-1', ...mixedData[0] })
        .mockRejectedValueOnce(duplicateError);

      const response = await request(app)
        .post('/api/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: mixedData })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('imported', 1);
      expect(response.body.data).toHaveProperty('failed', 1);
    });
  });

  describe('GET /api/clients/export', () => {
    it('should export clients in CSV format', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Export Client 1',
          email: 'export1@example.com',
          phone: '+1-555-0001',
          clientType: 'BUSINESS',
          industry: 'Technology',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
        {
          id: 'client-2',
          name: 'Export Client 2',
          email: 'export2@example.com',
          phone: '+1-555-0002',
          clientType: 'INDIVIDUAL',
          industry: 'Healthcare',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ];

      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/clients/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/csv/);
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="clients_.+\.csv"/);
      expect(response.text).toContain('Export Client 1');
      expect(response.text).toContain('Export Client 2');
    });

    it('should support filtered export', async () => {
      const businessClients = [
        {
          id: 'client-1',
          name: 'Business Client',
          email: 'business@example.com',
          clientType: 'BUSINESS',
          status: 'ACTIVE',
        },
      ];

      mockPrisma.client.findMany.mockResolvedValue(businessClients);

      const response = await request(app)
        .get('/api/clients/export?clientType=BUSINESS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.text).toContain('Business Client');
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientType: 'BUSINESS'
          })
        })
      );
    });
  });

  describe('Security and Access Control', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/clients' },
        { method: 'get', path: '/api/clients/client-1' },
        { method: 'post', path: '/api/clients' },
        { method: 'put', path: '/api/clients/client-1' },
        { method: 'delete', path: '/api/clients/client-1' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        phone: '+1-555-0123',
        clientType: 'BUSINESS',
      };

      mockPrisma.client.create.mockResolvedValue({
        id: 'safe-client',
        ...maliciousData,
        name: 'scriptalert("xss")/script', // Sanitized
      });

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.data.name).not.toContain('<script>');
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionData = {
        name: "'; DROP TABLE clients; --",
        email: 'test@example.com',
        clientType: 'BUSINESS',
      };

      mockPrisma.client.create.mockResolvedValue({
        id: 'safe-client',
        ...sqlInjectionData,
        name: " DROP TABLE clients --", // Sanitized
      });

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sqlInjectionData)
        .expect(201);

      expect(response.body.data.name).not.toContain("';");
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `client-${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        clientType: 'BUSINESS',
        status: 'ACTIVE',
      }));

      mockPrisma.client.findMany.mockResolvedValue(largeClientList);
      mockPrisma.client.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      
      expect(response.body.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should implement proper pagination for large datasets', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(10000);

      const response = await request(app)
        .get('/api/clients?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('total', 10000);
      expect(response.body.pagination).toHaveProperty('totalPages', 200);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });
  });
});