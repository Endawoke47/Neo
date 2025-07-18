// App Providers
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './auth-provider';
import { AIProvider } from './ai-provider';
import { CommandPaletteProvider } from './command-palette-provider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in older versions)
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AIProvider>
          <CommandPaletteProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </CommandPaletteProvider>
        </AIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
