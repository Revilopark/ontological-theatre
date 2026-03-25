/**
 * UbiquityStudioPage
 *
 * Distribution planner, revenue calculator, and publishing pipeline for
 * the world's content IP. Port of ubiquity-studio.html into React.
 *
 * Sections:
 *   1. Distribution Planner    — where and how to release content
 *   2. Revenue Calculator      — Chart.js revenue projections
 *   3. Audience Intelligence   — demographic breakdown
 *   4. Rights & Royalties      — rights management tracker
 *   5. Launch Planner          — calendar-based launch timeline
 *
 * Persistence: Trinity Graph API for world-level data + localStorage for drafts
 * Route: /ubiquity-studio
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTrinityGraphContext } from '../contexts/TrinityGraphContext';
import { useWorld } from '../../contexts/WorldContext';
import { EFFECTIVE_API_BASE_URL, authenticatedFetch } from '../../utils/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler
);

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'distribution' | 'revenue' | 'audience' | 'rights' | 'launch';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'distribution', label: 'Distribution',       icon: '🌐' },
  { id: 'revenue',      label: 'Revenue',             icon: '💰' },
  { id: 'audience',     label: 'Audience Intelligence', icon: '👥' },
  { id: 'rights',       label: 'Rights & Royalties',  icon: '⚖️' },
  { id: 'launch',       label: 'Launch Planner',      icon: '🚀' },
];

const DISTRIBUTION_CHANNELS = [
  { id: 'streaming',   label: 'Streaming',       icon: '📺', platforms: ['Netflix', 'HBO Max', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Peacock', 'Paramount+'] },
  { id: 'theatrical',  label: 'Theatrical',      icon: '🎬', platforms: ['Wide Release', 'Limited Release', 'Festival First', 'Prestige Platform'] },
  { id: 'digital',     label: 'Digital Sales',   icon: '💻', platforms: ['iTunes', 'Vudu', 'Google Play', 'Amazon Video'] },
  { id: 'physical',    label: 'Physical Media',  icon: '📀', platforms: ['4K UHD', 'Blu-ray', 'DVD', 'Collector Edition'] },
  { id: 'podcast',     label: 'Podcast/Audio',   icon: '🎙', platforms: ['Spotify', 'Apple Podcasts', 'Audible', 'iHeart'] },
  { id: 'publishing',  label: 'Publishing',      icon: '📚', platforms: ['Traditional', 'Self-Publish', 'Graphic Novel', 'eBook'] },
  { id: 'gaming',      label: 'Gaming',          icon: '🎮', platforms: ['Console DLC', 'Mobile Tie-in', 'PC Game', 'VR Experience'] },
  { id: 'merchandise', label: 'Merchandise',     icon: '🛍', platforms: ['Direct-to-Consumer', 'Retail Partners', 'Limited Edition', 'NFT/Digital'] },
];

const RIGHTS_CATEGORIES = [
  'Theatrical', 'Streaming', 'Broadcast TV', 'Cable TV', 'Home Video',
  'Digital Download', 'Publishing', 'Merchandising', 'Music',
  'Gaming', 'Theme Park', 'International', 'Sequel Rights',
];

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

function ubiquityKey(worldId: string) {
  return `ubiquity_studio_${worldId}`;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

interface UbiquityData {
  selectedChannels: string[];
  selectedPlatforms: Record<string, string[]>;
  revenueProjections: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
  };
  revenueBreakdown: Record<string, number>; // channel → % share
  audienceSegments: {
    name: string;
    percentage: number;
    description: string;
  }[];
  targetDemographics: string[];
  rightsTracker: {
    category: string;
    status: 'retained' | 'licensed' | 'sold' | 'pending';
    licensee?: string;
    expiry?: string;
    value?: number;
  }[];
  launchEvents: {
    id: string;
    title: string;
    date: string;
    type: string;
    description: string;
    status: 'planned' | 'confirmed' | 'completed';
  }[];
  notes: string;
}

const DEFAULT_PROJECTIONS = { year1: 500000, year2: 1200000, year3: 2000000, year4: 1800000, year5: 1500000 };

function defaultData(): UbiquityData {
  return {
    selectedChannels: [],
    selectedPlatforms: {},
    revenueProjections: { ...DEFAULT_PROJECTIONS },
    revenueBreakdown: { Streaming: 40, Theatrical: 25, Merchandise: 15, Publishing: 10, Other: 10 },
    audienceSegments: [
      { name: 'Core Fans', percentage: 30, description: 'Deep engagement, high LTV' },
      { name: 'Casual Viewers', percentage: 45, description: 'Broad reach, moderate engagement' },
      { name: 'Aspirational', percentage: 15, description: 'Premium buyers, low frequency' },
      { name: 'Discovery', percentage: 10, description: 'New-to-brand, conversion focus' },
    ],
    targetDemographics: ['18-34', 'Gender-neutral'],
    rightsTracker: RIGHTS_CATEGORIES.map(cat => ({
      category: cat, status: 'retained' as const,
    })),
    launchEvents: [],
    notes: '',
  };
}

// ============================================================================
// DISTRIBUTION TAB
// ============================================================================

interface DistributionTabProps {
  data: UbiquityData;
  onChange: (update: Partial<UbiquityData>) => void;
}

const DistributionTab: React.FC<DistributionTabProps> = ({ data, onChange }) => {
  const toggleChannel = (channelId: string) => {
    const selected = new Set(data.selectedChannels);
    if (selected.has(channelId)) selected.delete(channelId);
    else selected.add(channelId);
    onChange({ selectedChannels: Array.from(selected) });
  };

  const togglePlatform = (channelId: string, platform: string) => {
    const current = new Set(data.selectedPlatforms[channelId] ?? []);
    if (current.has(platform)) current.delete(platform);
    else current.add(platform);
    onChange({
      selectedPlatforms: { ...data.selectedPlatforms, [channelId]: Array.from(current) },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Select distribution channels and platforms for your world's content.</p>
      {DISTRIBUTION_CHANNELS.map(channel => {
        const isSelected = data.selectedChannels.includes(channel.id);
        return (
          <div
            key={channel.id}
            className={`rounded-xl border transition-all ${isSelected ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800 bg-slate-900/40'}`}
          >
            <button
              type="button"
              onClick={() => toggleChannel(channel.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <span className="text-xl">{channel.icon}</span>
              <span className="font-semibold text-sm text-slate-200">{channel.label}</span>
              <span className={`ml-auto text-xs font-bold ${isSelected ? 'text-rose-400' : 'text-slate-600'}`}>
                {isSelected ? '✓ Selected' : '+ Add'}
              </span>
            </button>
            {isSelected && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {channel.platforms.map(p => {
                  const isPlatformSelected = (data.selectedPlatforms[channel.id] ?? []).includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(channel.id, p)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${isPlatformSelected
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// REVENUE TAB
// ============================================================================

const RevenueTab: React.FC<{ data: UbiquityData; onChange: (update: Partial<UbiquityData>) => void }> = ({ data, onChange }) => {
  const proj = data.revenueProjections;

  const barData: ChartData<'bar'> = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [{
      label: 'Revenue Projection',
      data: [proj.year1, proj.year2, proj.year3, proj.year4, proj.year5],
      backgroundColor: [
        'rgba(244, 63, 94, 0.7)',
        'rgba(251, 191, 36, 0.7)',
        'rgba(52, 211, 153, 0.7)',
        'rgba(56, 189, 248, 0.7)',
        'rgba(167, 139, 250, 0.7)',
      ],
      borderColor: [
        '#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa',
      ],
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  const donutData: ChartData<'doughnut'> = {
    labels: Object.keys(data.revenueBreakdown),
    datasets: [{
      data: Object.values(data.revenueBreakdown),
      backgroundColor: ['#f43f5e88', '#fbbf2488', '#34d39988', '#38bdf888', '#a78bfa88'],
      borderColor: ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa'],
      borderWidth: 1.5,
    }],
  };

  const totalRevenue = Object.values(proj).reduce((s, v) => s + v, 0);

  const formatRevenue = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">5-Year Total</p>
          <p className="text-xl font-bold text-emerald-400">{formatRevenue(totalRevenue)}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Peak Year</p>
          <p className="text-xl font-bold text-rose-400">{formatRevenue(Math.max(...Object.values(proj)))}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Avg/Year</p>
          <p className="text-xl font-bold text-amber-400">{formatRevenue(totalRevenue / 5)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">5-Year Revenue Projection</h3>
        <Bar data={barData} options={{
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)' } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', callback: (v) => formatRevenue(Number(v)) } },
          },
        }} />
      </div>

      {/* Sliders for projections */}
      <div className="space-y-3">
        {(['year1', 'year2', 'year3', 'year4', 'year5'] as const).map((yr, i) => (
          <div key={yr} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-14">Year {i + 1}</span>
            <input
              type="range"
              min={0}
              max={10000000}
              step={50000}
              value={proj[yr]}
              onChange={e => onChange({ revenueProjections: { ...proj, [yr]: Number(e.target.value) } })}
              className="flex-1 accent-rose-500"
            />
            <span className="text-xs font-mono text-emerald-400 w-16 text-right">{formatRevenue(proj[yr])}</span>
          </div>
        ))}
      </div>

      {/* Donut chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Revenue Mix</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={donutData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
              },
            }} />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Revenue Breakdown %</h3>
          {Object.entries(data.revenueBreakdown).map(([channel, pct]) => (
            <div key={channel} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-24">{channel}</span>
              <input
                type="range" min={0} max={100} value={pct}
                onChange={e => onChange({ revenueBreakdown: { ...data.revenueBreakdown, [channel]: Number(e.target.value) } })}
                className="flex-1 accent-rose-500"
              />
              <span className="text-xs font-mono text-rose-400 w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AUDIENCE TAB
// ============================================================================

const AudienceTab: React.FC<{ data: UbiquityData; onChange: (u: Partial<UbiquityData>) => void }> = ({ data, onChange }) => {
  const pieData: ChartData<'doughnut'> = {
    labels: data.audienceSegments.map(s => s.name),
    datasets: [{
      data: data.audienceSegments.map(s => s.percentage),
      backgroundColor: ['#f43f5e88', '#38bdf888', '#fbbf2488', '#a78bfa88'],
      borderColor: ['#f43f5e', '#38bdf8', '#fbbf24', '#a78bfa'],
      borderWidth: 1.5,
    }],
  };

  const DEMO_OPTIONS = [
    '13-17', '18-24', '25-34', '35-44', '45-54', '55+',
    'Female-skewing', 'Male-skewing', 'Gender-neutral',
    'Urban', 'Suburban', 'Rural',
    'High income', 'Mid income', 'Mass market',
    'Genre fans', 'Mainstream', 'International',
  ];

  const toggleDemo = (d: string) => {
    const s = new Set(data.targetDemographics);
    s.has(d) ? s.delete(d) : s.add(d);
    onChange({ targetDemographics: Array.from(s) });
  };

  return (
    <div className="space-y-8">
      {/* Audience segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Audience Segments</h3>
          <div className="space-y-4">
            {data.audienceSegments.map((seg, i) => (
              <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <div className="flex items-center justify-between mb-2">
                  <input
                    value={seg.name}
                    onChange={e => {
                      const segs = [...data.audienceSegments];
                      segs[i] = { ...segs[i], name: e.target.value };
                      onChange({ audienceSegments: segs });
                    }}
                    className="text-sm font-semibold text-slate-200 bg-transparent border-b border-slate-700 focus:outline-none focus:border-rose-500 w-32"
                  />
                  <span className="text-sm font-bold font-mono text-rose-400">{seg.percentage}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={seg.percentage}
                  onChange={e => {
                    const segs = [...data.audienceSegments];
                    segs[i] = { ...segs[i], percentage: Number(e.target.value) };
                    onChange({ audienceSegments: segs });
                  }}
                  className="w-full accent-rose-500 mb-2"
                />
                <input
                  value={seg.description}
                  onChange={e => {
                    const segs = [...data.audienceSegments];
                    segs[i] = { ...segs[i], description: e.target.value };
                    onChange({ audienceSegments: segs });
                  }}
                  className="w-full text-xs text-slate-500 bg-transparent focus:outline-none"
                  placeholder="Description…"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="max-w-xs mx-auto">
            <Doughnut data={pieData} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } } },
            }} />
          </div>
        </div>
      </div>

      {/* Target demographics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Target Demographics</h3>
        <div className="flex flex-wrap gap-2">
          {DEMO_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDemo(d)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                data.targetDemographics.includes(d)
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RIGHTS TAB
// ============================================================================

const RightsTab: React.FC<{ data: UbiquityData; onChange: (u: Partial<UbiquityData>) => void }> = ({ data, onChange }) => {
  const STATUS_OPTIONS: UbiquityData['rightsTracker'][number]['status'][] = ['retained', 'licensed', 'sold', 'pending'];
  const STATUS_COLORS = { retained: 'text-emerald-400', licensed: 'text-amber-400', sold: 'text-rose-400', pending: 'text-sky-400' };

  const updateRight = (i: number, update: Partial<UbiquityData['rightsTracker'][number]>) => {
    const rt = [...data.rightsTracker];
    rt[i] = { ...rt[i], ...update };
    onChange({ rightsTracker: rt });
  };

  const retainedCount = data.rightsTracker.filter(r => r.status === 'retained').length;
  const licensedValue = data.rightsTracker.filter(r => r.status === 'licensed' && r.value).reduce((s, r) => s + (r.value ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-400 mb-1">Rights Retained</p>
          <p className="text-2xl font-bold text-emerald-300">{retainedCount}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-400 mb-1">Licensed</p>
          <p className="text-2xl font-bold text-amber-300">{data.rightsTracker.filter(r => r.status === 'licensed').length}</p>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 text-center">
          <p className="text-xs text-sky-400 mb-1">License Value</p>
          <p className="text-lg font-bold text-sky-300">${(licensedValue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Rights table */}
      <div className="space-y-2">
        {data.rightsTracker.map((right, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center bg-slate-800/30 rounded-xl px-4 py-3 border border-slate-800">
            <span className="col-span-3 text-sm text-slate-300 font-medium">{right.category}</span>
            <div className="col-span-2">
              <select
                value={right.status}
                onChange={e => updateRight(i, { status: e.target.value as typeof right.status })}
                className={`text-xs font-semibold bg-transparent border-0 focus:outline-none ${STATUS_COLORS[right.status]}`}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input
              value={right.licensee ?? ''}
              onChange={e => updateRight(i, { licensee: e.target.value })}
              placeholder="Licensee…"
              className="col-span-3 text-xs text-slate-400 bg-transparent border-b border-slate-800 focus:outline-none focus:border-rose-500 placeholder-slate-700"
            />
            <input
              type="date"
              value={right.expiry ?? ''}
              onChange={e => updateRight(i, { expiry: e.target.value })}
              className="col-span-2 text-xs text-slate-400 bg-transparent border-b border-slate-800 focus:outline-none focus:border-rose-500"
            />
            <input
              type="number"
              value={right.value ?? ''}
              onChange={e => updateRight(i, { value: Number(e.target.value) })}
              placeholder="$"
              className="col-span-2 text-xs text-slate-400 bg-transparent border-b border-slate-800 focus:outline-none focus:border-rose-500 placeholder-slate-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// LAUNCH PLANNER TAB
// ============================================================================

const LaunchTab: React.FC<{ data: UbiquityData; onChange: (u: Partial<UbiquityData>) => void }> = ({ data, onChange }) => {
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'Release', description: '' });

  const EVENT_TYPES = ['Release', 'Press Announcement', 'Trailer Drop', 'Festival', 'Q&A', 'Premiere', 'Marketing Beat', 'Partnership'];

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const event = { ...newEvent, id: `event-${Date.now()}`, status: 'planned' as const };
    onChange({ launchEvents: [...data.launchEvents, event].sort((a, b) => a.date.localeCompare(b.date)) });
    setNewEvent({ title: '', date: '', type: 'Release', description: '' });
  };

  const removeEvent = (id: string) => {
    onChange({ launchEvents: data.launchEvents.filter(e => e.id !== id) });
  };

  const STATUS_COLORS = { planned: 'text-slate-400', confirmed: 'text-emerald-400', completed: 'text-sky-400' };
  const TYPE_ICONS: Record<string, string> = {
    Release: '🎬', 'Press Announcement': '📰', 'Trailer Drop': '🎥',
    Festival: '🏆', 'Q&A': '💬', Premiere: '⭐', 'Marketing Beat': '📣',
    Partnership: '🤝',
  };

  return (
    <div className="space-y-6">
      {/* Add event */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Add Launch Event</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            value={newEvent.title}
            onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
            placeholder="Event title *"
            className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
          />
          <select
            value={newEvent.type}
            onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
          >
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            value={newEvent.description}
            onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="col-span-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <button
            type="button"
            onClick={addEvent}
            disabled={!newEvent.title || !newEvent.date}
            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Timeline */}
      {data.launchEvents.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm">No launch events yet. Add your first milestone above.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />
          <div className="space-y-4">
            {data.launchEvents.map(event => (
              <div key={event.id} className="flex gap-4 pl-10 relative">
                <div className="absolute left-3 top-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-rose-500 text-xs flex items-center justify-center">
                  {TYPE_ICONS[event.type] ?? '•'}
                </div>
                <div className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-200">{event.title}</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">{event.type}</span>
                      </div>
                      <p className="text-xs text-slate-400">{event.date}</p>
                      {event.description && <p className="text-xs text-slate-500 mt-1">{event.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvent(event.id)}
                      className="text-slate-600 hover:text-rose-400 text-xs ml-4"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const UbiquityStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentWorldId, currentWorld } = useWorld();
  const { getWorldStats } = useTrinityGraphContext();

  const worldId = searchParams.get('world_id') ?? currentWorldId ?? 'global';

  const [activeTab, setActiveTab] = useState<TabId>('distribution');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [graphStats, setGraphStats] = useState<{ nodes: any; relationships: any } | null>(null);

  // ── Data (localStorage + Trinity Graph hybrid) ─────────────────────────────
  const [ubiquityData, setUbiquityData] = useState<UbiquityData>(() => {
    try {
      const stored = localStorage.getItem(ubiquityKey(worldId));
      return stored ? JSON.parse(stored) : defaultData();
    } catch {
      return defaultData();
    }
  });

  // Save to localStorage on every change (draft)
  useEffect(() => {
    localStorage.setItem(ubiquityKey(worldId), JSON.stringify(ubiquityData));
  }, [ubiquityData, worldId]);

  // Load graph stats
  useEffect(() => {
    getWorldStats(worldId).then(setGraphStats).catch(() => setGraphStats(null));
  }, [worldId, getWorldStats]);

  const handleChange = useCallback((update: Partial<UbiquityData>) => {
    setUbiquityData(prev => ({ ...prev, ...update }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist to Trinity Graph via ingest (metadata about this world's distribution plan)
      const res = await authenticatedFetch(`${EFFECTIVE_API_BASE_URL}/api/trinity-graph/ingest`, {
        method: 'POST',
        body: JSON.stringify({
          world_id: worldId,
          content_type: 'distribution_plan',
          content: JSON.stringify(ubiquityData),
          metadata: { source: 'ubiquity-studio', version: '1.0' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Ubiquity Studio</h1>
            <p className="text-sm text-slate-500 mt-1">
              Distribution strategy, revenue planning, and publishing pipeline
              {worldId !== 'global' && <span className="ml-2 text-slate-600">· {worldId.slice(0, 12)}…</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-400">✓ Saved to Trinity Graph</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 rounded-xl text-sm font-bold text-white transition-colors"
            >
              {saving ? 'Saving…' : 'Save Plan'}
            </button>
          </div>
        </div>

        {/* Graph stats bar */}
        {graphStats && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Characters', value: graphStats.nodes?.characters ?? '—', color: 'text-rose-400' },
              { label: 'Places', value: graphStats.nodes?.places ?? '—', color: 'text-amber-400' },
              { label: 'Sparks', value: graphStats.nodes?.sparks ?? '—', color: 'text-violet-400' },
              { label: 'Garments', value: graphStats.nodes?.garments ?? '—', color: 'text-sky-400' },
              { label: 'Artifacts', value: graphStats.nodes?.artifacts ?? '—', color: 'text-emerald-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
          {activeTab === 'distribution' && <DistributionTab data={ubiquityData} onChange={handleChange} />}
          {activeTab === 'revenue' && <RevenueTab data={ubiquityData} onChange={handleChange} />}
          {activeTab === 'audience' && <AudienceTab data={ubiquityData} onChange={handleChange} />}
          {activeTab === 'rights' && <RightsTab data={ubiquityData} onChange={handleChange} />}
          {activeTab === 'launch' && <LaunchTab data={ubiquityData} onChange={handleChange} />}
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Global Notes</label>
          <textarea
            value={ubiquityData.notes}
            onChange={e => handleChange({ notes: e.target.value })}
            rows={3}
            placeholder="General distribution strategy notes…"
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/60"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UbiquityStudioPage;
