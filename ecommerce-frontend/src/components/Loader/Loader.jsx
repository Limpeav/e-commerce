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
      wrap: 'gap-3',
      ring: 'h-10 w-10 border-[3px]',
      dot: 'h-1.5 w-1.5',
    },
    medium: {
      wrap: 'gap-3.5',
      ring: 'h-12 w-12 border-[3px]',
      dot: 'h-2 w-2',
    },
    large: {
      wrap: 'gap-4',
      ring: 'h-16 w-16 border-4',
      dot: 'h-2.5 w-2.5',
    },
    xl: {
      wrap: 'gap-5',
      ring: 'h-20 w-20 border-4',
      dot: 'h-3 w-3',
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
      <div className={`flex flex-col items-center ${currentSize.wrap}`}>
        <div
          className={`rounded-full animate-spin ${currentSize.ring} ${
            isDark
              ? 'border-[var(--color-border)] border-t-[var(--color-primary)]'
              : 'border-[var(--color-border)] border-t-[var(--color-primary-dark)]'
          }`}
        />

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`${currentSize.dot} rounded-full animate-pulse ${
                isDark ? 'bg-[var(--color-primary)]/80' : 'bg-[var(--color-primary-dark)]/80'
              }`}
              style={{ animationDelay: `${index * 0.18}s` }}
            />
          ))}
        </div>
      </div>

      {message && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <p
            className={`text-sm font-semibold tracking-[0.18em] uppercase ${
              isDark ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary-dark)]'
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
