/**
 * Create Client Command
 * A+++++ Architecture: Pure business intention as data
 */

import { BaseCommand } from '../../core/command-bus';

export class CreateClientCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly clientType: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly industry?: string,
    public readonly notes?: string,
    currentUserId: string
  ) {
    super(currentUserId);
  }
}

export class UpdateClientCommand extends BaseCommand {
  constructor(
    public readonly clientId: string,
    public readonly updates: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      industry?: string;
      notes?: string;
      isActive?: boolean;
    },
    currentUserId: string
  ) {
    super(currentUserId);
  }
}

export class DeleteClientCommand extends BaseCommand {
  constructor(
    public readonly clientId: string,
    currentUserId: string
  ) {
    super(currentUserId);
  }
}

export class AssignClientToLawyerCommand extends BaseCommand {
  constructor(
    public readonly clientId: string,
    public readonly lawyerId: string,
    currentUserId: string
  ) {
    super(currentUserId);
  }
}