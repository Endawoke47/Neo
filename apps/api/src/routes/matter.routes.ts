// Matter Management Routes
// Complete CRUD operations for legal matter management

import { Router } from 'express';
import { MatterService, createMatterSchema, updateMatterSchema, matterQuerySchema } from '../services/matter.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/matters - List matters with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const query = matterQuerySchema.parse(req.query);
    const userId = req.user!.id;
    
    const result = await MatterService.getMatters(query, userId);
    
    res.json({
      success: true,
      data: result.matters,
      pagination: result.pagination,
      message: 'Matters retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /matters:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch matters'
    });
  }
});

// POST /api/v1/matters - Create new matter
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const matterData = createMatterSchema.parse(req.body);
    const userId = req.user!.id;
    
    const matter = await MatterService.createMatter(matterData, userId);
    
    res.status(201).json({
      success: true,
      data: matter,
      message: 'Matter created successfully'
    });
  } catch (error) {
    console.error('Error in POST /matters:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create matter'
      });
    }
  }
});

// GET /api/v1/matters/stats - Get matter statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = await MatterService.getMatterStats(userId);
    
    res.json({
      success: true,
      data: stats,
      message: 'Matter statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /matters/stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch matter statistics'
    });
  }
});

// GET /api/v1/matters/search - Search matters
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
    
    const matters = await MatterService.searchMatters(q, userId, searchLimit);
    
    res.json({
      success: true,
      data: matters,
      message: `Found ${matters.length} matters matching "${q}"`
    });
  } catch (error) {
    console.error('Error in GET /matters/search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

// GET /api/v1/matters/:id - Get matter by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const matter = await MatterService.getMatterById(id, userId);
    
    res.json({
      success: true,
      data: matter,
      message: 'Matter retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /matters/:id:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Matter not found'
    });
  }
});

// PUT /api/v1/matters/:id - Update matter
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateMatterSchema.parse(req.body);
    const userId = req.user!.id;
    
    const matter = await MatterService.updateMatter(id, updateData, userId);
    
    res.json({
      success: true,
      data: matter,
      message: 'Matter updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /matters/:id:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update matter'
      });
    }
  }
});

// PATCH /api/v1/matters/:id/status - Update matter status
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'UNDER_REVIEW', 'CLOSED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (OPEN, IN_PROGRESS, ON_HOLD, UNDER_REVIEW, CLOSED, COMPLETED)'
      });
    }
    
    const userId = req.user!.id;
    const matter = await MatterService.updateMatterStatus(id, status, userId);
    
    res.json({
      success: true,
      data: matter,
      message: `Matter status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in PATCH /matters/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update matter status'
    });
  }
});

// PATCH /api/v1/matters/:id/billable-hours - Update billable hours
router.patch('/:id/billable-hours', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { hours } = req.body;
    
    if (typeof hours !== 'number' || hours < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid hours (number >= 0) is required'
      });
    }
    
    const userId = req.user!.id;
    const matter = await MatterService.updateBillableHours(id, hours, userId);
    
    res.json({
      success: true,
      data: matter,
      message: `Billable hours updated to ${hours}`
    });
  } catch (error) {
    console.error('Error in PATCH /matters/:id/billable-hours:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update billable hours'
    });
  }
});

// PATCH /api/v1/matters/:id/assign-lawyer - Assign lawyer to matter
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
    const matter = await MatterService.assignLawyer(id, lawyerId, userId);
    
    res.json({
      success: true,
      data: matter,
      message: 'Lawyer assigned to matter successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /matters/:id/assign-lawyer:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign lawyer'
    });
  }
});

// DELETE /api/v1/matters/:id - Delete matter
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await MatterService.deleteMatter(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /matters/:id:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete matter'
    });
  }
});

export default router;
