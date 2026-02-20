"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface GaugeProps {
  value: number;
  size?: number;
  gradient?: boolean;
  primary?: 'success' | 'warning' | 'error' | 'info' | 'primary';
  tickMarks?: boolean;
  label?: string;
  transition?: {
    length: number;
    delay: number;
  };
  className?: string;
}

const colorMap = {
  success: {
    primary: '#10B981',
    secondary: '#34D399',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
  },
  warning: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
  },
  error: {
    primary: '#EF4444',
    secondary: '#F87171',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)'
  },
  info: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
  },
  primary: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
  }
};

export function Gauge({
  value,
  size = 200,
  gradient = true,
  primary = 'success',
  tickMarks = true,
  label,
  transition = { length: 1200, delay: 200 },
  className = ''
}: GaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const [animatedValue, setAnimatedValue] = useState(0);

  const colors = colorMap[primary];
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  // Generate tick marks
  const generateTickMarks = () => {
    const ticks = [];
    const tickCount = 10;
    const angleStep = 180 / (tickCount - 1);
    
    for (let i = 0; i < tickCount; i++) {
      const angle = -90 + (i * angleStep);
      const radian = (angle * Math.PI) / 180;
      const x1 = size / 2 + (radius - 15) * Math.cos(radian);
      const y1 = size / 2 + (radius - 15) * Math.sin(radian);
      const x2 = size / 2 + (radius - 5) * Math.cos(radian);
      const y2 = size / 2 + (radius - 5) * Math.sin(radian);
      
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-30"
        />
      );
    }
    return ticks;
  };

  useEffect(() => {
    if (!progressRef.current) return;

    const tl = gsap.timeline({ delay: transition.delay / 1000 });
    
    tl.to({ value: 0 }, {
      value: value,
      duration: transition.length / 1000,
      ease: "power2.out",
      onUpdate: function() {
        setAnimatedValue(this.targets()[0].value);
      }
    });

    return () => {
      tl.kill();
    };
  }, [value, transition]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="opacity-10"
            pathLength="180"
            strokeDasharray="180 180"
          />
          
          {/* Tick marks */}
          {tickMarks && (
            <g className="transform rotate-90" style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}>
              {generateTickMarks()}
            </g>
          )}
          
          {/* Progress circle */}
          <circle
            ref={progressRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={gradient ? `url(#gradient-${primary})` : colors.primary}
            strokeWidth="8"
            strokeLinecap="round"
            pathLength="180"
            strokeDasharray="180 180"
            strokeDashoffset={180 - (animatedValue / 100) * 180}
            className="transition-all duration-300 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${colors.primary}40)`
            }}
          />
          
          {/* Gradient definition */}
          {gradient && (
            <defs>
              <linearGradient id={`gradient-${primary}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
          )}
        </svg>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="text-4xl font-bold"
            style={{ color: colors.primary }}
          >
            {Math.round(animatedValue)}%
          </div>
          {label && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}