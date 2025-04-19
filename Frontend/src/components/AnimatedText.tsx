
import React, { useState, useEffect, useRef } from 'react';

type AnimatedTextProps = {
  items: string[];
  interval?: number;
  className?: string;
};

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  items, 
  interval = 3000,
  className = "" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState(items[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const nextIndex = (currentIndex + 1) % items.length;
    
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(true);
      
      // After fade out, change text and fade in
      setTimeout(() => {
        setCurrentText(items[nextIndex]);
        setCurrentIndex(nextIndex);
        setIsAnimating(false);
      }, 500); // Half the animation time for fade out
      
    }, interval);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, items, interval]);

  return (
    <span 
      className={`inline-block transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'} ${className}`}
    >
      {currentText}
    </span>
  );
};

export default AnimatedText;
