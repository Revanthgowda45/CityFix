import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const CityFixLogo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="cityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
        <clipPath id="circleClip">
          <circle cx="24" cy="24" r="18" />
        </clipPath>
      </defs>

      {/* Main circle - corporate clean look */}
      <circle 
        cx="24" 
        cy="24" 
        r="22" 
        fill="url(#cityGradient)" 
        opacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Modern abstract cityscape - clipped to circle */}
      <g clipPath="url(#circleClip)">
        {/* Building 1 */}
        <rect x="10" y="18" width="4" height="20" rx="0" fill="currentColor" opacity="0.7" />
        {/* Building 2 */}
        <rect x="16" y="12" width="4" height="26" rx="0" fill="currentColor" opacity="0.8" />
        {/* Building 3 - tallest (center) */}
        <rect x="22" y="8" width="4" height="30" rx="0" fill="currentColor" opacity="0.9" />
        {/* Building 4 */}
        <rect x="28" y="14" width="4" height="24" rx="0" fill="currentColor" opacity="0.8" />
        {/* Building 5 */}
        <rect x="34" y="19" width="4" height="19" rx="0" fill="currentColor" opacity="0.7" />
      </g>
      
      {/* Small windows on buildings */}
      <rect x="11" y="21" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="11" y="26" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="17" y="16" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="17" y="22" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="23" y="12" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="23" y="18" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="23" y="24" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="29" y="18" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="29" y="24" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="35" y="22" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="35" y="28" width="2" height="2" rx="0.5" fill="white" opacity="0.8" />
      
      {/* Circular fixing element */}
      <circle 
        cx="33" 
        cy="33" 
        r="10" 
        fill="currentColor" 
        stroke="white" 
        strokeWidth="1.5" 
      />
      
      {/* Checkmark inside fixing circle */}
      <path 
        d="M29 33L32 36L38 30" 
        stroke="white" 
        strokeWidth="2"
      />
    </svg>
  );
};

export default CityFixLogo;
