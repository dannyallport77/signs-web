import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string, planeClassName?: string }) {
  return (
    <img 
      src="/logo.png" 
      alt="Review Signs Logo" 
      className={`${className} object-contain`}
    />
  );
}

