"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Progress } from "@/components/ui/progress";
import { Gauge } from "@/components/ui/gauge";
import { 
  Activity, 
  Brain, 
  Shield, 
  Gauge as GaugeIcon,
  TrendingUp,
  Zap,
  DollarSign,
  CheckCircle,
  BarChart3,
  Target
} from "lucide-react";

interface DecisionStats {
  totalDecisions: number;
  agentBreakdown: Record<string, number>;
  avgConfidence: number;
  avgRiskScore: number;
  totalCostImpact: number;
  totalRevenueImpact: number;
  explanationsGenerated: number;
  blockchainAudited: number;
  explanationRate: number;
  blockchainRate: number;
  timeRange: string;
}

interface StatsCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  useGauge?: boolean;
  gaugeType?: 'success' | 'warning' | 'error' | 'info' | 'primary';
}

interface AnimatedStatsCardProps {
  card: StatsCardData;
  index: number;
  disableAnimations?: boolean;
}

const DEFAULT_GLOW_COLOR = '16, 185, 129';
const PARTICLE_COUNT = 8;

const createParticleElement = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'decision-particle';
  el.style.cssText = `
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 4px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const AnimatedStatsCard: React.FC<AnimatedStatsCardProps> = ({ 
  card, 
  index, 
  disableAnimations = false 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const isHoveredRef = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || disableAnimations) return;

    const rect = cardRef.current.getBoundingClientRect();
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const particle = createParticleElement(x, y, card.glowColor);
        
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(particle, 
          { scale: 0, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(particle, {
          opacity: 0.4,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, i * 150);

      timeoutsRef.current.push(timeoutId);
    }
  }, [card.glowColor, disableAnimations]);

  // Animate progress bar on mount
  useEffect(() => {
    if (card.progress !== undefined && progressRef.current && !disableAnimations) {
      gsap.fromTo(progressRef.current, 
        { width: '0%' },
        { 
          width: `${card.progress}%`, 
          duration: 1.5, 
          ease: 'power2.out',
          delay: index * 0.2
        }
      );
    }
  }, [card.progress, index, disableAnimations]);

  // Animate card entrance
  useEffect(() => {
    if (!cardRef.current || disableAnimations) return;

    gsap.fromTo(cardRef.current,
      { 
        opacity: 0, 
        y: 30,
        scale: 0.9
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: index * 0.1
      }
    );
  }, [index, disableAnimations]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      gsap.to(element, {
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000
      });

      // Enhance glow effect
      gsap.to(element, {
        boxShadow: `0 8px 32px rgba(${card.glowColor}, 0.3), 0 0 40px rgba(${card.glowColor}, 0.2)`,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      gsap.to(element, {
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        duration: 0.3,
        ease: 'power2.out'
      });

      gsap.to(element, {
        boxShadow: `0 4px 16px rgba(${card.glowColor}, 0.1)`,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(element, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: 1000
      });

      // Update CSS custom properties for gradient positioning
      element.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      element.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, card.glowColor]);

  return (
    <div
      ref={cardRef}
      className={`decision-stats-card relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm transition-all duration-300 cursor-pointer ${
        card.useGauge ? 'p-6' : 'p-6'
      }`}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%'
      } as React.CSSProperties}
    >
      {/* Subtle background gradient */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, transparent 100%)`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {card.useGauge ? (
          // Gauge Layout
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <div 
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                style={{ 
                  color: card.color
                }}
              >
                {card.icon}
              </div>
              
              {card.trend && (
                <div className={`flex items-center gap-1 text-sm ${
                  card.trend === 'up' ? 'text-green-500' : 
                  card.trend === 'down' ? 'text-red-500' : 
                  'text-gray-500'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${card.trend === 'down' ? 'rotate-180' : ''}`} />
                  {card.trendValue}
                </div>
              )}
            </div>

            <Gauge
              value={card.progress || 0}
              size={160}
              gradient={true}
              primary={card.gaugeType || 'success'}
              tickMarks={true}
              label={card.title}
              transition={{ length: 1500, delay: index * 300 }}
            />

            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {card.subtitle}
              </div>
            </div>
          </div>
        ) : (
          // Standard Layout
          <>
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                style={{ 
                  color: card.color
                }}
              >
                {card.icon}
              </div>
              
              {card.trend && (
                <div className={`flex items-center gap-1 text-sm ${
                  card.trend === 'up' ? 'text-green-500' : 
                  card.trend === 'down' ? 'text-red-500' : 
                  'text-gray-500'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${card.trend === 'down' ? 'rotate-180' : ''}`} />
                  {card.trendValue}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-bold" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {card.subtitle}
              </div>
              
              {card.progress !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>{card.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      ref={progressRef}
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: card.color,
                        boxShadow: `0 0 8px rgba(${card.glowColor}, 0.4)`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

interface DecisionStatsCardsProps {
  stats: DecisionStats | null;
  loading?: boolean;
  disableAnimations?: boolean;
}

export const DecisionStatsCards: React.FC<DecisionStatsCardsProps> = ({ 
  stats, 
  loading = false, 
  disableAnimations = false 
}) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const cardData: StatsCardData[] = [
    {
      id: 'ai-explained',
      title: 'AI Explained',
      value: `${stats.explanationRate}%`,
      subtitle: `${stats.explanationsGenerated} decisions with AI insights`,
      icon: <Brain className="h-6 w-6" />,
      color: '#8B5CF6',
      glowColor: '139, 92, 246',
      progress: stats.explanationRate,
      trend: 'up',
      trendValue: '+5%',
      useGauge: true,
      gaugeType: 'primary'
    },
    {
      id: 'blockchain-verified',
      title: 'Blockchain Verified',
      value: `${stats.blockchainRate}%`,
      subtitle: `${stats.blockchainAudited} immutable audit records`,
      icon: <Shield className="h-6 w-6" />,
      color: '#10B981',
      glowColor: '16, 185, 129',
      progress: stats.blockchainRate,
      trend: 'up',
      trendValue: '+8%',
      useGauge: true,
      gaugeType: 'success'
    },
    {
      id: 'total-decisions',
      title: 'Total Decisions',
      value: stats.totalDecisions.toLocaleString(),
      subtitle: `Last ${stats.timeRange} • Active monitoring`,
      icon: <Activity className="h-6 w-6" />,
      color: '#3B82F6',
      glowColor: '59, 130, 246',
      trend: 'up',
      trendValue: '+12%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cardData.map((card, index) => (
        <AnimatedStatsCard
          key={card.id}
          card={card}
          index={index}
          disableAnimations={disableAnimations}
        />
      ))}
    </div>
  );
};

export default DecisionStatsCards;