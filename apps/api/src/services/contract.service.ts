// Contract Management Service
// Comprehensive CRUD operations and business logic for contracts

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createContractSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['SERVICE_AGREEMENT', 'EMPLOYMENT', 'NDA', 'JOINT_VENTURE', 'LICENSE_AGREEMENT', 'MERGER_ACQUISITION', 'PARTNERSHIP', 'CONSULTING', 'SUPPLY', 'DISTRIBUTION']),
  value: z.number().positive().optional(),
  currency: z.string().default('USD'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
  renewalTerms: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  clientId: z.string(),
});

export const updateContractSchema = createContractSchema.partial();

export const contractQuerySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('10'),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'EXECUTED', 'TERMINATED', 'EXPIRED']).optional(),
  clientId: z.string().optional(),
  type: z.string().optional(),
  riskLevel: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'value', 'startDate', 'endDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateContractDTO = z.infer<typeof createContractSchema>;
export type UpdateContractDTO = z.infer<typeof updateContractSchema>;
export type ContractQueryDTO = z.infer<typeof contractQuerySchema>;

export class ContractService {
  static async createContract(data: CreateContractDTO, userId: string) {
    try {
      // Validate that client exists and user has access
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!client) {
        throw new Error('Client not found or access denied');
      }

      const contract = await prisma.contract.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
          assignedLawyerId: userId,
          status: 'DRAFT',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              clientType: true,
              industry: true
            }
          },
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          documents: {
            select: {
              id: true,
              title: true,
              type: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              documents: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...contract,
        tags: JSON.parse(contract.tags || '[]'),
      };
    } catch (error) {
      console.error('Error creating contract:', error);
      throw new Error(`Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getContracts(query: ContractQueryDTO, userId: string) {
    try {
      const {
        page,
        limit,
        search,
        status,
        clientId,
        type,
        riskLevel,
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
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } }
            ]
          }
        ];
      }

      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (type) where.type = type;
      if (riskLevel) where.riskLevel = riskLevel;

      // Get contracts with pagination
      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                clientType: true,
                industry: true
              }
            },
            assignedLawyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            documents: {
              select: {
                id: true,
                title: true,
                type: true,
                createdAt: true
              },
              take: 3,
              orderBy: { createdAt: 'desc' }
            },
            aiAnalyses: {
              select: {
                id: true,
                type: true,
                status: true,
                output: true,
                confidence: true,
                completedAt: true
              },
              where: {
                status: 'COMPLETED'
              },
              orderBy: {
                completedAt: 'desc'
              },
              take: 1 // Get the latest analysis
            },
            _count: {
              select: {
                documents: true,
                aiAnalyses: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.contract.count({ where })
      ]);

      // Parse tags for each contract
      const contractsWithTags = contracts.map(contract => ({
        ...contract,
        tags: JSON.parse(contract.tags || '[]'),
      }));

      return {
        contracts: contractsWithTags,
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
      console.error('Error fetching contracts:', error);
      throw new Error(`Failed to fetch contracts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getContractById(id: string, userId: string) {
    try {
      const contract = await prisma.contract.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              address: true,
              clientType: true,
              industry: true,
              description: true
            }
          },
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
            orderBy: { createdAt: 'desc' }
          },
          aiAnalyses: {
            select: {
              id: true,
              title: true,
              type: true,
              confidence: true,
              status: true,
              output: true,
              completedAt: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          risks: {
            select: {
              id: true,
              title: true,
              type: true,
              level: true,
              riskScore: true,
              status: true,
              createdAt: true
            },
            orderBy: { riskScore: 'desc' },
            take: 5
          }
        }
      });

      if (!contract) {
        throw new Error('Contract not found or access denied');
      }

      return {
        ...contract,
        tags: JSON.parse(contract.tags || '[]'),
      };
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw new Error(`Failed to fetch contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateContract(id: string, data: UpdateContractDTO, userId: string) {
    try {
      // Check if contract exists and user has access
      const existingContract = await prisma.contract.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!existingContract) {
        throw new Error('Contract not found or access denied');
      }

      const updateData: any = { ...data };
      if (data.tags) {
        updateData.tags = JSON.stringify(data.tags);
      }

      const contract = await prisma.contract.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              clientType: true,
              industry: true
            }
          },
          assignedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          documents: {
            select: {
              id: true,
              title: true,
              type: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              documents: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...contract,
        tags: JSON.parse(contract.tags || '[]'),
      };
    } catch (error) {
      console.error('Error updating contract:', error);
      throw new Error(`Failed to update contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteContract(id: string, userId: string) {
    try {
      // Check if contract exists and user has access
      const contract = await prisma.contract.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!contract) {
        throw new Error('Contract not found or access denied');
      }

      // Delete contract (cascade will handle related records)
      await prisma.contract.delete({
        where: { id }
      });

      return { success: true, message: 'Contract deleted successfully' };
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw new Error(`Failed to delete contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getContractStats(userId: string) {
    try {
      const whereClause = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      const [
        totalContracts,
        activeContracts,
        draftContracts,
        expiringSoon,
        contractsByStatus,
        contractsByRisk,
        monthlyTrend
      ] = await Promise.all([
        // Total contracts
        prisma.contract.count({ where: whereClause }),
        
        // Active contracts
        prisma.contract.count({
          where: {
            ...whereClause,
            status: { in: ['APPROVED', 'EXECUTED'] },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        }),
        
        // Draft contracts
        prisma.contract.count({
          where: {
            ...whereClause,
            status: 'DRAFT'
          }
        }),
        
        // Expiring soon (next 30 days)
        prisma.contract.count({
          where: {
            ...whereClause,
            endDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date()
            }
          }
        }),
        
        // Contracts by status
        prisma.contract.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        
        // Contracts by risk level
        prisma.contract.groupBy({
          by: ['riskLevel'],
          where: whereClause,
          _count: { riskLevel: true }
        }),
        
        // Monthly trend (last 6 months)
        prisma.contract.groupBy({
          by: ['createdAt'],
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true }
        })
      ]);

      return {
        summary: {
          total: totalContracts,
          active: activeContracts,
          draft: draftContracts,
          expiringSoon
        },
        byStatus: contractsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        byRiskLevel: contractsByRisk.map(item => ({
          riskLevel: item.riskLevel,
          count: item._count.riskLevel
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.createdAt,
          count: item._count.id
        }))
      };
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      throw new Error(`Failed to fetch contract statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchContracts(query: string, userId: string, limit: number = 10) {
    try {
      const contracts = await prisma.contract.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          AND: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { type: { contains: query, mode: 'insensitive' } },
              { client: { name: { contains: query, mode: 'insensitive' } } }
            ]
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              clientType: true
            }
          }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return contracts.map(contract => ({
        ...contract,
        tags: JSON.parse(contract.tags || '[]'),
      }));
    } catch (error) {
      console.error('Error searching contracts:', error);
      throw new Error(`Failed to search contracts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getContractStatsWithComparison(userId: string, options: {
    startDate?: Date;
    endDate?: Date;
    compareStartDate?: Date;
    compareEndDate?: Date;
  } = {}) {
    try {
      const baseWhereClause = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      // Calculate default periods (current month vs previous month)
      const now = new Date();
      const currentMonthStart = options.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = options.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const previousMonthStart = options.compareStartDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = options.compareEndDate || new Date(now.getFullYear(), now.getMonth(), 0);

      // Current period stats
      const currentPeriodWhere = {
        ...baseWhereClause,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      };

      // Previous period stats
      const previousPeriodWhere = {
        ...baseWhereClause,
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      };

      const [
        // Current period
        currentTotal,
        currentActive,
        currentTotalValue,
        currentExpiring,
        
        // Previous period
        previousTotal,
        previousActive,
        previousTotalValue,
        previousExpiring,
        
        // Overall stats
        totalContracts,
        activeContracts,
        totalValue,
        expiringSoon,
        contractsByType,
        contractsByStatus
      ] = await Promise.all([
        // Current period stats
        prisma.contract.count({ where: currentPeriodWhere }),
        prisma.contract.count({ where: { ...currentPeriodWhere, status: 'ACTIVE' } }),
        prisma.contract.aggregate({ 
          where: currentPeriodWhere, 
          _sum: { value: true } 
        }),
        prisma.contract.count({ 
          where: { 
            ...currentPeriodWhere, 
            endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
          } 
        }),
        
        // Previous period stats
        prisma.contract.count({ where: previousPeriodWhere }),
        prisma.contract.count({ where: { ...previousPeriodWhere, status: 'ACTIVE' } }),
        prisma.contract.aggregate({ 
          where: previousPeriodWhere, 
          _sum: { value: true } 
        }),
        prisma.contract.count({ 
          where: { 
            ...previousPeriodWhere, 
            endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
          } 
        }),
        
        // Overall stats
        prisma.contract.count({ where: baseWhereClause }),
        prisma.contract.count({ where: { ...baseWhereClause, status: 'ACTIVE' } }),
        prisma.contract.aggregate({ 
          where: baseWhereClause, 
          _sum: { value: true } 
        }),
        prisma.contract.count({ 
          where: { 
            ...baseWhereClause, 
            endDate: { 
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date()
            }
          } 
        }),
        
        // Contracts by type
        prisma.contract.groupBy({
          by: ['type'],
          where: baseWhereClause,
          _count: { type: true }
        }),
        
        // Contracts by status
        prisma.contract.groupBy({
          by: ['status'],
          where: baseWhereClause,
          _count: { status: true }
        })
      ]);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
      };

      return {
        summary: {
          total: totalContracts,
          active: activeContracts,
          totalValue: totalValue._sum.value || 0,
          expiringSoon
        },
        changes: {
          total: calculateChange(currentTotal, previousTotal),
          active: calculateChange(currentActive, previousActive),
          totalValue: calculateChange(currentTotalValue._sum.value || 0, previousTotalValue._sum.value || 0),
          expiring: calculateChange(currentExpiring, previousExpiring)
        },
        byType: contractsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        byStatus: contractsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        }))
      };
    } catch (error) {
      console.error('Error fetching contract stats with comparison:', error);
      throw new Error(`Failed to fetch contract statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}