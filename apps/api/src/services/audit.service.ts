/**
 * Audit Service - Database Activity Tracking
 * Tracks all database operations for security and compliance
 */

import { prisma } from '../config/database';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  metadata?: Record<string, any>;
}

/**
 * Audit Service Class
 */
export class AuditService {
  /**
   * Log an audit entry
   */
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
          changedFields: entry.changedFields ? entry.changedFields.join(',') : null,
          userId: entry.userId || null,
          userEmail: entry.userEmail || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          description: entry.description || null,
          severity: entry.severity || 'INFO',
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit failures shouldn't break application flow
    }
  }

  /**
   * Log user login
   */
  static async logLogin(userId: string, userEmail: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: userId,
      userEmail,
      ipAddress,
      userAgent,
      description: `User ${userEmail} logged in successfully`,
      severity: 'INFO',
    });
  }

  /**
   * Log user logout
   */
  static async logLogout(userId: string, userEmail: string): Promise<void> {
    await this.log({
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
      userEmail,
      description: `User ${userEmail} logged out`,
      severity: 'INFO',
    });
  }

  /**
   * Log data creation
   */
  static async logCreate(
    entityType: string,
    entityId: string,
    newValues: Record<string, any>,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.log({
      action: 'CREATE',
      entityType,
      entityId,
      newValues,
      userId,
      userEmail,
      description: `Created new ${entityType.toLowerCase()} with ID ${entityId}`,
      severity: 'INFO',
    });
  }

  /**
   * Log data updates
   */
  static async logUpdate(
    entityType: string,
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    const changedFields = Object.keys(newValues).filter(
      key => oldValues[key] !== newValues[key]
    );

    await this.log({
      action: 'UPDATE',
      entityType,
      entityId,
      oldValues,
      newValues,
      changedFields,
      userId,
      userEmail,
      description: `Updated ${entityType.toLowerCase()} ${entityId}: ${changedFields.join(', ')}`,
      severity: 'INFO',
    });
  }

  /**
   * Log data deletion
   */
  static async logDelete(
    entityType: string,
    entityId: string,
    oldValues: Record<string, any>,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.log({
      action: 'DELETE',
      entityType,
      entityId,
      oldValues,
      userId,
      userEmail,
      description: `Deleted ${entityType.toLowerCase()} with ID ${entityId}`,
      severity: 'WARN',
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    description: string,
    entityType: string,
    entityId: string,
    severity: 'WARN' | 'ERROR' | 'CRITICAL' = 'WARN',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'SECURITY_EVENT',
      entityType,
      entityId,
      description,
      severity,
      metadata,
    });
  }

  /**
   * Get audit logs with pagination and filtering
   */
  static async getAuditLogs(params: {
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      action,
      entityType,
      entityId,
      userId,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Clean old audit logs (retention policy)
   */
  static async cleanOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

export default AuditService;
