'use client';

import { useState, useEffect } from 'react';

export default function TypewriterText() {
  const [offset, setOffset] = useState(0);

  // Smooth continuous animation
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Smooth increment based on time (pixels per millisecond)
      setOffset(prev => (prev + deltaTime * 0.005) % 100);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const text = "WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  ";
  
  // Pre-defined snake path with 90-degree turns
  const snakePath = `
    M -50,80 
    L 200,80 L 200,200 L 400,200 L 400,100 L 600,100 L 600,300 
    L 800,300 L 800,150 L 1000,150 L 1000,350 L 750,350 L 750,500 
    L 500,500 L 500,400 L 250,400 L 250,550 L 450,550 L 450,650 
    L 700,650 L 700,500 L 950,500 L 950,700 L 1100,700 L 1100,400 
    L 1250,400
  `;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden" 
      style={{ zIndex: 1 }}
    >
      <svg 
        viewBox="0 0 1200 800" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <defs>
          <path
            id="snakePath"
            d={snakePath}
            fill="none"
          />
        </defs>
        
        {/* Animated text on snake path */}
        <text 
          className="fill-white/50 font-bold uppercase"
          style={{ 
            fontSize: '22px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.25em'
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
          className="fill-white/50 font-bold uppercase"
          style={{ 
            fontSize: '22px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.25em'
          }}
        >
          <textPath 
            href="#snakePath" 
            startOffset={`${offset - 50}%`}
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
