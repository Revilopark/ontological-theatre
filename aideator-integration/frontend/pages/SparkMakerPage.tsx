/**
 * SparkMakerPage
 *
 * Collision chamber for two characters. Generates a "Spark" — the narrative
 * potential energy between two ontological fingerprints.
 *
 * Flow:
 *   1. Select Character A and Character B from Trinity Graph
 *   2. Live convergence preview (client-side ity/pathy math)
 *   3. Trigger collision → SVG animation → Trinity Graph spark + Gemini narrative
 *   4. Optional: Fal.ai image generation for the spark
 *   5. Gallery of past sparks for the current world
 *
 * Route: /spark-maker
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CollisionAnimation, type CollisionPhase } from '../components/trinity/CollisionAnimation';
import { ConvergenceDisplay } from '../components/trinity/ConvergenceDisplay';
import { OntologicalSliders } from '../components/trinity/OntologicalSliders';
import {
  useTrinityGraphContext,
  type TrinityCharacter,
  type Spark,
  type ConvergenceAnalysis,
} from '../contexts/TrinityGraphContext';
import { useCharacters, useSparks, useItyPathyCompute } from '../hooks/useTrinityGraph';
import { useWorld } from '../../contexts/WorldContext';
import { EFFECTIVE_API_BASE_URL, authenticatedFetch } from '../../utils/api';

// ============================================================================
// CHARACTER SELECTOR CARD
// ============================================================================

interface CharacterSelectorProps {
  label: string;
  color: string;           // tailwind color name
  selectedId: string | null;
  characters: TrinityCharacter[];
  onSelect: (id: string) => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  label, color, selectedId, characters, onSelect,
}) => {
  const selected = characters.find(c => c.id === selectedId);

  const colorClasses: Record<string, string> = {
    rose: 'border-rose-500/60 bg-rose-500/5',
    sky:  'border-sky-500/60 bg-sky-500/5',
  };
  const accentClasses: Record<string, string> = {
    rose: 'text-rose-400',
    sky:  'text-sky-400',
  };

  return (
    <div className={`rounded-2xl border p-4 ${colorClasses[color] ?? 'border-slate-700'}`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${accentClasses[color] ?? 'text-slate-400'}`}>
        {label}
      </p>
      {selected ? (
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${color === 'rose' ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'}`}>
            {selected.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{selected.name}</p>
            <p className="text-xs text-slate-500">{selected.archetype ?? 'No archetype'}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect('')}
            className="ml-auto text-slate-600 hover:text-slate-400 text-xs"
          >
            ×
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mb-3">No character selected</p>
      )}
      <select
        value={selectedId ?? ''}
        onChange={e => onSelect(e.target.value)}
        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
      >
        <option value="">Select character…</option>
        {characters.map(c => (
          <option key={c.id} value={c.id}>{c.name} {c.archetype ? `(${c.archetype})` : ''}</option>
        ))}
      </select>
    </div>
  );
};

// ============================================================================
// SPARK CARD
// ============================================================================

interface SparkCardProps {
  spark: Spark;
  characters: TrinityCharacter[];
  onClick?: () => void;
}

const SparkCard: React.FC<SparkCardProps> = ({ spark, characters, onClick }) => {
  const charA = characters.find(c => c.id === spark.character_a_id);
  const charB = characters.find(c => c.id === spark.character_b_id);
  const score = spark.convergence_score;
  const scoreColor = score < 0.33 ? 'text-sky-400' : score < 0.66 ? 'text-amber-400' : 'text-rose-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all group"
    >
      {/* Image if available */}
      {spark.image_url && (
        <img
          src={spark.image_url}
          alt="Spark"
          className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-700"
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm text-slate-300">
          <span className="font-medium">{charA?.name ?? spark.character_a_name ?? '?'}</span>
          <span className="text-slate-600">×</span>
          <span className="font-medium">{charB?.name ?? spark.character_b_name ?? '?'}</span>
        </div>
        <span className={`text-sm font-bold font-mono ${scoreColor}`}>
          {Math.round(score * 100)}
        </span>
      </div>
      {spark.narrative && (
        <p className="text-xs text-slate-500 line-clamp-2">{spark.narrative}</p>
      )}
      <div className="flex gap-1 mt-2 flex-wrap">
        {(spark.tension_points ?? []).slice(0, 2).map((p, i) => (
          <span key={i} className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded px-1.5 py-0.5">
            {p.slice(0, 30)}
          </span>
        ))}
      </div>
    </button>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const SparkMakerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorldId } = useWorld();
  const { collideCharacters, getConvergence } = useTrinityGraphContext();

  const worldId = searchParams.get('world_id') ?? currentWorldId ?? '';
  const { characters, loading: charsLoading } = useCharacters(worldId);
  const { sparks, loading: sparksLoading, refetch: refetchSparks } = useSparks(worldId);

  // ── Selection state ──────────────────────────────────────────────────────────
  const [charAId, setCharAId] = useState<string>('');
  const [charBId, setCharBId] = useState<string>('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');

  const charA = useMemo(() => characters.find(c => c.id === charAId) ?? null, [characters, charAId]);
  const charB = useMemo(() => characters.find(c => c.id === charBId) ?? null, [characters, charBId]);

  // ── Live convergence (client-side preview) ────────────────────────────────────
  const liveConvergence = useItyPathyCompute(charA?.ity_pathy, charB?.ity_pathy);

  // ── Full API convergence ────────────────────────────────────────────────────
  const [apiConvergence, setApiConvergence] = useState<ConvergenceAnalysis | null>(null);
  const [convergenceLoading, setConvergenceLoading] = useState(false);

  useEffect(() => {
    if (!charAId || !charBId) { setApiConvergence(null); return; }
    setConvergenceLoading(true);
    getConvergence(charAId, charBId)
      .then(setApiConvergence)
      .catch(() => setApiConvergence(null))
      .finally(() => setConvergenceLoading(false));
  }, [charAId, charBId, getConvergence]);

  // ── Collision state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<CollisionPhase>('idle');
  const [spark, setSpark] = useState<Spark | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);

  // ── Narrative generation ─────────────────────────────────────────────────────
  const [narrative, setNarrative] = useState<string>('');
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  // ── Image generation ─────────────────────────────────────────────────────────
  const [sparkImageUrl, setSparkImageUrl] = useState<string>('');
  const [generatingImage, setGeneratingImage] = useState(false);

  // ── View state ───────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<'chamber' | 'gallery' | 'compare'>('chamber');

  // ── Trigger collision ────────────────────────────────────────────────────────

  const handleCollide = useCallback(async () => {
    if (!charAId || !charBId || !worldId) return;

    setPhase('collide');
    setCollisionError(null);
    setSpark(null);
    setNarrative('');
    setSparkImageUrl('');

    // Wait for animation before hitting API (1.4s for drift animation)
    await new Promise(resolve => setTimeout(resolve, 1400));

    try {
      const result = await collideCharacters(charAId, charBId, worldId, selectedPlaceId || undefined);
      setSpark(result);
      setPhase('burst');
    } catch (err: any) {
      setCollisionError(err.message);
      setPhase('idle');
    }
  }, [charAId, charBId, worldId, selectedPlaceId, collideCharacters]);

  const handleBurstComplete = useCallback(() => {
    setPhase('complete');
    // Auto-generate narrative
    if (spark) {
      generateNarrative(spark);
    }
  }, [spark]);

  // ── Gemini narrative ─────────────────────────────────────────────────────────

  const generateNarrative = async (sparkData: Spark) => {
    setGeneratingNarrative(true);
    try {
      const prompt = `Two characters have collided in a narrative spark:
Character A: ${charA?.name ?? 'Unknown'} — ${charA?.description ?? ''}
Character B: ${charB?.name ?? 'Unknown'} — ${charB?.description ?? ''}
Convergence Score: ${Math.round(sparkData.convergence_score * 100)}/100
Tension Points: ${sparkData.tension_points?.join(', ')}
Resonance Points: ${sparkData.resonance_points?.join(', ')}

Write a 2-3 paragraph narrative describing what happens when these two characters meet. 
Focus on the dramatic potential — the tension, the chemistry, what conflict or transformation emerges.
Write in a cinematic, present-tense style.`;

      const res = await authenticatedFetch(
        `${EFFECTIVE_API_BASE_URL}/api/generate-text`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt, maxTokens: 400 }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json();
      setNarrative(data.text ?? data.content ?? '');
    } catch (err) {
      console.error('Narrative generation failed:', err);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  // ── Fal.ai image ─────────────────────────────────────────────────────────────

  const generateSparkImage = async () => {
    if (!spark) return;
    setGeneratingImage(true);
    try {
      const imagePrompt = `Cinematic art — two characters colliding in an energy burst: "${charA?.name ?? 'Character A'}" meets "${charB?.name ?? 'Character B'}". 
Score ${Math.round(spark.convergence_score * 100)}/100 convergence. 
${spark.tension_points?.[0] ? `Tension: ${spark.tension_points[0]}` : ''} 
${spark.resonance_points?.[0] ? `Resonance: ${spark.resonance_points[0]}` : ''}
Dynamic, emotional, high contrast, dramatic lighting, conceptual illustration style.`;

      const res = await authenticatedFetch(
        `${EFFECTIVE_API_BASE_URL}/api/generate-image`,
        {
          method: 'POST',
          body: JSON.stringify({
            item: {
              id: `spark-${spark.id}`,
              name: `${charA?.name} × ${charB?.name} Spark`,
              type: 'concept',
              description: imagePrompt,
            },
            aspectRatio: '16:9',
            imageModel: 'flux-2',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json();
      const url = data.imageUrl ?? data.base64Image ?? '';
      setSparkImageUrl(url);
    } catch (err) {
      console.error('Spark image generation failed:', err);
    } finally {
      setGeneratingImage(false);
    }
  };

  const resetChamber = () => {
    setPhase('idle');
    setSpark(null);
    setNarrative('');
    setSparkImageUrl('');
    setCollisionError(null);
    refetchSparks();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Spark Maker</h1>
            <p className="text-sm text-slate-500 mt-1">Collide two characters. Discover the narrative energy between them.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/character-studio')}
            className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
          >
            + New Character
          </button>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-800 w-fit">
          {(['chamber', 'gallery', 'compare'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveView(v)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all
                ${activeView === v ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {v === 'chamber' ? '⚡ Chamber' : v === 'gallery' ? '✦ Sparks' : '📊 Compare'}
            </button>
          ))}
        </div>

        {/* ── COLLISION CHAMBER ─────────────────────────────────────────────── */}
        {activeView === 'chamber' && (
          <div className="space-y-6">
            {/* Character selectors */}
            {phase === 'idle' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CharacterSelector
                  label="Character A"
                  color="rose"
                  selectedId={charAId}
                  characters={characters}
                  onSelect={id => { setCharAId(id); setApiConvergence(null); }}
                />
                <CharacterSelector
                  label="Character B"
                  color="sky"
                  selectedId={charBId}
                  characters={characters}
                  onSelect={id => { setCharBId(id); setApiConvergence(null); }}
                />
              </div>
            )}

            {/* Live preview score bar */}
            {liveConvergence && phase === 'idle' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-4">
                <span className="text-xs text-slate-500">Live Convergence Preview</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500"
                    style={{ width: `${liveConvergence.convergenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {Math.round(liveConvergence.convergenceScore * 100)}
                </span>
              </div>
            )}

            {/* Animation canvas */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
              <CollisionAnimation
                phase={phase}
                characterAName={charA?.name ?? 'Character A'}
                characterBName={charB?.name ?? 'Character B'}
                characterAImageUrl={charA?.image_url}
                characterBImageUrl={charB?.image_url}
                colorA="#f43f5e"
                colorB="#38bdf8"
                onBurstComplete={handleBurstComplete}
                className="py-8 px-4"
              />
            </div>

            {/* Collision button */}
            {phase === 'idle' && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleCollide}
                  disabled={!charAId || !charBId || charAId === charBId}
                  className="px-10 py-4 bg-gradient-to-r from-rose-600 to-sky-600 hover:from-rose-500 hover:to-sky-500 disabled:opacity-40 rounded-2xl text-base font-bold text-white shadow-lg shadow-rose-900/30 transition-all transform hover:scale-105 disabled:scale-100"
                >
                  ⚡ Ignite Collision
                </button>
              </div>
            )}

            {collisionError && (
              <div className="px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
                {collisionError}
              </div>
            )}

            {/* Spark result */}
            {spark && phase === 'complete' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Convergence analysis */}
                {apiConvergence && (
                  <ConvergenceDisplay
                    analysis={apiConvergence}
                    characterAName={charA?.name}
                    characterBName={charB?.name}
                  />
                )}

                {/* Narrative */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300">✦ Spark Narrative</h3>
                    <button
                      type="button"
                      onClick={() => generateNarrative(spark)}
                      disabled={generatingNarrative}
                      className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 px-3 py-1 rounded-lg transition-colors"
                    >
                      {generatingNarrative ? '…' : '↻ Regenerate'}
                    </button>
                  </div>
                  {generatingNarrative ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <div className="w-3 h-3 border border-rose-500 border-t-transparent rounded-full animate-spin" />
                      Generating narrative via Gemini…
                    </div>
                  ) : narrative ? (
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{narrative}</p>
                  ) : (
                    <p className="text-sm text-slate-600 italic">Narrative will appear here…</p>
                  )}
                </div>

                {/* Spark image */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300">🎨 Spark Visualization</h3>
                    <button
                      type="button"
                      onClick={generateSparkImage}
                      disabled={generatingImage}
                      className="text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      {generatingImage ? 'Generating…' : '✨ Generate Image'}
                    </button>
                  </div>
                  {sparkImageUrl ? (
                    <img
                      src={sparkImageUrl}
                      alt="Spark visualization"
                      className="w-full rounded-xl border border-slate-700 max-h-80 object-cover"
                    />
                  ) : (
                    <p className="text-sm text-slate-600 italic">Click "Generate Image" to create a Fal.ai visualization of this spark.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={resetChamber}
                    className="px-5 py-2.5 border border-slate-700 hover:border-slate-500 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    New Collision
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('gallery')}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-white transition-colors"
                  >
                    View All Sparks →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SPARK GALLERY ─────────────────────────────────────────────────── */}
        {activeView === 'gallery' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400">
                {sparks.length} spark{sparks.length !== 1 ? 's' : ''} in this world
              </h2>
              <button
                type="button"
                onClick={refetchSparks}
                className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 px-3 py-1 rounded-lg transition-colors"
              >
                ↻ Refresh
              </button>
            </div>

            {sparksLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
                <div className="w-4 h-4 border border-rose-500 border-t-transparent rounded-full animate-spin" />
                Loading sparks…
              </div>
            ) : sparks.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <p className="text-4xl mb-3">⚡</p>
                <p className="text-sm">No sparks yet. Create your first collision!</p>
                <button
                  type="button"
                  onClick={() => setActiveView('chamber')}
                  className="mt-4 px-5 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm text-white"
                >
                  Go to Chamber
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sparks.map(s => (
                  <SparkCard key={s.id} spark={s} characters={characters} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE VIEW ──────────────────────────────────────────────────── */}
        {activeView === 'compare' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CharacterSelector label="Character A" color="rose" selectedId={charAId} characters={characters} onSelect={setCharAId} />
              <CharacterSelector label="Character B" color="sky"  selectedId={charBId} characters={characters} onSelect={setCharBId} />
            </div>

            {charA && charB && (
              <OntologicalSliders
                values={charA.ity_pathy}
                onChange={() => {}} // read-only in compare mode
                comparison={charB.ity_pathy}
                primaryLabel={charA.name}
                comparisonLabel={charB.name}
                readOnly
              />
            )}

            {!charAId || !charBId ? (
              <p className="text-center text-slate-600 text-sm py-8">Select two characters to compare their fingerprints.</p>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SparkMakerPage;
