import React from 'react';

const Loading = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 ${sizeClasses[size]}`}></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
