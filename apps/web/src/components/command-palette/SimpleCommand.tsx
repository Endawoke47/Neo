/**
 * Simple Command Component - A+++++ UI/UX
 * Lightweight command interface without external dependencies
 */

'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface CommandProps {
  className?: string;
  children: React.ReactNode;
}

interface CommandInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

interface CommandListProps {
  className?: string;
  children: React.ReactNode;
}

interface CommandGroupProps {
  heading?: string;
  children: React.ReactNode;
}

interface CommandItemProps {
  value: string;
  onSelect: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Command({ className = '', children }: CommandProps) {
  return (
    <div className={`command-root ${className}`}>
      {children}
    </div>
  );
}

export function CommandInput({ 
  value, 
  onValueChange, 
  placeholder, 
  className = '',
  autoFocus = false 
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function CommandList({ className = '', children }: CommandListProps) {
  return (
    <div className={`command-list ${className}`}>
      {children}
    </div>
  );
}

export function CommandGroup({ heading, children }: CommandGroupProps) {
  return (
    <div className="command-group">
      {heading && (
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
          {heading}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function CommandItem({ 
  value, 
  onSelect, 
  className = '',
  disabled = false,
  children 
}: CommandItemProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSelect();
    }
  };

  return (
    <div
      role="option"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`command-item ${className} ${disabled ? 'disabled' : ''}`}
      data-value={value}
    >
      {children}
    </div>
  );
}

// Export as nested object to match cmdk API
Command.Input = CommandInput;
Command.List = CommandList;
Command.Group = CommandGroup;
Command.Item = CommandItem;