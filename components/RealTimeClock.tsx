import React, { useState, useEffect } from 'react';

const RealTimeClock: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 50); // Update frequently to show running milliseconds

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
  };

  return (
    <div className="text-center">
      <div className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 whitespace-nowrap">
        {formatDate(currentDateTime)}
      </div>
      <div className="text-xs font-mono text-brand-gray-500 dark:text-brand-gray-400 tracking-wider">
        {formatTime(currentDateTime)}
      </div>
    </div>
  );
};

export default RealTimeClock;
