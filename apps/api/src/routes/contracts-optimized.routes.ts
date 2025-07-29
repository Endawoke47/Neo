import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { BaseRoutes } from './base.routes';
import { apiRateLimit } from '../middleware/global.middleware';
import { logger } from '../config/logger';
import { cacheable } from '../services/cache-optimized.service';

// Mock contract service (replace with actual service)
class ContractService {
  @cacheable(300, 'contracts') // Cache for 5 minutes
  async getContracts(filters: any) {
    // Mock implementation - replace with actual database queries
    return {
      contracts: [
        {
          id: '1',
          title: 'Service Agreement',
          status: 'Active',
          value: 50000,
          createdAt: new Date().toISOString()
        }
      ],
      total: 1
    };
  }

  @cacheable(600, 'contracts') // Cache for 10 minutes
  async getContractById(id: string) {
    return {
      id,
      title: 'Service Agreement',
      status: 'Active',
      value: 50000,
      createdAt: new Date().toISOString()
    };
  }

  async createContract(data: any) {
    // Clear cache when creating
    const { optimizedCache } = await import('../services/cache-optimized.service');
    optimizedCache.clear('contracts');
    
    return {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
  }

  async updateContract(id: string, data: any) {
    // Clear cache when updating
    const { optimizedCache } = await import('../services/cache-optimized.service');
    optimizedCache.clear('contracts');
    
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString()
    };
  }

  async deleteContract(id: string) {
    // Clear cache when deleting
    const { optimizedCache } = await import('../services/cache-optimized.service');
    optimizedCache.clear('contracts');
    
    return { message: 'Contract deleted successfully' };
  }
}

class ContractsRoutes extends BaseRoutes {
  private contractService: ContractService;

  constructor() {
    super('/contracts');
    this.contractService = new ContractService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET /contracts - List all contracts with pagination
    this.addRoute({
      path: '/',
      method: 'get',
      handler: this.getContracts,
      cache: { ttl: 300, prefix: 'contracts' }, // 5 minutes cache
      validation: [
        ...BaseRoutes.validationRules.pagination,
        BaseRoutes.validationRules.search,
        query('status').optional().isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
        query('clientId').optional().isString().trim()
      ],
      rateLimit: apiRateLimit
    });

    // GET /contracts/:id - Get contract by ID
    this.addRoute({
      path: '/:id',
      method: 'get',
      handler: this.getContractById,
      cache: { ttl: 600, prefix: 'contracts' }, // 10 minutes cache
      validation: [BaseRoutes.validationRules.id],
      rateLimit: apiRateLimit
    });

    // POST /contracts - Create new contract
    this.addRoute({
      path: '/',
      method: 'post',
      handler: this.createContract,
      validation: [
        body('title').isString().trim().isLength({ min: 1, max: 200 }),
        body('description').optional().isString().trim().isLength({ max: 1000 }),
        body('type').isString().trim().isLength({ min: 1, max: 50 }),
        body('clientId').isString().trim(),
        body('value').optional().isNumeric(),
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601()
      ],
      rateLimit: apiRateLimit
    });

    // PUT /contracts/:id - Update contract
    this.addRoute({
      path: '/:id',
      method: 'put',
      handler: this.updateContract,
      validation: [
        BaseRoutes.validationRules.id,
        body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
        body('description').optional().isString().trim().isLength({ max: 1000 }),
        body('status').optional().isIn(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
        body('value').optional().isNumeric(),
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601()
      ],
      rateLimit: apiRateLimit
    });

    // DELETE /contracts/:id - Delete contract
    this.addRoute({
      path: '/:id',
      method: 'delete',
      handler: this.deleteContract,
      validation: [BaseRoutes.validationRules.id],
      rateLimit: apiRateLimit
    });

    // GET /contracts/:id/documents - Get contract documents
    this.addRoute({
      path: '/:id/documents',
      method: 'get',
      handler: this.getContractDocuments,
      cache: { ttl: 300, prefix: 'contract-docs' },
      validation: [BaseRoutes.validationRules.id],
      rateLimit: apiRateLimit
    });
  }

  private getContracts = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const clientId = req.query.clientId as string;

      const filters = { search, status, clientId, page, limit };
      const result = await this.contractService.getContracts(filters);

      this.sendPaginated(res, result.contracts, result.total, page, limit);
    } catch (error) {
      this.sendError(res, 'Failed to fetch contracts', 500, error);
    }
  };

  private getContractById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const contract = await this.contractService.getContractById(id);

      if (!contract) {
        return this.sendError(res, 'Contract not found', 404);
      }

      this.sendSuccess(res, contract);
    } catch (error) {
      this.sendError(res, 'Failed to fetch contract', 500, error);
    }
  };

  private createContract = async (req: Request, res: Response) => {
    try {
      const contractData = {
        ...req.body,
        assignedLawyerId: req.user?.id // From auth middleware
      };

      const contract = await this.contractService.createContract(contractData);

      logger.info('Contract created', {
        contractId: contract.id,
        userId: req.user?.id,
        title: contract.title
      });

      this.sendSuccess(res, contract, 'Contract created successfully', 201);
    } catch (error) {
      this.sendError(res, 'Failed to create contract', 500, error);
    }
  };

  private updateContract = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const contract = await this.contractService.updateContract(id, updateData);

      logger.info('Contract updated', {
        contractId: id,
        userId: req.user?.id,
        changes: Object.keys(updateData)
      });

      this.sendSuccess(res, contract, 'Contract updated successfully');
    } catch (error) {
      this.sendError(res, 'Failed to update contract', 500, error);
    }
  };

  private deleteContract = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await this.contractService.deleteContract(id);

      logger.info('Contract deleted', {
        contractId: id,
        userId: req.user?.id
      });

      this.sendSuccess(res, null, 'Contract deleted successfully');
    } catch (error) {
      this.sendError(res, 'Failed to delete contract', 500, error);
    }
  };

  private getContractDocuments = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mock implementation - replace with actual service
      const documents = [
        {
          id: '1',
          name: 'Contract Terms.pdf',
          type: 'PDF',
          size: 1024000,
          uploadedAt: new Date().toISOString()
        }
      ];

      this.sendSuccess(res, documents);
    } catch (error) {
      this.sendError(res, 'Failed to fetch contract documents', 500, error);
    }
  };
}

export default new ContractsRoutes().getRouter();