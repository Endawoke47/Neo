/**
 * Command Palette - A+++++ UI/UX
 * The ultimate tool for power users - every action accessible via Cmd+K
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Users, 
  Briefcase, 
  Scale,
  Settings, 
  BarChart,
  Brain,
  Download,
  Filter,
  Calendar,
  Bell,
  Shield,
  Zap,
  ChevronRight,
  Command as CommandIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Command } from './SimpleCommand';
import { toast } from '../../utils/toast';

// Command types for maximum capability exposure
interface CommandAction {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  category: CommandCategory;
  keywords: string[];
  action: () => void | Promise<void>;
  shortcut?: string;
  disabled?: boolean;
  badge?: string;
  priority?: number;
}

enum CommandCategory {
  NAVIGATION = 'Navigation',
  CREATE = 'Create',
  AI = 'AI Actions',
  SEARCH = 'Search & Filter',
  EXPORT = 'Export & Reports',
  SETTINGS = 'Settings',
  ADMIN = 'Administration'
}

interface CommandPaletteProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | null>(null);
  const router = useRouter();

  // Define all available commands
  const commands: CommandAction[] = useMemo(() => [
    // Navigation Commands
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Main overview and metrics',
      icon: BarChart,
      category: CommandCategory.NAVIGATION,
      keywords: ['dashboard', 'home', 'overview', 'metrics'],
      action: () => router.push('/dashboard'),
      shortcut: 'G D',
      priority: 10
    },
    {
      id: 'nav-clients',
      title: 'Go to Client Management',
      description: 'Manage client relationships',
      icon: Users,
      category: CommandCategory.NAVIGATION,
      keywords: ['clients', 'customers', 'relationships'],
      action: () => router.push('/client-management'),
      shortcut: 'G C',
      priority: 9
    },
    {
      id: 'nav-matters',
      title: 'Go to Matter Management',
      description: 'Legal matters and cases',
      icon: Briefcase,
      category: CommandCategory.NAVIGATION,
      keywords: ['matters', 'cases', 'legal'],
      action: () => router.push('/matter-management'),
      shortcut: 'G M',
      priority: 9
    },
    {
      id: 'nav-contracts',
      title: 'Go to Contract Management',
      description: 'Contract lifecycle management',
      icon: FileText,
      category: CommandCategory.NAVIGATION,
      keywords: ['contracts', 'agreements', 'documents'],
      action: () => router.push('/contract-management'),
      shortcut: 'G O',
      priority: 8
    },
    {
      id: 'nav-disputes',
      title: 'Go to Dispute Management',
      description: 'Litigation and dispute resolution',
      icon: Scale,
      category: CommandCategory.NAVIGATION,
      keywords: ['disputes', 'litigation', 'resolution'],
      action: () => router.push('/dispute-management'),
      shortcut: 'G L',
      priority: 7
    },

    // Creation Commands
    {
      id: 'create-client',
      title: 'Add New Client',
      description: 'Create a new client record',
      icon: Plus,
      category: CommandCategory.CREATE,
      keywords: ['new', 'client', 'add', 'create'],
      action: () => {
        router.push('/client-management');
        // This would open the new client modal
        toast.success('Opening new client form...');
      },
      shortcut: 'N C',
      priority: 9
    },
    {
      id: 'create-matter',
      title: 'Create New Matter',
      description: 'Start a new legal matter',
      icon: Plus,
      category: CommandCategory.CREATE,
      keywords: ['new', 'matter', 'case', 'create'],
      action: () => {
        router.push('/matter-management');
        toast.success('Opening new matter form...');
      },
      shortcut: 'N M',
      priority: 9
    },
    {
      id: 'create-contract',
      title: 'Create New Contract',
      description: 'Draft a new contract',
      icon: Plus,
      category: CommandCategory.CREATE,
      keywords: ['new', 'contract', 'agreement', 'create'],
      action: () => {
        router.push('/contract-management');
        toast.success('Opening contract creation...');
      },
      shortcut: 'N O',
      priority: 8
    },

    // AI Actions (The Crown Jewel)
    {
      id: 'ai-analyze-contract',
      title: 'Analyze Contract with AI',
      description: 'AI-powered contract risk analysis',
      icon: Brain,
      category: CommandCategory.AI,
      keywords: ['ai', 'analyze', 'contract', 'risk', 'intelligence'],
      action: async () => {
        toast.loading('Starting AI contract analysis...');
        // This would open the AI analysis modal
        router.push('/contract-management?action=ai-analyze');
      },
      badge: 'AI',
      priority: 10
    },
    {
      id: 'ai-legal-research',
      title: 'Start Legal Research',
      description: 'AI-powered legal research across 71 jurisdictions',
      icon: Brain,
      category: CommandCategory.AI,
      keywords: ['ai', 'research', 'legal', 'jurisdiction', 'precedent'],
      action: async () => {
        toast.loading('Initializing legal research AI...');
        // Navigate to legal research interface
        router.push('/legal-research');
      },
      badge: 'AI',
      priority: 10
    },
    {
      id: 'ai-risk-assessment',
      title: 'AI Risk Assessment',
      description: 'Comprehensive risk analysis',
      icon: Shield,
      category: CommandCategory.AI,
      keywords: ['ai', 'risk', 'assessment', 'analysis'],
      action: async () => {
        toast.loading('Starting risk assessment...');
        router.push('/risk-management?action=ai-assess');
      },
      badge: 'AI',
      priority: 9
    },
    {
      id: 'ai-document-automation',
      title: 'Generate Document with AI',
      description: 'Auto-generate legal documents',
      icon: Zap,
      category: CommandCategory.AI,
      keywords: ['ai', 'generate', 'document', 'automation'],
      action: async () => {
        toast.loading('Opening document automation...');
        router.push('/document-automation');
      },
      badge: 'AI',
      priority: 9
    },

    // Search & Filter Commands
    {
      id: 'search-clients',
      title: 'Search Clients',
      description: 'Find clients by name, email, or type',
      icon: Search,
      category: CommandCategory.SEARCH,
      keywords: ['search', 'find', 'client', 'filter'],
      action: () => {
        router.push('/client-management');
        toast.success('Opening client search...');
      }
    },
    {
      id: 'filter-matters-active',
      title: 'Filter Active Matters',
      description: 'Show only active legal matters',
      icon: Filter,
      category: CommandCategory.SEARCH,
      keywords: ['filter', 'active', 'matters', 'status'],
      action: () => {
        router.push('/matter-management?filter=active');
        toast.success('Filtering active matters...');
      }
    },
    {
      id: 'search-contracts-expiring',
      title: 'Find Expiring Contracts',
      description: 'Contracts expiring in next 30 days',
      icon: Calendar,
      category: CommandCategory.SEARCH,
      keywords: ['expiring', 'contracts', 'calendar', 'deadline'],
      action: () => {
        router.push('/contract-management?filter=expiring');
        toast.success('Finding expiring contracts...');
      }
    },

    // Export & Reports
    {
      id: 'export-client-report',
      title: 'Export Client Report',
      description: 'Generate comprehensive client report',
      icon: Download,
      category: CommandCategory.EXPORT,
      keywords: ['export', 'report', 'client', 'download'],
      action: async () => {
        toast.loading('Generating client report...');
        // Simulate report generation
        setTimeout(() => {
          toast.success('Report exported successfully!');
        }, 2000);
      }
    },
    {
      id: 'export-matter-analytics',
      title: 'Export Matter Analytics',
      description: 'Detailed matter performance metrics',
      icon: BarChart,
      category: CommandCategory.EXPORT,
      keywords: ['export', 'analytics', 'matter', 'metrics'],
      action: async () => {
        toast.loading('Compiling analytics...');
        setTimeout(() => {
          toast.success('Analytics exported!');
        }, 2000);
      }
    },

    // Settings & Admin
    {
      id: 'settings-profile',
      title: 'Edit Profile Settings',
      description: 'Update your profile information',
      icon: Settings,
      category: CommandCategory.SETTINGS,
      keywords: ['settings', 'profile', 'account', 'preferences'],
      action: () => router.push('/settings'),
      shortcut: 'S P'
    },
    {
      id: 'settings-notifications',
      title: 'Notification Settings',
      description: 'Configure alerts and notifications',
      icon: Bell,
      category: CommandCategory.SETTINGS,
      keywords: ['notifications', 'alerts', 'settings'],
      action: () => router.push('/settings?tab=notifications')
    },
    {
      id: 'admin-users',
      title: 'Manage Users',
      description: 'User administration and permissions',
      icon: Shield,
      category: CommandCategory.ADMIN,
      keywords: ['admin', 'users', 'permissions', 'manage'],
      action: () => router.push('/admin/users'),
      disabled: false // Would check user permissions
    }
  ], [router]);

  // Filter commands based on search and category
  const filteredCommands = useMemo(() => {
    let filtered = commands;

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(cmd => cmd.category === selectedCategory);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(cmd => 
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    // Sort by priority and relevance
    return filtered.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // If search term, sort by relevance
      if (search) {
        const searchLower = search.toLowerCase();
        
        const getRelevance = (title: string) => {
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.startsWith(searchLower)) return 2;
          if (lowerTitle.includes(searchLower)) return 1;
          return 0;
        };
        
        const aRelevance = getRelevance(a.title);
        const bRelevance = getRelevance(b.title);
        return bRelevance - aRelevance;
      }
      
      return a.title.localeCompare(b.title);
    });
  }, [commands, search, selectedCategory]);

  // Group commands by category for display
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);

  // Handle command execution
  const executeCommand = useCallback(async (command: CommandAction) => {
    if (command.disabled) return;
    
    onClose();
    setSearch('');
    setSelectedCategory(null);
    
    try {
      await command.action();
    } catch (error) {
      toast.error('Failed to execute command');
      console.error('Command execution error:', error);
    }
  }, [onClose]);

  // Keyboard shortcuts are handled by the CommandPaletteProvider

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-16">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border overflow-hidden">
          <Command className="relative">
            {/* Header with search */}
            <div className="flex items-center border-b px-4 py-3">
              <CommandIcon className="w-5 h-5 text-gray-400 mr-3" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="flex-1 outline-none text-lg placeholder-gray-400"
                autoFocus
              />
              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                ESC
              </div>
            </div>

            {/* Category filters */}
            {!search && (
              <div className="border-b px-4 py-2">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      !selectedCategory
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  {Object.values(CommandCategory).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Commands list */}
            <Command.List className="max-h-96 overflow-y-auto">
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <Command.Group key={category} heading={category}>
                    {categoryCommands.map(command => (
                      <Command.Item
                        key={command.id}
                        value={`${command.title} ${command.keywords.join(' ')}`}
                        onSelect={() => executeCommand(command)}
                        className={`flex items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                          command.disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={command.disabled}
                      >
                        <command.icon className="w-5 h-5 mr-3 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {command.title}
                            </span>
                            {command.badge && (
                              <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                                {command.badge}
                              </span>
                            )}
                          </div>
                          {command.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {command.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {command.shortcut && (
                            <div className="flex gap-1">
                              {command.shortcut.split(' ').map((key) => (
                                <kbd
                                  key={`${command.id}-${key}`}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))
              )}
            </Command.List>

            {/* Footer with shortcuts help */}
            <div className="border-t px-4 py-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white rounded border">↑</kbd>
                    {' '}
                    <kbd className="px-1 py-0.5 bg-white rounded border">↓</kbd>
                    {' '}
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd>
                    {' '}
                    to select
                  </span>
                </div>
                <span>
                  {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </Command>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;