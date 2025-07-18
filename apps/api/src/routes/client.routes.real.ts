/**
 * Real Client Routes Implementation
 * Actual CRUD operations with proper validation and error handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ClientService } from '../services/client.service.real';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import { logger } from '../config/logger';

const router = Router();
const prisma = new PrismaClient();
const clientService = new ClientService(prisma);

// Create client
router.post('/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.createClient(req.body, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to create client', 500));
      }
    }
  }
);

// Get all clients with filtering and pagination
router.get('/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        clientType: req.query.clientType as any,
        industry: req.query.industry as string,
        sortBy: req.query.sortBy as any || 'name',
        sortOrder: req.query.sortOrder as any || 'asc',
      };

      const result = await clientService.getClients(query);
      
      res.json({
        success: true,
        data: result.clients,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          limit: query.limit,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to retrieve clients', 500));
      }
    }
  }
);

// Get client by ID
router.get('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.getClientById(req.params.id);
      
      if (!client) {
        return next(createError('Client not found', 404));
      }
      
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to retrieve client', 500));
      }
    }
  }
);

// Update client
router.put('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.updateClient(
        req.params.id,
        req.body,
        req.user!.id
      );
      
      res.json({
        success: true,
        data: client,
        message: 'Client updated successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Client not found') {
          next(createError(error.message, 404));
        } else {
          next(createError(error.message, 400));
        }
      } else {
        next(createError('Failed to update client', 500));
      }
    }
  }
);

// Delete client
router.delete('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await clientService.deleteClient(req.params.id, req.user!.id);
      
      res.json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Client not found') {
          next(createError(error.message, 404));
        } else {
          next(createError(error.message, 400));
        }
      } else {
        next(createError('Failed to delete client', 500));
      }
    }
  }
);

// Get client statistics
router.get('/stats/overview',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await clientService.getClientStatistics();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to retrieve client statistics', 500));
      }
    }
  }
);

// Search clients
router.get('/search/:term',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.params.term;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const clients = await clientService.searchClients(searchTerm, limit);
      
      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to search clients', 500));
      }
    }
  }
);

// Export specific client data
router.get('/:id/export',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.getClientById(req.params.id);
      
      if (!client) {
        return next(createError('Client not found', 404));
      }

      // Get related data for export
      const [matters, documents, contacts] = await Promise.all([
        prisma.matter.findMany({
          where: { clientId: client.id },
          include: { assignedTo: true },
        }),
        prisma.document.findMany({
          where: { clientId: client.id },
        }),
        prisma.contact.findMany({
          where: { clientId: client.id },
        }),
      ]);

      const exportData = {
        client,
        matters,
        documents,
        contacts,
        exportedAt: new Date().toISOString(),
        exportedBy: req.user!.email,
      };
      
      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to export client data', 500));
      }
    }
  }
);

// Bulk operations
router.post('/bulk/delete',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { clientIds } = req.body;
      
      if (!Array.isArray(clientIds) || clientIds.length === 0) {
        return next(createError('Client IDs array is required', 400));
      }

      const results = {
        deleted: [] as string[],
        failed: [] as { id: string; error: string }[],
      };

      for (const clientId of clientIds) {
        try {
          await clientService.deleteClient(clientId, req.user!.id);
          results.deleted.push(clientId);
        } catch (error) {
          results.failed.push({
            id: clientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      res.json({
        success: true,
        data: results,
        message: `Bulk delete completed: ${results.deleted.length} deleted, ${results.failed.length} failed`,
      });
    } catch (error) {
      next(createError('Bulk delete operation failed', 500));
    }
  }
);

// Client activity timeline
router.get('/:id/timeline',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const clientId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return next(createError('Client not found', 404));
      }

      // Get timeline activities
      const [matterActivities, documentActivities, contactActivities] = await Promise.all([
        prisma.matter.findMany({
          where: { clientId },
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            assignedTo: { select: { firstName: true, lastName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        }),
        prisma.document.findMany({
          where: { clientId },
          select: {
            id: true,
            title: true,
            createdAt: true,
            fileType: true,
            uploadedBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.contact.findMany({
          where: { clientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      // Combine and sort timeline
      const timeline = [
        ...matterActivities.map(matter => ({
          id: matter.id,
          type: 'matter',
          title: matter.title,
          description: `Matter ${matter.status}`,
          date: matter.updatedAt,
          user: matter.assignedTo ? `${matter.assignedTo.firstName} ${matter.assignedTo.lastName}` : null,
        })),
        ...documentActivities.map(doc => ({
          id: doc.id,
          type: 'document',
          title: doc.title,
          description: `Document uploaded (${doc.fileType})`,
          date: doc.createdAt,
          user: doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : null,
        })),
        ...contactActivities.map(contact => ({
          id: contact.id,
          type: 'contact',
          title: `${contact.firstName} ${contact.lastName}`,
          description: `Contact added (${contact.email})`,
          date: contact.createdAt,
          user: null,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      
      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(createError(error.message, 400));
      } else {
        next(createError('Failed to retrieve client timeline', 500));
      }
    }
  }
);

export default router;