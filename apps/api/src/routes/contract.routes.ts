// Contract Management Routes
// Complete CRUD operations for contract management

import { Router } from 'express';
import { ContractService, createContractSchema, updateContractSchema, contractQuerySchema } from '../services/contract.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/contracts - List contracts with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const query = contractQuerySchema.parse(req.query);
    const userId = req.user!.id;
    
    const result = await ContractService.getContracts(query, userId);
    
    res.json({
      success: true,
      data: result.contracts,
      pagination: result.pagination,
      message: 'Contracts retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /contracts:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contracts'
    });
  }
});

// POST /api/v1/contracts - Create new contract
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const contractData = createContractSchema.parse(req.body);
    const userId = req.user!.id;
    
    const contract = await ContractService.createContract(contractData, userId);
    
    res.status(201).json({
      success: true,
      data: contract,
      message: 'Contract created successfully'
    });
  } catch (error) {
    console.error('Error in POST /contracts:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contract'
      });
    }
  }
});

// GET /api/v1/contracts/stats - Get contract statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;
    
    // If date parameters are provided, use stats with comparison
    if (startDate || endDate || compareStartDate || compareEndDate) {
      const options = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        compareStartDate: compareStartDate ? new Date(compareStartDate as string) : undefined,
        compareEndDate: compareEndDate ? new Date(compareEndDate as string) : undefined,
      };
      const stats = await ContractService.getContractStatsWithComparison(userId, options);
      res.json({
        success: true,
        data: stats,
        message: 'Contract statistics retrieved successfully'
      });
    } else {
      // Default stats without comparison
      const stats = await ContractService.getContractStatsWithComparison(userId);
      res.json({
        success: true,
        data: stats,
        message: 'Contract statistics retrieved successfully'
      });
    }
  } catch (error) {
    console.error('Error in GET /contracts/stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contract statistics'
    });
  }
});

// GET /api/v1/contracts/search - Search contracts
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
    
    const contracts = await ContractService.searchContracts(q, userId, searchLimit);
    
    res.json({
      success: true,
      data: contracts,
      message: `Found ${contracts.length} contracts matching "${q}"`
    });
  } catch (error) {
    console.error('Error in GET /contracts/search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

// GET /api/v1/contracts/:id - Get contract by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const contract = await ContractService.getContractById(id, userId);
    
    res.json({
      success: true,
      data: contract,
      message: 'Contract retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /contracts/:id:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Contract not found'
    });
  }
});

// PUT /api/v1/contracts/:id - Update contract
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateContractSchema.parse(req.body);
    const userId = req.user!.id;
    
    const contract = await ContractService.updateContract(id, updateData, userId);
    
    res.json({
      success: true,
      data: contract,
      message: 'Contract updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /contracts/:id:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contract'
      });
    }
  }
});

// PATCH /api/v1/contracts/:id/status - Update contract status
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'EXECUTED', 'TERMINATED', 'EXPIRED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    const userId = req.user!.id;
    const contract = await ContractService.updateContract(id, { status }, userId);
    
    res.json({
      success: true,
      data: contract,
      message: `Contract status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in PATCH /contracts/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contract status'
    });
  }
});

// DELETE /api/v1/contracts/:id - Delete contract
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await ContractService.deleteContract(id, userId);
    
    res.json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /contracts/:id:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contract'
    });
  }
});

// POST /api/v1/contracts/:id/duplicate - Duplicate contract
router.post('/:id/duplicate', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Get the original contract
    const originalContract = await ContractService.getContractById(id, userId);
    
    // Create new contract with copied data
    const duplicateData = {
      title: `${originalContract.title} (Copy)`,
      description: originalContract.description,
      type: originalContract.type,
      value: originalContract.value,
      currency: originalContract.currency,
      startDate: new Date().toISOString(),
      endDate: originalContract.endDate?.toISOString(),
      renewalTerms: originalContract.renewalTerms,
      riskLevel: originalContract.riskLevel,
      priority: originalContract.priority,
      tags: JSON.parse(originalContract.tags || '[]'),
      clientId: originalContract.clientId,
    };
    
    const duplicatedContract = await ContractService.createContract(duplicateData, userId);
    
    res.status(201).json({
      success: true,
      data: duplicatedContract,
      message: 'Contract duplicated successfully'
    });
  } catch (error) {
    console.error('Error in POST /contracts/:id/duplicate:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate contract'
    });
  }
});


export default router;