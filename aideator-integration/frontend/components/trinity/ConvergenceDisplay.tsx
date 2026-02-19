/**
 * ConvergenceDisplay
 *
 * Renders a convergence score between two characters with:
 *  - Color-coded arc/gauge visualization (SVG)
 *  - Top tension points (where values conflict)
 *  - Top resonance points (where values align)
 *
 * Used by: SparkMakerPage, optionally DetailPage
 */

import React, { useMemo } from 'react';
import type { ConvergenceAnalysis } from '../../contexts/TrinityGraphContext';

// ============================================================================
// SVG ARC GAUGE
// ============================================================================

interface ArcGaugeProps {
  score: number; // 0–1
  size?: number;
}

const ArcGauge: React.FC<ArcGaugeProps> = ({ score, size = 160 }) => {
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210; // degrees (left-bottom)
  const endAngle = 30;     // degrees (right-bottom), total sweep = 240°
  const totalSweep = 240;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const polarToXY = (deg: number) => ({
    x: cx + radius * Math.cos(toRad(deg)),
    y: cy + radius * Math.sin(toRad(deg)),
  });

  const arcPath = (fromDeg: number, toDeg: number) => {
    const from = polarToXY(fromDeg);
    const to = polarToXY(toDeg);
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y}`;
  };

  const fillAngle = startAngle + score * totalSweep;

  // Color: blue (low) → amber (mid) → rose (high)
  const scoreColor =
    score < 0.33 ? '#38bdf8' : score < 0.66 ? '#f59e0b' : '#f43f5e';

  const pct = Math.round(score * 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {score > 0 && (
        <path
          d={arcPath(startAngle, fillAngle)}
          fill="none"
          stroke={scoreColor}
          strokeWidth={10}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${scoreColor}88)` }}
        />
      )}
      {/* Score text */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill={scoreColor}
        fontSize={size * 0.22}
        fontWeight="700"
        fontFamily="monospace"
      >
        {pct}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="rgba(148,163,184,0.7)"
        fontSize={size * 0.09}
        fontFamily="sans-serif"
      >
        CONVERGENCE
      </text>
    </svg>
  );
};

// ============================================================================
// POINT LIST (tension / resonance)
// ============================================================================

interface PointListProps {
  points: string[];
  type: 'tension' | 'resonance';
  max?: number;
}

const PointList: React.FC<PointListProps> = ({ points, type, max = 4 }) => {
  const shown = points.slice(0, max);
  const isTension = type === 'tension';

  const icon = isTension ? '⚡' : '✦';
  const colorClass = isTension ? 'text-rose-400' : 'text-emerald-400';
  const dotClass = isTension
    ? 'bg-rose-500/20 border border-rose-500/40'
    : 'bg-emerald-500/20 border border-emerald-500/40';
  const heading = isTension ? 'Tension Points' : 'Resonance Points';

  if (shown.length === 0) return null;

  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${colorClass}`}>
        {icon} {heading}
      </h4>
      <ul className="space-y-1.5">
        {shown.map((point, i) => (
          <li key={i} className={`rounded-lg px-3 py-2 text-xs text-slate-300 leading-snug ${dotClass}`}>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============================================================================
// CONVERGENCE LABEL
// ============================================================================

function convergenceLabel(score: number): { label: string; desc: string } {
  if (score >= 0.85) return { label: 'Transcendent', desc: 'Unprecedented chemistry. A story-defining collision.' };
  if (score >= 0.70) return { label: 'Electric',     desc: 'Powerful attraction with deep creative tension.' };
  if (score >= 0.55) return { label: 'Charged',      desc: 'Strong potential. Interesting conflict points.' };
  if (score >= 0.40) return { label: 'Resonant',     desc: 'Moderate alignment. Relationship can grow.' };
  if (score >= 0.25) return { label: 'Tentative',    desc: 'Limited overlap. Conflict likely dominant.' };
  return { label: 'Dissonant', desc: 'These characters repel. A collision could destroy both.' };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ConvergenceDisplayProps {
  analysis: ConvergenceAnalysis;
  characterAName?: string;
  characterBName?: string;
  /** Show compact version without tension/resonance lists */
  compact?: boolean;
  className?: string;
}

export const ConvergenceDisplay: React.FC<ConvergenceDisplayProps> = ({
  analysis,
  characterAName = 'Character A',
  characterBName = 'Character B',
  compact = false,
  className = '',
}) => {
  const { label, desc } = useMemo(
    () => convergenceLabel(analysis.convergence_score),
    [analysis.convergence_score]
  );

  const scoreColor =
    analysis.convergence_score < 0.33
      ? 'text-sky-400'
      : analysis.convergence_score < 0.66
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className={`bg-slate-900/80 border border-slate-700/60 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/40">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-slate-500 text-xs truncate max-w-[100px]">{characterAName}</span>
          <span className="text-slate-600">×</span>
          <span className="text-slate-500 text-xs truncate max-w-[100px]">{characterBName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${scoreColor}`}>{label}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>

      {/* Gauge + sub-scores */}
      <div className="px-5 py-4 flex items-center gap-6">
        <ArcGauge score={analysis.convergence_score} size={140} />

        <div className="flex-1 space-y-3">
          {/* Ity complementarity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Ity Complementarity</span>
              <span className="text-xs font-mono text-rose-400">
                {Math.round(analysis.ity_complementarity * 100)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{ width: `${analysis.ity_complementarity * 100}%` }}
              />
            </div>
          </div>

          {/* Pathy cosine */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Pathy Resonance</span>
              <span className="text-xs font-mono text-sky-400">
                {Math.round(analysis.pathy_cosine * 100)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${analysis.pathy_cosine * 100}%` }}
              />
            </div>
          </div>

          {/* Formula legend */}
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Score = (Ity × 0.6) + (Pathy × 0.4)
          </p>
        </div>
      </div>

      {/* Tension & resonance points */}
      {!compact && (analysis.tension_points?.length > 0 || analysis.resonance_points?.length > 0) && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PointList points={analysis.tension_points ?? []} type="tension" />
          <PointList points={analysis.resonance_points ?? []} type="resonance" />
        </div>
      )}

      {/* Narrative potential */}
      {!compact && analysis.narrative_potential && (
        <div className="px-5 pb-5">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 italic leading-relaxed">
              "{analysis.narrative_potential}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvergenceDisplay;
