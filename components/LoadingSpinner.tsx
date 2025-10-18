
import React from 'react';

const LoadingSpinner: React.FC<{className?: string}> = ({className = 'w-8 h-8'}) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-t-4 border-stone-300 border-t-stone-600 ${className}`} role="status">
        <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
