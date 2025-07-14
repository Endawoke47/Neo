// Matter Management Service
// Comprehensive CRUD operations and business logic for legal matter management

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createMatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['LITIGATION', 'CORPORATE', 'REAL_ESTATE', 'INTELLECTUAL_PROPERTY', 'EMPLOYMENT', 'REGULATORY', 'TAX', 'IMMIGRATION', 'CRIMINAL', 'FAMILY']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  estimatedValue: z.number().positive().optional(),
  actualValue: z.number().positive().optional(),
  startDate: z.string().transform(str => new Date(str)),
  targetDate: z.string().transform(str => new Date(str)).optional(),
  billableHours: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  clientId: z.string(),
});

export const updateMatterSchema = createMatterSchema.partial();

export const matterQuerySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('10'),
  search: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'UNDER_REVIEW', 'CLOSED', 'COMPLETED']).optional(),
  clientId: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  riskLevel: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'estimatedValue', 'startDate', 'targetDate', 'billableHours']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateMatterDTO = z.infer<typeof createMatterSchema>;
export type UpdateMatterDTO = z.infer<typeof updateMatterSchema>;
export type MatterQueryDTO = z.infer<typeof matterQuerySchema>;

export class MatterService {
  static async createMatter(data: CreateMatterDTO, userId: string) {
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

      const matter = await prisma.matter.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
          assignedLawyerId: userId,
          status: 'OPEN',
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
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          },
          disputes: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              priority: true
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              documents: true,
              disputes: true,
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...matter,
        tags: JSON.parse(matter.tags || '[]'),
      };
    } catch (error) {
      console.error('Error creating matter:', error);
      throw new Error(`Failed to create matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMatters(query: MatterQueryDTO, userId: string) {
    try {
      const {
        page,
        limit,
        search,
        status,
        clientId,
        type,
        priority,
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
      if (priority) where.priority = priority;
      if (riskLevel) where.riskLevel = riskLevel;

      // Get matters with pagination
      const [matters, total] = await Promise.all([
        prisma.matter.findMany({
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
            disputes: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
                priority: true
              },
              take: 3,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                documents: true,
                disputes: true,
                riskAssessments: true,
                aiAnalyses: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.matter.count({ where })
      ]);

      // Parse tags for each matter
      const mattersWithTags = matters.map(matter => ({
        ...matter,
        tags: JSON.parse(matter.tags || '[]'),
      }));

      return {
        matters: mattersWithTags,
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
      console.error('Error fetching matters:', error);
      throw new Error(`Failed to fetch matters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMatterById(id: string, userId: string) {
    try {
      const matter = await prisma.matter.findFirst({
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
              courtName: true,
              caseNumber: true,
              filingDate: true,
              trialDate: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          riskAssessments: {
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
            take: 10
          },
          aiAnalyses: {
            select: {
              id: true,
              title: true,
              type: true,
              confidence: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              documents: true,
              disputes: true,
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      if (!matter) {
        throw new Error('Matter not found or access denied');
      }

      return {
        ...matter,
        tags: JSON.parse(matter.tags || '[]'),
      };
    } catch (error) {
      console.error('Error fetching matter:', error);
      throw new Error(`Failed to fetch matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateMatter(id: string, data: UpdateMatterDTO, userId: string) {
    try {
      // Check if matter exists and user has access
      const existingMatter = await prisma.matter.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!existingMatter) {
        throw new Error('Matter not found or access denied');
      }

      const updateData: any = { ...data };
      if (data.tags) {
        updateData.tags = JSON.stringify(data.tags);
      }

      const matter = await prisma.matter.update({
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
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              documents: true,
              disputes: true,
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...matter,
        tags: JSON.parse(matter.tags || '[]'),
      };
    } catch (error) {
      console.error('Error updating matter:', error);
      throw new Error(`Failed to update matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteMatter(id: string, userId: string) {
    try {
      // Check if matter exists and user has access
      const matter = await prisma.matter.findFirst({
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
              disputes: true,
              documents: true
            }
          }
        }
      });

      if (!matter) {
        throw new Error('Matter not found or access denied');
      }

      // Check if matter has active disputes
      if (matter._count.disputes > 0) {
        throw new Error('Cannot delete matter with active disputes. Please resolve or reassign disputes first.');
      }

      // Delete matter (cascade will handle related records)
      await prisma.matter.delete({
        where: { id }
      });

      return { success: true, message: 'Matter deleted successfully' };
    } catch (error) {
      console.error('Error deleting matter:', error);
      throw new Error(`Failed to delete matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMatterStats(userId: string) {
    try {
      const whereClause = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      const [
        totalMatters,
        openMatters,
        inProgressMatters,
        closedMatters,
        mattersByStatus,
        mattersByType,
        mattersByRisk,
        totalBillableHours,
        totalEstimatedValue,
        monthlyTrend,
        upcomingDeadlines
      ] = await Promise.all([
        // Total matters
        prisma.matter.count({ where: whereClause }),
        
        // Open matters
        prisma.matter.count({
          where: {
            ...whereClause,
            status: 'OPEN'
          }
        }),
        
        // In progress matters
        prisma.matter.count({
          where: {
            ...whereClause,
            status: 'IN_PROGRESS'
          }
        }),
        
        // Closed matters
        prisma.matter.count({
          where: {
            ...whereClause,
            status: { in: ['CLOSED', 'COMPLETED'] }
          }
        }),
        
        // Matters by status
        prisma.matter.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        
        // Matters by type
        prisma.matter.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true }
        }),
        
        // Matters by risk level
        prisma.matter.groupBy({
          by: ['riskLevel'],
          where: whereClause,
          _count: { riskLevel: true }
        }),
        
        // Total billable hours
        prisma.matter.aggregate({
          where: whereClause,
          _sum: { billableHours: true }
        }),
        
        // Total estimated value
        prisma.matter.aggregate({
          where: whereClause,
          _sum: { estimatedValue: true }
        }),
        
        // Monthly trend (last 6 months)
        prisma.matter.groupBy({
          by: ['createdAt'],
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true }
        }),
        
        // Upcoming deadlines (next 30 days)
        prisma.matter.findMany({
          where: {
            ...whereClause,
            targetDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            status: { not: { in: ['CLOSED', 'COMPLETED'] } }
          },
          select: {
            id: true,
            title: true,
            targetDate: true,
            priority: true,
            status: true,
            client: {
              select: {
                name: true
              }
            }
          },
          orderBy: { targetDate: 'asc' },
          take: 10
        })
      ]);

      return {
        summary: {
          total: totalMatters,
          open: openMatters,
          inProgress: inProgressMatters,
          closed: closedMatters,
          totalBillableHours: totalBillableHours._sum.billableHours || 0,
          totalEstimatedValue: totalEstimatedValue._sum.estimatedValue || 0
        },
        byStatus: mattersByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        byType: mattersByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        byRiskLevel: mattersByRisk.map(item => ({
          riskLevel: item.riskLevel,
          count: item._count.riskLevel
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.createdAt,
          count: item._count.id
        })),
        upcomingDeadlines
      };
    } catch (error) {
      console.error('Error fetching matter stats:', error);
      throw new Error(`Failed to fetch matter statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchMatters(query: string, userId: string, limit: number = 10) {
    try {
      const matters = await prisma.matter.findMany({
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

      return matters.map(matter => ({
        ...matter,
        tags: JSON.parse(matter.tags || '[]'),
      }));
    } catch (error) {
      console.error('Error searching matters:', error);
      throw new Error(`Failed to search matters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateMatterStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'UNDER_REVIEW' | 'CLOSED' | 'COMPLETED', userId: string) {
    try {
      const updateData: any = { status };
      
      // If closing matter, set completion date
      if (status === 'COMPLETED' || status === 'CLOSED') {
        updateData.completedDate = new Date();
      }
      
      const matter = await this.updateMatter(id, updateData, userId);
      return matter;
    } catch (error) {
      console.error('Error updating matter status:', error);
      throw new Error(`Failed to update matter status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateBillableHours(id: string, hours: number, userId: string) {
    try {
      const matter = await this.updateMatter(id, { billableHours: hours }, userId);
      return matter;
    } catch (error) {
      console.error('Error updating billable hours:', error);
      throw new Error(`Failed to update billable hours: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async assignLawyer(matterId: string, lawyerId: string, userId: string) {
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

      // Update matter assignment
      const matter = await prisma.matter.update({
        where: { id: matterId },
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
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return matter;
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      throw new Error(`Failed to assign lawyer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}