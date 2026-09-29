import React from 'react';

interface TargetStarProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const TargetStar: React.FC<TargetStarProps> = ({
  className = '',
  size = 40,
  showText = true,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 select-none group transition-opacity duration-300 ${className}`}
      title="R4 914 Protocol Star"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white/30 group-hover:text-rose-400/80 transition-colors duration-300"
      >
        {/* Subtle Outer Concentric Ring */}
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="2 3"
          className="opacity-40"
        />

        {/* Inner Tactical Target Ring */}
        <circle
          cx="24"
          cy="24"
          r="14"
          stroke="currentColor"
          strokeWidth="0.85"
          className="opacity-60"
        />

        {/* 4-Point Geometric Star */}
        <path
          d="M24 4 C24 16 26 22 44 24 C26 26 24 32 24 44 C24 32 22 26 4 24 C22 22 24 16 24 4 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinejoin="round"
        />

        {/* Cardinal Crosshair ticks */}
        <line x1="24" y1="2" x2="24" y2="7" stroke="currentColor" strokeWidth="1" />
        <line x1="24" y1="41" x2="24" y2="46" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="24" x2="7" y2="24" stroke="currentColor" strokeWidth="1" />
        <line x1="41" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="1" />

        {/* Center Target Point */}
        <circle cx="24" cy="24" r="1.5" fill="currentColor" />
      </svg>

      {showText && (
        <div className="flex flex-col font-mono text-[9px] tracking-[0.2em] text-white/30 group-hover:text-rose-300/80 transition-colors duration-300 leading-none">
          <span>R4</span>
          <span>914</span>
        </div>
      )}
    </div>
  );
};
