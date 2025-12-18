'use client';

import { useState, useEffect, useRef } from 'react';

export default function TypewriterText() {
  const [path, setPath] = useState('');
  const [offset, setOffset] = useState(0);
  const pathRef = useRef<{ x: number; y: number; direction: number; points: string[] }>({
    x: 100,
    y: 100,
    direction: 0, // 0=right, 1=down, 2=left, 3=up
    points: ['M 100,100']
  });

  // Generate snake-like path with 90-degree turns
  useEffect(() => {
    const generatePath = () => {
      const state = pathRef.current;
      const stepSize = 150;
      const width = 1200;
      const height = 800;
      const margin = 50;
      
      // Possible 90-degree turns from current direction
      const turns: { [key: number]: number[] } = {
        0: [1, 3], // right can go down or up
        1: [0, 2], // down can go right or left
        2: [1, 3], // left can go down or up
        3: [0, 2], // up can go right or left
      };
      
      // Move in current direction
      let newX = state.x;
      let newY = state.y;
      
      switch (state.direction) {
        case 0: newX += stepSize; break; // right
        case 1: newY += stepSize; break; // down
        case 2: newX -= stepSize; break; // left
        case 3: newY -= stepSize; break; // up
      }
      
      // Check boundaries and force turn if needed
      let mustTurn = false;
      if (newX > width - margin || newX < margin || newY > height - margin || newY < margin) {
        mustTurn = true;
      }
      
      // Random chance to turn (30%) or forced turn at boundaries
      if (mustTurn || Math.random() < 0.3) {
        const possibleTurns = turns[state.direction];
        let validTurns = possibleTurns.filter(dir => {
          let testX = state.x;
          let testY = state.y;
          switch (dir) {
            case 0: testX += stepSize; break;
            case 1: testY += stepSize; break;
            case 2: testX -= stepSize; break;
            case 3: testY -= stepSize; break;
          }
          return testX > margin && testX < width - margin && testY > margin && testY < height - margin;
        });
        
        if (validTurns.length > 0) {
          state.direction = validTurns[Math.floor(Math.random() * validTurns.length)];
          // Recalculate position after turn
          switch (state.direction) {
            case 0: newX = state.x + stepSize; newY = state.y; break;
            case 1: newX = state.x; newY = state.y + stepSize; break;
            case 2: newX = state.x - stepSize; newY = state.y; break;
            case 3: newX = state.x; newY = state.y - stepSize; break;
          }
        }
      }
      
      // Clamp to boundaries
      newX = Math.max(margin, Math.min(width - margin, newX));
      newY = Math.max(margin, Math.min(height - margin, newY));
      
      state.x = newX;
      state.y = newY;
      state.points.push(`L ${newX},${newY}`);
      
      // Keep path length manageable (last 50 segments)
      if (state.points.length > 50) {
        state.points.shift();
        state.points[0] = `M ${state.points[0].split(' ')[1]}`;
      }
      
      setPath(state.points.join(' '));
    };

    // Generate initial path
    for (let i = 0; i < 30; i++) {
      generatePath();
    }
    
    // Continue generating path
    const pathInterval = setInterval(generatePath, 200);
    
    return () => clearInterval(pathInterval);
  }, []);

  // Animate text along path
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 0.15) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  const text = "WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  WE DO SOCIAL MEDIA  •  ";
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      <svg 
        viewBox="0 0 1200 800" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <defs>
          <path
            id="snakePath"
            d={path || 'M 100,100 L 300,100 L 300,300 L 500,300'}
            fill="none"
          />
        </defs>
        
        {/* Animated text on snake path */}
        <text 
          className="fill-white/70 font-bold uppercase"
          style={{ 
            fontSize: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.3em'
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
          className="fill-white/70 font-bold uppercase"
          style={{ 
            fontSize: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.3em'
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
