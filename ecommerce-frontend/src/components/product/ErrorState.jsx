import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center py-20">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-text-main mb-2">Something went wrong</h3>
        <p className="text-text-muted mb-6">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-text-main)] px-6 py-2 font-bold text-[var(--color-bg-base)] shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
