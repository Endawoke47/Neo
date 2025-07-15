'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({ 
  message, 
  onRetry, 
  className = "" 
}: ErrorStateProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
        <span className="text-red-800 flex-grow">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800 text-sm transition-colors flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}