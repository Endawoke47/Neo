/**
 * Command Palette Indicator - A+++++ UI/UX
 * Shows users how to access the command palette
 */

'use client';

import React from 'react';
import { Command } from 'lucide-react';
import { useCommandPalette } from '../../providers/command-palette-provider';

export function CommandPaletteIndicator() {
  const { openPalette } = useCommandPalette();

  return (
    <button
      onClick={openPalette}
      className="
        fixed bottom-4 right-4 z-40
        bg-primary-600 hover:bg-primary-700
        text-white p-3 rounded-full shadow-lg
        hover:shadow-xl hover:scale-105
        transition-all duration-200 ease-in-out
        group
      "
      title="Open Command Palette (Cmd+K)"
    >
      <Command className="w-5 h-5" />
      <div className="
        absolute bottom-full right-0 mb-2
        bg-gray-900 text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        whitespace-nowrap
      ">
        Press <kbd className="bg-gray-700 px-1 rounded">⌘K</kbd> or <kbd className="bg-gray-700 px-1 rounded">Ctrl+K</kbd>
      </div>
    </button>
  );
}

export function CommandPaletteHint() {
  return (
    <div className="
      fixed top-4 left-1/2 transform -translate-x-1/2 z-30
      bg-black/80 text-white text-sm px-4 py-2 rounded-full
      opacity-75 pointer-events-none
    ">
      Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">⌘K</kbd> for commands
    </div>
  );
}