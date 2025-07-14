// Client Management Service
// Comprehensive CRUD operations and business logic for client management

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  clientType: z.enum(['INDIVIDUAL', 'CORPORATION', 'NON_PROFIT', 'GOVERNMENT']),
  industry: z.string().optional(),
  description: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientQuerySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('10'),
  search: z.string().optional(),
  clientType: z.enum(['INDIVIDUAL', 'CORPORATION', 'NON_PROFIT', 'GOVERNMENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
  industry: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'clientType', 'industry']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateClientDTO = z.infer<typeof createClientSchema>;
export type UpdateClientDTO = z.infer<typeof updateClientSchema>;
export type ClientQueryDTO = z.infer<typeof clientQuerySchema>;

export class ClientService {
  static async createClient(data: CreateClientDTO, userId: string) {
    try {
      // Check if client with same email already exists
      const existingClient = await prisma.client.findUnique({
        where: { email: data.email }
      });

      if (existingClient) {
        throw new Error('Client with this email already exists');
      }

      const client = await prisma.client.create({
        data: {
          ...data,
          assignedLawyerId: userId,
          status: 'PROSPECT',
        },
        include: {
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              contracts: true,
              matters: true,
              disputes: true,
              documents: true
            }
          }
        }
      });

      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getClients(query: ClientQueryDTO, userId: string) {
    try {
      const {
        page,
        limit,
        search,
        clientType,
        status,
        industry,
        sortBy,
        sortOrder
      } = query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      if (search) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { industry: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      if (clientType) where.clientType = clientType;
      if (status) where.status = status;
      if (industry) where.industry = { contains: industry, mode: 'insensitive' };

      // Get clients with pagination
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            assignedLawyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            contracts: {
              select: {
                id: true,
                title: true,
                status: true,
                value: true,
                currency: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            matters: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            _count: {
              select: {
                contracts: true,
                matters: true,
                disputes: true,
                documents: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.client.count({ where })
      ]);

      return {
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw new Error(`Failed to fetch clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getClientById(id: string, userId: string) {
    try {
      const client = await prisma.client.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              phoneNumber: true
            }
          },
          contracts: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              status: true,
              value: true,
              currency: true,
              startDate: true,
              endDate: true,
              riskLevel: true,
              priority: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          matters: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              status: true,
              priority: true,
              riskLevel: true,
              estimatedValue: true,
              actualValue: true,
              startDate: true,
              targetDate: true,
              billableHours: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          disputes: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              status: true,
              priority: true,
              riskLevel: true,
              claimAmount: true,
              estimatedLiability: true,
              jurisdiction: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          documents: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              fileType: true,
              fileSize: true,
              isConfidential: true,
              version: true,
              createdAt: true,
              uploadedBy: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              contracts: true,
              matters: true,
              disputes: true,
              documents: true
            }
          }
        }
      });

      if (!client) {
        throw new Error('Client not found or access denied');
      }

      return client;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw new Error(`Failed to fetch client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateClient(id: string, data: UpdateClientDTO, userId: string) {
    try {
      // Check if client exists and user has access
      const existingClient = await prisma.client.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!existingClient) {
        throw new Error('Client not found or access denied');
      }

      // Check if email is being changed and doesn't conflict
      if (data.email && data.email !== existingClient.email) {
        const emailExists = await prisma.client.findUnique({
          where: { email: data.email }
        });

        if (emailExists) {
          throw new Error('Client with this email already exists');
        }
      }

      const client = await prisma.client.update({
        where: { id },
        data,
        include: {
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              contracts: true,
              matters: true,
              disputes: true,
              documents: true
            }
          }
        }
      });

      return client;
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteClient(id: string, userId: string) {
    try {
      // Check if client exists and user has access
      const client = await prisma.client.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          _count: {
            select: {
              contracts: true,
              matters: true,
              disputes: true
            }
          }
        }
      });

      if (!client) {
        throw new Error('Client not found or access denied');
      }

      // Check if client has active matters/contracts/disputes
      if (client._count.contracts > 0 || client._count.matters > 0 || client._count.disputes > 0) {
        throw new Error('Cannot delete client with active contracts, matters, or disputes');
      }

      // Delete client
      await prisma.client.delete({
        where: { id }
      });

      return { success: true, message: 'Client deleted successfully' };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getClientStats(userId: string) {
    try {
      const whereClause = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      const [
        totalClients,
        activeClients,
        prospectClients,
        inactiveClients,
        clientsByType,
        clientsByIndustry,
        monthlyTrend,
        recentActivity
      ] = await Promise.all([
        // Total clients
        prisma.client.count({ where: whereClause }),
        
        // Active clients
        prisma.client.count({
          where: {
            ...whereClause,
            status: 'ACTIVE'
          }
        }),
        
        // Prospect clients
        prisma.client.count({
          where: {
            ...whereClause,
            status: 'PROSPECT'
          }
        }),
        
        // Inactive clients
        prisma.client.count({
          where: {
            ...whereClause,
            status: 'INACTIVE'
          }
        }),
        
        // Clients by type
        prisma.client.groupBy({
          by: ['clientType'],
          where: whereClause,
          _count: { clientType: true }
        }),
        
        // Clients by industry
        prisma.client.groupBy({
          by: ['industry'],
          where: {
            ...whereClause,
            industry: { not: null }
          },
          _count: { industry: true },
          orderBy: { _count: { industry: 'desc' } },
          take: 10
        }),
        
        // Monthly trend (last 6 months)
        prisma.client.groupBy({
          by: ['createdAt'],
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true }
        }),
        
        // Recent activity
        prisma.client.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        })
      ]);

      return {
        summary: {
          total: totalClients,
          active: activeClients,
          prospect: prospectClients,
          inactive: inactiveClients
        },
        byType: clientsByType.map(item => ({
          type: item.clientType,
          count: item._count.clientType
        })),
        byIndustry: clientsByIndustry.map(item => ({
          industry: item.industry,
          count: item._count.industry
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.createdAt,
          count: item._count.id
        })),
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching client stats:', error);
      throw new Error(`Failed to fetch client statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchClients(query: string, userId: string, limit: number = 10) {
    try {
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          AND: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { industry: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          clientType: true,
          industry: true,
          status: true,
          createdAt: true
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return clients;
    } catch (error) {
      console.error('Error searching clients:', error);
      throw new Error(`Failed to search clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateClientStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT', userId: string) {
    try {
      const client = await this.updateClient(id, { status }, userId);
      return client;
    } catch (error) {
      console.error('Error updating client status:', error);
      throw new Error(`Failed to update client status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async assignLawyer(clientId: string, lawyerId: string, userId: string) {
    try {
      // Check if requesting user has permission (admin/partner only)
      const requestingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!requestingUser || !['ADMIN', 'PARTNER'].includes(requestingUser.role)) {
        throw new Error('Insufficient permissions to assign lawyers');
      }

      // Check if target lawyer exists
      const targetLawyer = await prisma.user.findUnique({
        where: { id: lawyerId },
        select: { id: true, role: true }
      });

      if (!targetLawyer) {
        throw new Error('Target lawyer not found');
      }

      // Update client assignment
      const client = await prisma.client.update({
        where: { id: clientId },
        data: { assignedLawyerId: lawyerId },
        include: {
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return client;
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      throw new Error(`Failed to assign lawyer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}