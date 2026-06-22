import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({
  size = 'medium',
  color = 'indigo', // Changed default to match brand color
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  return (
    <Loader2
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        animate-spin 
        ${className}
      `}
    />
  );
};

export default Spinner;
