import React from 'react';

const LoaderComponent = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-300'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Custom CSS Animated Loader */}
      <div className={`${sizeClasses[size]} relative font-sans`}>
        <div className="absolute inset-0 rounded-full border-2 border-indigo-100"></div>
        <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-[35%] bg-indigo-600 rounded-full animate-pulse"></div>
      </div>

      {/* Message */}
      {message && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-gray-600 font-bold tracking-wide text-sm bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoaderComponent;
