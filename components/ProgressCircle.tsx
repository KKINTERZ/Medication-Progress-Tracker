import React from 'react';

interface ProgressCircleProps {
  percentage: number;
  isCompleted: boolean;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, isCompleted }) => {
  const radius = 50;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const progressColor = isCompleted ? 'stroke-brand-success-DEFAULT' : 'stroke-brand-gold-DEFAULT';

  return (
    <div className="relative w-32 h-32">
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 120 120"
        className="transform -rotate-90"
      >
        <circle
          className="text-brand-gray-200 dark:text-brand-gray-700"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx={radius + stroke}
          cy={radius + stroke}
        />
        <circle
          className={`transition-all duration-500 ease-in-out ${progressColor}`}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx={radius + stroke}
          cy={radius + stroke}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${isCompleted ? 'text-brand-success-dark dark:text-brand-success-light' : 'text-brand-gold-dark dark:text-brand-gold-light'}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressCircle;