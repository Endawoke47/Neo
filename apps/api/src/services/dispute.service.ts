// Dispute Management Service
// Comprehensive CRUD operations and business logic for dispute/litigation management

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createDisputeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CONTRACT', 'TORT', 'EMPLOYMENT', 'INTELLECTUAL_PROPERTY', 'REAL_ESTATE', 'COMMERCIAL', 'REGULATORY', 'CRIMINAL', 'FAMILY', 'ARBITRATION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  claimAmount: z.number().positive().optional(),
  estimatedLiability: z.number().positive().optional(),
  jurisdiction: z.string().optional(),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  filingDate: z.string().transform(str => new Date(str)).optional(),
  trialDate: z.string().transform(str => new Date(str)).optional(),
  opposingParty: z.string().optional(),
  opposingCounsel: z.string().optional(),
  deadlines: z.array(z.object({
    type: z.string(),
    date: z.string(),
    status: z.enum(['pending', 'completed', 'overdue'])
  })).default([]),
  clientId: z.string(),
  matterId: z.string().optional(),
});

export const updateDisputeSchema = createDisputeSchema.partial();

export const disputeQuerySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('10'),
  search: z.string().optional(),
  status: z.enum(['OPEN', 'DISCOVERY', 'MEDIATION', 'ARBITRATION', 'TRIAL', 'APPEAL', 'SETTLED', 'DISMISSED', 'CLOSED']).optional(),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  riskLevel: z.string().optional(),
  jurisdiction: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'claimAmount', 'filingDate', 'trialDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDisputeDTO = z.infer<typeof createDisputeSchema>;
export type UpdateDisputeDTO = z.infer<typeof updateDisputeSchema>;
export type DisputeQueryDTO = z.infer<typeof disputeQuerySchema>;

export class DisputeService {
  static async createDispute(data: CreateDisputeDTO, userId: string) {
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

      // If matterId provided, validate access to matter
      if (data.matterId) {
        const matter = await prisma.matter.findFirst({
          where: {
            id: data.matterId,
            clientId: data.clientId,
            OR: [
              { assignedLawyerId: userId },
              { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
            ]
          }
        });

        if (!matter) {
          throw new Error('Matter not found or access denied');
        }
      }

      const dispute = await prisma.dispute.create({
        data: {
          ...data,
          deadlines: JSON.stringify(data.deadlines),
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
          matter: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true
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
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...dispute,
        deadlines: JSON.parse(dispute.deadlines || '[]'),
      };
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw new Error(`Failed to create dispute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDisputes(query: DisputeQueryDTO, userId: string) {
    try {
      const {
        page,
        limit,
        search,
        status,
        clientId,
        matterId,
        type,
        priority,
        riskLevel,
        jurisdiction,
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
              { caseNumber: { contains: search, mode: 'insensitive' } },
              { opposingParty: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } }
            ]
          }
        ];
      }

      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (matterId) where.matterId = matterId;
      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (riskLevel) where.riskLevel = riskLevel;
      if (jurisdiction) where.jurisdiction = { contains: jurisdiction, mode: 'insensitive' };

      // Get disputes with pagination
      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
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
            matter: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true
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
                riskAssessments: true,
                aiAnalyses: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.dispute.count({ where })
      ]);

      // Parse deadlines for each dispute
      const disputesWithDeadlines = disputes.map(dispute => ({
        ...dispute,
        deadlines: JSON.parse(dispute.deadlines || '[]'),
      }));

      return {
        disputes: disputesWithDeadlines,
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
      console.error('Error fetching disputes:', error);
      throw new Error(`Failed to fetch disputes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDisputeById(id: string, userId: string) {
    try {
      const dispute = await prisma.dispute.findFirst({
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
          matter: {
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
              billableHours: true
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
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found or access denied');
      }

      return {
        ...dispute,
        deadlines: JSON.parse(dispute.deadlines || '[]'),
      };
    } catch (error) {
      console.error('Error fetching dispute:', error);
      throw new Error(`Failed to fetch dispute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateDispute(id: string, data: UpdateDisputeDTO, userId: string) {
    try {
      // Check if dispute exists and user has access
      const existingDispute = await prisma.dispute.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!existingDispute) {
        throw new Error('Dispute not found or access denied');
      }

      const updateData: any = { ...data };
      if (data.deadlines) {
        updateData.deadlines = JSON.stringify(data.deadlines);
      }

      const dispute = await prisma.dispute.update({
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
          matter: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true
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
              riskAssessments: true,
              aiAnalyses: true
            }
          }
        }
      });

      return {
        ...dispute,
        deadlines: JSON.parse(dispute.deadlines || '[]'),
      };
    } catch (error) {
      console.error('Error updating dispute:', error);
      throw new Error(`Failed to update dispute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteDispute(id: string, userId: string) {
    try {
      // Check if dispute exists and user has access
      const dispute = await prisma.dispute.findFirst({
        where: {
          id,
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found or access denied');
      }

      // Delete dispute (cascade will handle related records)
      await prisma.dispute.delete({
        where: { id }
      });

      return { success: true, message: 'Dispute deleted successfully' };
    } catch (error) {
      console.error('Error deleting dispute:', error);
      throw new Error(`Failed to delete dispute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDisputeStats(userId: string) {
    try {
      const whereClause = {
        OR: [
          { assignedLawyerId: userId },
          { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      const [
        totalDisputes,
        openDisputes,
        inTrialDisputes,
        settledDisputes,
        disputesByStatus,
        disputesByType,
        disputesByRisk,
        totalClaimAmount,
        totalEstimatedLiability,
        monthlyTrend,
        upcomingTrials,
        upcomingDeadlines
      ] = await Promise.all([
        // Total disputes
        prisma.dispute.count({ where: whereClause }),
        
        // Open disputes
        prisma.dispute.count({
          where: {
            ...whereClause,
            status: { in: ['OPEN', 'DISCOVERY', 'MEDIATION', 'ARBITRATION'] }
          }
        }),
        
        // In trial disputes
        prisma.dispute.count({
          where: {
            ...whereClause,
            status: 'TRIAL'
          }
        }),
        
        // Settled disputes
        prisma.dispute.count({
          where: {
            ...whereClause,
            status: { in: ['SETTLED', 'DISMISSED'] }
          }
        }),
        
        // Disputes by status
        prisma.dispute.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        
        // Disputes by type
        prisma.dispute.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true }
        }),
        
        // Disputes by risk level
        prisma.dispute.groupBy({
          by: ['riskLevel'],
          where: whereClause,
          _count: { riskLevel: true }
        }),
        
        // Total claim amount
        prisma.dispute.aggregate({
          where: whereClause,
          _sum: { claimAmount: true }
        }),
        
        // Total estimated liability
        prisma.dispute.aggregate({
          where: whereClause,
          _sum: { estimatedLiability: true }
        }),
        
        // Monthly trend (last 6 months)
        prisma.dispute.groupBy({
          by: ['createdAt'],
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { id: true }
        }),
        
        // Upcoming trials (next 60 days)
        prisma.dispute.findMany({
          where: {
            ...whereClause,
            trialDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            },
            status: { not: { in: ['SETTLED', 'DISMISSED', 'CLOSED'] } }
          },
          select: {
            id: true,
            title: true,
            trialDate: true,
            courtName: true,
            caseNumber: true,
            priority: true,
            status: true,
            client: {
              select: {
                name: true
              }
            }
          },
          orderBy: { trialDate: 'asc' },
          take: 10
        }),
        
        // Upcoming deadlines (next 30 days)
        prisma.dispute.findMany({
          where: {
            ...whereClause,
            status: { not: { in: ['SETTLED', 'DISMISSED', 'CLOSED'] } }
          },
          select: {
            id: true,
            title: true,
            deadlines: true,
            client: {
              select: {
                name: true
              }
            }
          }
        })
      ]);

      // Process upcoming deadlines
      const processedDeadlines = upcomingDeadlines
        .map(dispute => {
          const deadlines = JSON.parse(dispute.deadlines || '[]');
          return deadlines
            .filter((deadline: any) => {
              const deadlineDate = new Date(deadline.date);
              const now = new Date();
              const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return deadlineDate >= now && deadlineDate <= thirtyDaysFromNow && deadline.status === 'pending';
            })
            .map((deadline: any) => ({
              disputeId: dispute.id,
              disputeTitle: dispute.title,
              clientName: dispute.client.name,
              type: deadline.type,
              date: deadline.date,
              status: deadline.status
            }));
        })
        .flat()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10);

      return {
        summary: {
          total: totalDisputes,
          open: openDisputes,
          inTrial: inTrialDisputes,
          settled: settledDisputes,
          totalClaimAmount: totalClaimAmount._sum.claimAmount || 0,
          totalEstimatedLiability: totalEstimatedLiability._sum.estimatedLiability || 0
        },
        byStatus: disputesByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        byType: disputesByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        byRiskLevel: disputesByRisk.map(item => ({
          riskLevel: item.riskLevel,
          count: item._count.riskLevel
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.createdAt,
          count: item._count.id
        })),
        upcomingTrials,
        upcomingDeadlines: processedDeadlines
      };
    } catch (error) {
      console.error('Error fetching dispute stats:', error);
      throw new Error(`Failed to fetch dispute statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchDisputes(query: string, userId: string, limit: number = 10) {
    try {
      const disputes = await prisma.dispute.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          AND: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { caseNumber: { contains: query, mode: 'insensitive' } },
              { opposingParty: { contains: query, mode: 'insensitive' } },
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
          },
          matter: {
            select: {
              id: true,
              title: true
            }
          }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return disputes.map(dispute => ({
        ...dispute,
        deadlines: JSON.parse(dispute.deadlines || '[]'),
      }));
    } catch (error) {
      console.error('Error searching disputes:', error);
      throw new Error(`Failed to search disputes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateDisputeStatus(id: string, status: 'OPEN' | 'DISCOVERY' | 'MEDIATION' | 'ARBITRATION' | 'TRIAL' | 'APPEAL' | 'SETTLED' | 'DISMISSED' | 'CLOSED', userId: string) {
    try {
      const dispute = await this.updateDispute(id, { status }, userId);
      return dispute;
    } catch (error) {
      console.error('Error updating dispute status:', error);
      throw new Error(`Failed to update dispute status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateDeadlines(id: string, deadlines: Array<{type: string, date: string, status: 'pending' | 'completed' | 'overdue'}>, userId: string) {
    try {
      const dispute = await this.updateDispute(id, { deadlines }, userId);
      return dispute;
    } catch (error) {
      console.error('Error updating deadlines:', error);
      throw new Error(`Failed to update deadlines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async assignLawyer(disputeId: string, lawyerId: string, userId: string) {
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

      // Update dispute assignment
      const dispute = await prisma.dispute.update({
        where: { id: disputeId },
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
          },
          matter: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      return dispute;
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      throw new Error(`Failed to assign lawyer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}