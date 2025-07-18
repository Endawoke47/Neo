/**
 * Command Palette Provider - A+++++ UI/UX Integration
 * Global provider for Cmd+K command palette functionality
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import CommandPalette from '../components/command-palette/CommandPalette';
import { useCommandPalette as useCommandPaletteHook } from '../hooks/use-command-palette';

interface CommandPaletteContextType {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePalette = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  useCommandPaletteHook({ onToggle: togglePalette });

  const value: CommandPaletteContextType = {
    isOpen,
    openPalette,
    closePalette,
    togglePalette,
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={closePalette} />
    </CommandPaletteContext.Provider>
  );
}