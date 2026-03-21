import React from 'react';
import { useDarkMode } from '../../hooks';

const LoaderComponent = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const [isDark] = useDarkMode();

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const containerClasses = fullScreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 ${
        isDark ? 'bg-slate-950/85' : 'bg-white/80'
      }`
    : 'flex flex-col items-center justify-center py-8 transition-colors duration-300';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`${sizeClasses[size]} relative font-sans`}>
        <div className={`absolute inset-0 rounded-full border-2 ${isDark ? 'border-slate-700' : 'border-indigo-100'}`}></div>
        <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-cyan-400' : 'border-indigo-600'}`}></div>
      </div>

      {message && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <p
            className={`font-bold tracking-wide text-sm bg-clip-text text-transparent ${
              isDark
                ? 'bg-gradient-to-r from-cyan-300 to-blue-400'
                : 'bg-gradient-to-r from-indigo-600 to-rose-500'
            }`}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoaderComponent;
