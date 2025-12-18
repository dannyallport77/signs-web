'use client';

import { useState, useEffect } from 'react';

export default function TypewriterText() {
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 100);
    }, 50); // Speed of scrolling
    
    return () => clearInterval(interval);
  }, []);

  const text = "WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • ";
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ margin: '-20px' }}>
      <svg 
        viewBox="0 0 340 600" 
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Define the path that follows the phone border */}
          <path
            id="phonePath"
            d="M 50,48 
               L 290,48 
               Q 320,48 320,78
               L 320,522
               Q 320,552 290,552
               L 50,552
               Q 20,552 20,522
               L 20,78
               Q 20,48 50,48"
            fill="none"
          />
        </defs>
        
        {/* Animated text on path */}
        <text 
          className="fill-white font-black text-xl tracking-widest"
          style={{ 
            fontSize: '18px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <textPath 
            href="#phonePath" 
            startOffset={`${offset}%`}
          >
            {text}
          </textPath>
        </text>
        
        {/* Second text instance for seamless loop */}
        <text 
          className="fill-white font-black text-xl tracking-widest"
          style={{ 
            fontSize: '18px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <textPath 
            href="#phonePath" 
            startOffset={`${offset - 100}%`}
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
