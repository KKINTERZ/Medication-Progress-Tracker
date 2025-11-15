import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  return (
    <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5 my-2">
      <div 
        className="bg-gradient-to-r from-brand-gold-light to-brand-gold-dark h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;