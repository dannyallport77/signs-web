'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface FruitMachineAdvertProps {
  giftName: string;
  giftEmoji: string;
  businessName: string;
}

export default function FruitMachineAdvert({ giftName, giftEmoji, businessName }: FruitMachineAdvertProps) {
  const [currentIcon, setCurrentIcon] = useState(0);
  const icons = ['🎰', '🎁', '⭐', '🍀', giftEmoji];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 500);
    return () => clearInterval(interval);
  }, [giftEmoji]);

  return (
    <div className="w-full max-w-md mx-auto my-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden text-white transform transition-all hover:scale-105 duration-300">
      <div className="p-6 text-center relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <div className="flex justify-center items-center mb-4">
            <span className="text-5xl animate-bounce filter drop-shadow-lg">
              {icons[currentIcon]}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 text-yellow-300 drop-shadow-md">
            Spin to Win!
          </h3>
          
          <p className="text-lg mb-4 font-medium">
            Win a free <span className="font-bold text-white underline decoration-yellow-400 decoration-2 underline-offset-2">{giftName}</span> at {businessName}!
          </p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/30">
            <p className="text-sm">
              Tap the NFC tag on your table or ask staff to play!
            </p>
          </div>

          <div className="text-xs text-indigo-200 mt-2">
            <Link href="/fruit-machine/terms" className="hover:text-white underline transition-colors">
              Terms & Conditions apply
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
