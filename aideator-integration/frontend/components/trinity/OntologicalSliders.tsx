/**
 * OntologicalSliders
 *
 * Renders the 50 -ity/-pathy ontological fingerprint sliders grouped into
 * 5 categories, with dual radar charts (Chart.js) for visualization.
 *
 * Dependencies:
 *   npm install chart.js react-chartjs-2
 *
 * Used by: CharacterStudioPage, SparkMakerPage (comparison overlay)
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ItyPathy, ItyPathyKey } from '../../contexts/TrinityGraphContext';
import { ITY_PATHY_DEFAULTS } from '../../contexts/TrinityGraphContext';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export interface SliderCategory {
  id: string;
  label: string;
  color: string;         // Tailwind accent color name (for dot)
  chartColor: string;    // rgba string for Chart.js
  keys: ItyPathyKey[];
}

export const SLIDER_CATEGORIES: SliderCategory[] = [
  {
    id: 'relational',
    label: 'Relational Dynamics',
    color: 'rose',
    chartColor: 'rgba(244, 63, 94, 0.6)',
    keys: [
      'brutality', 'sensuality', 'volatility', 'empathy', 'loyalty',
      'duplicity', 'dominance', 'submission', 'sympathy', 'antipathy',
    ],
  },
  {
    id: 'cognitive',
    label: 'Cognitive Architecture',
    color: 'sky',
    chartColor: 'rgba(56, 189, 248, 0.6)',
    keys: [
      'creativity', 'rigidity', 'curiosity', 'certainty', 'adaptability',
      'tenacity', 'rationality', 'irrationality', 'clarity', 'opacity',
    ],
  },
  {
    id: 'moral',
    label: 'Moral Topology',
    color: 'amber',
    chartColor: 'rgba(251, 191, 36, 0.6)',
    keys: [
      'morality', 'amorality', 'integrity', 'duplicity2', 'altruism',
      'selfishness', 'purity', 'corruption', 'honesty', 'deception',
    ],
  },
  {
    id: 'emotional',
    label: 'Emotional Landscape',
    color: 'violet',
    chartColor: 'rgba(167, 139, 250, 0.6)',
    keys: [
      'vulnerability', 'stoicity', 'intensity', 'serenity', 'anxiety',
      'tranquility', 'passion', 'apathy', 'warmth', 'coldness',
    ],
  },
  {
    id: 'existential',
    label: 'Existential Stance',
    color: 'emerald',
    chartColor: 'rgba(52, 211, 153, 0.6)',
    keys: [
      'spirituality', 'materialism', 'idealism', 'pragmatism', 'fatalism',
      'agency', 'mortality_awareness', 'immortality_seeking', 'belonging', 'alienation',
    ],
  },
];

// Human-readable label for each key
const SLIDER_LABELS: Partial<Record<ItyPathyKey, string>> = {
  duplicity2: 'Moral Duplicity',
  mortality_awareness: 'Mortality Awareness',
  immortality_seeking: 'Immortality Seeking',
};
function labelFor(key: ItyPathyKey): string {
  return SLIDER_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

// ============================================================================
// RADAR CHART COMPONENT
// ============================================================================

interface RadarChartProps {
  category: SliderCategory;
  primary: ItyPathy;           // First character (always shown)
  comparison?: ItyPathy | null; // Second character (overlay in Spark Maker)
  comparisonLabel?: string;
  primaryLabel?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({
  category,
  primary,
  comparison,
  primaryLabel = 'Character',
  comparisonLabel = 'Character B',
}) => {
  const labels = category.keys.map(labelFor);
  const primaryData = category.keys.map(k => primary[k]);
  const compData = comparison ? category.keys.map(k => comparison[k]) : null;

  const data: ChartData<'radar'> = {
    labels,
    datasets: [
      {
        label: primaryLabel,
        data: primaryData,
        backgroundColor: category.chartColor.replace('0.6', '0.25'),
        borderColor: category.chartColor,
        borderWidth: 2,
        pointBackgroundColor: category.chartColor,
        pointRadius: 3,
      },
      ...(compData
        ? [
            {
              label: comparisonLabel,
              data: compData,
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              borderColor: 'rgba(148, 163, 184, 0.8)',
              borderDash: [5, 3],
              borderWidth: 1.5,
              pointBackgroundColor: 'rgba(148, 163, 184, 0.8)',
              pointRadius: 2,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: {
          color: 'rgba(203, 213, 225, 0.9)',
          font: { size: 9 },
        },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
      },
    },
    plugins: {
      legend: {
        display: !!comparison,
        labels: { color: 'rgba(203,213,225,0.8)', boxWidth: 12, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
      },
    },
  };

  return <Radar data={data} options={options} />;
};

// ============================================================================
// SINGLE SLIDER ROW
// ============================================================================

interface SliderRowProps {
  fieldKey: ItyPathyKey;
  value: number;
  onChange: (key: ItyPathyKey, value: number) => void;
  readOnly?: boolean;
  comparisonValue?: number | null;
}

const SliderRow: React.FC<SliderRowProps> = ({
  fieldKey,
  value,
  onChange,
  readOnly = false,
  comparisonValue,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(fieldKey, Number(e.target.value));
    },
    [fieldKey, onChange]
  );

  const pct = value;
  const compPct = comparisonValue ?? null;

  // Color ramp: low = cool blue, mid = gray, high = warm rose
  const trackColor =
    pct < 33 ? '#38bdf8' : pct < 66 ? '#64748b' : '#f43f5e';

  return (
    <div className="flex items-center gap-2 group py-0.5">
      <span className="w-40 text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors flex-shrink-0">
        {labelFor(fieldKey)}
      </span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Comparison ghost bar */}
        {compPct !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-slate-500 opacity-40 pointer-events-none"
            style={{ left: 0, width: `${compPct}%` }}
          />
        )}
        {/* Primary slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={handleChange}
          disabled={readOnly}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-current"
          style={{ accentColor: trackColor }}
        />
      </div>
      <span
        className="w-9 text-right text-xs font-mono font-semibold tabular-nums flex-shrink-0"
        style={{ color: trackColor }}
      >
        {value}
      </span>
    </div>
  );
};

// ============================================================================
// CATEGORY PANEL
// ============================================================================

interface CategoryPanelProps {
  category: SliderCategory;
  values: ItyPathy;
  onChange: (key: ItyPathyKey, value: number) => void;
  comparison?: ItyPathy | null;
  primaryLabel?: string;
  comparisonLabel?: string;
  readOnly?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({
  category,
  values,
  onChange,
  comparison,
  primaryLabel,
  comparisonLabel,
  readOnly,
  expanded = true,
  onToggle,
}) => {
  const colorClasses: Record<string, string> = {
    rose: 'border-rose-500/40 bg-rose-500/5',
    sky: 'border-sky-500/40 bg-sky-500/5',
    amber: 'border-amber-500/40 bg-amber-500/5',
    violet: 'border-violet-500/40 bg-violet-500/5',
    emerald: 'border-emerald-500/40 bg-emerald-500/5',
  };
  const dotClasses: Record<string, string> = {
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${colorClasses[category.color] ?? 'border-slate-700 bg-slate-800/50'}`}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 mb-3 text-left"
        onClick={onToggle}
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClasses[category.color]}`} />
        <span className="text-sm font-semibold text-slate-200 flex-1">{category.label}</span>
        <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sliders */}
          <div className="space-y-1">
            {category.keys.map(key => (
              <SliderRow
                key={key}
                fieldKey={key}
                value={values[key]}
                onChange={onChange}
                readOnly={readOnly}
                comparisonValue={comparison ? comparison[key] : null}
              />
            ))}
          </div>
          {/* Radar chart */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xs">
              <RadarChart
                category={category}
                primary={values}
                comparison={comparison}
                primaryLabel={primaryLabel}
                comparisonLabel={comparisonLabel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface OntologicalSlidersProps {
  /** Current ity/pathy values for the primary character */
  values: ItyPathy;
  /** Called when any slider changes */
  onChange: (key: ItyPathyKey, value: number) => void;
  /** Optional second character for comparison overlay (Spark Maker) */
  comparison?: ItyPathy | null;
  primaryLabel?: string;
  comparisonLabel?: string;
  /** When true, sliders are disabled (read-only display mode) */
  readOnly?: boolean;
  /** Collapse all categories by default */
  collapsed?: boolean;
}

export const OntologicalSliders: React.FC<OntologicalSlidersProps> = ({
  values,
  onChange,
  comparison,
  primaryLabel = 'Character',
  comparisonLabel = 'Character B',
  readOnly = false,
  collapsed = false,
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    () => new Set(collapsed ? [] : SLIDER_CATEGORIES.map(c => c.id))
  );

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    SLIDER_CATEGORIES.forEach(cat =>
      cat.keys.forEach(key => onChange(key, ITY_PATHY_DEFAULTS[key]))
    );
  }, [onChange]);

  const handleRandomize = useCallback(() => {
    SLIDER_CATEGORIES.forEach(cat =>
      cat.keys.forEach(key => onChange(key, Math.floor(Math.random() * 101)))
    );
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {SLIDER_CATEGORIES.reduce((s, c) => s + c.keys.length, 0)} ontological dimensions
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRandomize}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
            >
              Randomize
            </button>
          </div>
        </div>
      )}

      {/* Category panels */}
      {SLIDER_CATEGORIES.map(cat => (
        <CategoryPanel
          key={cat.id}
          category={cat}
          values={values}
          onChange={onChange}
          comparison={comparison}
          primaryLabel={primaryLabel}
          comparisonLabel={comparisonLabel}
          readOnly={readOnly}
          expanded={expandedCategories.has(cat.id)}
          onToggle={() => toggleCategory(cat.id)}
        />
      ))}
    </div>
  );
};

export default OntologicalSliders;
