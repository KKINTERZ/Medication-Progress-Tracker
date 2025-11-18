

import React, { useState, useEffect, useRef } from 'react';

const RealTimeClock: React.FC = () => {
  const [date, setDate] = useState(new Date());
  // FIX: Corrected the useRef initialization. When providing a type argument to useRef, an initial value must also be provided. Initializing with null is the correct approach here.
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setDate(new Date());
      animationFrameId.current = requestAnimationFrame(updateClock);
    };

    animationFrameId.current = requestAnimationFrame(updateClock);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const format = (num: number, length = 2) => num.toString().padStart(length, '0');

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const dateString = `${month} ${date.getDate()}, ${date.getFullYear()}`;
  
  const timeString = `${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`;
  const milliseconds = format(date.getMilliseconds(), 3);


  return (
    <div className="font-mono text-center">
      <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400 tracking-wider">
        {dayOfWeek}, {dateString}
      </div>
      <div className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200 tracking-widest">
        <span>{timeString}</span>
        <span className="text-brand-gold-dark dark:text-brand-gold-light">.{milliseconds}</span>
      </div>
    </div>
  );
};

export default RealTimeClock;