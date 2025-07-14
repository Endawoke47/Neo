// Document Management Service
// Comprehensive file management and document handling for legal practice

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// Validation schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CONTRACT', 'LEGAL_MEMO', 'COURT_FILING', 'CORRESPONDENCE', 'EVIDENCE', 'COMPLIANCE_REPORT', 'BRIEF', 'MOTION', 'DISCOVERY', 'AGREEMENT', 'OTHER']),
  fileType: z.string(), // PDF, DOCX, XLSX, etc.
  fileName: z.string(),
  originalName: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  filePath: z.string(),
  isConfidential: z.boolean().default(false),
  version: z.number().positive().default(1),
  tags: z.array(z.string()).default([]),
  clientId: z.string().optional(),
  contractId: z.string().optional(),
  matterId: z.string().optional(),
  disputeId: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['CONTRACT', 'LEGAL_MEMO', 'COURT_FILING', 'CORRESPONDENCE', 'EVIDENCE', 'COMPLIANCE_REPORT', 'BRIEF', 'MOTION', 'DISCOVERY', 'AGREEMENT', 'OTHER']).optional(),
  isConfidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const documentQuerySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('10'),
  search: z.string().optional(),
  type: z.string().optional(),
  fileType: z.string().optional(),
  isConfidential: z.string().transform(str => str === 'true').optional(),
  clientId: z.string().optional(),
  contractId: z.string().optional(),
  matterId: z.string().optional(),
  disputeId: z.string().optional(),
  uploadedBy: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'fileSize', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDocumentDTO = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentDTO = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryDTO = z.infer<typeof documentQuerySchema>;

export class DocumentService {
  static async createDocument(data: CreateDocumentDTO, userId: string) {
    try {
      // Validate access to related entities
      if (data.clientId) {
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
      }

      if (data.contractId) {
        const contract = await prisma.contract.findFirst({
          where: {
            id: data.contractId,
            OR: [
              { assignedLawyerId: userId },
              { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
            ]
          }
        });
        if (!contract) {
          throw new Error('Contract not found or access denied');
        }
      }

      if (data.matterId) {
        const matter = await prisma.matter.findFirst({
          where: {
            id: data.matterId,
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

      if (data.disputeId) {
        const dispute = await prisma.dispute.findFirst({
          where: {
            id: data.disputeId,
            OR: [
              { assignedLawyerId: userId },
              { assignedLawyer: { role: { in: ['ADMIN', 'PARTNER'] } } }
            ]
          }
        });
        if (!dispute) {
          throw new Error('Dispute not found or access denied');
        }
      }

      const document = await prisma.document.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
          uploadedById: userId,
          status: 'ACTIVE',
          category: data.type, // Map type to category for compatibility
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          client: data.clientId ? {
            select: {
              id: true,
              name: true,
              email: true
            }
          } : false,
          contract: data.contractId ? {
            select: {
              id: true,
              title: true,
              type: true
            }
          } : false,
          matter: data.matterId ? {
            select: {
              id: true,
              title: true,
              type: true
            }
          } : false,
          dispute: data.disputeId ? {
            select: {
              id: true,
              title: true,
              type: true
            }
          } : false
        }
      });

      return {
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocuments(query: DocumentQueryDTO, userId: string) {
    try {
      const {
        page,
        limit,
        search,
        type,
        fileType,
        isConfidential,
        clientId,
        contractId,
        matterId,
        disputeId,
        uploadedBy,
        sortBy,
        sortOrder
      } = query;

      const offset = (page - 1) * limit;

      // Build where clause - users can access documents they uploaded or related to their cases
      const where: any = {
        OR: [
          { uploadedById: userId },
          { client: { assignedLawyerId: userId } },
          { contract: { assignedLawyerId: userId } },
          { matter: { assignedLawyerId: userId } },
          { dispute: { assignedLawyerId: userId } },
          // Admin/Partner access
          { 
            uploadedBy: { 
              OR: [
                { role: { in: ['ADMIN', 'PARTNER'] } },
                { id: userId }
              ]
            }
          }
        ]
      };

      if (search) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { fileName: { contains: search, mode: 'insensitive' } },
              { originalName: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      if (type) where.type = type;
      if (fileType) where.fileType = { contains: fileType, mode: 'insensitive' };
      if (isConfidential !== undefined) where.isConfidential = isConfidential;
      if (clientId) where.clientId = clientId;
      if (contractId) where.contractId = contractId;
      if (matterId) where.matterId = matterId;
      if (disputeId) where.disputeId = disputeId;
      if (uploadedBy) where.uploadedById = uploadedBy;

      // Get documents with pagination
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            uploadedBy: {
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
            contract: {
              select: {
                id: true,
                title: true,
                type: true
              }
            },
            matter: {
              select: {
                id: true,
                title: true,
                type: true
              }
            },
            dispute: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.document.count({ where })
      ]);

      // Parse tags for each document
      const documentsWithTags = documents.map(document => ({
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      }));

      return {
        documents: documentsWithTags,
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
      console.error('Error fetching documents:', error);
      throw new Error(`Failed to fetch documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocumentById(id: string, userId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id,
          OR: [
            { uploadedById: userId },
            { client: { assignedLawyerId: userId } },
            { contract: { assignedLawyerId: userId } },
            { matter: { assignedLawyerId: userId } },
            { dispute: { assignedLawyerId: userId } },
            // Admin/Partner access
            { 
              uploadedBy: { 
                OR: [
                  { role: { in: ['ADMIN', 'PARTNER'] } },
                  { id: userId }
                ]
              }
            }
          ]
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              phoneNumber: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              clientType: true,
              industry: true
            }
          },
          contract: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              value: true,
              currency: true
            }
          },
          matter: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              priority: true,
              estimatedValue: true
            }
          },
          dispute: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              claimAmount: true,
              caseNumber: true
            }
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
            take: 5
          }
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      return {
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      throw new Error(`Failed to fetch document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateDocument(id: string, data: UpdateDocumentDTO, userId: string) {
    try {
      // Check if document exists and user has access
      const existingDocument = await prisma.document.findFirst({
        where: {
          id,
          OR: [
            { uploadedById: userId },
            { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!existingDocument) {
        throw new Error('Document not found or access denied');
      }

      const updateData: any = { ...data };
      if (data.tags) {
        updateData.tags = JSON.stringify(data.tags);
      }
      if (data.type) {
        updateData.category = data.type; // Update category as well
      }

      const document = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          uploadedBy: {
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
          contract: {
            select: {
              id: true,
              title: true,
              type: true
            }
          },
          matter: {
            select: {
              id: true,
              title: true,
              type: true
            }
          },
          dispute: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        }
      });

      return {
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      };
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteDocument(id: string, userId: string) {
    try {
      // Check if document exists and user has access
      const document = await prisma.document.findFirst({
        where: {
          id,
          OR: [
            { uploadedById: userId },
            { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ]
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Delete physical file if it exists
      try {
        await fs.unlink(document.filePath);
      } catch (fileError) {
        console.warn('Could not delete physical file:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete document from database
      await prisma.document.delete({
        where: { id }
      });

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocumentStats(userId: string) {
    try {
      const whereClause = {
        OR: [
          { uploadedById: userId },
          { client: { assignedLawyerId: userId } },
          { contract: { assignedLawyerId: userId } },
          { matter: { assignedLawyerId: userId } },
          { dispute: { assignedLawyerId: userId } },
          { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
        ]
      };

      const [
        totalDocuments,
        confidentialDocuments,
        recentDocuments,
        documentsByType,
        documentsByFileType,
        totalFileSize,
        monthlyTrend
      ] = await Promise.all([
        // Total documents
        prisma.document.count({ where: whereClause }),
        
        // Confidential documents
        prisma.document.count({
          where: {
            ...whereClause,
            isConfidential: true
          }
        }),
        
        // Recent documents (last 7 days)
        prisma.document.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Documents by type
        prisma.document.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true }
        }),
        
        // Documents by file type
        prisma.document.groupBy({
          by: ['fileType'],
          where: whereClause,
          _count: { fileType: true }
        }),
        
        // Total file size
        prisma.document.aggregate({
          where: whereClause,
          _sum: { fileSize: true }
        }),
        
        // Monthly trend (last 6 months)
        prisma.document.groupBy({
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
          total: totalDocuments,
          confidential: confidentialDocuments,
          recent: recentDocuments,
          totalSizeMB: Math.round((totalFileSize._sum.fileSize || 0) / (1024 * 1024))
        },
        byType: documentsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        byFileType: documentsByFileType.map(item => ({
          fileType: item.fileType,
          count: item._count.fileType
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.createdAt,
          count: item._count.id
        }))
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw new Error(`Failed to fetch document statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchDocuments(query: string, userId: string, limit: number = 10) {
    try {
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { uploadedById: userId },
            { client: { assignedLawyerId: userId } },
            { contract: { assignedLawyerId: userId } },
            { matter: { assignedLawyerId: userId } },
            { dispute: { assignedLawyerId: userId } },
            { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
          ],
          AND: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { fileName: { contains: query, mode: 'insensitive' } },
              { originalName: { contains: query, mode: 'insensitive' } },
              { type: { contains: query, mode: 'insensitive' } }
            ]
          }
        },
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return documents.map(document => ({
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async downloadDocument(id: string, userId: string) {
    try {
      const document = await this.getDocumentById(id, userId);
      
      // Check if file exists
      try {
        await fs.access(document.filePath);
      } catch {
        throw new Error('File not found on server');
      }

      return {
        filePath: document.filePath,
        fileName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize
      };
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocumentVersions(originalDocumentId: string, userId: string) {
    try {
      // First verify access to the original document
      await this.getDocumentById(originalDocumentId, userId);

      // Get all versions of this document (assuming we track versions by title or reference)
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { id: originalDocumentId },
            // Add logic here if you have a parent document relationship
          ],
          AND: {
            OR: [
              { uploadedById: userId },
              { client: { assignedLawyerId: userId } },
              { contract: { assignedLawyerId: userId } },
              { matter: { assignedLawyerId: userId } },
              { dispute: { assignedLawyerId: userId } },
              { uploadedBy: { role: { in: ['ADMIN', 'PARTNER'] } } }
            ]
          }
        },
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { version: 'desc' }
      });

      return documents.map(document => ({
        ...document,
        tags: JSON.parse(document.tags || '[]'),
      }));
    } catch (error) {
      console.error('Error fetching document versions:', error);
      throw new Error(`Failed to fetch document versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}