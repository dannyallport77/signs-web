'use client';

import { useState, useEffect } from 'react';

export default function TypewriterText() {
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 0.1) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  const text = "WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • WE DO SOCIAL MEDIA • ";
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      <svg 
        viewBox="0 0 1200 800" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <defs>
          {/* Snake path that winds across the page */}
          <path
            id="snakePath"
            d="M -100,100 
               Q 200,50 400,150
               T 800,100
               T 1200,200
               T 1000,350
               T 600,300
               T 200,400
               T 0,500
               T 400,550
               T 800,480
               T 1200,600
               T 900,700
               T 500,650
               T 100,750
               T -100,700"
            fill="none"
          />
        </defs>
        
        {/* Animated text on snake path */}
        <text 
          className="fill-white font-black uppercase"
          style={{ 
            fontSize: '48px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.1em'
          }}
        >
          <textPath 
            href="#snakePath" 
            startOffset={`${offset}%`}
          >
            {text}
          </textPath>
        </text>
        
        {/* Second text for seamless loop */}
        <text 
          className="fill-white font-black uppercase"
          style={{ 
            fontSize: '48px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.1em'
          }}
        >
          <textPath 
            href="#snakePath" 
            startOffset={`${offset - 100}%`}
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
