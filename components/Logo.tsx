import React from 'react';

export default function Logo({ className = "w-10 h-10", planeClassName = "text-white" }: { className?: string, planeClassName?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Review Signs Logo">
      <circle cx="50" cy="50" r="45" className="text-indigo-600" stroke="currentColor" strokeWidth="8" opacity="0.2" />
      
      {/* Swoosh */}
      <path 
        d="M 20 55 Q 50 80 80 45" 
        stroke="#4F46E5" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      
      {/* Paper Plane */}
      <path 
        d="M 30 60 L 75 25 L 55 75 L 45 55 Z" 
        fill="currentColor" 
        className={planeClassName}
      />
    </svg>
  );
}
