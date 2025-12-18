'use client';

import { useState, useEffect } from 'react';

export default function TypewriterText() {
  const text = "WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • ";
  const [displayedChars, setDisplayedChars] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedChars(prev => {
        if (prev >= text.length) {
          return 0; // Reset to loop
        }
        return prev + 1;
      });
    }, 100); // Speed of typewriter effect
    
    return () => clearInterval(interval);
  }, []);

  // Create the circular text effect
  const fullText = text + text; // Double it for continuous loop appearance
  
  return (
    <>
      {/* Top text - left to right */}
      <div className="absolute -top-12 left-0 right-0 overflow-hidden pointer-events-none">
        <div className="text-4xl md:text-5xl font-black text-white whitespace-nowrap tracking-wider transition-all duration-300">
          <span className="inline-block">
            {fullText.slice(0, displayedChars)}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>
      
      {/* Bottom text - right to left */}
      <div className="absolute -bottom-12 left-0 right-0 overflow-hidden pointer-events-none">
        <div className="text-4xl md:text-5xl font-black text-white whitespace-nowrap tracking-wider text-right transition-all duration-300">
          <span className="inline-block">
            <span className="animate-pulse">|</span>
            {fullText.slice(0, displayedChars).split('').reverse().join('')}
          </span>
        </div>
      </div>
      
      {/* Left side text - vertical */}
      <div className="absolute -left-16 top-0 bottom-0 overflow-hidden pointer-events-none hidden lg:flex items-center">
        <div 
          className="text-4xl md:text-5xl font-black text-white whitespace-nowrap tracking-wider transition-all duration-300"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="inline-block">
            {fullText.slice(0, displayedChars)}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>
      
      {/* Right side text - vertical */}
      <div className="absolute -right-16 top-0 bottom-0 overflow-hidden pointer-events-none hidden lg:flex items-center">
        <div 
          className="text-4xl md:text-5xl font-black text-white whitespace-nowrap tracking-wider transition-all duration-300"
          style={{ writingMode: 'vertical-lr' }}
        >
          <span className="inline-block">
            {fullText.slice(0, displayedChars)}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>
    </>
  );
}
