/**
 * Real Client Service Implementation
 * Replaces mock/placeholder implementations with actual database operations
 */

import { PrismaClient, Client, ClientType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../config/logger';

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional(),
  address: z.string().max(500).optional(),
  clientType: z.nativeEnum(ClientType),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

const updateClientSchema = createClientSchema.partial();

const clientQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  clientType: z.nativeEnum(ClientType).optional(),
  industry: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;

export interface ClientWithStats extends Client {
  _count: {
    matters: number;
    documents: number;
  };
  totalBilled: number;
  lastActivityAt: Date | null;
}

export class ClientService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new client
   */
  async createClient(data: CreateClientInput, userId: string): Promise<Client> {
    const validatedData = createClientSchema.parse(data);
    
    // Check for duplicate email
    const existingClient = await this.prisma.client.findUnique({
      where: { email: validatedData.email },
    });

    if (existingClient) {
      throw new Error('Client with this email already exists');
    }

    try {
      const client = await this.prisma.client.create({
        data: {
          ...validatedData,
          createdById: userId,
        },
      });

      logger.info('Client created successfully', {
        clientId: client.id,
        clientName: client.name,
        createdBy: userId,
      });

      return client;
    } catch (error) {
      logger.error('Failed to create client', { error, data: validatedData });
      throw new Error('Failed to create client');
    }
  }

  /**
   * Get client by ID with related data
   */
  async getClientById(id: string): Promise<ClientWithStats | null> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              matters: true,
              documents: true,
            },
          },
          matters: {
            select: {
              billedAmount: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!client) {
        return null;
      }

      // Calculate total billed amount
      const totalBilledResult = await this.prisma.matter.aggregate({
        where: { clientId: id },
        _sum: {
          billedAmount: true,
        },
      });

      // Get last activity
      const lastMatter = await this.prisma.matter.findFirst({
        where: { clientId: id },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      return {
        ...client,
        totalBilled: totalBilledResult._sum.billedAmount || 0,
        lastActivityAt: lastMatter?.updatedAt || null,
      };
    } catch (error) {
      logger.error('Failed to get client by ID', { error, clientId: id });
      throw new Error('Failed to retrieve client');
    }
  }

  /**
   * Get clients with filtering, searching, and pagination
   */
  async getClients(query: ClientQuery): Promise<{
    clients: ClientWithStats[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const validatedQuery = clientQuerySchema.parse(query);
    const { page, limit, search, clientType, industry, sortBy, sortOrder } = validatedQuery;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClientWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        clientType ? { clientType } : {},
        industry ? { industry: { contains: industry, mode: 'insensitive' } } : {},
      ],
    };

    try {
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          include: {
            _count: {
              select: {
                matters: true,
                documents: true,
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        }),
        this.prisma.client.count({ where }),
      ]);

      // Get billing information for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const [totalBilledResult, lastMatter] = await Promise.all([
            this.prisma.matter.aggregate({
              where: { clientId: client.id },
              _sum: { billedAmount: true },
            }),
            this.prisma.matter.findFirst({
              where: { clientId: client.id },
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true },
            }),
          ]);

          return {
            ...client,
            totalBilled: totalBilledResult._sum.billedAmount || 0,
            lastActivityAt: lastMatter?.updatedAt || null,
          };
        })
      );

      const totalPages = Math.ceil(total / limit);

      return {
        clients: clientsWithStats,
        total,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      logger.error('Failed to get clients', { error, query: validatedQuery });
      throw new Error('Failed to retrieve clients');
    }
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: UpdateClientInput, userId: string): Promise<Client> {
    const validatedData = updateClientSchema.parse(data);

    // Check if client exists
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailConflict = await this.prisma.client.findUnique({
        where: { email: validatedData.email },
      });

      if (emailConflict) {
        throw new Error('Another client with this email already exists');
      }
    }

    try {
      const updatedClient = await this.prisma.client.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      logger.info('Client updated successfully', {
        clientId: id,
        updatedBy: userId,
        changes: Object.keys(validatedData),
      });

      return updatedClient;
    } catch (error) {
      logger.error('Failed to update client', { error, clientId: id, data: validatedData });
      throw new Error('Failed to update client');
    }
  }

  /**
   * Delete client (soft delete)
   */
  async deleteClient(id: string, userId: string): Promise<void> {
    // Check if client exists
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            matters: true,
          },
        },
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if client has active matters
    if (existingClient._count.matters > 0) {
      throw new Error('Cannot delete client with active matters');
    }

    try {
      await this.prisma.client.delete({
        where: { id },
      });

      logger.info('Client deleted successfully', {
        clientId: id,
        clientName: existingClient.name,
        deletedBy: userId,
      });
    } catch (error) {
      logger.error('Failed to delete client', { error, clientId: id });
      throw new Error('Failed to delete client');
    }
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(): Promise<{
    totalClients: number;
    clientsByType: Record<ClientType, number>;
    clientsByIndustry: Array<{ industry: string; count: number }>;
    recentClients: Client[];
    topClientsByBilling: Array<{ client: Client; totalBilled: number }>;
  }> {
    try {
      const [
        totalClients,
        clientsByType,
        clientsByIndustry,
        recentClients,
        topBillingData,
      ] = await Promise.all([
        // Total clients
        this.prisma.client.count(),

        // Clients by type
        this.prisma.client.groupBy({
          by: ['clientType'],
          _count: true,
        }),

        // Clients by industry (top 10)
        this.prisma.client.groupBy({
          by: ['industry'],
          _count: true,
          where: {
            industry: { not: null },
          },
          orderBy: {
            _count: { industry: 'desc' },
          },
          take: 10,
        }),

        // Recent clients (last 30 days)
        this.prisma.client.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),

        // Top clients by billing
        this.prisma.matter.groupBy({
          by: ['clientId'],
          _sum: {
            billedAmount: true,
          },
          orderBy: {
            _sum: {
              billedAmount: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      // Get client details for top billing
      const topClientsByBilling = await Promise.all(
        topBillingData.map(async (item) => {
          const client = await this.prisma.client.findUnique({
            where: { id: item.clientId },
          });
          return {
            client: client!,
            totalBilled: item._sum.billedAmount || 0,
          };
        })
      );

      // Transform clients by type
      const clientsByTypeObject = clientsByType.reduce((acc, item) => {
        acc[item.clientType] = item._count;
        return acc;
      }, {} as Record<ClientType, number>);

      // Transform clients by industry
      const clientsByIndustryArray = clientsByIndustry.map(item => ({
        industry: item.industry || 'Unknown',
        count: item._count,
      }));

      return {
        totalClients,
        clientsByType: clientsByTypeObject,
        clientsByIndustry: clientsByIndustryArray,
        recentClients,
        topClientsByBilling,
      };
    } catch (error) {
      logger.error('Failed to get client statistics', { error });
      throw new Error('Failed to retrieve client statistics');
    }
  }

  /**
   * Search clients by name or email
   */
  async searchClients(searchTerm: string, limit: number = 10): Promise<Client[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      const clients = await this.prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        take: limit,
      });

      return clients;
    } catch (error) {
      logger.error('Failed to search clients', { error, searchTerm });
      throw new Error('Failed to search clients');
    }
  }
}