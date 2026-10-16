import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export function FlipFadeText({
  words = ["custom ER:LC bot", "live server monitor", "staff shift auditor", "911 dispatch terminal"],
  interval = 3200,
  className
}) {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setAnimating(false);
      }, 350);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span 
      className={cn(
        "inline-block transition-all duration-300 font-bold",
        animating ? "opacity-0 -translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100",
        className
      )}
      style={{
        color: '#2E90FA',
        textShadow: '0 0 25px rgba(46, 144, 250, 0.35)'
      }}
    >
      {words[index]}
    </span>
  );
}

export default FlipFadeText;
