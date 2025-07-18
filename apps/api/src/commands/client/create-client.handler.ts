/**
 * Create Client Command Handler
 * A+++++ Architecture: Pure business logic orchestration
 */

import { ICommandHandler } from '../../core/command-bus';
import { CreateClientCommand, UpdateClientCommand, DeleteClientCommand, AssignClientToLawyerCommand } from './create-client.command';
import { policyService } from '../../core/policy.service';
import { prisma, QueryOptimizer } from '../../config/database';
import { logger, businessLogger } from '../../config/logger';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { InputValidator } from '../../config/secrets';

export class CreateClientHandler implements ICommandHandler<CreateClientCommand> {
  async execute(command: CreateClientCommand): Promise<{ clientId: string }> {
    const { name, email, clientType, phone, address, industry, notes, currentUserId } = command;

    // 1. Get user for authorization
    const user = await this.getUser(currentUserId);
    
    // 2. Authorization check using Policy Service
    await policyService.authorize(user, 'create', 'client');

    // 3. Business validation
    await this.validateClientData({ name, email, clientType, phone });

    // 4. Business logic execution with transaction
    const result = await QueryOptimizer.executeWithRetry(async (tx) => {
      // Check for duplicate email
      const existingClient = await tx.client.findUnique({
        where: { email }
      });

      if (existingClient) {
        throw new ValidationError(
          'Client with this email already exists',
          command.commandId,
          { email, existingClientId: existingClient.id }
        );
      }

      // Create the client
      const client = await tx.client.create({
        data: {
          name: InputValidator.sanitizeString(name),
          email: email.toLowerCase().trim(),
          clientType,
          phone: phone ? InputValidator.sanitizeString(phone) : null,
          address: address ? InputValidator.sanitizeString(address) : null,
          industry: industry ? InputValidator.sanitizeString(industry) : null,
          notes: notes ? InputValidator.sanitizeString(notes) : null,
          assignedLawyerId: currentUserId,
          isActive: true
        }
      });

      // Business event logging
      businessLogger.contractCreated(client.id, currentUserId, client.id);

      return { clientId: client.id };
    });

    logger.info('Client created successfully', {
      commandId: command.commandId,
      clientId: result.clientId,
      userId: currentUserId,
      clientType,
      businessEvent: 'client_created'
    });

    return result;
  }

  private async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        firm: true,
        specialization: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive) {
      throw new ValidationError('User account is inactive');
    }

    return user;
  }

  private async validateClientData(data: {
    name: string;
    email: string;
    clientType: string;
    phone?: string;
  }): Promise<void> {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Client name must be at least 2 characters');
    }

    // Email validation
    if (!InputValidator.validateEmail(data.email)) {
      errors.push('Invalid email address');
    }

    // Client type validation
    const validClientTypes = ['INDIVIDUAL', 'BUSINESS', 'ORGANIZATION'];
    if (!validClientTypes.includes(data.clientType)) {
      errors.push('Invalid client type');
    }

    // Phone validation (if provided)
    if (data.phone && !InputValidator.validatePhoneNumber(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'Client data validation failed',
        undefined,
        { validationErrors: errors }
      );
    }
  }
}

export class UpdateClientHandler implements ICommandHandler<UpdateClientCommand> {
  async execute(command: UpdateClientCommand): Promise<{ clientId: string }> {
    const { clientId, updates, currentUserId } = command;

    // Get user and existing client
    const user = await this.getUser(currentUserId);
    const existingClient = await this.getClient(clientId);

    // Authorization check
    await policyService.authorize(user, 'update', existingClient);

    // Validate updates
    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No updates provided');
    }

    // Execute update with transaction
    const result = await QueryOptimizer.executeWithRetry(async (tx) => {
      const sanitizedUpdates: any = {};
      
      if (updates.name) sanitizedUpdates.name = InputValidator.sanitizeString(updates.name);
      if (updates.email) sanitizedUpdates.email = updates.email.toLowerCase().trim();
      if (updates.phone) sanitizedUpdates.phone = InputValidator.sanitizeString(updates.phone);
      if (updates.address) sanitizedUpdates.address = InputValidator.sanitizeString(updates.address);
      if (updates.industry) sanitizedUpdates.industry = InputValidator.sanitizeString(updates.industry);
      if (updates.notes) sanitizedUpdates.notes = InputValidator.sanitizeString(updates.notes);
      if (updates.isActive !== undefined) sanitizedUpdates.isActive = updates.isActive;

      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: sanitizedUpdates
      });

      return { clientId: updatedClient.id };
    });

    logger.info('Client updated successfully', {
      commandId: command.commandId,
      clientId,
      userId: currentUserId,
      updatedFields: Object.keys(updates)
    });

    return result;
  }

  private async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        firm: true
      }
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    return user;
  }

  private async getClient(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }
}

export class DeleteClientHandler implements ICommandHandler<DeleteClientCommand> {
  async execute(command: DeleteClientCommand): Promise<{ success: boolean }> {
    const { clientId, currentUserId } = command;

    // Get user and client
    const user = await this.getUser(currentUserId);
    const client = await this.getClient(clientId);

    // Authorization check
    await policyService.authorize(user, 'delete', client);

    // Business rule: Check if client has active matters
    const activeMatterCount = await prisma.matter.count({
      where: {
        clientId,
        status: { in: ['ACTIVE', 'PENDING'] }
      }
    });

    if (activeMatterCount > 0) {
      throw new ValidationError(
        'Cannot delete client with active matters',
        command.commandId,
        { activeMatterCount }
      );
    }

    // Soft delete the client
    await QueryOptimizer.executeWithRetry(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: { isActive: false }
      });
    });

    logger.info('Client deleted (soft delete)', {
      commandId: command.commandId,
      clientId,
      userId: currentUserId
    });

    return { success: true };
  }

  private async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    return user;
  }

  private async getClient(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }
}

export class AssignClientToLawyerHandler implements ICommandHandler<AssignClientToLawyerCommand> {
  async execute(command: AssignClientToLawyerCommand): Promise<{ success: boolean }> {
    const { clientId, lawyerId, currentUserId } = command;

    // Get user, client, and target lawyer
    const user = await this.getUser(currentUserId);
    const client = await this.getClient(clientId);
    const targetLawyer = await this.getUser(lawyerId);

    // Authorization check
    await policyService.authorize(user, 'update', client);

    // Business validation: Target must be a lawyer
    if (!['ADMIN', 'PARTNER', 'ASSOCIATE'].includes(targetLawyer.role)) {
      throw new ValidationError('Target user must be a legal professional');
    }

    // Update assignment
    await QueryOptimizer.executeWithRetry(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: { assignedLawyerId: lawyerId }
      });
    });

    logger.info('Client reassigned to lawyer', {
      commandId: command.commandId,
      clientId,
      fromLawyerId: client.assignedLawyerId,
      toLawyerId: lawyerId,
      userId: currentUserId
    });

    return { success: true };
  }

  private async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    return user;
  }

  private async getClient(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }
}