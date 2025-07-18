/**
 * Client Controller - A+++++ Architecture
 * Ultra-thin HTTP layer that only translates requests to commands
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { commandBus } from '../core/command-bus';
import { 
  CreateClientCommand, 
  UpdateClientCommand, 
  DeleteClientCommand,
  AssignClientToLawyerCommand
} from '../commands/client/create-client.command';
import { asyncHandler } from '../utils/errors';

export class ClientController {
  // Create client - Ultra thin: HTTP -> Command
  createClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, clientType, phone, address, industry, notes } = req.body;
    
    const command = new CreateClientCommand(
      name,
      email,
      clientType,
      phone,
      address,
      industry,
      notes,
      req.user!.id
    );

    const result = await commandBus.execute(command);

    res.status(201).json({
      success: true,
      data: result,
      commandId: command.commandId
    });
  });

  // Update client
  updateClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    const command = new UpdateClientCommand(id, updates, req.user!.id);
    const result = await commandBus.execute(command);

    res.json({
      success: true,
      data: result,
      commandId: command.commandId
    });
  });

  // Delete client
  deleteClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const command = new DeleteClientCommand(id, req.user!.id);
    const result = await commandBus.execute(command);

    res.json({
      success: true,
      data: result,
      commandId: command.commandId
    });
  });

  // Assign client to lawyer
  assignToLawyer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { lawyerId } = req.body;
    
    const command = new AssignClientToLawyerCommand(id, lawyerId, req.user!.id);
    const result = await commandBus.execute(command);

    res.json({
      success: true,
      data: result,
      commandId: command.commandId
    });
  });

  // Read operations (these can remain simple for now, but could be converted to queries)
  getClients = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // For now, keeping read operations simple
    // In a full CQRS implementation, these would use Query handlers
    const { page = 1, limit = 20, search, clientType, isActive } = req.query;
    
    // This would typically go through a Query handler in full CQRS
    // For now, we'll implement basic reading logic here
    res.json({
      success: true,
      message: 'Query operations to be implemented with Query handlers'
    });
  });

  getClient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Query handler would go here
    res.json({
      success: true,
      message: `Get client ${id} - Query handler to be implemented`
    });
  });
}