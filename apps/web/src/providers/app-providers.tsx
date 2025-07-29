'use client';

import React from 'react';
import { AuthProvider } from './auth-provider';
import { AIProvider } from './ai-provider';
<<<<<<< HEAD
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
=======
import QueryProvider from './query-provider';
>>>>>>> 86de1ee (🚀 Complete Performance Optimization - Production Ready)

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AIProvider>
<<<<<<< HEAD
          <CommandPaletteProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </CommandPaletteProvider>
=======
          {children}
>>>>>>> 86de1ee (🚀 Complete Performance Optimization - Production Ready)
        </AIProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
