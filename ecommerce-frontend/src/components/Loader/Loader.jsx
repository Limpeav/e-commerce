import React from 'react';
import { Loader } from 'lucide-react';

const LoaderComponent = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className="relative inline-block">
          <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
          <Loader className={`text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse ${sizeClasses[size]}`} />
        </div>
        {message && (
          <p className="mt-4 text-gray-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoaderComponent;
