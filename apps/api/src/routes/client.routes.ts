// Client Management Routes
// Complete CRUD operations for client management

import { Router } from 'express';
import { ClientService, createClientSchema, updateClientSchema, clientQuerySchema } from '../services/client.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/clients - List clients with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const query = clientQuerySchema.parse(req.query);
    const userId = req.user!.id;
    
    const result = await ClientService.getClients(query, userId);
    
    res.json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
      message: 'Clients retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /clients:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients'
    });
  }
});

// POST /api/v1/clients - Create new client
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const clientData = createClientSchema.parse(req.body);
    const userId = req.user!.id;
    
    const client = await ClientService.createClient(clientData, userId);
    
    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error in POST /clients:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client'
      });
    }
  }
});

// GET /api/v1/clients/stats - Get client statistics with optional date range for comparisons
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;
    
    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      compareStartDate: compareStartDate ? new Date(compareStartDate as string) : undefined,
      compareEndDate: compareEndDate ? new Date(compareEndDate as string) : undefined,
    };
    
    const stats = await ClientService.getClientStatsWithComparison(userId, options);
    
    res.json({
      success: true,
      data: stats,
      message: 'Client statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /clients/stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch client statistics'
    });
  }
});

// GET /api/v1/clients/search - Search clients
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }
    
    const userId = req.user!.id;
    const searchLimit = limit ? parseInt(limit as string) : 10;
    
    const clients = await ClientService.searchClients(q, userId, searchLimit);
    
    res.json({
      success: true,
      data: clients,
      message: `Found ${clients.length} clients matching "${q}"`
    });
  } catch (error) {
    console.error('Error in GET /clients/search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

// GET /api/v1/clients/:id - Get client by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const client = await ClientService.getClientById(id, userId);
    
    res.json({
      success: true,
      data: client,
      message: 'Client retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /clients/:id:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Client not found'
    });
  }
});

// PUT /api/v1/clients/:id - Update client
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateClientSchema.parse(req.body);
    const userId = req.user!.id;
    
    const client = await ClientService.updateClient(id, updateData, userId);
    
    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /clients/:id:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update client'
      });
    }
  }
});

// PATCH /api/v1/clients/:id/status - Update client status
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['ACTIVE', 'INACTIVE', 'PROSPECT'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (ACTIVE, INACTIVE, or PROSPECT)'
      });
    }
    
    const userId = req.user!.id;
    const client = await ClientService.updateClientStatus(id, status, userId);
    
    res.json({
      success: true,
      data: client,
      message: `Client status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in PATCH /clients/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client status'
    });
  }
});

// PATCH /api/v1/clients/:id/assign-lawyer - Assign lawyer to client
router.patch('/:id/assign-lawyer', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { lawyerId } = req.body;
    
    if (!lawyerId || typeof lawyerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Lawyer ID is required'
      });
    }
    
    const userId = req.user!.id;
    const client = await ClientService.assignLawyer(id, lawyerId, userId);
    
    res.json({
      success: true,
      data: client,
      message: 'Lawyer assigned to client successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /clients/:id/assign-lawyer:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign lawyer'
    });
  }
});

// DELETE /api/v1/clients/:id - Delete client
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await ClientService.deleteClient(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /clients/:id:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client'
    });
  }
});

// POST /api/v1/clients/bulk - Bulk import clients
router.post('/bulk', async (req: AuthenticatedRequest, res) => {
  try {
    const { clients } = req.body;
    
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Clients array is required and must not be empty'
      });
    }
    
    const userId = req.user!.id;
    const result = await ClientService.bulkCreateClients(clients, userId);
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully imported ${result.successful.length} clients. ${result.failed.length} failed.`
    });
  } catch (error) {
    console.error('Error in POST /clients/bulk:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk import clients'
    });
  }
});

export default router;
