'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FruitMachineGameProps {
  onSpinFinish: () => void;
  giftEmoji: string;
}

const ICONS = ['🎁', '💰', '⭐', '🏆', '🎉', '💎', '🎊', '🍀'];

export default function FruitMachineGame({ onSpinFinish, giftEmoji }: FruitMachineGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [slots, setSlots] = useState([ICONS[0], ICONS[1], ICONS[2]]);
  
  // Use refs to manage intervals without re-renders
  const intervals = useRef<NodeJS.Timeout[]>([]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Clear any existing intervals
    intervals.current.forEach(clearInterval);
    intervals.current = [];

    // Start spinning each slot
    const newIntervals: NodeJS.Timeout[] = [];
    
    // Slot 1
    newIntervals.push(setInterval(() => {
      setSlots(prev => [ICONS[Math.floor(Math.random() * ICONS.length)], prev[1], prev[2]]);
    }, 100));

    // Slot 2
    newIntervals.push(setInterval(() => {
      setSlots(prev => [prev[0], ICONS[Math.floor(Math.random() * ICONS.length)], prev[2]]);
    }, 100));

    // Slot 3
    newIntervals.push(setInterval(() => {
      setSlots(prev => [prev[0], prev[1], ICONS[Math.floor(Math.random() * ICONS.length)]]);
    }, 100));

    intervals.current = newIntervals;

    // Stop slots one by one
    setTimeout(() => {
      clearInterval(intervals.current[0]);
      // Set final value for slot 1 (random for now, or controlled if we passed a result)
    }, 1000);

    setTimeout(() => {
      clearInterval(intervals.current[1]);
    }, 2000);

    setTimeout(() => {
      clearInterval(intervals.current[2]);
      setIsSpinning(false);
      onSpinFinish();
    }, 3000);
  };

  // Cleanup
  useEffect(() => {
    return () => intervals.current.forEach(clearInterval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 sm:gap-4 mb-8 bg-slate-800 p-4 rounded-xl border-4 border-yellow-500 shadow-2xl">
        {slots.map((icon, i) => (
          <div 
            key={i} 
            className="w-20 h-24 sm:w-24 sm:h-32 bg-white rounded-lg flex items-center justify-center text-4xl sm:text-5xl border-b-4 border-slate-300 shadow-inner overflow-hidden relative"
          >
            <div className={`transition-transform duration-100 ${isSpinning ? 'animate-pulse' : ''}`}>
              {icon}
            </div>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
          </div>
        ))}
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className={`
          px-12 py-4 rounded-full text-2xl font-bold text-white shadow-lg transform transition-all
          ${isSpinning 
            ? 'bg-slate-600 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-red-500 to-pink-600 hover:scale-105 hover:shadow-xl active:scale-95 animate-bounce'}
        `}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN!'}
      </button>
    </div>
  );
}
