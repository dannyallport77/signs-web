import React from 'react';

export default function Logo({ className = "w-10 h-10", planeClassName = "text-white" }: { className?: string, planeClassName?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stylized Circle/Swoosh */}
      <path 
        d="M 20 50 A 30 30 0 1 1 80 50" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
        className="text-indigo-500"
      />
      <path 
        d="M 20 50 Q 50 65 80 50" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
        className="text-indigo-600"
      />
      
      {/* Paper Plane */}
      <path 
        d="M 25 65 L 85 20 L 60 80 L 50 55 Z" 
        fill="currentColor" 
        className={planeClassName}
      />
    </svg>
  );
}
