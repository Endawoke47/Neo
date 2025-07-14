// Dashboard Service
// Aggregates data from all services to provide comprehensive dashboard insights

import { PrismaClient } from '@prisma/client';
import { ClientService } from './client.service';
import { ContractService } from './contract.service';
import { MatterService } from './matter.service';
import { DisputeService } from './dispute.service';
import { DocumentService } from './document.service';

const prisma = new PrismaClient();

export class DashboardService {
  static async getDashboardOverview(userId: string) {
    try {
      // Get user role for access control
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, firstName: true, lastName: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get all stats in parallel for performance
      const [
        clientStats,
        contractStats,
        matterStats,
        disputeStats,
        documentStats
      ] = await Promise.all([
        ClientService.getClientStats(userId),
        ContractService.getContractStats(userId),
        MatterService.getMatterStats(userId),
        DisputeService.getDisputeStats(userId),
        DocumentService.getDocumentStats(userId)
      ]);

      // Calculate key metrics
      const totalRevenue = contractStats.summary.total * 50000; // Estimated average contract value
      const totalBillableHours = matterStats.summary.totalBillableHours;
      const averageHourlyRate = totalRevenue > 0 ? totalRevenue / (totalBillableHours || 1) : 0;

      // Risk score calculation
      const riskFactors = [
        disputeStats.summary.totalEstimatedLiability / 1000000, // Normalize by million
        contractStats.summary.expiringSoon / 10, // Normalize by 10 contracts
        (matterStats.summary.total - matterStats.summary.closed) / 20 // Open matters
      ];
      const overallRiskScore = Math.min(10, riskFactors.reduce((a, b) => a + b, 0));

      return {
        user: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        },
        summary: {
          totalClients: clientStats.summary.total,
          activeClients: clientStats.summary.active,
          totalContracts: contractStats.summary.total,
          activeContracts: contractStats.summary.active,
          totalMatters: matterStats.summary.total,
          openMatters: matterStats.summary.open,
          totalDisputes: disputeStats.summary.total,
          openDisputes: disputeStats.summary.open,
          totalDocuments: documentStats.summary.total,
          totalBillableHours: totalBillableHours,
          estimatedRevenue: totalRevenue,
          averageHourlyRate: Math.round(averageHourlyRate),
          overallRiskScore: Math.round(overallRiskScore * 10) / 10
        },
        alerts: await this.getAlerts(userId),
        recentActivity: await this.getRecentActivity(userId),
        upcomingDeadlines: await this.getUpcomingDeadlines(userId),
        performance: {
          clientGrowth: this.calculateGrowthRate(clientStats.monthlyTrend),
          contractValue: contractStats.summary.total * 50000,
          matterResolution: this.calculateResolutionRate(matterStats),
          disputeSuccess: this.calculateDisputeSuccessRate(disputeStats)
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDetailedAnalytics(userId: string) {
    try {
      const [
        clientStats,
        contractStats,
        matterStats,
        disputeStats,
        documentStats,
        financialMetrics,
        productivityMetrics
      ] = await Promise.all([
        ClientService.getClientStats(userId),
        ContractService.getContractStats(userId),
        MatterService.getMatterStats(userId),
        DisputeService.getDisputeStats(userId),
        DocumentService.getDocumentStats(userId),
        this.getFinancialMetrics(userId),
        this.getProductivityMetrics(userId)
      ]);

      return {
        clients: {
          overview: clientStats.summary,
          byType: clientStats.byType,
          byIndustry: clientStats.byIndustry,
          monthlyTrend: clientStats.monthlyTrend,
          recentActivity: clientStats.recentActivity
        },
        contracts: {
          overview: contractStats.summary,
          byStatus: contractStats.byStatus,
          byRiskLevel: contractStats.byRiskLevel,
          monthlyTrend: contractStats.monthlyTrend,
          valueDistribution: this.calculateValueDistribution(contractStats)
        },
        matters: {
          overview: matterStats.summary,
          byStatus: matterStats.byStatus,
          byType: matterStats.byType,
          byRiskLevel: matterStats.byRiskLevel,
          monthlyTrend: matterStats.monthlyTrend,
          upcomingDeadlines: matterStats.upcomingDeadlines
        },
        disputes: {
          overview: disputeStats.summary,
          byStatus: disputeStats.byStatus,
          byType: disputeStats.byType,
          byRiskLevel: disputeStats.byRiskLevel,
          monthlyTrend: disputeStats.monthlyTrend,
          upcomingTrials: disputeStats.upcomingTrials,
          upcomingDeadlines: disputeStats.upcomingDeadlines
        },
        documents: {
          overview: documentStats.summary,
          byType: documentStats.byType,
          byFileType: documentStats.byFileType,
          monthlyTrend: documentStats.monthlyTrend
        },
        financial: financialMetrics,
        productivity: productivityMetrics
      };
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAlerts(userId: string) {
    try {
      const alerts = [];

      // Contract expiration alerts
      const expiringContracts = await prisma.contract.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            gte: new Date()
          },
          status: { in: ['APPROVED', 'EXECUTED'] }
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          client: { select: { name: true } }
        },
        take: 5
      });

      expiringContracts.forEach(contract => {
        alerts.push({
          type: 'CONTRACT_EXPIRY',
          priority: 'HIGH',
          title: 'Contract Expiring Soon',
          message: `Contract "${contract.title}" for ${contract.client.name} expires on ${contract.endDate?.toLocaleDateString()}`,
          entityId: contract.id,
          entityType: 'CONTRACT'
        });
      });

      // Overdue matters
      const overdueMatters = await prisma.matter.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          targetDate: {
            lt: new Date()
          },
          status: { not: { in: ['CLOSED', 'COMPLETED'] } }
        },
        select: {
          id: true,
          title: true,
          targetDate: true,
          client: { select: { name: true } }
        },
        take: 5
      });

      overdueMatters.forEach(matter => {
        alerts.push({
          type: 'MATTER_OVERDUE',
          priority: 'CRITICAL',
          title: 'Matter Overdue',
          message: `Matter "${matter.title}" for ${matter.client.name} was due on ${matter.targetDate?.toLocaleDateString()}`,
          entityId: matter.id,
          entityType: 'MATTER'
        });
      });

      // High-risk disputes
      const highRiskDisputes = await prisma.dispute.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          riskLevel: 'CRITICAL',
          status: { not: { in: ['SETTLED', 'DISMISSED', 'CLOSED'] } }
        },
        select: {
          id: true,
          title: true,
          claimAmount: true,
          client: { select: { name: true } }
        },
        take: 3
      });

      highRiskDisputes.forEach(dispute => {
        alerts.push({
          type: 'HIGH_RISK_DISPUTE',
          priority: 'CRITICAL',
          title: 'Critical Risk Dispute',
          message: `Dispute "${dispute.title}" for ${dispute.client.name} has critical risk level with claim amount of $${dispute.claimAmount?.toLocaleString()}`,
          entityId: dispute.id,
          entityType: 'DISPUTE'
        });
      });

      // Sort alerts by priority
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      alerts.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

      return alerts.slice(0, 10); // Return top 10 alerts
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw new Error('Failed to fetch alerts');
    }
  }

  static async getRecentActivity(userId: string, limit: number = 10) {
    try {
      const activities = [];

      // Recent contracts
      const recentContracts = await prisma.contract.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          client: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      });

      recentContracts.forEach(contract => {
        activities.push({
          type: 'CONTRACT',
          action: 'UPDATED',
          title: `Contract Updated: ${contract.title}`,
          description: `Contract for ${contract.client.name} was updated`,
          entityId: contract.id,
          timestamp: contract.updatedAt
        });
      });

      // Recent matters
      const recentMatters = await prisma.matter.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          client: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      });

      recentMatters.forEach(matter => {
        activities.push({
          type: 'MATTER',
          action: 'UPDATED',
          title: `Matter Updated: ${matter.title}`,
          description: `Matter for ${matter.client.name} was updated`,
          entityId: matter.id,
          timestamp: matter.updatedAt
        });
      });

      // Recent documents
      const recentDocuments = await prisma.document.findMany({
        where: {
          OR: [
            { uploadedById: userId },
            { client: { assignedLawyerId: userId } },
            { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          type: true,
          uploadedBy: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 4
      });

      recentDocuments.forEach(document => {
        activities.push({
          type: 'DOCUMENT',
          action: 'UPLOADED',
          title: `Document Uploaded: ${document.title}`,
          description: `Document uploaded by ${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`,
          entityId: document.id,
          timestamp: document.createdAt
        });
      });

      // Sort by timestamp and return recent activities
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error('Failed to fetch recent activity');
    }
  }

  static async getUpcomingDeadlines(userId: string, limit: number = 10) {
    try {
      const deadlines = [];

      // Contract deadlines
      const contractDeadlines = await prisma.contract.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Next 60 days
          }
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          client: { select: { name: true } }
        },
        take: 5
      });

      contractDeadlines.forEach(contract => {
        if (contract.endDate) {
          deadlines.push({
            type: 'CONTRACT_END',
            title: `Contract End: ${contract.title}`,
            description: `Contract with ${contract.client.name}`,
            date: contract.endDate,
            entityId: contract.id,
            entityType: 'CONTRACT'
          });
        }
      });

      // Matter deadlines
      const matterDeadlines = await prisma.matter.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          targetDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          },
          status: { not: { in: ['CLOSED', 'COMPLETED'] } }
        },
        select: {
          id: true,
          title: true,
          targetDate: true,
          client: { select: { name: true } }
        },
        take: 5
      });

      matterDeadlines.forEach(matter => {
        if (matter.targetDate) {
          deadlines.push({
            type: 'MATTER_TARGET',
            title: `Matter Due: ${matter.title}`,
            description: `Matter for ${matter.client.name}`,
            date: matter.targetDate,
            entityId: matter.id,
            entityType: 'MATTER'
          });
        }
      });

      // Dispute trial dates
      const disputeTrials = await prisma.dispute.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          trialDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 90 days
          },
          status: { not: { in: ['SETTLED', 'DISMISSED', 'CLOSED'] } }
        },
        select: {
          id: true,
          title: true,
          trialDate: true,
          courtName: true,
          client: { select: { name: true } }
        },
        take: 5
      });

      disputeTrials.forEach(dispute => {
        if (dispute.trialDate) {
          deadlines.push({
            type: 'TRIAL_DATE',
            title: `Trial: ${dispute.title}`,
            description: `${dispute.courtName} - ${dispute.client.name}`,
            date: dispute.trialDate,
            entityId: dispute.id,
            entityType: 'DISPUTE'
          });
        }
      });

      // Sort by date and return upcoming deadlines
      deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return deadlines.slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      throw new Error('Failed to fetch upcoming deadlines');
    }
  }

  private static async getFinancialMetrics(userId: string) {
    try {
      const contracts = await prisma.contract.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        select: {
          value: true,
          currency: true,
          status: true,
          createdAt: true
        }
      });

      const totalValue = contracts.reduce((sum, contract) => sum + (contract.value || 0), 0);
      const activeValue = contracts
        .filter(c => ['APPROVED', 'EXECUTED'].includes(c.status))
        .reduce((sum, contract) => sum + (contract.value || 0), 0);

      return {
        totalContractValue: totalValue,
        activeContractValue: activeValue,
        averageContractValue: contracts.length > 0 ? totalValue / contracts.length : 0,
        contractGrowthRate: this.calculateGrowthRate(
          contracts.map(c => ({ createdAt: c.createdAt, count: c.value || 0 }))
        )
      };
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      return {
        totalContractValue: 0,
        activeContractValue: 0,
        averageContractValue: 0,
        contractGrowthRate: 0
      };
    }
  }

  private static async getProductivityMetrics(userId: string) {
    try {
      const matters = await prisma.matter.findMany({
        where: {
          OR: [
            { assignedLawyerId: userId },
            { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        },
        select: {
          billableHours: true,
          status: true,
          createdAt: true,
          completedDate: true
        }
      });

      const totalBillableHours = matters.reduce((sum, matter) => sum + matter.billableHours, 0);
      const completedMatters = matters.filter(m => ['CLOSED', 'COMPLETED'].includes(m.status));
      const avgResolutionTime = this.calculateAverageResolutionTime(completedMatters);

      return {
        totalBillableHours,
        averageHoursPerMatter: matters.length > 0 ? totalBillableHours / matters.length : 0,
        matterCompletionRate: matters.length > 0 ? (completedMatters.length / matters.length) * 100 : 0,
        averageResolutionDays: avgResolutionTime
      };
    } catch (error) {
      console.error('Error calculating productivity metrics:', error);
      return {
        totalBillableHours: 0,
        averageHoursPerMatter: 0,
        matterCompletionRate: 0,
        averageResolutionDays: 0
      };
    }
  }

  private static calculateGrowthRate(monthlyData: any[]): number {
    if (monthlyData.length < 2) return 0;
    
    const current = monthlyData[monthlyData.length - 1]?.count || 0;
    const previous = monthlyData[monthlyData.length - 2]?.count || 1;
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  private static calculateResolutionRate(matterStats: any): number {
    const total = matterStats.summary.total;
    const closed = matterStats.summary.closed;
    return total > 0 ? (closed / total) * 100 : 0;
  }

  private static calculateDisputeSuccessRate(disputeStats: any): number {
    const total = disputeStats.summary.total;
    const settled = disputeStats.summary.settled;
    return total > 0 ? (settled / total) * 100 : 0;
  }

  private static calculateValueDistribution(contractStats: any) {
    // This would analyze contract values and return distribution
    return {
      lowValue: 30,    // < $100K
      mediumValue: 45, // $100K - $1M
      highValue: 25    // > $1M
    };
  }

  private static calculateAverageResolutionTime(completedMatters: any[]): number {
    if (completedMatters.length === 0) return 0;
    
    const resolutionTimes = completedMatters
      .filter(m => m.completedDate)
      .map(m => {
        const start = new Date(m.createdAt).getTime();
        const end = new Date(m.completedDate).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Days
      });
    
    return resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;
  }
}