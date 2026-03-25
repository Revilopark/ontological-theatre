/**
 * CollisionAnimation
 *
 * SVG + CSS-based collision animation for the Spark Maker.
 * Three phases:
 *   1. "idle"     — two characters breathe and orbit gently
 *   2. "collide"  — characters drift toward center, accelerate
 *   3. "burst"    — merge point explodes with particles, then fades to spark
 *
 * Props control the current phase. The parent (SparkMakerPage) drives
 * the state machine by calling phase transitions.
 */

import React, { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type CollisionPhase = 'idle' | 'collide' | 'burst' | 'complete';

export interface CollisionAnimationProps {
  phase: CollisionPhase;
  characterAName?: string;
  characterBName?: string;
  characterAImageUrl?: string;
  characterBImageUrl?: string;
  /** Accent color for character A orb */
  colorA?: string;
  /** Accent color for character B orb */
  colorB?: string;
  /** Called when burst animation finishes */
  onBurstComplete?: () => void;
  className?: string;
}

// ============================================================================
// PARTICLE BURST
// ============================================================================

interface Particle {
  id: number;
  angle: number;
  dist: number;
  size: number;
  hue: number;
  duration: number;
  delay: number;
}

function generateParticles(count = 40): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + Math.random() * 18 - 9,
    dist: 60 + Math.random() * 80,
    size: 3 + Math.random() * 6,
    hue: Math.random() * 60 - 30, // ±30° from center hue
    duration: 0.6 + Math.random() * 0.5,
    delay: Math.random() * 0.15,
  }));
}

const PARTICLES = generateParticles(48);

// ============================================================================
// CHARACTER ORB
// ============================================================================

interface CharacterOrbProps {
  name: string;
  imageUrl?: string;
  color: string;
  /** SVG cx position as percentage string, e.g. "25%" */
  cx: string;
  phase: CollisionPhase;
  side: 'left' | 'right';
}

const CharacterOrb: React.FC<CharacterOrbProps> = ({ name, imageUrl, color, cx, phase, side }) => {
  const orbSize = 80;
  const isColliding = phase === 'collide' || phase === 'burst';

  // CSS vars for animation
  const translateX = isColliding ? (side === 'left' ? '90px' : '-90px') : '0px';
  const opacity = phase === 'burst' || phase === 'complete' ? 0 : 1;

  return (
    <g
      style={{
        transform: `translateX(${translateX})`,
        opacity: opacity,
        transition:
          phase === 'collide'
            ? 'transform 1.2s cubic-bezier(0.4,0,0.6,1)'
            : phase === 'burst'
            ? 'opacity 0.3s ease, transform 0s'
            : 'transform 0.4s ease',
      }}
    >
      {/* Glow ring */}
      <circle
        cx={cx}
        cy="50%"
        r={orbSize / 2 + 8}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.3"
      >
        <animate
          attributeName="r"
          values={`${orbSize / 2 + 6};${orbSize / 2 + 14};${orbSize / 2 + 6}`}
          dur="2.5s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.3;0.15;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Avatar circle */}
      <defs>
        <clipPath id={`clip-${side}`}>
          <circle cx={cx} cy="50%" r={orbSize / 2} />
        </clipPath>
        <radialGradient id={`grad-${side}`} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {imageUrl ? (
        <>
          <image
            href={imageUrl}
            x={`calc(${cx} - ${orbSize / 2}px)`}
            y={`calc(50% - ${orbSize / 2}px)`}
            width={orbSize}
            height={orbSize}
            clipPath={`url(#clip-${side})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle
            cx={cx}
            cy="50%"
            r={orbSize / 2}
            fill={`url(#grad-${side})`}
          />
        </>
      ) : (
        <>
          <circle cx={cx} cy="50%" r={orbSize / 2} fill={`url(#grad-${side})`} />
          <circle cx={cx} cy="50%" r={orbSize / 2} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
          {/* Initials */}
          <text
            x={cx}
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize="24"
            fontWeight="700"
            fontFamily="system-ui"
          >
            {name.charAt(0).toUpperCase()}
          </text>
        </>
      )}

      {/* Name label */}
      <text
        x={cx}
        y={`calc(50% + ${orbSize / 2 + 20}px)`}
        textAnchor="middle"
        fill="rgba(203,213,225,0.8)"
        fontSize="11"
        fontFamily="system-ui"
      >
        {name}
      </text>
    </g>
  );
};

// ============================================================================
// SPARK BURST CENTER
// ============================================================================

interface BurstCenterProps {
  active: boolean;
  convergenceScore?: number;
}

const BurstCenter: React.FC<BurstCenterProps> = ({ active, convergenceScore }) => {
  if (!active) return null;

  // Color from score
  const score = convergenceScore ?? 0.5;
  const burstColor =
    score < 0.33 ? '#38bdf8' : score < 0.66 ? '#f59e0b' : '#f43f5e';

  return (
    <g>
      {/* Core flash */}
      <circle cx="50%" cy="50%" r="20" fill={burstColor} opacity="0.9">
        <animate attributeName="r" values="5;40;20" dur="0.4s" fill="freeze" />
        <animate attributeName="opacity" values="1;0.6;0.9" dur="0.4s" fill="freeze" />
      </circle>

      {/* Particles */}
      {PARTICLES.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;
        return (
          <circle
            key={p.id}
            cx="50%"
            cy="50%"
            r={p.size / 2}
            fill={burstColor}
            opacity="0"
            style={{
              transformOrigin: 'center',
              transform: 'translate(0,0)',
            }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0;${tx} ${ty};${tx * 1.3} ${ty * 1.3}`}
              dur={`${p.duration}s`}
              begin={`${p.delay}s`}
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              values={`0;0.9;0`}
              dur={`${p.duration}s`}
              begin={`${p.delay}s`}
              fill="freeze"
            />
            <animate
              attributeName="r"
              values={`${p.size / 2};${p.size};0`}
              dur={`${p.duration}s`}
              begin={`${p.delay}s`}
              fill="freeze"
            />
          </circle>
        );
      })}

      {/* Shockwave ring */}
      <circle cx="50%" cy="50%" r="10" fill="none" stroke={burstColor} strokeWidth="2" opacity="0.8">
        <animate attributeName="r" values="10;100" dur="0.6s" fill="freeze" />
        <animate attributeName="opacity" values="0.8;0" dur="0.6s" fill="freeze" />
        <animate attributeName="stroke-width" values="4;1" dur="0.6s" fill="freeze" />
      </circle>
    </g>
  );
};

// ============================================================================
// PHASE LABELS
// ============================================================================

const PHASE_LABELS: Record<CollisionPhase, string> = {
  idle: 'Select characters and initiate collision',
  collide: 'Converging…',
  burst: 'Spark ignited!',
  complete: 'Analyzing convergence…',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CollisionAnimation: React.FC<CollisionAnimationProps> = ({
  phase,
  characterAName = 'Character A',
  characterBName = 'Character B',
  characterAImageUrl,
  characterBImageUrl,
  colorA = '#f43f5e',
  colorB = '#38bdf8',
  onBurstComplete,
  className = '',
}) => {
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire onBurstComplete after burst animation duration
  useEffect(() => {
    if (phase === 'burst' && onBurstComplete) {
      burstTimeoutRef.current = setTimeout(onBurstComplete, 900);
    }
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    };
  }, [phase, onBurstComplete]);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* SVG canvas */}
      <div className="w-full relative" style={{ paddingBottom: '40%', minHeight: 200 }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 240"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Dark background */}
          <rect width="600" height="240" fill="transparent" />

          {/* Energy line between characters */}
          {(phase === 'idle' || phase === 'collide') && (
            <line
              x1="150"
              y1="120"
              x2="450"
              y2="120"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          )}

          {/* Character A — left */}
          <CharacterOrb
            name={characterAName}
            imageUrl={characterAImageUrl}
            color={colorA}
            cx="150"
            phase={phase}
            side="left"
          />

          {/* Character B — right */}
          <CharacterOrb
            name={characterBName}
            imageUrl={characterBImageUrl}
            color={colorB}
            cx="450"
            phase={phase}
            side="right"
          />

          {/* Burst center */}
          <BurstCenter active={phase === 'burst' || phase === 'complete'} />
        </svg>
      </div>

      {/* Phase label */}
      <p
        key={phase}
        className="text-xs text-slate-500 mt-2 text-center transition-all duration-300 animate-pulse"
      >
        {PHASE_LABELS[phase]}
      </p>
    </div>
  );
};

export default CollisionAnimation;
