// Dispute Management Routes
// Complete CRUD operations for dispute/litigation management

import { Router } from 'express';
import { DisputeService, createDisputeSchema, updateDisputeSchema, disputeQuerySchema } from '../services/dispute.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/disputes - List disputes with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const query = disputeQuerySchema.parse(req.query);
    const userId = req.user!.id;
    
    const result = await DisputeService.getDisputes(query, userId);
    
    res.json({
      success: true,
      data: result.disputes,
      pagination: result.pagination,
      message: 'Disputes retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /disputes:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch disputes'
    });
  }
});

// POST /api/v1/disputes - Create new dispute
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const disputeData = createDisputeSchema.parse(req.body);
    const userId = req.user!.id;
    
    const dispute = await DisputeService.createDispute(disputeData, userId);
    
    res.status(201).json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully'
    });
  } catch (error) {
    console.error('Error in POST /disputes:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create dispute'
      });
    }
  }
});

// GET /api/v1/disputes/stats - Get dispute statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = await DisputeService.getDisputeStats(userId);
    
    res.json({
      success: true,
      data: stats,
      message: 'Dispute statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /disputes/stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dispute statistics'
    });
  }
});

// GET /api/v1/disputes/search - Search disputes
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
    
    const disputes = await DisputeService.searchDisputes(q, userId, searchLimit);
    
    res.json({
      success: true,
      data: disputes,
      message: `Found ${disputes.length} disputes matching "${q}"`
    });
  } catch (error) {
    console.error('Error in GET /disputes/search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

// GET /api/v1/disputes/:id - Get dispute by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const dispute = await DisputeService.getDisputeById(id, userId);
    
    res.json({
      success: true,
      data: dispute,
      message: 'Dispute retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /disputes/:id:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Dispute not found'
    });
  }
});

// PUT /api/v1/disputes/:id - Update dispute
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateDisputeSchema.parse(req.body);
    const userId = req.user!.id;
    
    const dispute = await DisputeService.updateDispute(id, updateData, userId);
    
    res.json({
      success: true,
      data: dispute,
      message: 'Dispute updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /disputes/:id:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update dispute'
      });
    }
  }
});

// PATCH /api/v1/disputes/:id/status - Update dispute status
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['OPEN', 'DISCOVERY', 'MEDIATION', 'ARBITRATION', 'TRIAL', 'APPEAL', 'SETTLED', 'DISMISSED', 'CLOSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (OPEN, DISCOVERY, MEDIATION, ARBITRATION, TRIAL, APPEAL, SETTLED, DISMISSED, CLOSED)'
      });
    }
    
    const userId = req.user!.id;
    const dispute = await DisputeService.updateDisputeStatus(id, status, userId);
    
    res.json({
      success: true,
      data: dispute,
      message: `Dispute status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in PATCH /disputes/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update dispute status'
    });
  }
});

// PATCH /api/v1/disputes/:id/deadlines - Update dispute deadlines
router.patch('/:id/deadlines', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { deadlines } = req.body;
    
    if (!Array.isArray(deadlines)) {
      return res.status(400).json({
        success: false,
        error: 'Deadlines must be an array'
      });
    }
    
    // Validate deadlines format
    const deadlineSchema = z.array(z.object({
      type: z.string(),
      date: z.string(),
      status: z.enum(['pending', 'completed', 'overdue'])
    }));
    
    const validatedDeadlines = deadlineSchema.parse(deadlines);
    
    const userId = req.user!.id;
    const dispute = await DisputeService.updateDeadlines(id, validatedDeadlines, userId);
    
    res.json({
      success: true,
      data: dispute,
      message: 'Dispute deadlines updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /disputes/:id/deadlines:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update deadlines'
      });
    }
  }
});

// PATCH /api/v1/disputes/:id/assign-lawyer - Assign lawyer to dispute
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
    const dispute = await DisputeService.assignLawyer(id, lawyerId, userId);
    
    res.json({
      success: true,
      data: dispute,
      message: 'Lawyer assigned to dispute successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /disputes/:id/assign-lawyer:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign lawyer'
    });
  }
});

// DELETE /api/v1/disputes/:id - Delete dispute
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await DisputeService.deleteDispute(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /disputes/:id:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete dispute'
    });
  }
});

export default router;
