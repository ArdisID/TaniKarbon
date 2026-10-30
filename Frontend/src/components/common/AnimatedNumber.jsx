import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber
 * Smoothly animates numbers with ease-out cubic curve (Dribbble/Linear style).
 */
export default function AnimatedNumber({ 
  value = 0, 
  duration = 750, 
  format = (val) => Math.round(val).toLocaleString('id-ID'),
  className = '' 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimestampRef = useRef(null);
  const startValRef = useRef(0);
  const targetValRef = useRef(value);

  useEffect(() => {
    startValRef.current = displayValue;
    targetValRef.current = Number(value) || 0;
    startTimestampRef.current = null;

    let frameId;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startValRef.current + (targetValRef.current - startValRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValRef.current);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {format(displayValue)}
    </span>
  );
}

