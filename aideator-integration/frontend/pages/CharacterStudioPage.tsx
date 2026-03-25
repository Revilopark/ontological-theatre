/**
 * CharacterStudioPage
 *
 * Full-featured character creation and editing studio.
 * Port of the standalone character-studio.html into a proper React component.
 *
 * 7 Tabs:
 *   1. Identity          — name, archetype, age, backstory, etc.
 *   2. Ontological       — 50 ity/pathy sliders + radar charts
 *   3. Relationships     — D3 relationship graph
 *   4. Visual DNA        — character portrait + Gemini image analysis
 *   5. Voice & Music     — voice description, theme music
 *   6. Garments          — garments and artifacts
 *   7. Export            — JSON / share
 *
 * Persistence: Trinity Graph API (via TrinityGraphContext)
 * Route: /character-studio
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { OntologicalSliders } from '../components/trinity/OntologicalSliders';
import { useTrinityGraphContext, type TrinityCharacter, type ItyPathy, type ItyPathyKey, type Garment, type Artifact, ITY_PATHY_DEFAULTS } from '../contexts/TrinityGraphContext';
import { useCharacters } from '../hooks/useTrinityGraph';
import { useWorld } from '../../contexts/WorldContext';
import { EFFECTIVE_API_BASE_URL, authenticatedFetch } from '../../utils/api';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'identity' | 'ontological' | 'relationships' | 'visual-dna' | 'voice' | 'garments' | 'export';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'identity',      label: 'Identity',         icon: '👤' },
  { id: 'ontological',   label: 'Ontological',       icon: '🧬' },
  { id: 'relationships', label: 'Relationships',     icon: '🔗' },
  { id: 'visual-dna',   label: 'Visual DNA',         icon: '🎨' },
  { id: 'voice',         label: 'Voice & Music',     icon: '🎵' },
  { id: 'garments',      label: 'Garments',          icon: '👗' },
  { id: 'export',        label: 'Export',            icon: '📤' },
];

const ARCHETYPES = [
  'The Hero', 'The Shadow', 'The Mentor', 'The Trickster',
  'The Anima/Animus', 'The Threshold Guardian', 'The Herald',
  'The Shapeshifter', 'The Ally', 'The Villain',
];

// ============================================================================
// BLANK CHARACTER TEMPLATE
// ============================================================================

function blankCharacter(worldId: string): Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'> {
  return {
    world_id: worldId,
    name: '',
    description: '',
    archetype: '',
    age: '',
    gender: '',
    occupation: '',
    nationality: '',
    backstory: '',
    ity_pathy: { ...ITY_PATHY_DEFAULTS },
    voice_description: '',
    music_theme: '',
    relationships: [],
    garments: [],
    artifacts: [],
  };
}

// ============================================================================
// IDENTITY TAB
// ============================================================================

interface IdentityTabProps {
  data: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>;
  onChange: (field: keyof TrinityCharacter, value: string) => void;
}

const IdentityTab: React.FC<IdentityTabProps> = ({ data, onChange }) => {
  const field = (label: string, key: keyof TrinityCharacter, placeholder = '') => (
    <div>
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={(data[key] as string) ?? ''}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60 transition-colors"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {field('Name *', 'name', 'Character name')}
        {field('Age', 'age', 'e.g. 32, Early 40s, Ancient')}
        {field('Gender', 'gender', 'e.g. Female, Non-binary, Unknown')}
        {field('Occupation', 'occupation', 'What do they do?')}
        {field('Nationality / Origin', 'nationality', 'Where are they from?')}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Archetype</label>
          <select
            value={data.archetype ?? ''}
            onChange={e => onChange('archetype', e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
          >
            <option value="">Select archetype…</option>
            {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea
            value={data.description ?? ''}
            onChange={e => onChange('description', e.target.value)}
            rows={3}
            placeholder="Physical and psychological overview…"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/60"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Backstory</label>
          <textarea
            value={data.backstory ?? ''}
            onChange={e => onChange('backstory', e.target.value)}
            rows={6}
            placeholder="Character history, formative events, secrets…"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/60"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RELATIONSHIPS TAB (D3 graph)
// ============================================================================

const RelationshipsTab: React.FC<{
  character: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>;
  allCharacters: TrinityCharacter[];
  onAddRelationship: (targetId: string, type: string, description: string) => void;
}> = ({ character, allCharacters, onAddRelationship }) => {
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('KNOWS');
  const [relDesc, setRelDesc] = useState('');

  const REL_TYPES = ['KNOWS', 'LOVES', 'RIVALS', 'MENTORS', 'BETRAYED', 'FEARS', 'ALLIES_WITH', 'HUNTS'];

  const handleAdd = () => {
    if (!targetId || !relType) return;
    onAddRelationship(targetId, relType, relDesc);
    setTargetId('');
    setRelDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Add relationship */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Add Relationship</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
          >
            <option value="">Select character…</option>
            {allCharacters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={relType}
            onChange={e => setRelType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/60"
          >
            {REL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            value={relDesc}
            onChange={e => setRelDesc(e.target.value)}
            placeholder="Description (optional)"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!targetId}
          className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 rounded-lg text-sm font-semibold text-white transition-colors"
        >
          Add Relationship
        </button>
      </div>

      {/* Existing relationships */}
      {(character.relationships?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-sm">No relationships yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {character.relationships!.map((rel, i) => {
            const target = allCharacters.find(c => c.id === rel.target_id);
            return (
              <div key={i} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700/40">
                <span className="text-xs font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded">{rel.relationship_type}</span>
                <span className="text-sm text-slate-200 font-medium">{target?.name ?? rel.target_id}</span>
                {rel.description && <span className="text-xs text-slate-500 flex-1">{rel.description}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VISUAL DNA TAB
// ============================================================================

const VisualDNATab: React.FC<{
  character: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>;
  savedCharacterId?: string;
  worldId: string;
}> = ({ character, savedCharacterId, worldId }) => {
  const [imageUrl, setImageUrl] = useState(character.image_url ?? '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');

  const analyzeImage = async () => {
    if (!imageUrl || !savedCharacterId) return;
    setAnalyzing(true);
    try {
      const res = await authenticatedFetch(
        `${EFFECTIVE_API_BASE_URL}/api/worlds/${worldId}/characters/${encodeURIComponent(character.name)}/analyze-visual-dna`,
        {
          method: 'POST',
          body: JSON.stringify({ imageUrl }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json();
      setAnalysis(JSON.stringify(data.visualDNA, null, 2));
    } catch (err: any) {
      setAnalysis(`Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Image URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://… or /worlds/…"
            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <button
            type="button"
            onClick={analyzeImage}
            disabled={!imageUrl || analyzing}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg text-sm font-semibold text-white transition-colors whitespace-nowrap"
          >
            {analyzing ? 'Analyzing…' : '🔬 Analyze DNA'}
          </button>
        </div>
      </div>

      {imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={character.name}
            className="w-64 h-64 object-cover rounded-2xl border border-slate-700"
          />
        </div>
      )}

      {analysis && (
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Visual DNA Analysis</label>
          <pre className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 overflow-auto max-h-80 font-mono leading-relaxed">
            {analysis}
          </pre>
        </div>
      )}

      {!savedCharacterId && (
        <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Save the character first (Identity tab) to enable Visual DNA analysis.
        </p>
      )}
    </div>
  );
};

// ============================================================================
// VOICE & MUSIC TAB
// ============================================================================

const VoiceTab: React.FC<{
  data: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>;
  onChange: (field: keyof TrinityCharacter, value: string) => void;
}> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Voice Description</label>
      <textarea
        value={data.voice_description ?? ''}
        onChange={e => onChange('voice_description', e.target.value)}
        rows={5}
        placeholder="Describe the character's voice: tone, cadence, accent, emotional coloring, speech patterns, vocabulary range…"
        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/60"
      />
    </div>
    <div>
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Musical Theme</label>
      <textarea
        value={data.music_theme ?? ''}
        onChange={e => onChange('music_theme', e.target.value)}
        rows={4}
        placeholder="Describe the character's musical identity: genre, instrumentation, tempo, emotional arc, reference tracks…"
        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/60"
      />
    </div>
    <p className="text-xs text-slate-600">
      Voice and music data are stored in the Trinity Graph and can be used for AI-generated character dialogue and soundtrack generation.
    </p>
  </div>
);

// ============================================================================
// GARMENTS TAB
// ============================================================================

const GarmentsTab: React.FC<{
  character: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>;
  savedCharacterId?: string;
  onAddGarment: (garment: Omit<Garment, 'id'>) => void;
  onAddArtifact: (artifact: Omit<Artifact, 'id'>) => void;
}> = ({ character, savedCharacterId, onAddGarment, onAddArtifact }) => {
  const [garmentName, setGarmentName] = useState('');
  const [garmentDesc, setGarmentDesc] = useState('');
  const [artifactName, setArtifactName] = useState('');
  const [artifactDesc, setArtifactDesc] = useState('');

  return (
    <div className="space-y-8">
      {/* Garments section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>👗</span> Garments
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={garmentName}
            onChange={e => setGarmentName(e.target.value)}
            placeholder="Garment name"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <input
            value={garmentDesc}
            onChange={e => setGarmentDesc(e.target.value)}
            placeholder="Description"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <button
            type="button"
            disabled={!garmentName || !savedCharacterId}
            onClick={() => {
              onAddGarment({ character_id: savedCharacterId!, name: garmentName, description: garmentDesc });
              setGarmentName('');
              setGarmentDesc('');
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 rounded-lg text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {(character.garments ?? []).map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/40 text-sm text-slate-300">
              <span className="font-medium">{g.name}</span>
              {g.description && <span className="text-slate-500">— {g.description}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Artifacts section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>⚔️</span> Artifacts
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={artifactName}
            onChange={e => setArtifactName(e.target.value)}
            placeholder="Artifact name"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <input
            value={artifactDesc}
            onChange={e => setArtifactDesc(e.target.value)}
            placeholder="Description"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60"
          />
          <button
            type="button"
            disabled={!artifactName || !savedCharacterId}
            onClick={() => {
              onAddArtifact({ name: artifactName, description: artifactDesc, associated_with_id: savedCharacterId });
              setArtifactName('');
              setArtifactDesc('');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-lg text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {(character.artifacts ?? []).map((a, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/40 text-sm text-slate-300">
              <span className="font-medium">{a.name}</span>
              {a.description && <span className="text-slate-500">— {a.description}</span>}
            </div>
          ))}
        </div>
      </div>

      {!savedCharacterId && (
        <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Save the character first to add garments and artifacts.
        </p>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT TAB
// ============================================================================

const ExportTab: React.FC<{ character: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>; savedId?: string }> = ({ character, savedId }) => {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...character, id: savedId }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {savedId && (
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Trinity Graph ID</p>
          <code className="text-sm text-emerald-400 font-mono">{savedId}</code>
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={exportJson}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          📥 Export JSON
        </button>
      </div>
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Raw Data Preview</label>
        <pre className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 overflow-auto max-h-96 font-mono leading-relaxed">
          {JSON.stringify({ ...character, id: savedId }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const CharacterStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorldId } = useWorld();
  const { createCharacter, updateCharacter, relateCharacters, createGarment, createArtifact } = useTrinityGraphContext();

  // Determine world — prefer URL param, fall back to WorldContext
  const worldId = searchParams.get('world_id') ?? currentWorldId ?? '';
  const editCharId = searchParams.get('character_id');

  const { characters } = useCharacters(worldId);

  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const [character, setCharacter] = useState<Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>>(
    () => blankCharacter(worldId)
  );
  const [savedCharacterId, setSavedCharacterId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing character for editing
  useEffect(() => {
    if (editCharId && characters.length > 0) {
      const found = characters.find(c => c.id === editCharId);
      if (found) {
        const { id, created_at, updated_at, ...rest } = found;
        setCharacter(rest);
        setSavedCharacterId(id);
      }
    }
  }, [editCharId, characters]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleFieldChange = useCallback((field: keyof TrinityCharacter, value: string) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSliderChange = useCallback((key: ItyPathyKey, value: number) => {
    setCharacter(prev => ({
      ...prev,
      ity_pathy: { ...prev.ity_pathy, [key]: value },
    }));
  }, []);

  const handleSave = async () => {
    if (!character.name.trim()) {
      setSaveError('Character name is required');
      return;
    }
    if (!worldId) {
      setSaveError('No world selected. Return to the main page and open a world first.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (savedCharacterId) {
        await updateCharacter(savedCharacterId, character);
      } else {
        const created = await createCharacter(character);
        setSavedCharacterId(created.id);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRelationship = async (targetId: string, type: string, description: string) => {
    if (!savedCharacterId) return;
    await relateCharacters(savedCharacterId, targetId, type, description);
    setCharacter(prev => ({
      ...prev,
      relationships: [
        ...(prev.relationships ?? []),
        { id: `rel-${Date.now()}`, target_id: targetId, target_name: '', relationship_type: type, description },
      ],
    }));
  };

  const handleAddGarment = async (data: Omit<Garment, 'id'>) => {
    const created = await createGarment(data);
    setCharacter(prev => ({ ...prev, garments: [...(prev.garments ?? []), created] }));
  };

  const handleAddArtifact = async (data: Omit<Artifact, 'id'>) => {
    const created = await createArtifact(data);
    setCharacter(prev => ({ ...prev, artifacts: [...(prev.artifacts ?? []), created] }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Character Studio</h1>
            <p className="text-sm text-slate-500 mt-1">
              {savedCharacterId ? `Editing: ${character.name}` : 'Create a new character'}
              {worldId && <span className="ml-2 text-slate-600">· World: {worldId.slice(0, 12)}…</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/spark-maker')}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              ⚡ Spark Maker
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 rounded-xl text-sm font-bold text-white transition-colors"
            >
              {saving ? 'Saving…' : savedCharacterId ? 'Update' : 'Save Character'}
            </button>
          </div>
        </div>

        {/* Status banners */}
        {saveError && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-sm text-red-300">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 px-4 py-3 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-sm text-emerald-300">
            ✓ Character saved to Trinity Graph
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
                ${activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
          {activeTab === 'identity' && (
            <IdentityTab data={character} onChange={handleFieldChange} />
          )}
          {activeTab === 'ontological' && (
            <OntologicalSliders
              values={character.ity_pathy}
              onChange={handleSliderChange}
            />
          )}
          {activeTab === 'relationships' && (
            <RelationshipsTab
              character={character}
              allCharacters={characters.filter(c => c.id !== savedCharacterId)}
              onAddRelationship={handleAddRelationship}
            />
          )}
          {activeTab === 'visual-dna' && (
            <VisualDNATab
              character={character}
              savedCharacterId={savedCharacterId}
              worldId={worldId}
            />
          )}
          {activeTab === 'voice' && (
            <VoiceTab data={character} onChange={handleFieldChange} />
          )}
          {activeTab === 'garments' && (
            <GarmentsTab
              character={character}
              savedCharacterId={savedCharacterId}
              onAddGarment={handleAddGarment}
              onAddArtifact={handleAddArtifact}
            />
          )}
          {activeTab === 'export' && (
            <ExportTab character={character} savedId={savedCharacterId} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CharacterStudioPage;
