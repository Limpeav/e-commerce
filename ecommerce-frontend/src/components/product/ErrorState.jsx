import React from 'react';
import { Zap } from 'lucide-react';

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
          onClick={onRetry}
          className="px-6 py-2 bg-text-main text-white rounded-full font-bold hover:bg-stone-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
