'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ScratchCardGameProps {
  result: string;
  resultEmoji: string;
  isWinner: boolean;
  onReveal: () => void;
}

export default function ScratchCardGame({ result, resultEmoji, isWinner, onReveal }: ScratchCardGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Fill with scratchable layer
      ctx.fillStyle = '#C0C0C0'; // Silver color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some texture/text
      ctx.font = '20px Arial';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getMousePos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || isRevealed) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getMousePos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    checkRevealProgress();
  };

  const checkRevealProgress = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Sample pixels to check how much is cleared
    // Optimization: check every 10th pixel
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4 * 10) {
      if (pixels[i + 3] === 0) {
        transparentPixels++;
      }
    }

    // If > 40% revealed, auto reveal the rest
    if (transparentPixels / (totalPixels / 10) > 0.4) {
      setIsRevealed(true);
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => {
        canvas.style.display = 'none';
        onReveal();
      }, 500);
    }
  };

  return (
    <div className="relative w-full max-w-sm aspect-[4/3] mx-auto bg-white rounded-xl shadow-xl overflow-hidden border-4 border-yellow-500">
      {/* Result Layer (Underneath) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">
          {resultEmoji}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {isWinner ? 'WINNER!' : 'Try Again'}
        </h3>
        <p className="text-yellow-300 font-medium text-lg">
          {result}
        </p>
      </div>

      {/* Scratch Layer (Canvas) */}
      <div ref={containerRef} className="absolute inset-0 cursor-pointer touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={(e: any) => scratch(e)}
          onTouchStart={() => setIsDrawing(true)}
          onTouchEnd={() => setIsDrawing(false)}
          onTouchMove={(e: any) => scratch(e)}
        />
      </div>
    </div>
  );
}
