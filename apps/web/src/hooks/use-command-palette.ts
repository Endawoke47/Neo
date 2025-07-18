/**
 * Command Palette Hook - A+++++ UI/UX
 * Simple keyboard shortcut handler without external dependencies
 */

'use client';

import { useEffect } from 'react';

interface UseCommandPaletteProps {
  onToggle: () => void;
  enabled?: boolean;
}

export function useCommandPalette({ onToggle, enabled = true }: UseCommandPaletteProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (PC)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onToggle();
        return;
      }

      // Alternative: Cmd+Shift+P or Ctrl+Shift+P
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        onToggle();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggle, enabled]);
}