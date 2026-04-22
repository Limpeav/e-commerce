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
    small: {
      orb: 'h-16 w-16',
      ring: 'border-[3px]',
      core: 'h-6 w-6',
      dot: 'h-2 w-2',
    },
    medium: {
      orb: 'h-20 w-20',
      ring: 'border-[3px]',
      core: 'h-8 w-8',
      dot: 'h-2.5 w-2.5',
    },
    large: {
      orb: 'h-28 w-28',
      ring: 'border-4',
      core: 'h-10 w-10',
      dot: 'h-3 w-3',
    },
    xl: {
      orb: 'h-36 w-36',
      ring: 'border-4',
      core: 'h-14 w-14',
      dot: 'h-3.5 w-3.5',
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.medium;

  const containerClasses = fullScreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 ${
        isDark ? 'bg-slate-950/85' : 'bg-white/80'
      }`
    : 'flex flex-col items-center justify-center py-8 transition-colors duration-300';

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite">
      <div
        className={`relative flex items-center justify-center rounded-full ${currentSize.orb} ${
          isDark
            ? 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(15,23,42,0.05)_55%,_transparent_75%)]'
            : 'bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_rgba(255,255,255,0.2)_55%,_transparent_78%)]'
        }`}
      >
        <div
          className={`absolute inset-0 rounded-full ${currentSize.ring} animate-spin ${
            isDark ? 'border-slate-700/70 border-t-cyan-400' : 'border-indigo-100 border-t-indigo-600'
          }`}
        />
        <div
          className={`absolute inset-[16%] rounded-full ${currentSize.ring} animate-pulse ${
            isDark ? 'border-cyan-400/20' : 'border-rose-200'
          }`}
        />
        <div
          className={`relative rounded-full animate-pulse ${currentSize.core} ${
            isDark
              ? 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_40px_rgba(34,211,238,0.35)]'
              : 'bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 shadow-[0_0_40px_rgba(99,102,241,0.28)]'
          }`}
        />
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
          <div className="flex items-center gap-2 pt-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`${currentSize.dot} rounded-full animate-bounce ${
                  isDark ? 'bg-cyan-300/80' : 'bg-indigo-500/80'
                }`}
                style={{ animationDelay: `${index * 0.12}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoaderComponent;
